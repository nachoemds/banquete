// src/App.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  Flame,
  Music,
  Trophy,
  Disc,
  Play,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Shuffle,
  ChevronDown,
  ChevronUp,
  Search,
  ExternalLink,
  Copy,
  Check,
  Sliders,
  X,
  Volume2,
  Sparkles,
  Eye,
  Swords,
  Ticket,
  Share2,
  User,
} from 'lucide-react';
import {
  LA_RENGA_SONGS,
  LA_RENGA_ALBUMS,
  PRESET_BANQUETES,
  LaRengaSong,
  SongEnergy,
} from './data/laRengaSongs';
import {
  calculateBanqueteScore,
  DEFAULT_WEIGHTS,
  ScoringWeights,
} from './utils/banqueteScoring';
import { BanqueteStage3D, CameraPreset } from './components/BanqueteStage3D';
import { BanqueteGameModal, GameTab } from './components/BanqueteGameModal';
import { BanqueteOnboardingModal } from './components/BanqueteOnboardingModal';
import { VisualSetlistBuilderModal } from './components/VisualSetlistBuilderModal';
import { BanqueteInAppPlayer } from './components/BanqueteInAppPlayer';
import { BanqueteShareModal } from './components/BanqueteShareModal';
import { SITE_COPY } from './data/siteCopy';
import {
  BONUS_CULT_SONGS,
  STAGE_UNLOCKABLES,
  GUEST_MUSICIANS_BY_SCORE,
  getActiveGuestForScore,
  NECOCHEA_TICKETS_OFFICIAL_URL,
  GameProgressState,
  StageUnlockableId,
  CollectibleTicket,
  LeaderboardEntry,
  loadGameProgress,
  saveGameProgress,
} from './data/banqueteGameData';
import {
  fetchCommunityBanquetes,
  publishCommunityBanquete,
  decodeSharedBanqueteFromUrl,
  CommunityBanqueteRecord,
  SharedBanquetePayload,
} from './utils/supabaseClient';
import { rockAudio } from './utils/rockAudioEngine';
import { getAlbumCoverDataUrl } from './utils/albumArtGenerator';

type ActiveModal =
  | 'none'
  | 'builder'
  | 'player'
  | 'score'
  | 'presets'
  | 'game'
  | 'share';

// Pool of songs with verified standalone iTunes audio previews so the 6 random starter songs always match 100%
const VERIFIED_STARTER_POOL_IDS = new Set([
  'ec-2', 'ec-3', 'ec-5', 'ec-9',
  'ad-3', 'ad-8', 'ad-11',
  'dp-1', 'dp-2', 'dp-3', 'dp-4', 'dp-5', 'dp-6', 'dp-7', 'dp-9', 'dp-10', 'dp-11',
  'lr-2', 'lr-9',
  'ei-2', 'ei-3', 'ei-4', 'ei-7', 'ei-9', 'ei-10', 'ei-11',
  'ds-1', 'ds-2', 'ds-3', 'ds-4', 'ds-5', 'ds-6', 'ds-8', 'ds-9', 'ds-10', 'ds-11',
  'tt-1', 'tt-2', 'tt-3', 'tt-4', 'tt-5', 'tt-6', 'tt-7', 'tt-8', 'tt-9',
  'ar-1', 'ar-2', 'ar-3', 'ar-4', 'ar-5', 'ar-7', 'ar-8',
  'pv-1', 'pv-2', 'pv-3', 'pv-4', 'pv-5', 'pv-6', 'pv-7', 'pv-8',
  'al-1', 'al-2', 'al-3', 'al-4', 'al-5', 'al-6', 'al-7',
  'tp-2', 'tp-3',
]);

function pickRandomStarterSetlist(count = 6): LaRengaSong[] {
  const pool = LA_RENGA_SONGS.filter((s) => VERIFIED_STARTER_POOL_IDS.has(s.id));
  const source = pool.length >= count ? [...pool] : [...LA_RENGA_SONGS];
  // Fisher-Yates shuffle for true randomness on every page load
  for (let i = source.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = source[i];
    source[i] = source[j];
    source[j] = temp;
  }
  return source.slice(0, count);
}

