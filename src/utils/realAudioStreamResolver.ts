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
    .toLowerCase()
    .trim();
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
      `https://itunes.apple.com/search?term=${query}&entity=song&limit=12&country=AR`
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

      // Prefer exact or substring title match
      const bestMatch =
        laRengaMatches.find((r) =>
          normalizeText(r.trackName || '').includes(cleanTitle)
        ) ||
        laRengaMatches[0] ||
        results.find((r) => Boolean(r.previewUrl));

      if (bestMatch && bestMatch.previewUrl) {
        const resolved: ResolvedTrackStream = {
          previewUrl: bestMatch.previewUrl,
          trackName: bestMatch.trackName || song.title,
          collectionName: bestMatch.collectionName || song.album,
          trackViewUrl: bestMatch.trackViewUrl || null,
          sourceLabel: 'Stream Oficial Audio Real (AAC 256kbps)',
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
      )}&entity=song&limit=25&country=AR`
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
          normalizeText(r.artistName || '').includes('la renga')
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
          sourceLabel: `Stream Audio Real La Renga (${pick.trackName})`,
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
    sourceLabel: 'Modo YouTube / Sintetizador',
  };
  return emptyResult;
}
