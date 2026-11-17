// src/utils/supabaseClient.ts
import { INITIAL_LEADERBOARD, LeaderboardEntry } from '../data/banqueteGameData';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const LOCAL_COMMUNITY_CACHE_KEY = 'la_renga_community_banquetes_v1';

export interface CommunityBanqueteRecord extends LeaderboardEntry {
  songIds: string[];
  rankTitle?: string;
}

export interface SharedBanquetePayload {
  author: string;
  title: string;
  score: number;
  songIds: string[];
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    SUPABASE_URL &&
      SUPABASE_ANON_KEY &&
      SUPABASE_URL.startsWith('https://')
  );
}

const DEFAULT_COMMUNITY_BANQUETES: CommunityBanqueteRecord[] = [
  {
    id: 'seed-1',
    banqueteName: 'Huracán 1999 · El Ojo del Pogo',
    author: 'Chizzo_Mataderos',
    totalScore: 9540,
    openerTitle: 'A la carga mi rocanrol',
    closerTitle: 'Hablando de la libertad',
    albumsCount: 10,
    badgesCount: 5,
    dateLabel: 'Huracán 99',
    isPlayer: false,
    songIds: [
      'dp-2', 'lr-2', 'ei-4', 'ad-3', 'dp-6', 'ds-1',
      'tt-2', 'ar-3', 'pv-1', 'al-4', 'ec-5', 'ad-8',
      'dp-4', 'dp-5', 'ei-2', 'ei-3', 'ds-2', 'ds-4',
      'tt-1', 'tt-6', 'ar-1', 'pv-4', 'al-1', 'tp-2',
      'dp-1', 'dp-7', 'lr-9', 'ei-7', 'ds-8', 'tt-3',
      'ar-5', 'pv-7', 'al-6', 'ec-9', 'ei-9', 'dp-10',
    ],
  },
  {
    id: 'seed-2',
    banqueteName: 'Costa Atlántica Truenotierra',
    author: 'Rengo_Necochea',
    totalScore: 9180,
    openerTitle: 'Panic Show',
    closerTitle: 'Hablando de la libertad',
    albumsCount: 9,
    badgesCount: 4,
    dateLabel: 'Necochea 2026',
    isPlayer: false,
    songIds: [
      'ei-4', 'dp-1', 'tt-1', 'ds-2', 'lr-2', 'al-1',
      'pv-1', 'ar-3', 'dp-6', 'ad-8', 'ec-2', 'ei-2',
      'ds-1', 'tt-3', 'ar-5', 'pv-2', 'al-4', 'tp-3',
      'dp-2', 'dp-4', 'dp-5', 'ei-10', 'ds-3', 'tt-6',
      'ar-1', 'pv-6', 'al-5', 'ec-3', 'ad-3', 'dp-10',
    ],
  },
  {
    id: 'seed-3',
    banqueteName: 'Mística de Ruta 40',
    author: 'LaEstrella73',
    totalScore: 8790,
    openerTitle: 'Tripa y corazón',
    closerTitle: 'Hablando de la libertad',
    albumsCount: 9,
    badgesCount: 4,
    dateLabel: 'Autódromo',
    isPlayer: false,
    songIds: [
      'lr-2', 'tt-3', 'dp-2', 'ei-3', 'ds-4', 'pv-2',
      'al-6', 'tp-2', 'ad-3', 'dp-6', 'ec-5', 'ar-2',
      'tt-5', 'ds-1', 'ei-4', 'dp-5', 'pv-4', 'al-2',
      'dp-10',
    ],
  },
  {
    id: 'seed-4',
    banqueteName: 'Trinchera del Charco 1991',
    author: 'Viejo_Rengo',
    totalScore: 7890,
    openerTitle: 'Moscas verdes, para el charlatán',
    closerTitle: 'Hablando de la libertad',
    albumsCount: 7,
    badgesCount: 4,
    dateLabel: 'Obras 1995',
    isPlayer: false,
    songIds: [
      'ec-2', 'ec-3', 'ec-5', 'ec-9', 'ad-3', 'ad-8',
      'ad-11', 'dp-2', 'dp-4', 'dp-5', 'dp-6', 'dp-10',
    ],
  },
];

function getLocalCommunityCache(): CommunityBanqueteRecord[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_COMMUNITY_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_COMMUNITY_BANQUETES;
}

function saveLocalCommunityCache(records: CommunityBanqueteRecord[]): void {
  try {
    window.localStorage.setItem(
      LOCAL_COMMUNITY_CACHE_KEY,
      JSON.stringify(records.slice(0, 40))
    );
  } catch {
    // Ignore storage errors
  }
}

/**
 * Trae el Ranking Global de Banquetes desde Supabase (si está configurado)
 * o combina con la caché local para que siempre haya usuarios con quienes batallar.
 */
