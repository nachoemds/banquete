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
import {
  BONUS_CULT_SONGS,
  STAGE_UNLOCKABLES,
  GameProgressState,
  StageUnlockableId,
  CollectibleTicket,
  LeaderboardEntry,
  loadGameProgress,
  saveGameProgress,
} from './data/banqueteGameData';
import { rockAudio } from './utils/rockAudioEngine';
import { getAlbumCoverDataUrl, OFFICIAL_LOGO_URL } from './utils/albumArtGenerator';

type ActiveModal = 'none' | 'builder' | 'albums' | 'player' | 'score' | 'presets' | 'game';

export default function App() {
  const [setlist, setSetlist] = useState<LaRengaSong[]>(() => {
    const starterIds = ['ei-4', 'dp-2', 'lr-2', 'ec-1', 'dp-6', 'dp-10'];
    return starterIds
      .map((id) => LA_RENGA_SONGS.find((s) => s.id === id))
      .filter((s): s is LaRengaSong => Boolean(s));
  });

  const [activeSong, setActiveSong] = useState<LaRengaSong | null>(() => LA_RENGA_SONGS[0]);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('general');
  const [flareActive, setFlareActive] = useState<boolean>(false);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('banquete_onboarding_seen_v1') !== 'true';
    } catch {
      return true;
    }
  });

  const handleCloseOnboarding = () => {
    setOnboardingOpen(false);
    try {
      localStorage.setItem('banquete_onboarding_seen_v1', 'true');
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

  useEffect(() => {
    saveGameProgress(gameProgress);
  }, [gameProgress]);

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

  // Automatically check and award setlist-based trophies & stage unlockables
  useEffect(() => {
    const newTrophies = new Set(gameProgress.earnedTrophyIds);
    const newUnlockedStages = new Set(gameProgress.unlockedStageIds);
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
    // Unlock Guest Musician if score >= 8600 with 36 songs
    if (
      setlist.length === 36 &&
      scoreResult.totalScore >= 8600 &&
      !newUnlockedStages.has('guest_musician')
    ) {
      newUnlockedStages.add('guest_musician');
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
      }));
    }
  }, [
    setlist,
    scoreResult.totalScore,
    gameProgress.earnedTrophyIds,
    gameProgress.unlockedStageIds,
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
    if (soundEnabled) {
      rockAudio.playPowerRiff(song);
    }
  };

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
        leaderboard: mergedBoard,
        tickets: nextTickets,
        earnedTrophyIds: Array.from(trophies),
      };
    });

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
    <div className="relative w-screen h-screen bg-[#0d0a09] text-[#efe8d8] overflow-hidden flex flex-col select-none">
      {/* TOP BAR CONTRACT: 3 Zones separated by gap-8 */}
      <header className="relative z-20 flex items-center justify-between gap-8 px-6 py-3.5 bg-[#120e0c] border-b-2 border-[#3a2c24]">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveModal('none');
          }}
          className="text-2xl font-rock tracking-wider text-[#f59e0b] hover:text-[#ef4444] transition-colors whitespace-nowrap shrink-0"
        >
          LA RENGA · EL BANQUETE
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#c5b8a5]">
          <button
            onClick={() => setActiveModal(activeModal === 'builder' ? 'none' : 'builder')}
            className={`hover:text-[#f5efe2] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeModal === 'builder' ? 'text-[#ef4444] underline underline-offset-8' : ''
            }`}
          >
            Armar Setlist ({setlist.length}/36)
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
            Oráculo & Duelos
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
            Entradas & Ranking ({gameProgress.tickets.length})
          </button>
          <button
            onClick={() => setActiveModal(activeModal === 'albums' ? 'none' : 'albums')}
            className={`hover:text-[#f5efe2] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeModal === 'albums' ? 'text-[#ef4444] underline underline-offset-8' : ''
            }`}
          >
            Tapas de Discos (11)
          </button>
          <button
            onClick={() => setActiveModal(activeModal === 'player' ? 'none' : 'player')}
            className={`hover:text-[#f5efe2] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeModal === 'player' ? 'text-[#ef4444] underline underline-offset-8' : ''
            }`}
          >
            Escuchar Setlist
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => {
              setGameInitialTab('duelo');
              setActiveModal('game');
            }}
            className="px-4 py-2 text-xs font-semibold text-[#f5efe2] bg-[#b91c1c] hover:bg-[#dc2626] rounded border border-[#f59e0b]/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Jugar Duelo / Oráculo ({scoreResult.totalScore.toLocaleString('es-AR')} pts)
          </button>
        </div>
      </header>

      {/* MAIN 3D VIEWPORT */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <BanqueteStage3D
          setlist={setlist}
          activeSong={activeSong}
          cameraPreset={cameraPreset}
          flareActive={flareActive}
          enabledUnlockables={gameProgress.enabledStageIds}
        />

        {/* Hand-Illustrated Top-Left Stage & Album Badge (Zero backdrop-filter) */}
        <div className="absolute top-4 left-6 z-10 max-w-md sketch-panel px-4 py-3 rounded flex items-center gap-3.5">
          {activeSong && (
            <img
              src={albumCoverMap[activeSong.album] || getAlbumCoverDataUrl(activeSong.album)}
              alt={`Tapa ilustrada de ${activeSong.album}`}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded border border-[#544034] object-cover shrink-0 pointer-events-none"
            />
          )}
          <div className="min-w-0">
            <div className="text-xs text-[#a89984] flex items-center gap-2 font-mono tabular-nums">
              <span>PLAYA NECOCHEA</span>
              <span aria-hidden="true">·</span>
              <span>{setlist.length}/36 TEMAS</span>
              <span aria-hidden="true">·</span>
              <span>{scoreResult.totalDurationFormatted}</span>
            </div>
            <p className="mt-0.5 text-base font-rock tracking-wide text-[#f5efe2] truncate">
              {scoreResult.rankTitle}
            </p>
            <div className="mt-1 flex items-center gap-2">
              {activeSong && (
                <p className="text-xs text-[#f59e0b] truncate">
                  {activeSong.title}
                </p>
              )}
              <button
                onClick={() => setOnboardingOpen(true)}
                className="px-2 py-0.5 text-[11px] font-semibold bg-[#241b17] hover:bg-[#332721] text-[#f5efe2] border border-[#544034] rounded cursor-pointer whitespace-nowrap shrink-0 transition-colors"
              >
                ¿Cómo jugar? / Guía
              </button>
            </div>
          </div>
        </div>

        {/* UNIFIED COLLAPSIBLE BOTTOM CONTROL DOCK */}
        <div
          className="fixed z-20 transition-transform duration-200"
          style={{
            left: '53%',
            bottom: '18px',
            width: 'min(920px, 90vw)',
            transform: dockCollapsed
              ? 'translate(-50%, calc(100% - 34px))'
              : 'translate(-50%, 0)',
          }}
        >
          {/* Collapse / Expand Toggle Tab */}
          <div className="flex justify-center">
            <button
              onClick={() => setDockCollapsed((prev) => !prev)}
              className="px-4 py-1 text-xs font-medium bg-[#181210] text-[#d6c9b8] border-2 border-b-0 border-[#4a382d] rounded-t flex items-center gap-1.5 hover:text-white cursor-pointer whitespace-nowrap shrink-0"
              title="Atajo de teclado: H"
            >
              {dockCollapsed ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Mostrar Controles de la Playa (H)</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Ocultar Controles / Modo Cine (H)</span>
                </>
              )}
            </button>
          </div>

          {/* Main Dock Body */}
          <div className="sketch-panel rounded p-3.5 flex flex-col gap-3">
            {/* Row 1: Progress Bar to 36 Songs + Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                <div className="text-xs font-mono tabular-nums text-[#f5efe2] shrink-0">
                  SETLIST: <strong className="text-[#ef4444]">{setlist.length}</strong> / 36
                </div>
                <div className="flex-1 h-2.5 bg-[#241b17] rounded overflow-hidden border border-[#382b24]">
                  <div
                    className="h-full bg-[#dc2626] transition-all duration-200"
                    style={{ width: `${(setlist.length / 36) * 100}%` }}
                  />
                </div>
                <div className="text-xs font-mono tabular-nums text-[#f59e0b] shrink-0">
                  {scoreResult.totalScore.toLocaleString('es-AR')} PTS
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setActiveModal('builder')}
                  className="px-3 py-1.5 text-xs font-semibold sketch-card hover:bg-[#2c211c] text-[#f5efe2] rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-[#ef4444]" />
                  <span>Elegir Canciones ({36 - setlist.length} libres)</span>
                </button>

                <button
                  onClick={() => {
                    setGameInitialTab('oraculo');
                    setActiveModal('game');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold sketch-card hover:bg-[#2c211c] text-[#f59e0b] rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Swords className="w-3.5 h-3.5 text-[#f59e0b]" />
                  <span>Oráculo & Duelos</span>
                </button>

                <button
                  onClick={() => {
                    setGameInitialTab('vitrina');
                    setActiveModal('game');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold sketch-card hover:bg-[#2c211c] text-[#f5efe2] rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Ticket className="w-3.5 h-3.5 text-[#ef4444]" />
                  <span>Entradas & Efectos 3D ({gameProgress.enabledStageIds.length}/4)</span>
                </button>

                {setlist.length < 36 && (
                  <button
                    onClick={handleAutoFill36}
                    className="px-3 py-1.5 text-xs font-semibold sketch-card hover:bg-[#2c211c] text-[#f5efe2] rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-[#d97706]" />
                    <span>Completar 36</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveModal('player')}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#b91c1c] hover:bg-[#dc2626] text-white rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Escuchar</span>
                </button>
              </div>
            </div>

            {/* Row 2: Camera Angles + Decorative 3D Stage Effect Toggles + Agitar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#2e231d]">
              <div className="flex items-center gap-1 bg-[#0d0a09] p-1 rounded border border-[#2c221d]">
                {(
                  [
                    { id: 'general', label: 'Playa & Mar' },
                    { id: 'stage', label: 'Pantallas & Batería' },
                    { id: 'pogo', label: 'Olla del Pogo' },
                    { id: 'entrance', label: 'Costa & Olas (Izq.)' },
                  ] as { id: CameraPreset; label: string }[]
                ).map((cam) => (
                  <button
                    key={cam.id}
                    onClick={() => setCameraPreset(cam.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
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
              <div className="flex items-center gap-1.5">
                {(
                  [
                    { id: 'stage_fire', label: 'Fuego' },
                    { id: 'stadium_lasers', label: 'Luces Huracán' },
                    { id: 'guest_musician', label: 'Invitado' },
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

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    rockAudio.playCrowdRoar();
                    setFlareActive(true);
                    window.setTimeout(() => setFlareActive(false), 3200);
                  }}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded border transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                    flareActive
                      ? 'bg-[#dc2626] text-white border-[#f59e0b]'
                      : 'bg-[#b91c1c] hover:bg-[#dc2626] text-white border-[#ef4444]'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>{flareActive ? '¡Agitando el Campo!' : '¡Agitar!'}</span>
                </button>

                <button
                  onClick={() => {
                    const target = activeSong || setlist[0] || LA_RENGA_SONGS[0];
                    rockAudio.playPowerRiff(target);
                  }}
                  className="px-3 py-1.5 text-xs font-medium sketch-card hover:bg-[#2a201b] text-[#d6c9b8] rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Volume2 className="w-3.5 h-3.5 text-[#d97706]" />
                  <span>Riff</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL 1: ARMADOR DE SETLIST DE 36 CANCIONES CON TAPAS ILUSTRADAS */}
        {activeModal === 'builder' && (
          <div className="fixed inset-0 z-30 bg-black/80 flex items-center justify-center p-4">
            <div className="sketch-panel rounded w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#3a2c24] bg-[#191310]">
                <div>
                  <h2 className="text-2xl font-rock text-[#f5efe2]">
                    Armador Ilustrado del Banquete (36 Canciones)
                  </h2>
                  <p className="text-xs text-[#a89984]">
                    Hacé clic en cualquier tapa de disco para filtrar sus temas y proyectar su arte en el escenario 3D.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {setlist.length < 36 && (
                    <button
                      onClick={handleAutoFill36}
                      className="px-3 py-1.5 text-xs font-semibold sketch-card hover:bg-[#382b24] text-[#f5efe2] rounded cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Autocompletar las {36 - setlist.length} restantes
                    </button>
                  )}
                  {setlist.length > 0 && (
                    <button
                      onClick={() => setSetlist([])}
                      className="px-3 py-1.5 text-xs font-medium text-[#ef4444] hover:bg-[#2a1615] border border-[#4a2320] rounded cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Vaciar Lista
                    </button>
                  )}
                  <button
                    onClick={() => setActiveModal('none')}
                    className="p-1.5 text-[#a89984] hover:text-white rounded cursor-pointer"
                    aria-label="Cerrar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Illustrated Album Cover Strip (All 11 Studio Albums) */}
              <div className="px-4 py-2.5 bg-[#110d0b] border-b border-[#2e231e] flex items-center gap-2.5 overflow-x-auto shrink-0">
                <button
                  onClick={() => setSelectedAlbum('ALL')}
                  className={`px-3 py-2 rounded border text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                    selectedAlbum === 'ALL'
                      ? 'bg-[#b91c1c] text-white border-[#ef4444]'
                      : 'sketch-card text-[#c5b8a5] hover:text-white'
                  }`}
                >
                  Todos los Discos (11)
                </button>
                {LA_RENGA_ALBUMS.map((alb) => {
                  const isSelected = selectedAlbum === alb.name;
                  return (
                    <button
                      key={alb.name}
                      onClick={() =>
                        setSelectedAlbum(isSelected ? 'ALL' : alb.name)
                      }
                      className={`flex items-center gap-2 p-1.5 pr-3 rounded border transition-all cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-[#2b1814] border-[#f59e0b] text-white'
                          : 'bg-[#17120f] border-[#332720] text-[#c5b8a5] hover:border-[#6e5546]'
                      }`}
                    >
                      <img
                        src={albumCoverMap[alb.name]}
                        alt={alb.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded object-cover border border-[#090706] shrink-0"
                      />
                      <div className="text-left">
                        <div className="text-xs font-semibold leading-tight whitespace-nowrap">
                          {alb.name}
                        </div>
                        <div className="text-[10px] font-mono tabular-nums text-[#9c8c79]">
                          {alb.year}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 2-Column Workspace */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                {/* Left Column: Catalog with Illustrated Covers */}
                <div className="lg:col-span-7 border-r border-[#2e231e] flex flex-col overflow-hidden">
                  <div className="p-3.5 border-b border-[#261d19] flex flex-wrap items-center justify-between gap-2 bg-[#16110f]">
                    <div className="relative flex-1 min-w-[220px]">
                      <Search className="w-4 h-4 text-[#8c7c68] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar canción o época..."
                        className="w-full pl-9 pr-4 py-1.5 text-sm bg-[#0d0a09] border border-[#362a23] rounded text-[#f5efe2] placeholder-[#756756] focus:outline-none focus:border-[#dc2626]"
                      />
                    </div>

                    <div className="flex items-center gap-1 bg-[#0d0a09] p-1 rounded border border-[#2c221d]">
                      {(
                        [
                          { id: 'ALL', label: 'Todos' },
                          { id: 'pogo', label: 'Pogo' },
                          { id: 'himno', label: 'Himnos' },
                          { id: 'rock', label: 'Rock' },
                          { id: 'balada', label: 'Baladas' },
                          { id: 'oculto', label: 'Culto' },
                        ] as { id: SongEnergy | 'ALL'; label: string }[]
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setSelectedEnergy(tab.id)}
                          className={`px-2 py-1 text-xs rounded cursor-pointer whitespace-nowrap shrink-0 ${
                            selectedEnergy === tab.id
                              ? 'bg-[#b91c1c] text-white'
                              : 'text-[#a89984] hover:text-white'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-[#221a16] p-2">
                    {filteredCatalog.map((song) => {
                      const alreadyAdded = setlistIds.has(song.id);
                      const isFull = setlist.length >= 36;
                      return (
                        <div
                          key={song.id}
                          className={`flex items-center justify-between gap-3 px-3 py-2 rounded transition-colors ${
                            alreadyAdded
                              ? 'bg-[#1c1613]/50 opacity-55'
                              : 'hover:bg-[#1f1815]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <img
                              src={albumCoverMap[song.album]}
                              alt={song.album}
                              referrerPolicy="no-referrer"
                              className="w-11 h-11 rounded border border-[#4a382d] object-cover shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-[#f5efe2] truncate">
                                  {song.title}
                                </span>
                                {song.isIdealOpener && (
                                  <span className="text-[11px] text-[#f59e0b] shrink-0">
                                    · Ideal Apertura
                                  </span>
                                )}
                                {song.isIdealCloser && (
                                  <span className="text-[11px] text-[#ef4444] shrink-0">
                                    · Ritual Cierre
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[#9c8c79] flex items-center gap-1.5 mt-0.5 truncate">
                                <span>{song.album}</span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums">{song.year}</span>
                                <span aria-hidden="true">·</span>
                                <span>{energyLabel[song.energy]}</span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums">{song.duration}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                setActiveSong(song);
                                rockAudio.playPowerRiff(song);
                              }}
                              className="px-2.5 py-1 text-xs text-[#c5b8a5] hover:text-white sketch-card rounded cursor-pointer whitespace-nowrap shrink-0"
                            >
                              Riff
                            </button>
                            <button
                              disabled={alreadyAdded || isFull}
                              onClick={() => handleAddSong(song)}
                              className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer whitespace-nowrap shrink-0 ${
                                alreadyAdded || isFull
                                  ? 'bg-[#261e1a] text-[#6e6052] cursor-not-allowed'
                                  : 'bg-[#b91c1c] hover:bg-[#dc2626] text-white'
                              }`}
                            >
                              {alreadyAdded ? 'En la lista' : '+ Sumar'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Current 36-Song Setlist with Album Art */}
                <div className="lg:col-span-5 flex flex-col overflow-hidden bg-[#110d0b]">
                  <div className="p-3.5 border-b border-[#261d19] flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[#f5efe2]">
                        Tu Lista en Orden ({setlist.length} / 36)
                      </h3>
                      <p className="text-xs text-[#9c8c79] font-mono tabular-nums">
                        Duración: {scoreResult.totalDurationFormatted} · Puntaje:{' '}
                        {scoreResult.totalScore.toLocaleString('es-AR')} pts
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                    {setlist.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8c7c68]">
                        <Disc className="w-10 h-10 mb-2 stroke-1" />
                        <p className="text-sm font-medium text-[#d6c9b8]">
                          Tu lista del Banquete está vacía
                        </p>
                        <p className="text-xs mt-1 max-w-xs">
                          Sumá canciones desde el catálogo de la izquierda para convocar fanáticos al escenario.
                        </p>
                      </div>
                    ) : (
                      setlist.map((song, idx) => (
                        <div
                          key={song.id}
                          className="flex items-center justify-between gap-2 px-2.5 py-1.5 sketch-card rounded hover:border-[#f59e0b]"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`text-xs font-mono tabular-nums font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                                idx === 0
                                  ? 'bg-[#d97706]/20 text-[#fbbf24]'
                                  : idx === 35
                                  ? 'bg-[#dc2626]/25 text-[#f87171]'
                                  : 'text-[#8c7c68]'
                              }`}
                            >
                              #{String(idx + 1).padStart(2, '0')}
                            </span>
                            <img
                              src={albumCoverMap[song.album]}
                              alt={song.album}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded object-cover border border-[#090706] shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#f5efe2] truncate">
                                {song.title}
                              </p>
                              <p className="text-[11px] text-[#8c7c68] truncate">
                                {song.album} · {song.duration}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleMoveSong(idx, -1)}
                              disabled={idx === 0}
                              className="p-1 text-[#8c7c68] hover:text-white disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveSong(idx, 1)}
                              disabled={idx === setlist.length - 1}
                              className="p-1 text-[#8c7c68] hover:text-white disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveSong(song.id)}
                              className="p-1 text-[#8c7c68] hover:text-[#ef4444] cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: GALERÍA DE LAS 11 TAPAS ILUSTRADAS + LOGO OFICIAL EN ESCENARIO */}
        {activeModal === 'albums' && (
          <div className="fixed inset-0 z-30 bg-black/80 flex items-center justify-center p-4">
            <div className="sketch-panel rounded w-full max-w-6xl max-h-[88vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#3a2c24] bg-[#191310]">
                <div>
                  <h2 className="text-2xl font-rock text-[#f5efe2]">
                    Tapas Originales de los Discos (1991–2024) & Logo en Tablas
                  </h2>
                  <p className="text-xs text-[#a89984]">
                    Artes de tapa originales de la discografía oficial de La Renga. Tocá cualquier disco para ver sus temas o proyectarlo en el escenario 3D.
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal('none')}
                  className="p-1.5 text-[#a89984] hover:text-white rounded cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                {/* Featured Card: Official Uploaded Logo on Stage & Drum Kit */}
                <div className="sketch-card rounded p-4 flex flex-col md:flex-row items-center justify-between gap-5 border-[#f59e0b]/60">
                  <div className="flex items-center gap-4">
                    <img
                      src={OFFICIAL_LOGO_URL}
                      alt="Logo clásico de La Renga en escenario y batería"
                      referrerPolicy="no-referrer"
                      className="w-24 h-24 rounded border-2 border-[#f59e0b] object-cover shrink-0"
                    />
                    <div>
                      <div className="text-xs font-mono text-[#f59e0b]">
                        ARTE INSTALADO EN EL ESCENARIO 3D Y EN LA BATERÍA DE TANQUE
                      </div>
                      <h3 className="text-xl font-rock text-[#f5efe2] mt-0.5">
                        Logo Clásico de La Renga (Telón Central + Doble Bombo)
                      </h3>
                      <p className="text-xs text-[#c5b8a5] mt-1 max-w-2xl">
                        El emblema ilustrado ya está montado en el gran telón de fondo detrás de Chizzo, Tete y Tanque, en la cenefa superior de luces y en los dos parches frontales de la batería doble bombo.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCameraPreset('stage');
                      setActiveModal('none');
                    }}
                    className="px-4 py-2.5 text-xs font-semibold bg-[#b91c1c] hover:bg-[#dc2626] text-white rounded flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Enfocar Escenario y Batería 3D</span>
                  </button>
                </div>

                {/* Grid of All 11 Hand-Illustrated Album Covers */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {LA_RENGA_ALBUMS.map((alb) => {
                    const albumSongs = LA_RENGA_SONGS.filter((s) => s.album === alb.name);
                    const inSetlistCount = setlist.filter((s) => s.album === alb.name).length;
                    return (
                      <div
                        key={alb.name}
                        className="sketch-card rounded p-3 flex flex-col justify-between gap-3 hover:border-[#f59e0b] transition-colors"
                      >
                        <div>
                          <div className="aspect-square w-full rounded overflow-hidden border border-[#090706] bg-[#0d0a09]">
                            <img
                              src={albumCoverMap[alb.name]}
                              alt={`Tapa de ${alb.name}`}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="mt-2.5 flex items-center justify-between gap-2 text-xs text-[#a89984] font-mono tabular-nums">
                            <span>{alb.year}</span>
                            <span>·</span>
                            <span>{albumSongs.length} temas</span>
                            <span>·</span>
                            <span className="text-[#f59e0b]">{inSetlistCount} en lista</span>
                          </div>
                          <h4 className="text-base font-rock text-[#f5efe2] mt-0.5 truncate">
                            {alb.name}
                          </h4>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedAlbum(alb.name);
                            if (albumSongs[0]) {
                              setActiveSong(albumSongs[0]);
                            }
                            setActiveModal('builder');
                          }}
                          className="w-full py-1.5 text-xs font-semibold bg-[#281f1a] hover:bg-[#b91c1c] text-[#f5efe2] rounded border border-[#4a382d] transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Elegir Temas de este Disco
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: REPRODUCTOR YOUTUBE & SPOTIFY */}
        {activeModal === 'player' && (
          <div className="fixed inset-0 z-30 bg-black/80 flex items-center justify-center p-4">
            <div className="sketch-panel rounded w-full max-w-4xl max-h-[86vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#3a2c24] bg-[#191310]">
                <div>
                  <h2 className="text-2xl font-rock text-[#f5efe2]">
                    Escuchar el Banquete (YouTube & Spotify)
                  </h2>
                  <p className="text-xs text-[#a89984]">
                    Reproducí cada tema de tu lista o exportá las 36 canciones a tu cuenta de Spotify o YouTube.
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal('none')}
                  className="p-1.5 text-[#a89984] hover:text-white rounded cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-7 flex flex-col gap-4">
                  <div className="sketch-card rounded p-4">
                    {activeSong && (
                      <div className="flex items-center gap-3.5">
                        <img
                          src={albumCoverMap[activeSong.album]}
                          alt={activeSong.album}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded border border-[#4a382d] object-cover shrink-0"
                        />
                        <div>
                          <div className="text-xs text-[#f59e0b] font-mono tabular-nums">
                            SONANDO EN EL ESCENARIO
                          </div>
                          <h3 className="text-xl font-rock text-[#f5efe2]">
                            {activeSong.title}
                          </h3>
                          <p className="text-xs text-[#a89984]">
                            {activeSong.album} ({activeSong.year}) · {activeSong.tempoBpm} BPM
                          </p>
                        </div>
                      </div>
                    )}

                    {activeSong && (
                      <div className="mt-4 aspect-video w-full bg-black rounded overflow-hidden border border-[#2c221d]">
                        <iframe
                          className="w-full h-full"
                          src={`https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(
                            `La Renga ${activeSong.title} en vivo`
                          )}`}
                          title={`La Renga - ${activeSong.title}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}

                    {activeSong && (
                      <div className="mt-4 flex flex-wrap items-center gap-2.5">
                        <a
                          href={`https://open.spotify.com/search/${encodeURIComponent(
                            `La Renga ${activeSong.title}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 text-xs font-semibold bg-[#1db954] hover:bg-[#1ed760] text-black rounded flex items-center gap-1.5 whitespace-nowrap shrink-0"
                        >
                          <Music className="w-3.5 h-3.5" />
                          <span>Abrir en Spotify</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                            `La Renga ${activeSong.title} en vivo`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 text-xs font-semibold bg-[#dc2626] hover:bg-[#ef4444] text-white rounded flex items-center gap-1.5 whitespace-nowrap shrink-0"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Ver en YouTube</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <button
                          onClick={() => rockAudio.playPowerRiff(activeSong)}
                          className="px-3.5 py-2 text-xs font-semibold sketch-card text-[#f5efe2] rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-[#d97706]" />
                          <span>Sonar Riff</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="sketch-card rounded p-4 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-[#f5efe2]">
                        Exportar Lista Completa ({setlist.length} canciones)
                      </h4>
                      <p className="text-xs text-[#9c8c79]">
                        Copiá el listado numerado para armar tu playlist en Spotify.
                      </p>
                    </div>
                    <button
                      onClick={handleCopySpotifyList}
                      className="px-3.5 py-2 text-xs font-semibold bg-[#271e1a] hover:bg-[#382b24] text-[#f5efe2] border border-[#4a3930] rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {copiedSpotify ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#22c55e]" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Setlist</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Queue with Illustrated Covers */}
                <div className="md:col-span-5 bg-[#0d0a09] border border-[#2e231e] rounded flex flex-col max-h-[480px] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#241b17] text-xs font-semibold text-[#d6c9b8]">
                    COLA DE REPRODUCCIÓN DEL BANQUETE
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-[#1e1714]">
                    {setlist.map((song, idx) => {
                      const isCurrent = activeSong?.id === song.id;
                      return (
                        <button
                          key={song.id}
                          onClick={() => {
                            setActiveSong(song);
                            if (soundEnabled) rockAudio.playPowerRiff(song);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            isCurrent ? 'bg-[#b91c1c]/25 text-white' : 'hover:bg-[#191310]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xs font-mono tabular-nums text-[#8c7c68]">
                              {String(idx + 1).padStart(2, '0')}.
                            </span>
                            <img
                              src={albumCoverMap[song.album]}
                              alt={song.album}
                              referrerPolicy="no-referrer"
                              className="w-7 h-7 rounded object-cover border border-[#090706] shrink-0"
                            />
                            <span className="text-xs font-medium text-[#f5efe2] truncate">
                              {song.title}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono tabular-nums text-[#8c7c68] shrink-0">
                            {song.duration}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
          key={gameInitialTab}
          isOpen={activeModal === 'game'}
          initialTab={gameInitialTab}
          onClose={() => setActiveModal('none')}
          setlist={setlist}
          catalogSongs={allCatalogSongs}
          playerScore={scoreResult}
          weights={weights}
          albumCoverMap={albumCoverMap}
          gameProgress={gameProgress}
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
          setlistCount={setlist.length}
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
      </main>
    </div>
  );
}
