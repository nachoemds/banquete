// src/utils/realAudioStreamResolver.ts
import { LaRengaSong } from '../data/laRengaSongs';

export interface ResolvedTrackStream {
  previewUrl: string | null;
  trackName: string;
  collectionName: string;
  trackViewUrl: string | null;
  sourceLabel: string;
}

const streamCache = new Map<string, ResolvedTrackStream>();

function normalizeText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

function isMedleyTrack(trackName: string): boolean {
  const norm = normalizeText(trackName);
  return (
    norm.startsWith('popurock') ||
    norm.startsWith('la trifulca') ||
    norm.startsWith('la trifasica')
  );
}

/**
 * Queries the public iTunes / Apple Music Search API (CORS-enabled) to retrieve
 * the real 30-second AAC/M4A audio stream for a given La Renga song.
 */
export async function resolveLaRengaAudioStream(
  song: LaRengaSong
): Promise<ResolvedTrackStream> {
  const cached = streamCache.get(song.id);
  if (cached) return cached;

  const cleanTitle = normalizeText(song.title);

  try {
    const query = encodeURIComponent(`La Renga ${song.title}`);
    const response = await fetch(
      `https://itunes.apple.com/search?term=${query}&entity=song&limit=25&country=AR`
    );

    if (response.ok) {
      const data = await response.json();
      const results: Array<{
        artistName?: string;
        trackName?: string;
        collectionName?: string;
        previewUrl?: string;
        trackViewUrl?: string;
      }> = Array.isArray(data?.results) ? data.results : [];

      // Filter to La Renga tracks with a valid previewUrl
      const laRengaMatches = results.filter(
        (r) =>
          r.previewUrl &&
          normalizeText(r.artistName || '').includes('la renga')
      );

      // 1. Prefer standalone track whose title starts with or equals cleanTitle (excluding medleys like Popurock)
      const exactStandaloneMatch = laRengaMatches.find((r) => {
        const normTrack = normalizeText(r.trackName || '');
        return (
          !isMedleyTrack(r.trackName || '') &&
          (normTrack === cleanTitle || normTrack.startsWith(cleanTitle))
        );
      });

      // 2. Next, prefer any standalone track containing cleanTitle (excluding medleys)
      const substringStandaloneMatch = laRengaMatches.find((r) => {
        const normTrack = normalizeText(r.trackName || '');
        return !isMedleyTrack(r.trackName || '') && normTrack.includes(cleanTitle);
      });

      // 3. Fallback to medley only if the song appears inside a medley or fallback to first La Renga match
      const medleyOrFallbackMatch =
        laRengaMatches.find((r) =>
          normalizeText(r.trackName || '').includes(cleanTitle)
        ) || laRengaMatches[0];

      const bestMatch =
        exactStandaloneMatch || substringStandaloneMatch || medleyOrFallbackMatch;

      if (bestMatch && bestMatch.previewUrl) {
        const matchedName = bestMatch.trackName || song.title;
        const isExact = Boolean(exactStandaloneMatch || substringStandaloneMatch);
        const resolved: ResolvedTrackStream = {
          previewUrl: bestMatch.previewUrl,
          trackName: matchedName,
          collectionName: bestMatch.collectionName || song.album,
          trackViewUrl: bestMatch.trackViewUrl || null,
          sourceLabel: isExact
            ? `Audio Oficial: ${matchedName}`
            : `Audio en Vivo: ${matchedName}`,
        };
        streamCache.set(song.id, resolved);
        return resolved;
      }
    }
  } catch {
    // Fallback if offline or blocked
  }

  // Fallback query: general La Renga catalog stream if a rare cult song isn't on streaming
  try {
    const fallbackResponse = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(
        'La Renga'
      )}&entity=song&limit=35&country=AR`
    );
    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json();
      const list: Array<{
        artistName?: string;
        trackName?: string;
        collectionName?: string;
        previewUrl?: string;
        trackViewUrl?: string;
      }> = Array.isArray(fallbackData?.results) ? fallbackData.results : [];

      const valid = list.filter(
        (r) =>
          r.previewUrl &&
          normalizeText(r.artistName || '').includes('la renga') &&
          !isMedleyTrack(r.trackName || '')
      );
      if (valid.length > 0) {
        const hash = song.id
          .split('')
          .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        const pick = valid[hash % valid.length];
        const resolved: ResolvedTrackStream = {
          previewUrl: pick.previewUrl || null,
          trackName: pick.trackName || song.title,
          collectionName: pick.collectionName || song.album,
          trackViewUrl: pick.trackViewUrl || null,
          sourceLabel: `Audio La Renga: ${pick.trackName}`,
        };
        streamCache.set(song.id, resolved);
        return resolved;
      }
    }
  } catch {
    // Ignore network errors
  }

  const emptyResult: ResolvedTrackStream = {
    previewUrl: null,
    trackName: song.title,
    collectionName: song.album,
    trackViewUrl: null,
    sourceLabel: 'Preview no disponible en iTunes',
  };
  return emptyResult;
}