export async function fetchCommunityBanquetes(
  limit = 25
): Promise<CommunityBanqueteRecord[]> {
  const localRecords = getLocalCommunityCache();

  if (!isSupabaseConfigured()) {
    return localRecords
      .slice()
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/banquetes_comunidad?select=*&order=total_score.desc,created_at.desc&limit=${limit}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const rows: Array<{
        id: string;
        banquete_name: string;
        author_name: string;
        total_score: number;
        rank_title?: string;
        opener_title: string;
        closer_title: string;
        albums_count: number;
        badges_count: number;
        song_ids?: string[];
        date_label?: string;
      }> = await response.json();

      const mapped: CommunityBanqueteRecord[] = rows.map((r) => ({
        id: r.id,
        banqueteName: r.banquete_name,
        author: r.author_name,
        totalScore: Number(r.total_score) || 0,
        rankTitle: r.rank_title || 'Banquete Renguero',
        openerTitle: r.opener_title || 'Sin Apertura',
        closerTitle: r.closer_title || 'Sin Cierre',
        albumsCount: Number(r.albums_count) || 1,
        badgesCount: Number(r.badges_count) || 0,
        dateLabel: r.date_label || 'Comunidad Online',
        isPlayer: false,
        songIds: Array.isArray(r.song_ids) ? r.song_ids : [],
      }));

      if (mapped.length > 0) {
        saveLocalCommunityCache(mapped);
        return mapped;
      }
    }
  } catch {
    // Fallback to local records if offline
  }

  return localRecords
    .slice()
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit);
}

/**
 * Publica un Banquete en la tabla global de Supabase (y también en la caché local)
 * para que aparezca en el Ranking Mundial y otros usuarios puedan batallar contra él.
 */
export async function publishCommunityBanquete(input: {
  banqueteName: string;
  authorName: string;
  totalScore: number;
  rankTitle: string;
  openerTitle: string;
  closerTitle: string;
  albumsCount: number;
  badgesCount: number;
  songIds: string[];
}): Promise<{ savedToSupabase: boolean; record: CommunityBanqueteRecord }> {
  const newLocalRecord: CommunityBanqueteRecord = {
    id: `usr-${Date.now()}`,
    banqueteName: input.banqueteName.trim() || 'Mi Banquete en Necochea',
    author: input.authorName.trim() || 'Renguero',
    totalScore: input.totalScore,
    rankTitle: input.rankTitle,
    openerTitle: input.openerTitle,
    closerTitle: input.closerTitle,
    albumsCount: input.albumsCount,
    badgesCount: input.badgesCount,
    dateLabel: 'Recién publicado',
    isPlayer: true,
    songIds: input.songIds,
  };

  const currentLocal = getLocalCommunityCache();
  const updatedLocal = [newLocalRecord, ...currentLocal]
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 40);
  saveLocalCommunityCache(updatedLocal);

  if (!isSupabaseConfigured()) {
    return { savedToSupabase: false, record: newLocalRecord };
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/banquetes_comunidad`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        banquete_name: newLocalRecord.banqueteName,
        author_name: newLocalRecord.author,
        total_score: newLocalRecord.totalScore,
        rank_title: newLocalRecord.rankTitle || 'Banquete Renguero',
        opener_title: newLocalRecord.openerTitle,
        closer_title: newLocalRecord.closerTitle,
        albums_count: newLocalRecord.albumsCount,
        badges_count: newLocalRecord.badgesCount,
        song_ids: newLocalRecord.songIds,
        date_label: 'Temporada 2026',
      }),
    });

    if (response.ok) {
      const inserted = await response.json();
      const row = Array.isArray(inserted) ? inserted[0] : inserted;
      if (row && row.id) {
        newLocalRecord.id = String(row.id);
      }
      return { savedToSupabase: true, record: newLocalRecord };
    }
  } catch {
    // Fallback to local cache
  }

  return { savedToSupabase: false, record: newLocalRecord };
}

/**
 * Codifica y decodifica un Banquete en un parámetro corto de URL (?banquete=...)
 * para compartir por WhatsApp, X/Twitter o link directo con amigos.
 */
export function encodeShareBanqueteUrl(payload: SharedBanquetePayload): string {
  try {
    const compact = {
      a: payload.author.slice(0, 40),
      t: payload.title.slice(0, 60),
      s: Math.round(payload.score),
      i: payload.songIds.slice(0, 36).join(','),
    };
    const json = JSON.stringify(compact);
    const encoded = window.btoa(unescape(encodeURIComponent(json)));
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    return `${baseUrl}?banquete=${encodeURIComponent(encoded)}`;
  } catch {
    return window.location.href;
  }
}

export function decodeSharedBanqueteFromUrl(): SharedBanquetePayload | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('banquete');
    if (!raw) return null;
    const json = decodeURIComponent(escape(window.atob(raw)));
    const parsed = JSON.parse(json) as {
      a?: string;
      t?: string;
      s?: number;
      i?: string;
    };
    const songIds = (parsed.i || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (songIds.length === 0) return null;
    return {
      author: parsed.a || 'Amigo Renguero',
      title: parsed.t || 'Banquete Compartido',
      score: Number(parsed.s) || 0,
      songIds,
    };
  } catch {
    return null;
  }
}