export default function App() {
  const [setlist, setSetlist] = useState<LaRengaSong[]>(() =>
    pickRandomStarterSetlist(6)
  );

  // Sync activeSong initially to the exact #01 song of the random 6-song starter setlist
  const [activeSong, setActiveSong] = useState<LaRengaSong | null>(
    () => setlist[0] || LA_RENGA_SONGS[0]
  );
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('general');
  const [flareActive, setFlareActive] = useState<boolean>(false);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(true);
  const [showWelcomeGreeting, setShowWelcomeGreeting] = useState<boolean>(true);

  const handleCloseOnboarding = () => {
    setOnboardingOpen(false);
    setShowWelcomeGreeting(false);
    try {
      localStorage.setItem('banquete_onboarding_seen_v5', 'true');
    } catch {
      // ignore storage errors
    }
  };

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAlbum, setSelectedAlbum] = useState<string>('ALL');
  const [selectedEnergy, setSelectedEnergy] = useState<SongEnergy | 'ALL'>('ALL');

  const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);
  const [copiedSpotify, setCopiedSpotify] = useState<boolean>(false);
  const [soundEnabled] = useState<boolean>(true);

  // Game Mode State (persisted in localStorage)
  const [gameProgress, setGameProgress] = useState<GameProgressState>(() =>
    loadGameProgress()
  );
  const [gameInitialTab, setGameInitialTab] = useState<GameTab>('oraculo');
  const [gameInitialRivalId, setGameInitialRivalId] = useState<string | null>(null);
  const [communityBanquetes, setCommunityBanquetes] = useState<
    CommunityBanqueteRecord[]
  >([]);
  const [sharedFriendBanquete, setSharedFriendBanquete] =
    useState<SharedBanquetePayload | null>(() => decodeSharedBanqueteFromUrl());

  useEffect(() => {
    saveGameProgress(gameProgress);
  }, [gameProgress]);

  useEffect(() => {
    fetchCommunityBanquetes(30).then((records) => {
      if (sharedFriendBanquete) {
        const friendRec: CommunityBanqueteRecord = {
          id: 'shared-friend',
          banqueteName: sharedFriendBanquete.title,
          author: sharedFriendBanquete.author,
          totalScore: sharedFriendBanquete.score,
          openerTitle:
            LA_RENGA_SONGS.find((s) => s.id === sharedFriendBanquete.songIds[0])
              ?.title || 'Apertura',
          closerTitle:
            LA_RENGA_SONGS.find(
              (s) =>
                s.id ===
                sharedFriendBanquete.songIds[
                  sharedFriendBanquete.songIds.length - 1
                ]
            )?.title || 'Cierre',
          albumsCount: 8,
          badgesCount: 4,
          dateLabel: 'Invitación Amigo',
          isPlayer: false,
          songIds: sharedFriendBanquete.songIds,
        };
        setCommunityBanquetes([friendRec, ...records]);
      } else {
        setCommunityBanquetes(records);
      }
    });
  }, [sharedFriendBanquete]);

  const handleSaveProfile = (alias: string, title: string) => {
    setGameProgress((prev) => ({
      ...prev,
      playerAlias: alias.trim() || 'Renguero',
      banqueteTitle: title.trim() || 'Mi Banquete en Necochea',
    }));
  };

  // Catalog includes the 3 bonus cult songs once golden_pyro is unlocked
  const allCatalogSongs = useMemo(() => {
    if (gameProgress.unlockedStageIds.includes('golden_pyro')) {
      return [...LA_RENGA_SONGS, ...BONUS_CULT_SONGS];
    }
    return LA_RENGA_SONGS;
  }, [gameProgress.unlockedStageIds]);

  // Pre-generate all 11 hand-illustrated album cover URLs on mount
  const albumCoverMap = useMemo(() => {
    const map: Record<string, string> = {};
    LA_RENGA_ALBUMS.forEach((alb) => {
      map[alb.name] = getAlbumCoverDataUrl(alb.name);
    });
    return map;
  }, []);

  const scoreResult = useMemo(
    () => calculateBanqueteScore(setlist, weights),
    [setlist, weights]
  );

  const activeGuestTier = useMemo(
    () => getActiveGuestForScore(scoreResult.totalScore),
    [scoreResult.totalScore]
  );

  // Automatically check and award setlist-based trophies & stage unlockables
  useEffect(() => {
    const newTrophies = new Set(gameProgress.earnedTrophyIds);
    const newUnlockedStages = new Set(gameProgress.unlockedStageIds);
    const newEnabledStages = new Set(gameProgress.enabledStageIds);
    let changed = false;

    if (setlist.length === 36 && !newTrophies.has('tr_first_banquete')) {
      newTrophies.add('tr_first_banquete');
      changed = true;
    }
    if (
      setlist.length === 36 &&
      scoreResult.totalScore >= 9000 &&
      !newTrophies.has('tr_nine_thousand')
    ) {
      newTrophies.add('tr_nine_thousand');
      changed = true;
    }
    const uniqueAlbums = new Set(setlist.map((s) => s.album)).size;
    if (uniqueAlbums >= 9 && !newTrophies.has('tr_all_eras')) {
      newTrophies.add('tr_all_eras');
      changed = true;
    }
    const cultCount = setlist.filter((s) => s.rarity === 3).length;
    if (cultCount >= 6 && !newTrophies.has('tr_cult_digger')) {
      newTrophies.add('tr_cult_digger');
      changed = true;
    }
    if (gameProgress.tickets.length >= 4 && !newTrophies.has('tr_collector')) {
      newTrophies.add('tr_collector');
      changed = true;
    }

    // Unlock Stage Fire if score >= 7500
    if (scoreResult.totalScore >= 7500 && !newUnlockedStages.has('stage_fire')) {
      newUnlockedStages.add('stage_fire');
      changed = true;
    }
    // Unlock Guest Musician (starting with El Carpo at 2,000 pts) according to score points
    if (
      scoreResult.totalScore >= 2000 &&
      !newUnlockedStages.has('guest_musician')
    ) {
      newUnlockedStages.add('guest_musician');
      newEnabledStages.add('guest_musician');
      changed = true;
    }
    // Unlock Golden Pyro if 3+ tickets collected
    if (
      gameProgress.tickets.length >= 3 &&
      !newUnlockedStages.has('golden_pyro')
    ) {
      newUnlockedStages.add('golden_pyro');
      changed = true;
    }

    if (changed) {
      setGameProgress((prev) => ({
        ...prev,
        earnedTrophyIds: Array.from(newTrophies),
        unlockedStageIds: Array.from(newUnlockedStages),
        enabledStageIds: Array.from(newEnabledStages),
      }));
    }
  }, [
    setlist,
    scoreResult.totalScore,
    gameProgress.earnedTrophyIds,
    gameProgress.unlockedStageIds,
    gameProgress.enabledStageIds,
    gameProgress.tickets.length,
  ]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'h' || e.key === 'H') &&
        document.activeElement?.tagName !== 'INPUT'
      ) {
        setDockCollapsed((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setActiveModal('none');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const setlistIds = useMemo(() => new Set(setlist.map((s) => s.id)), [setlist]);

  const filteredCatalog = useMemo(() => {
    return allCatalogSongs.filter((song) => {
      const matchesAlbum = selectedAlbum === 'ALL' || song.album === selectedAlbum;
      const matchesEnergy = selectedEnergy === 'ALL' || song.energy === selectedEnergy;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        song.title.toLowerCase().includes(q) ||
        song.album.toLowerCase().includes(q);
      return matchesAlbum && matchesEnergy && matchesQuery;
    });
  }, [allCatalogSongs, selectedAlbum, selectedEnergy, searchQuery]);

  const handleAddSong = (song: LaRengaSong) => {
    if (setlist.length >= 36 || setlistIds.has(song.id)) return;
    const updated = [...setlist, song];
    setSetlist(updated);
    setActiveSong(song);
  };

  // Keep activeSong synced with setlist[0] if the active song is removed from the list
  useEffect(() => {
    if (
      setlist.length > 0 &&
      (!activeSong || !setlist.some((s) => s.id === activeSong.id))
    ) {
      setActiveSong(setlist[0]);
    }
  }, [setlist, activeSong]);

  const handleRemoveSong = (songId: string) => {
    setSetlist((prev) => prev.filter((s) => s.id !== songId));
  };

  const handleMoveSong = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= setlist.length) return;
    const copy = [...setlist];
    const [item] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, item);
    setSetlist(copy);
  };

  const handlePromoteToOpener = (index: number) => {
    if (index <= 0 || index >= setlist.length) return;
    const copy = [...setlist];
    const [item] = copy.splice(index, 1);
    copy.unshift(item);
    setSetlist(copy);
    setActiveSong(item);
  };

  const handleReorderSong = (fromIndex: number, toIndex: number) => {
    setSetlist((prev) => {
      if (
        fromIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex < 0 ||
        toIndex >= prev.length ||
        fromIndex === toIndex
      ) {
        return prev;
      }
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  };

  const handleReplaceSong = (slotIndex: number, newSong: LaRengaSong) => {
    setSetlist((prev) => {
      if (slotIndex < 0 || slotIndex >= prev.length) return prev;
      const copy = [...prev];
      const existingIdx = copy.findIndex((s) => s.id === newSong.id);
      if (existingIdx !== -1) {
        // If the replacement song is already in the setlist at another slot, swap them!
        const temp = copy[slotIndex];
        copy[slotIndex] = copy[existingIdx];
        copy[existingIdx] = temp;
      } else {
        // Otherwise replace the slot directly with the new song
        copy[slotIndex] = newSong;
      }
      return copy;
    });
    setActiveSong(newSong);
  };

  const handleInsertSongAt = (insertIndex: number, newSong: LaRengaSong) => {
    setSetlist((prev) => {
      const copy = [...prev];
      const existingIdx = copy.findIndex((s) => s.id === newSong.id);
      if (existingIdx !== -1) {
        // If song is already in the list, move it to the target gap position
        const [moved] = copy.splice(existingIdx, 1);
        const adjustedIdx =
          existingIdx < insertIndex ? insertIndex - 1 : insertIndex;
        const clampedIdx = Math.max(0, Math.min(copy.length, adjustedIdx));
        copy.splice(clampedIdx, 0, moved);
        return copy;
      }
      // Insert new song at the exact position between songs (without replacing the target song)
      const clampedIdx = Math.max(0, Math.min(copy.length, insertIndex));
      copy.splice(clampedIdx, 0, newSong);
      // Keep max 36 songs if the list was already at 36
      return copy.slice(0, 36);
    });
    setActiveSong(newSong);
  };

  const handleAutoFill36 = () => {
    const remainingNeeded = 36 - setlist.length;
    if (remainingNeeded <= 0) return;

    const available = LA_RENGA_SONGS.filter((s) => !setlistIds.has(s.id));
    const hablando = available.find((s) => s.title === 'Hablando de la libertad');
    const pool = available
      .filter((s) => s.title !== 'Hablando de la libertad')
      .sort(() => Math.random() - 0.5);

    const picked = pool.slice(0, hablando ? remainingNeeded - 1 : remainingNeeded);
    if (hablando && remainingNeeded >= 1) {
      picked.push(hablando);
    }

    const nextList = [...setlist, ...picked].slice(0, 36);
    setSetlist(nextList);
    setActiveSong(nextList[nextList.length - 1]);
    if (soundEnabled) {
      rockAudio.playCrowdRoar();
    }
  };

  const handleLoadPreset = (songIds: string[]) => {
    const loaded = songIds
      .map((id) => allCatalogSongs.find((s) => s.id === id) || LA_RENGA_SONGS.find((s) => s.id === id))
      .filter((s): s is LaRengaSong => Boolean(s));
    setSetlist(loaded);
    if (loaded.length > 0) {
      setActiveSong(loaded[0]);
    }
    if (soundEnabled) {
      rockAudio.playCrowdRoar();
    }
    setActiveModal('none');
  };

  const handleToggleStageUnlockable = (id: StageUnlockableId) => {
    setGameProgress((prev) => {
      const isAlreadyUnlocked = prev.unlockedStageIds.includes(id);
      const isAlreadyEnabled = prev.enabledStageIds.includes(id);

      const nextUnlocked = isAlreadyUnlocked
        ? prev.unlockedStageIds
        : [...prev.unlockedStageIds, id];
      const nextEnabled = isAlreadyEnabled
        ? prev.enabledStageIds.filter((x) => x !== id)
        : [...prev.enabledStageIds, id];

      return {
        ...prev,
        unlockedStageIds: nextUnlocked,
        enabledStageIds: nextEnabled,
      };
    });
  };

  const handleRecordOracleAttempt = (
    challengeId: string,
    hitsCount: number,
    _oracleScore: number,
    ticket: CollectibleTicket,
    unlockedStageId?: StageUnlockableId
  ) => {
    setGameProgress((prev) => {
      const solved = prev.solvedOracleIds.includes(challengeId)
        ? prev.solvedOracleIds
        : hitsCount >= 3
        ? [...prev.solvedOracleIds, challengeId]
        : prev.solvedOracleIds;

      const trophies = new Set(prev.earnedTrophyIds);
      if (hitsCount >= 4) {
        trophies.add('tr_huracan_oracle');
      }

      const unlocked = new Set(prev.unlockedStageIds);
      const enabled = new Set(prev.enabledStageIds);
      if (unlockedStageId) {
        unlocked.add(unlockedStageId);
        enabled.add(unlockedStageId);
      }

      const nextTickets = [ticket, ...prev.tickets].slice(0, 20);
      if (nextTickets.length >= 4) {
        trophies.add('tr_collector');
      }

      return {
        ...prev,
        solvedOracleIds: solved,
        earnedTrophyIds: Array.from(trophies),
        unlockedStageIds: Array.from(unlocked),
        enabledStageIds: Array.from(enabled),
        tickets: nextTickets,
      };
    });
  };

  const handleRecordDuelResult = (
    rivalId: string,
    playerWon: boolean,
    ticket: CollectibleTicket
  ) => {
    setGameProgress((prev) => {
      const defeated =
        playerWon && !prev.defeatedRivalIds.includes(rivalId)
          ? [...prev.defeatedRivalIds, rivalId]
          : prev.defeatedRivalIds;

      const trophies = new Set(prev.earnedTrophyIds);
      const unlocked = new Set(prev.unlockedStageIds);
      const enabled = new Set(prev.enabledStageIds);

      if (playerWon) {
        trophies.add('tr_duel_winner');
        unlocked.add('stage_fire');
        enabled.add('stage_fire');
      }
      if (defeated.length >= 2) {
        unlocked.add('stadium_lasers');
        enabled.add('stadium_lasers');
        unlocked.add('guest_musician');
        enabled.add('guest_musician');
      }
      if (playerWon && rivalId === 'rival-oraculo-mataderos') {
        trophies.add('tr_boss_slayer');
        unlocked.add('golden_pyro');
        enabled.add('golden_pyro');
      }

      const nextTickets = [ticket, ...prev.tickets].slice(0, 20);
      if (nextTickets.length >= 4) {
        trophies.add('tr_collector');
      }

      return {
        ...prev,
        defeatedRivalIds: defeated,
        earnedTrophyIds: Array.from(trophies),
        unlockedStageIds: Array.from(unlocked),
        enabledStageIds: Array.from(enabled),
        tickets: nextTickets,
      };
    });
  };

  const handlePublishToGlobalRanking = async (
    banqueteName: string,
    authorName: string
  ): Promise<{ savedToSupabase: boolean }> => {
    const uniqueAlbums = new Set(setlist.map((s) => s.album)).size;
    const res = await publishCommunityBanquete({
      banqueteName,
      authorName,
      totalScore: scoreResult.totalScore,
      rankTitle: scoreResult.rankTitle,
      openerTitle: setlist[0]?.title || 'Sin Apertura',
      closerTitle: setlist[setlist.length - 1]?.title || 'Sin Cierre',
      albumsCount: uniqueAlbums,
      badgesCount: scoreResult.badges.length,
      songIds: setlist.map((s) => s.id),
    });
    const refreshed = await fetchCommunityBanquetes(30);
    setCommunityBanquetes(refreshed);
    return { savedToSupabase: res.savedToSupabase };
  };

  const handleRegisterLeaderboardBanquete = (
    banqueteName: string,
    authorName: string
  ): CollectibleTicket => {
    const uniqueAlbums = new Set(setlist.map((s) => s.album)).size;
    const newEntry: LeaderboardEntry = {
      id: `lb-${Date.now()}`,
      banqueteName,
      author: authorName,
      totalScore: scoreResult.totalScore,
      openerTitle: setlist[0]?.title || 'Sin Apertura',
      closerTitle: setlist[setlist.length - 1]?.title || 'Sin Cierre',
      albumsCount: uniqueAlbums,
      badgesCount: scoreResult.badges.length,
      dateLabel: 'Temporada 2026',
      isPlayer: true,
    };

    const newTicket: CollectibleTicket = {
      id: `tk-banquete-${Date.now()}`,
      serialNumber: `BNQ-${String(Math.floor(1000 + Math.random() * 9000))}`,
      title: banqueteName,
      subtitle: `Curado por ${authorName} · ${setlist.length}/36 Canciones`,
      venue: 'Playa de Necochea · Escenario Principal',
      dateIssued: 'Temporada 2026',
      score: scoreResult.totalScore,
      mode: 'setlist',
      openerTitle: setlist[0]?.title || 'Sin Apertura',
      closerTitle: setlist[setlist.length - 1]?.title || 'Sin Cierre',
      stampText: scoreResult.rankTitle.toUpperCase(),
      badgesEarned: scoreResult.badges,
    };

    setGameProgress((prev) => {
      const mergedBoard = [...prev.leaderboard, newEntry]
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 12);
      const nextTickets = [newTicket, ...prev.tickets].slice(0, 20);
      const trophies = new Set(prev.earnedTrophyIds);
      if (nextTickets.length >= 4) {
        trophies.add('tr_collector');
      }
      return {
        ...prev,
        playerAlias: authorName.trim() || prev.playerAlias,
        banqueteTitle: banqueteName.trim() || prev.banqueteTitle,
        leaderboard: mergedBoard,
        tickets: nextTickets,
        earnedTrophyIds: Array.from(trophies),
      };
    });

    handlePublishToGlobalRanking(banqueteName, authorName);

    return newTicket;
  };

  const handleCopySpotifyList = () => {
    const text = setlist
      .map(
        (s, idx) =>
          `${String(idx + 1).padStart(2, '0')}. La Renga - ${s.title} (${s.album})`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedSpotify(true);
    setTimeout(() => setCopiedSpotify(false), 2500);
  };

  const energyLabel: Record<SongEnergy, string> = {
    pogo: 'Pogo Demoledor',
    himno: 'Himno de Estadio',
    rock: 'Rocanrol de Ruta',
    balada: 'Balada / Respiro',
    oculto: 'Joya de Culto',
  };

  return (
    <div className="relative w-screen h-[100dvh] bg-[#0d0a09] text-[#efe8d8] overflow-hidden flex flex-col select-none">
      {/* TOP BAR CONTRACT: Responsive Desktop & Mobile Header */}
      <header className="relative z-20 flex flex-col bg-[#120e0c] border-b-2 border-[#3a2c24] shrink-0">
        <div className="flex items-center justify-between gap-2 sm:gap-6 px-3 sm:px-6 py-2 sm:py-3.5">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveModal('none');
            }}
            className="text-lg sm:text-2xl font-rock tracking-wider text-[#f59e0b] hover:text-[#ef4444] transition-colors whitespace-nowrap shrink-0"
          >
            {SITE_COPY.header.brandTitle}
          </a>

          {/* Zone 2: Desktop navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#c5b8a5]">
            <button
              onClick={() => setActiveModal(activeModal === 'builder' ? 'none' : 'builder')}
              className={`hover:text-[#f5efe2] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeModal === 'builder' ? 'text-[#ef4444] underline underline-offset-8' : ''
              }`}
            >
              {SITE_COPY.header.navBuilder} ({setlist.length}/36)
            </button>
            <button
              onClick={() => {
                setGameInitialTab('oraculo');
                setActiveModal(activeModal === 'game' && gameInitialTab === 'oraculo' ? 'none' : 'game');
              }}
              className={`hover:text-[#f5efe2] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeModal === 'game' && gameInitialTab !== 'vitrina'
                  ? 'text-[#ef4444] underline underline-offset-8'
                  : 'text-[#f59e0b]'
              }`}
            >
              {SITE_COPY.header.navOracleAndDuels}
            </button>
            <button
              onClick={() => {
                setGameInitialTab('vitrina');
                setActiveModal(activeModal === 'game' && gameInitialTab === 'vitrina' ? 'none' : 'game');
              }}
              className={`hover:text-[#f5efe2] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeModal === 'game' && gameInitialTab === 'vitrina'
                  ? 'text-[#ef4444] underline underline-offset-8'
                  : ''
              }`}
            >
              {SITE_COPY.header.navTicketsAndRanking} ({gameProgress.tickets.length})
            </button>
            <button
              onClick={() => setActiveModal(activeModal === 'player' ? 'none' : 'player')}
              className={`hover:text-[#f5efe2] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeModal === 'player' ? 'text-[#ef4444] underline underline-offset-8' : ''
              }`}
            >
              {SITE_COPY.header.navListen}
            </button>
          </nav>

          {/* Zone 3: Player Profile + Share Button + Primary Action */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveModal('share')}
              title="Editar tu Apodo Renguero o compartir tu Banquete"
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold bg-[#1c1512] hover:bg-[#2a201b] text-[#f59e0b] border border-[#4a382d] rounded cursor-pointer whitespace-nowrap"
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="max-w-[78px] sm:max-w-[130px] truncate">{gameProgress.playerAlias}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('share')}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold bg-[#271b15] hover:bg-[#3a281f] text-[#f5efe2] border border-[#f59e0b]/50 rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Share2 className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span className="hidden sm:inline">Compartir / Invitar</span>
            </button>

            <button
              onClick={() => {
                setGameInitialTab('duelo');
                setActiveModal('game');
              }}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-[#f5efe2] bg-[#b91c1c] hover:bg-[#dc2626] rounded border border-[#f59e0b]/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="sm:hidden">
                Duelos ({scoreResult.totalScore.toLocaleString('es-AR')})
              </span>
              <span className="hidden sm:inline">
                {SITE_COPY.header.ctaMainButton} ({scoreResult.totalScore.toLocaleString('es-AR')} pts)
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Quick Navigation Bar (Shown below header on phones/tablets < md) */}
        <nav className="flex md:hidden items-center justify-between gap-1 px-2 py-1.5 bg-[#0e0b09] border-t border-[#291f1a] overflow-x-auto text-[11px] font-semibold text-[#c5b8a5]">
          <button
            onClick={() => setActiveModal(activeModal === 'builder' ? 'none' : 'builder')}
            className={`px-2.5 py-1 rounded whitespace-nowrap shrink-0 cursor-pointer ${
              activeModal === 'builder'
                ? 'bg-[#b91c1c] text-white'
                : 'bg-[#181210] text-[#f5efe2] border border-[#332720]'
            }`}
          >
            Armar ({setlist.length}/36)
          </button>
          <button
            onClick={() => {
              setGameInitialTab('oraculo');
              setActiveModal(activeModal === 'game' && gameInitialTab === 'oraculo' ? 'none' : 'game');
            }}
            className={`px-2.5 py-1 rounded whitespace-nowrap shrink-0 cursor-pointer ${
              activeModal === 'game' && gameInitialTab !== 'vitrina'
                ? 'bg-[#b91c1c] text-white'
                : 'bg-[#181210] text-[#f59e0b] border border-[#332720]'
            }`}
          >
            Oráculo & Duelos
          </button>
          <button
            onClick={() => {
              setGameInitialTab('vitrina');
              setActiveModal(activeModal === 'game' && gameInitialTab === 'vitrina' ? 'none' : 'game');
            }}
            className={`px-2.5 py-1 rounded whitespace-nowrap shrink-0 cursor-pointer ${
              activeModal === 'game' && gameInitialTab === 'vitrina'
                ? 'bg-[#b91c1c] text-white'
                : 'bg-[#181210] text-[#c5b8a5] border border-[#332720]'
            }`}
          >
            Entradas ({gameProgress.tickets.length})
          </button>
          <button
            onClick={() => setActiveModal(activeModal === 'player' ? 'none' : 'player')}
            className={`px-2.5 py-1 rounded whitespace-nowrap shrink-0 cursor-pointer ${
              activeModal === 'player'
                ? 'bg-[#b91c1c] text-white'
                : 'bg-[#181210] text-[#c5b8a5] border border-[#332720]'
            }`}
          >
            Escuchar
          </button>
        </nav>
      </header>

      {/* MAIN 3D VIEWPORT */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <BanqueteStage3D
          setlist={setlist}
          activeSong={activeSong}
          cameraPreset={cameraPreset}
          flareActive={flareActive}
          enabledUnlockables={gameProgress.enabledStageIds}
          activeGuestAssetUrl={activeGuestTier.assetUrl}
        />

        {/* Incoming Friend Shared Setlist / Challenge Banner (?banquete=...) */}
        {sharedFriendBanquete && (
          <div className="absolute top-[132px] sm:top-24 left-2.5 right-2.5 sm:right-auto sm:left-6 z-20 max-w-md sketch-panel p-3 sm:p-3.5 rounded border-2 border-[#f59e0b] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono font-bold text-[#f59e0b]">
                🔥 DESAFÍO RECIBIDO DE UN AMIGO
              </span>
              <button
                type="button"
                onClick={() => setSharedFriendBanquete(null)}
                className="text-xs text-[#a89984] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#f5efe2]">
              <strong className="text-[#fbbf24]">{sharedFriendBanquete.author}</strong> te invitó con su Banquete{' '}
              <strong>"{sharedFriendBanquete.title}"</strong> ({sharedFriendBanquete.score.toLocaleString('es-AR')} pts ·{' '}
              {sharedFriendBanquete.songIds.length} temas).
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  handleLoadPreset(sharedFriendBanquete.songIds);
                  setSharedFriendBanquete(null);
                }}
                className="px-3 py-1.5 text-xs font-bold bg-[#291811] hover:bg-[#3b2318] text-[#fbbf24] border border-[#f59e0b] rounded cursor-pointer"
              >
                Cargar y Escuchar su Lista
              </button>
              <button
                type="button"
                onClick={() => {
                  setGameInitialTab('duelo');
                  setGameInitialRivalId('user-shared-friend');
                  setActiveModal('game');
                }}
                className="px-3 py-1.5 text-xs font-bold bg-[#b91c1c] hover:bg-[#dc2626] text-white rounded cursor-pointer flex items-center gap-1"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Batallar vs. {sharedFriendBanquete.author}</span>
              </button>
            </div>
          </div>
        )}

        {/* Hand-Illustrated Top-Left Stage & Album Badge (Zero backdrop-filter, compact on mobile) */}
        <div className="absolute top-2 left-2.5 right-2.5 sm:right-auto sm:top-4 sm:left-6 z-10 max-w-md sketch-panel px-2.5 py-1.5 sm:px-4 sm:py-3 rounded flex items-center gap-2.5 sm:gap-3.5">
          {activeSong && (
            <img
              src={albumCoverMap[activeSong.album] || getAlbumCoverDataUrl(activeSong.album)}
              alt={`Tapa ilustrada de ${activeSong.album}`}
              referrerPolicy="no-referrer"
              className="w-10 h-10 sm:w-16 sm:h-16 rounded border border-[#544034] object-cover shrink-0 pointer-events-none"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[10px] sm:text-xs text-[#a89984] flex items-center gap-1.5 sm:gap-2 font-mono tabular-nums">
              <span className="truncate">{SITE_COPY.stageBadge.locationLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="shrink-0">
                {setlist.length}/36 {SITE_COPY.stageBadge.songsCounterUnit}
              </span>
              <span aria-hidden="true" className="hidden xs:inline">·</span>
              <span className="hidden xs:inline shrink-0">{scoreResult.totalDurationFormatted}</span>
            </div>
            <p className="mt-0.5 text-xs sm:text-base font-rock tracking-wide text-[#f5efe2] truncate">
              {scoreResult.rankTitle}
            </p>
            <div className="mt-0.5 sm:mt-1 flex items-center gap-1.5 overflow-x-auto">
              {activeSong && (
                <p className="hidden sm:block text-xs text-[#f59e0b] truncate max-w-[140px]">
                  {activeSong.title}
                </p>
              )}
              <button
                onClick={() => {
                  setShowWelcomeGreeting(false);
                  setOnboardingOpen(true);
                }}
                className="px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold bg-[#241b17] hover:bg-[#332721] text-[#f5efe2] border border-[#544034] rounded cursor-pointer whitespace-nowrap shrink-0 transition-colors"
              >
                {SITE_COPY.stageBadge.howToPlayButton}
              </button>
              <a
                href={NECOCHEA_TICKETS_OFFICIAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="Sacar Entradas Oficiales para La Renga en Necochea (Arte Infernal)"
                className="px-2 py-0.5 text-[10px] sm:text-[11px] font-bold bg-[#b91c1c] hover:bg-[#dc2626] text-white border border-[#f59e0b]/50 rounded flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <Ticket className="w-3 h-3" />
                <span>Entradas Necochea ↗</span>
              </a>
            </div>
          </div>
        </div>

        {/* UNIFIED COLLAPSIBLE BOTTOM CONTROL DOCK (Centered & Scroll-Friendly on Mobile) */}
        <div
          className="fixed z-20 transition-transform duration-200"
          style={{
            left: '50%',
            bottom: '8px',
            width: 'min(920px, 96vw)',
            transform: dockCollapsed
              ? 'translate(-50%, calc(100% - 30px))'
              : 'translate(-50%, 0)',
          }}
        >
          {/* Collapse / Expand Toggle Tab */}
          <div className="flex justify-center">
            <button
              onClick={() => setDockCollapsed((prev) => !prev)}
              className="px-3.5 sm:px-4 py-1 text-[11px] sm:text-xs font-medium bg-[#181210] text-[#d6c9b8] border-2 border-b-0 border-[#4a382d] rounded-t flex items-center gap-1.5 hover:text-white cursor-pointer whitespace-nowrap shrink-0"
              title="Atajo de teclado: H"
            >
              {dockCollapsed ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Mostrar Controles de la Playa</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Ocultar Controles / Modo Cine</span>
                </>
              )}
            </button>
          </div>

          {/* Main Dock Body */}
          <div className="sketch-panel rounded p-2.5 sm:p-3.5 flex flex-col gap-2 sm:gap-3">
            {/* Row 1: Progress Bar to 36 Songs + Quick Actions (Horizontally scrollable on mobile) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                <div className="text-[11px] sm:text-xs font-mono tabular-nums text-[#f5efe2] shrink-0">
                  SETLIST: <strong className="text-[#ef4444]">{setlist.length}</strong> / 36
                </div>
                <div className="flex-1 h-2 sm:h-2.5 bg-[#241b17] rounded overflow-hidden border border-[#382b24]">
                  <div
                    className="h-full bg-[#dc2626] transition-all duration-200"
                    style={{ width: `${(setlist.length / 36) * 100}%` }}
                  />
                </div>
                <div className="text-[11px] sm:text-xs font-mono tabular-nums text-[#f59e0b] shrink-0">
                  {scoreResult.totalScore.toLocaleString('es-AR')} PTS
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 md:pb-0 shrink-0">
                <button
                  onClick={() => setActiveModal('builder')}
                  className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold sketch-card hover:bg-[#2c211c] text-[#f5efe2] rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-[#ef4444]" />
                  <span>Elegir Canciones ({36 - setlist.length} libres)</span>
                </button>

                <button
                  onClick={() => {
                    setGameInitialTab('oraculo');
                    setActiveModal('game');
                  }}
                  className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold sketch-card hover:bg-[#2c211c] text-[#f59e0b] rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Swords className="w-3.5 h-3.5 text-[#f59e0b]" />
                  <span>Oráculo & Duelos</span>
                </button>

                <button
                  onClick={() => {
                    setGameInitialTab('vitrina');
                    setActiveModal('game');
                  }}
                  className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold sketch-card hover:bg-[#2c211c] text-[#f5efe2] rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Ticket className="w-3.5 h-3.5 text-[#ef4444]" />
                  <span>Entradas & Efectos 3D ({gameProgress.enabledStageIds.length}/4)</span>
                </button>

                {setlist.length < 36 && (
                  <button
                    onClick={handleAutoFill36}
                    className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold sketch-card hover:bg-[#2c211c] text-[#f5efe2] rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-[#d97706]" />
                    <span>Completar 36</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveModal('player')}
                  className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold bg-[#b91c1c] hover:bg-[#dc2626] text-white rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Escuchar</span>
                </button>
              </div>
            </div>

            {/* Row 2: Camera Angles + Decorative 3D Stage Effect Toggles + Agitar */}
            <div className="flex items-center justify-between gap-2 sm:gap-3 pt-1.5 sm:pt-2 border-t border-[#2e231d] overflow-x-auto pb-0.5 md:pb-0">
              <div className="flex items-center gap-1 bg-[#0d0a09] p-1 rounded border border-[#2c221d] shrink-0">
                {(
                  [
                    { id: 'general', label: 'Playa & Mar' },
                    { id: 'stage', label: 'Escenario' },
                    { id: 'pogo', label: 'Olla del Pogo' },
                    { id: 'entrance', label: 'Costa & Olas' },
                  ] as { id: CameraPreset; label: string }[]
                ).map((cam) => (
                  <button
                    key={cam.id}
                    onClick={() => setCameraPreset(cam.id)}
                    className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      cameraPreset === cam.id
                        ? 'bg-[#b91c1c] text-white'
                        : 'text-[#a89984] hover:text-white'
                    }`}
                  >
                    {cam.label}
                  </button>
                ))}
              </div>

              {/* Quick 3D Decorative Reward Toggles */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {(
                  [
                    { id: 'stage_fire', label: 'Fuego' },
                    { id: 'stadium_lasers', label: 'Luces Huracán' },
                    {
                      id: 'guest_musician',
                      label: `Invitado (${activeGuestTier.nickname})`,
                    },
                    { id: 'golden_pyro', label: 'Chispas' },
                  ] as { id: StageUnlockableId; label: string }[]
                ).map((fx) => {
                  const isActive = gameProgress.enabledStageIds.includes(fx.id);
                  const isUnlocked = gameProgress.unlockedStageIds.includes(fx.id);
                  return (
                    <button
                      key={fx.id}
                      onClick={() => handleToggleStageUnlockable(fx.id)}
                      title={
                        STAGE_UNLOCKABLES.find((u) => u.id === fx.id)?.name || fx.label
                      }
                      className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-[#291811] text-[#f59e0b] border-[#f59e0b]'
                          : isUnlocked
                          ? 'bg-[#14100e] text-[#c5b8a5] border-[#3a2c24] hover:text-white'
                          : 'bg-[#110d0b] text-[#786a58] border-[#261d19] hover:text-[#c5b8a5]'
                      }`}
                    >
                      {isActive ? `★ ${fx.label}` : fx.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    rockAudio.playCrowdRoar();
                    setFlareActive(true);
                    window.setTimeout(() => setFlareActive(false), 3200);
                  }}
                  className={`px-3 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded border transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                    flareActive
                      ? 'bg-[#dc2626] text-white border-[#f59e0b]'
                      : 'bg-[#b91c1c] hover:bg-[#dc2626] text-white border-[#ef4444]'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>{flareActive ? '¡Agitando!' : '¡Agitar!'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL 1: ARMADOR VISUAL DE SETLIST (BATEA DE DISCOS + TARJETAS INTERACTIVAS) */}
        <VisualSetlistBuilderModal
          isOpen={activeModal === 'builder'}
          onClose={() => setActiveModal('none')}
          setlist={setlist}
          catalogSongs={allCatalogSongs}
          albumCoverMap={albumCoverMap}
          scoreResult={scoreResult}
          selectedAlbum={selectedAlbum}
          onSelectAlbum={setSelectedAlbum}
          onAddSong={handleAddSong}
          onInsertSongAt={handleInsertSongAt}
          onReplaceSong={handleReplaceSong}
          onReorderSong={handleReorderSong}
          onRemoveSong={handleRemoveSong}
          onMoveSong={handleMoveSong}
          onPromoteToOpener={handlePromoteToOpener}
          onAutoFill36={handleAutoFill36}
          onClearSetlist={() => setSetlist([])}
          onLoadPreset={handleLoadPreset}
        />

        {/* REPRODUCTOR IN-APP PERSISTENTE (MINI-PLAYER FLOTANTE 3D + MODAL COMPLETO) */}
        <BanqueteInAppPlayer
          setlist={setlist}
          activeSong={activeSong}
          albumCoverMap={albumCoverMap}
          isModalOpen={activeModal === 'player'}
          onOpenModal={() => setActiveModal('player')}
          onCloseModal={() => setActiveModal('none')}
          onSelectActiveSong={(song) => setActiveSong(song)}
          onCopySpotifyList={handleCopySpotifyList}
          copiedSpotify={copiedSpotify}
        />

        {/* MODAL 4: PUNTUACIÓN DEL BANQUETE */}
        {activeModal === 'score' && (
          <div className="fixed inset-0 z-30 bg-black/80 flex items-center justify-center p-4">
            <div className="sketch-panel rounded w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#3a2c24] bg-[#191310]">
                <div className="flex items-center gap-2.5">
                  <Trophy className="w-5 h-5 text-[#f59e0b]" />
                  <div>
                    <h2 className="text-2xl font-rock text-[#f5efe2]">
                      Puntuación del Banquete & Reglas de Jurado
                    </h2>
                    <p className="text-xs text-[#a89984]">
                      Así se calcula el puntaje de tu lista de 36 canciones.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal('none')}
                  className="p-1.5 text-[#a89984] hover:text-white rounded cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                <div className="sketch-card rounded p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-[#d97706] font-mono tabular-nums">
                      RANGO ALCANZADO ({setlist.length}/36 CANCIONES)
                    </div>
                    <h3 className="text-2xl font-rock text-[#f5efe2] mt-1">
                      {scoreResult.rankTitle}
                    </h3>
                    <p className="text-xs text-[#c5b8a5] mt-1 max-w-xl">
                      {scoreResult.rankDescription}
                    </p>
                    {scoreResult.badges.length > 0 && (
                      <div className="mt-3 text-xs text-[#f59e0b] flex flex-wrap items-center gap-2">
                        <span>Menciones obtenidas:</span>
                        {scoreResult.badges.map((b, i) => (
                          <React.Fragment key={b}>
                            {i > 0 && <span aria-hidden="true">·</span>}
                            <span className="text-[#f5efe2] font-medium">{b}</span>
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-left md:text-right shrink-0 bg-[#110d0b] px-5 py-3 rounded border border-[#2e231e]">
                    <div className="text-xs text-[#9c8c79]">PUNTAJE TOTAL</div>
                    <div className="text-3xl font-mono tabular-nums font-bold text-[#ef4444]">
                      {scoreResult.totalScore.toLocaleString('es-AR')}
                      <span className="text-sm text-[#8c7c68] font-normal"> / 10.000</span>
                    </div>
                  </div>
                </div>

                {/* Escalera de Invitados Desbloqueables según Puntos */}
                <div className="sketch-card rounded p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-base font-rock text-[#f5efe2]">
                        Escalera de Invitados en el Escenario 3D según tus Puntos
                      </h4>
                      <p className="text-xs text-[#a89984]">
                        A medida que tu lista suma puntos, se destraban nuevos invitados sobre las tablas (ahora activo: {activeGuestTier.name}).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!gameProgress.enabledStageIds.includes('guest_musician')) {
                          handleToggleStageUnlockable('guest_musician');
                        }
                        setCameraPreset('stage');
                        setActiveModal('none');
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-[#b91c1c] hover:bg-[#dc2626] text-white rounded cursor-pointer"
                    >
                      Ver a {activeGuestTier.nickname} en el Escenario
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {GUEST_MUSICIANS_BY_SCORE.map((guest) => {
                      const unlocked = scoreResult.totalScore >= guest.minScore;
                      const isCurrent = activeGuestTier.id === guest.id;
                      return (
                        <div
                          key={guest.id}
                          className={`rounded p-3 border flex items-center gap-3 ${
                            isCurrent
                              ? 'bg-[#281812] border-[#f59e0b]'
                              : unlocked
                              ? 'bg-[#17120f] border-[#3f3027]'
                              : 'bg-[#100c0a] border-[#241b17] opacity-60'
                          }`}
                        >
                          <img
                            src={guest.assetUrl}
                            alt={guest.name}
                            className="w-12 h-14 object-contain rounded bg-[#0b0807] border border-[#3a2c24] shrink-0 p-0.5"
                          />
                          <div className="min-w-0">
                            <div className="text-[10px] font-mono text-[#f59e0b]">
                              {guest.minScore.toLocaleString('es-AR')} PTS ·{' '}
                              {unlocked ? 'DESTRABADO' : 'BLOQUEADO'}
                            </div>
                            <p className="text-xs font-bold text-[#f5efe2] truncate">
                              {guest.nickname}
                            </p>
                            <p className="text-[10px] text-[#9c8c79] truncate">
                              {guest.instrument}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scoreResult.breakdown.map((item) => {
                    const pct =
                      item.maxScore > 0
                        ? Math.round((item.score / item.maxScore) * 100)
                        : 0;
                    return (
                      <div
                        key={item.id}
                        className="sketch-card rounded p-4 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-[#f5efe2]">
                              {item.label}
                            </span>
                            <span className="text-xs font-mono tabular-nums text-[#f59e0b]">
                              {item.score.toLocaleString('es-AR')} /{' '}
                              {item.maxScore.toLocaleString('es-AR')} pts
                            </span>
                          </div>
                          <p className="text-xs text-[#ef4444] font-medium mt-1">
                            {item.verdict}
                          </p>
                          <p className="text-xs text-[#8c7c68] mt-1">{item.detail}</p>
                        </div>

                        <div className="mt-3 h-2 bg-[#0d0a09] rounded overflow-hidden border border-[#2c221d]">
                          <div
                            className="h-full bg-[#dc2626]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-[#110d0b] border border-[#2e231e] rounded p-5">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#d97706]" />
                      <h4 className="text-sm font-semibold text-[#f5efe2]">
                        Laboratorio de Puntaje: Ajustá el peso de cada criterio
                      </h4>
                    </div>
                    <button
                      onClick={() => setWeights(DEFAULT_WEIGHTS)}
                      className="text-xs text-[#a89984] hover:text-white underline cursor-pointer"
                    >
                      Restaurar valores por defecto
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    {(
                      [
                        { key: 'openerWeight', label: 'Apertura (#01)' },
                        { key: 'closerWeight', label: 'Cierre (#36)' },
                        { key: 'eraBalanceWeight', label: '11 Discos' },
                        { key: 'dynamicsWeight', label: 'Curva Pogo/Aire' },
                        { key: 'cultMixWeight', label: 'Culto + Himnos' },
                      ] as { key: keyof ScoringWeights; label: string }[]
                    ).map((ctrl) => (
                      <div key={ctrl.key} className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#c5b8a5]">{ctrl.label}</span>
                          <span className="font-mono tabular-nums text-[#f59e0b]">
                            {weights[ctrl.key]}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={5}
                          max={50}
                          step={5}
                          value={weights[ctrl.key]}
                          onChange={(e) =>
                            setWeights((prev) => ({
                              ...prev,
                              [ctrl.key]: Number(e.target.value),
                            }))
                          }
                          className="accent-[#dc2626] cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 5: BANQUETES HISTÓRICOS */}
        {activeModal === 'presets' && (
          <div className="fixed inset-0 z-30 bg-black/80 flex items-center justify-center p-4">
            <div className="sketch-panel rounded w-full max-w-3xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#3a2c24] bg-[#191310]">
                <div>
                  <h2 className="text-2xl font-rock text-[#f5efe2]">
                    Cargar un Banquete de 36 Canciones
                  </h2>
                  <p className="text-xs text-[#a89984]">
                    Probá una lista completa de 36 temas para ver el campo 3D lleno de gente, banderas y bengalas.
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal('none')}
                  className="p-1.5 text-[#a89984] hover:text-white rounded cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {PRESET_BANQUETES.map((preset) => (
                  <div
                    key={preset.id}
                    className="sketch-card hover:border-[#dc2626] rounded p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors"
                  >
                    <div>
                      <h3 className="text-lg font-rock text-[#f5efe2]">{preset.name}</h3>
                      <p className="text-xs text-[#a89984] mt-0.5">{preset.subtitle}</p>
                    </div>
                    <button
                      onClick={() => handleLoadPreset(preset.songIds)}
                      className="px-4 py-2 text-xs font-semibold bg-[#b91c1c] hover:bg-[#dc2626] text-white rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Cargar 36 Temas al Campo</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL 6: MODO JUEGO (ORÁCULO DE SHOWS REALES, DUELO DE SETLISTS, ENTRADAS, EFECTOS 3D & RANKING) */}
        <BanqueteGameModal
          key={`${gameInitialTab}-${gameInitialRivalId || 'default'}`}
          isOpen={activeModal === 'game'}
          initialTab={gameInitialTab}
          initialRivalId={gameInitialRivalId}
          onClose={() => {
            setGameInitialRivalId(null);
            setActiveModal('none');
          }}
          setlist={setlist}
          catalogSongs={allCatalogSongs}
          playerScore={scoreResult}
          weights={weights}
          albumCoverMap={albumCoverMap}
          gameProgress={gameProgress}
          communityBanquetes={communityBanquetes}
          onToggleStageUnlockable={handleToggleStageUnlockable}
          onRecordOracleAttempt={handleRecordOracleAttempt}
          onRecordDuelResult={handleRecordDuelResult}
          onRegisterLeaderboardBanquete={handleRegisterLeaderboardBanquete}
          onLoadSetlistToBeach={handleLoadPreset}
          onFocusStage3D={() => setCameraPreset('stage')}
        />

        {/* MODAL 7: ONBOARDING INTERACTIVO ("GUÍA RÁPIDA DEL BANQUETE") */}
        <BanqueteOnboardingModal
          isOpen={onboardingOpen}
          showWelcomeGreeting={showWelcomeGreeting}
          onDismissWelcomeGreeting={() => setShowWelcomeGreeting(false)}
          setlistCount={setlist.length}
          playerAlias={gameProgress.playerAlias}
          banqueteTitle={gameProgress.banqueteTitle}
          onSaveProfile={handleSaveProfile}
          onClose={handleCloseOnboarding}
          onOpenBuilder={() => setActiveModal('builder')}
          onOpenOracle={() => {
            setGameInitialTab('oraculo');
            setActiveModal('game');
          }}
          onAutoFillDemo={() => {
            handleAutoFill36();
            handleCloseOnboarding();
          }}
        />

        {/* MODAL 8: COMPARTIR BANQUETE, INVITAR AMIGOS & GENERAR FLYER PNG */}
        <BanqueteShareModal
          isOpen={activeModal === 'share'}
          onClose={() => setActiveModal('none')}
          setlist={setlist}
          scoreResult={scoreResult}
          playerAlias={gameProgress.playerAlias}
          banqueteTitle={gameProgress.banqueteTitle}
          activeGuestTier={activeGuestTier}
          onSaveProfile={handleSaveProfile}
          onPublishToGlobalRanking={handlePublishToGlobalRanking}
        />
      </main>
    </div>
  );
}
