// src/components/BanqueteGameModal.tsx
import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Flame,
  Swords,
  Compass,
  Ticket,
  Sparkles,
  Check,
  X,
  Eye,
  Play,
  Award,
  Lock,
  Unlock,
} from 'lucide-react';
import { LaRengaSong } from '../data/laRengaSongs';
import {
  BanqueteScoreResult,
  calculateBanqueteScore,
  ScoringWeights,
} from '../utils/banqueteScoring';
import {
  HISTORICAL_CHALLENGES,
  RIVAL_BANQUETES,
  STAGE_UNLOCKABLES,
  RENGA_TROPHIES,
  GameProgressState,
  MilestoneKey,
  StageUnlockableId,
  CollectibleTicket,
  RivalBanquete,
} from '../data/banqueteGameData';
import { CommunityBanqueteRecord } from '../utils/supabaseClient';
import { rockAudio } from '../utils/rockAudioEngine';

export type GameTab = 'oraculo' | 'duelo' | 'vitrina';

interface BanqueteGameModalProps {
  isOpen: boolean;
  initialTab?: GameTab;
  initialRivalId?: string | null;
  onClose: () => void;
  setlist: LaRengaSong[];
  catalogSongs: LaRengaSong[];
  playerScore: BanqueteScoreResult;
  weights: ScoringWeights;
  albumCoverMap: Record<string, string>;
  gameProgress: GameProgressState;
  communityBanquetes: CommunityBanqueteRecord[];
  onToggleStageUnlockable: (id: StageUnlockableId) => void;
  onRecordOracleAttempt: (
    challengeId: string,
    hitsCount: number,
    oracleScore: number,
    ticket: CollectibleTicket,
    unlockedStageId?: StageUnlockableId
  ) => void;
  onRecordDuelResult: (
    rivalId: string,
    playerWon: boolean,
    ticket: CollectibleTicket
  ) => void;
  onRegisterLeaderboardBanquete: (
    banqueteName: string,
    authorName: string
  ) => CollectibleTicket;
  onLoadSetlistToBeach: (songIds: string[]) => void;
  onFocusStage3D: () => void;
}

export const BanqueteGameModal: React.FC<BanqueteGameModalProps> = ({
  isOpen,
  initialTab = 'oraculo',
  initialRivalId = null,
  onClose,
  setlist,
  catalogSongs,
  playerScore,
  weights,
  albumCoverMap,
  gameProgress,
  communityBanquetes,
  onToggleStageUnlockable,
  onRecordOracleAttempt,
  onRecordDuelResult,
  onRegisterLeaderboardBanquete,
  onLoadSetlistToBeach,
  onFocusStage3D,
}) => {
  const [activeTab, setActiveTab] = useState<GameTab>(initialTab);

  // Sync tab and rival when opened externally (e.g., from a friend's shared link)
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      if (initialRivalId) {
        setSelectedRivalId(initialRivalId);
      }
    }
  }, [isOpen, initialTab, initialRivalId]);

  // Oracle State
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(
    HISTORICAL_CHALLENGES[0].id
  );
  const [oracleMode, setOracleMode] = useState<'milestones' | 'compare36'>('milestones');
  const [guesses, setGuesses] = useState<Record<string, Record<MilestoneKey, string>>>({});
  const [revealedChallenges, setRevealedChallenges] = useState<Record<string, boolean>>({});

  // Duel State
  const [selectedRivalId, setSelectedRivalId] = useState<string>(
    initialRivalId || RIVAL_BANQUETES[0].id
  );
  const [duelExecutedRivalId, setDuelExecutedRivalId] = useState<string | null>(null);

  // Vitrina & Ticket Generator State (Initialized from cached player profile)
  const [customBanqueteName, setCustomBanqueteName] = useState<string>(
    gameProgress.banqueteTitle || 'Mi Banquete en Necochea'
  );
  const [customAuthorName, setCustomAuthorName] = useState<string>(
    gameProgress.playerAlias || 'Renguero'
  );
  React.useEffect(() => {
    setCustomBanqueteName(gameProgress.banqueteTitle || 'Mi Banquete en Necochea');
    setCustomAuthorName(gameProgress.playerAlias || 'Renguero');
  }, [gameProgress.banqueteTitle, gameProgress.playerAlias]);

  const [highlightedTicket, setHighlightedTicket] = useState<CollectibleTicket | null>(
    () => gameProgress.tickets[0] || null
  );

  const songById = useMemo(() => {
    const map: Record<string, LaRengaSong> = {};
    catalogSongs.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [catalogSongs]);

  const currentChallenge = useMemo(
    () =>
      HISTORICAL_CHALLENGES.find((c) => c.id === selectedChallengeId) ||
      HISTORICAL_CHALLENGES[0],
    [selectedChallengeId]
  );

  const currentChallengeGuesses = guesses[currentChallenge.id] || {
    opener: '',
    earlyAnthem: '',
    cultGem: '',
    midPogo: '',
    preCloser: '',
    closer: '',
  };

  const isCurrentChallengeRevealed = Boolean(revealedChallenges[currentChallenge.id]);

  const handleSelectGuess = (key: MilestoneKey, songId: string) => {
    setGuesses((prev) => ({
      ...prev,
      [currentChallenge.id]: {
        ...(prev[currentChallenge.id] || {
          opener: '',
          earlyAnthem: '',
          cultGem: '',
          midPogo: '',
          preCloser: '',
          closer: '',
        }),
        [key]: songId,
      },
    }));
  };

  const filledGuessCount = Object.values(currentChallengeGuesses).filter(Boolean).length;

  const oracleEvaluation = useMemo(() => {
    let exactHits = 0;
    const details = currentChallenge.milestones.map((m) => {
      const pickedId = currentChallengeGuesses[m.key];
      const isCorrect = pickedId === m.songId;
      if (isCorrect) exactHits += 1;
      return {
        milestone: m,
        pickedSong: pickedId ? songById[pickedId] : null,
        correctSong: songById[m.songId],
        isCorrect,
      };
    });
    const oracleScore = Math.round((exactHits / 6) * 10000);
    return { exactHits, oracleScore, details };
  }, [currentChallenge, currentChallengeGuesses, songById]);

  // Full 36-song comparison against the selected historical concert
  const fullSetlistComparison = useMemo(() => {
    const realSet = new Set(currentChallenge.fullSetlistIds);
    const sharedSongs = setlist.filter((s) => realSet.has(s.id));
    const exactPositionMatches = setlist.filter(
      (s, idx) => currentChallenge.fullSetlistIds[idx] === s.id
    );
    const coincidencePct = Math.round((sharedSongs.length / 36) * 100);
    return {
      sharedSongs,
      exactPositionMatches,
      coincidencePct,
    };
  }, [currentChallenge, setlist]);

  const handleRevealOracle = () => {
    setRevealedChallenges((prev) => ({ ...prev, [currentChallenge.id]: true }));
    const { exactHits, oracleScore } = oracleEvaluation;

    const newTicket: CollectibleTicket = {
      id: `tk-oracle-${currentChallenge.id}-${Date.now()}`,
      serialNumber: `ORAC-${String(Math.floor(1000 + Math.random() * 9000))}`,
      title: currentChallenge.rewardTicketTitle,
      subtitle: `${currentChallenge.venue} · ${currentChallenge.city}`,
      venue: currentChallenge.venue,
      dateIssued: currentChallenge.date,
      score: oracleScore,
      mode: 'oraculo',
      openerTitle: songById[currentChallenge.milestones[0].songId]?.title || 'Apertura',
      closerTitle: songById[currentChallenge.milestones[5].songId]?.title || 'Hablando de la libertad',
      stampText:
        exactHits >= 5
          ? 'ORÁCULO INFALIBLE (6/6)'
          : exactHits >= 4
          ? `VIDENTE DEL SHOW (${exactHits}/6)`
          : `PEREGRINO HISTÓRICO (${exactHits}/6)`,
      badgesEarned:
        exactHits >= 4
          ? ['Vidente del Ducó', `${exactHits}/6 Hitos Históricos`]
          : [`${exactHits}/6 Hitos Históricos`],
    };

    setHighlightedTicket(newTicket);
    onRecordOracleAttempt(
      currentChallenge.id,
      exactHits,
      oracleScore,
      newTicket,
      exactHits >= 3 ? currentChallenge.unlockableRewardId : undefined
    );

    if (exactHits >= 4) {
      rockAudio.playCrowdRoar();
    }
  };

  // Convert Community User playlists from Supabase into playable Duel Rivals
  const communityRivals = useMemo<RivalBanquete[]>(() => {
    return communityBanquetes
      .filter((c) => Array.isArray(c.songIds) && c.songIds.length > 0)
      .map((c) => ({
        id: `user-${c.id}`,
        name: c.author,
        archetype: `Usuario · "${c.banqueteName}"`,
        difficulty: c.totalScore >= 9000 ? 'Leyenda' : c.totalScore >= 8000 ? 'Histórico' : 'Picante',
        challengeQuote: `Setlist real de la comunidad (${c.songIds.length} temas · Abre con "${c.openerTitle}").`,
        songIds: c.songIds,
        rewardBadgeId: 'duel_user',
      }));
  }, [communityBanquetes]);

  const allRivals = useMemo<RivalBanquete[]>(
    () => [...RIVAL_BANQUETES, ...communityRivals],
    [communityRivals]
  );

  // Rival Duel computation
  const currentRival = useMemo(
    () => allRivals.find((r) => r.id === selectedRivalId) || RIVAL_BANQUETES[0],
    [allRivals, selectedRivalId]
  );

  const rivalSetlistSongs = useMemo(
    () =>
      currentRival.songIds
        .map((id) => songById[id])
        .filter((s): s is LaRengaSong => Boolean(s)),
    [currentRival, songById]
  );

  const rivalScore = useMemo(
    () => calculateBanqueteScore(rivalSetlistSongs, weights),
    [rivalSetlistSongs, weights]
  );

  const duelComparison = useMemo(() => {
    let playerRoundsWon = 0;
    let rivalRoundsWon = 0;

    const rounds = rivalScore.breakdown.map((rivItem, idx) => {
      const plItem = playerScore.breakdown[idx] || {
        id: rivItem.id,
        label: rivItem.label,
        score: 0,
        maxScore: rivItem.maxScore,
        verdict: 'Lista vacía',
        detail: '',
      };
      const winner: 'player' | 'rival' | 'tie' =
        plItem.score > rivItem.score
          ? 'player'
          : rivItem.score > plItem.score
          ? 'rival'
          : 'tie';
      if (winner === 'player') playerRoundsWon += 1;
      if (winner === 'rival') rivalRoundsWon += 1;

      return {
        id: rivItem.id,
        label: rivItem.label,
        playerPts: plItem.score,
        rivalPts: rivItem.score,
        maxPts: rivItem.maxScore,
        playerVerdict: plItem.verdict,
        rivalVerdict: rivItem.verdict,
        winner,
      };
    });

    const playerWinsOverall =
      playerScore.totalScore > rivalScore.totalScore ||
      (playerScore.totalScore === rivalScore.totalScore &&
        playerRoundsWon >= rivalRoundsWon);

    return {
      rounds,
      playerRoundsWon,
      rivalRoundsWon,
      playerWinsOverall,
    };
  }, [playerScore, rivalScore]);

  const handleRunDuel = () => {
    setDuelExecutedRivalId(currentRival.id);
    const won = duelComparison.playerWinsOverall;

    const duelTicket: CollectibleTicket = {
      id: `tk-duel-${currentRival.id}-${Date.now()}`,
      serialNumber: `DUEL-${String(Math.floor(1000 + Math.random() * 9000))}`,
      title: won
        ? `Victoria en Duelo vs. ${currentRival.name}`
        : `Duelo Disputado vs. ${currentRival.name}`,
      subtitle: `${currentRival.archetype} · Mano a Mano de 36 Canciones`,
      venue: 'Playa de Necochea · Arena Central',
      dateIssued: 'Temporada 2026',
      score: playerScore.totalScore,
      mode: 'duelo',
      openerTitle: setlist[0]?.title || 'Sin Apertura',
      closerTitle: setlist[setlist.length - 1]?.title || 'Sin Cierre',
      stampText: won
        ? `GANADOR (${duelComparison.playerRoundsWon} A ${duelComparison.rivalRoundsWon})`
        : `RIVALSUPERIOR (${duelComparison.rivalRoundsWon} A ${duelComparison.playerRoundsWon})`,
      badgesEarned: playerScore.badges,
    };

    setHighlightedTicket(duelTicket);
    onRecordDuelResult(currentRival.id, won, duelTicket);

    if (won) {
      rockAudio.playCrowdRoar();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-30 bg-black/85 flex items-center justify-center p-2 sm:p-4">
      <div className="sketch-panel rounded w-full max-w-6xl h-[94dvh] sm:h-[90vh] flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b border-[#3a2c24] bg-[#191310] shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-2xl font-rock text-[#f5efe2]">
                Modo Juego · El Oráculo, Duelo de Setlists y Vitrina
              </h2>
              <p className="text-xs text-[#a89984] hidden sm:block">
                Adiviná qué tocó La Renga en shows históricos reales, competí mano a mano contra listas míticas y desbloqueá fuego, luces e invitados para tu playa 3D.
              </p>
            </div>
            <button
              onClick={onClose}
              className="sm:hidden p-1.5 text-[#a89984] hover:text-white rounded cursor-pointer shrink-0"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Segmented Mode Tabs (Horizontally scrollable on narrow mobile screens) */}
            <div className="flex items-center gap-1 bg-[#0d0a09] p-1 rounded border border-[#3a2c24] overflow-x-auto w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('oraculo')}
                className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                  activeTab === 'oraculo'
                    ? 'bg-[#b91c1c] text-white'
                    : 'text-[#c5b8a5] hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>1. Oráculo</span>
              </button>
              <button
                onClick={() => setActiveTab('duelo')}
                className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                  activeTab === 'duelo'
                    ? 'bg-[#b91c1c] text-white'
                    : 'text-[#c5b8a5] hover:text-white'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                <span>2. Duelo de Setlists</span>
              </button>
              <button
                onClick={() => setActiveTab('vitrina')}
                className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                  activeTab === 'vitrina'
                    ? 'bg-[#b91c1c] text-white'
                    : 'text-[#c5b8a5] hover:text-white'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>
                  3. Entradas & Ranking ({gameProgress.tickets.length})
                </span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="hidden sm:block p-1.5 text-[#a89984] hover:text-white rounded cursor-pointer shrink-0"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* TAB 1: EL ORÁCULO DE SHOWS REALES (ADIVINANZA HISTÓRICA)               */}
        {/* ===================================================================== */}
        {activeTab === 'oraculo' && (
          <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 overflow-y-auto lg:overflow-hidden">
            {/* Left Sidebar: Historical Show Selector + Clues */}
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#2e231e] bg-[#120e0c] p-3.5 sm:p-4 lg:overflow-y-auto flex flex-col gap-4 shrink-0">
              <div>
                <div className="text-xs font-mono tabular-nums text-[#f59e0b]">
                  ELEGÍ UNA FECHA HISTÓRICA REAL ({gameProgress.solvedOracleIds.length}/4 RESUELTAS)
                </div>
                <div className="mt-2 space-y-2">
                  {HISTORICAL_CHALLENGES.map((ch) => {
                    const isSelected = ch.id === currentChallenge.id;
                    const isSolved = gameProgress.solvedOracleIds.includes(ch.id);
                    return (
                      <button
                        key={ch.id}
                        onClick={() => setSelectedChallengeId(ch.id)}
                        className={`w-full text-left p-3 rounded border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#281814] border-[#f59e0b] text-[#f5efe2]'
                            : 'sketch-card text-[#c5b8a5] hover:border-[#6e5546]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums text-[#a89984]">
                          <span>{ch.date}</span>
                          <span>·</span>
                          <span className="text-[#f59e0b]">{ch.difficulty}</span>
                        </div>
                        <div className="text-base font-rock text-[#f5efe2] mt-0.5 flex items-center justify-between gap-2">
                          <span>{ch.title}</span>
                          {isSolved && (
                            <Check className="w-4 h-4 text-[#22c55e] shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-[#9c8c79] mt-0.5">
                          {ch.venue} · {ch.attendance}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Historical Dossier & Clues */}
              <div className="sketch-card rounded p-4 space-y-3">
                <div className="text-xs font-mono tabular-nums text-[#ef4444]">
                  EXPEDIENTE DE LA NOCHE · PISTAS DEL ORÁCULO
                </div>
                <h3 className="text-lg font-rock text-[#f5efe2]">
                  {currentChallenge.venue} ({currentChallenge.city})
                </h3>
                <p className="text-xs text-[#c5b8a5] leading-relaxed">
                  {currentChallenge.summary}
                </p>
                <div className="pt-2 border-t border-[#2e231d] space-y-1.5">
                  {currentChallenge.generalClues.map((clue, idx) => (
                    <p key={idx} className="text-xs text-[#efe8d8]">
                      <span className="font-mono tabular-nums text-[#f59e0b] mr-1.5">
                        0{idx + 1}.
                      </span>
                      {clue}
                    </p>
                  ))}
                </div>
              </div>

              {/* Switch between 6 Key Milestones vs Full 36-Song Comparison */}
              <div className="sketch-card rounded p-3 flex flex-col gap-2">
                <div className="text-xs text-[#a89984]">MODO DE JUEGO DEL ORÁCULO</div>
                <div className="grid grid-cols-2 gap-1.5 bg-[#0d0a09] p-1 rounded border border-[#2c221d]">
                  <button
                    onClick={() => setOracleMode('milestones')}
                    className={`py-1.5 px-2 text-xs font-semibold rounded cursor-pointer whitespace-nowrap ${
                      oracleMode === 'milestones'
                        ? 'bg-[#b91c1c] text-white'
                        : 'text-[#a89984] hover:text-white'
                    }`}
                  >
                    Adivinar 6 Hitos
                  </button>
                  <button
                    onClick={() => setOracleMode('compare36')}
                    className={`py-1.5 px-2 text-xs font-semibold rounded cursor-pointer whitespace-nowrap ${
                      oracleMode === 'compare36'
                        ? 'bg-[#b91c1c] text-white'
                        : 'text-[#a89984] hover:text-white'
                    }`}
                  >
                    Comparar mis 36 Temas
                  </button>
                </div>
              </div>
            </div>

            {/* Right Workspace: 6 Milestones Deduction OR 36-Song Comparison */}
            <div className="lg:col-span-8 p-3.5 sm:p-5 lg:overflow-y-auto flex flex-col justify-between gap-5 bg-[#0d0a09]">
              {oracleMode === 'milestones' ? (
                <>
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-xl font-rock text-[#f5efe2]">
                          Deducí los 6 Momentos Clave de {currentChallenge.title}
                        </h3>
                        <p className="text-xs text-[#a89984]">
                          Leé la pista de cada momento del recital y elegí qué canción sonó realmente esa noche. Al acertar 3 o más desbloqueás su Entrada Histórica y efectos 3D.
                        </p>
                      </div>
                      <div className="text-xs font-mono tabular-nums text-[#f59e0b]">
                        SELECCIONADOS: {filledGuessCount} / 6 HITOS
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {currentChallenge.milestones.map((ms) => {
                        const selectedSongId = currentChallengeGuesses[ms.key];
                        const isCorrect = selectedSongId === ms.songId;

                        return (
                          <div
                            key={ms.key}
                            className={`sketch-card rounded p-3.5 flex flex-col justify-between gap-2.5 ${
                              isCurrentChallengeRevealed
                                ? isCorrect
                                  ? 'border-[#22c55e]'
                                  : 'border-[#ef4444]'
                                : ''
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums text-[#f59e0b]">
                                <span>{ms.slotLabel}</span>
                                <span>{ms.positionLabel}</span>
                              </div>
                              <p className="text-xs text-[#d6c9b8] mt-1">
                                {ms.clue}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 gap-1.5 mt-1">
                              {ms.optionsIds.map((optId) => {
                                const optSong = songById[optId];
                                if (!optSong) return null;
                                const isChosen = selectedSongId === optId;
                                const isRealAnswer = optId === ms.songId;

                                let btnClass =
                                  'bg-[#140f0d] border-[#332720] text-[#c5b8a5] hover:border-[#6e5546] hover:text-white';
                                if (isCurrentChallengeRevealed) {
                                  if (isRealAnswer) {
                                    btnClass =
                                      'bg-[#14291a] border-[#22c55e] text-[#f5efe2]';
                                  } else if (isChosen && !isRealAnswer) {
                                    btnClass =
                                      'bg-[#2b1414] border-[#ef4444] text-[#fca5a5]';
                                  }
                                } else if (isChosen) {
                                  btnClass =
                                    'bg-[#b91c1c]/30 border-[#f59e0b] text-white';
                                }

                                return (
                                  <button
                                    key={optId}
                                    onClick={() => handleSelectGuess(ms.key, optId)}
                                    className={`w-full text-left px-2.5 py-1.5 rounded border text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${btnClass}`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <img
                                        src={albumCoverMap[optSong.album]}
                                        alt={optSong.album}
                                        referrerPolicy="no-referrer"
                                        className="w-6 h-6 rounded object-cover border border-[#090706] shrink-0"
                                      />
                                      <span className="font-medium truncate">
                                        {optSong.title}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-mono tabular-nums text-[#9c8c79] shrink-0">
                                      {optSong.year}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Oracle Footer Verdict & Action Bar */}
                  <div className="sketch-card rounded p-4 flex flex-wrap items-center justify-between gap-4 border-[#f59e0b]/50">
                    {isCurrentChallengeRevealed ? (
                      <div>
                        <div className="text-xs font-mono tabular-nums text-[#22c55e]">
                          VEREDICTO DEL ORÁCULO · {oracleEvaluation.exactHits} DE 6 ACIERTOS EXACTOS ({oracleEvaluation.oracleScore.toLocaleString('es-AR')} PTS)
                        </div>
                        <p className="text-xs text-[#efe8d8] mt-0.5">
                          ¡Se emitió tu <strong>{currentChallenge.rewardTicketTitle}</strong> en la Vitrina! Podés cargar las 36 canciones reales de esa noche en la playa 3D.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="text-xs font-mono tabular-nums text-[#f59e0b]">
                          RECOMPENSA DE ESTA FECHA
                        </div>
                        <p className="text-xs text-[#c5b8a5] mt-0.5">
                          Emitir <strong>{currentChallenge.rewardTicketTitle}</strong> + Desbloquear Efecto Escénico 3D.
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2.5">
                      {isCurrentChallengeRevealed && (
                        <>
                          <button
                            onClick={() =>
                              onLoadSetlistToBeach(currentChallenge.fullSetlistIds)
                            }
                            className="px-3.5 py-2 text-xs font-semibold sketch-card hover:bg-[#2c211c] text-[#f59e0b] rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Cargar este Show Real (36 Temas) en la Playa</span>
                          </button>
                          <button
                            onClick={() => setActiveTab('vitrina')}
                            className="px-3.5 py-2 text-xs font-semibold bg-[#1db954] hover:bg-[#1ed760] text-black rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <Ticket className="w-3.5 h-3.5" />
                            <span>Ver Entrada Emitida</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={handleRevealOracle}
                        disabled={filledGuessCount < 6}
                        className={`px-4 py-2 text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                          filledGuessCount < 6
                            ? 'bg-[#261e1a] text-[#6e6052] cursor-not-allowed'
                            : 'bg-[#b91c1c] hover:bg-[#dc2626] text-white'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {isCurrentChallengeRevealed
                            ? 'Volver a Evaluar Oráculo'
                            : `Revelar Show Real (${filledGuessCount}/6)`}
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* MODO B: COMPARAR MIS 36 CANCIONES CONTRA EL SHOW REAL */
                <div className="space-y-4">
                  <div className="sketch-card rounded p-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-mono tabular-nums text-[#f59e0b]">
                        COMPARACIÓN DIRECTA · TU SETLIST ({setlist.length}/36) VS. {currentChallenge.title.toUpperCase()}
                      </div>
                      <h3 className="text-xl font-rock text-[#f5efe2] mt-0.5">
                        Coincidencia con el Show Real: {fullSetlistComparison.coincidencePct}% ({fullSetlistComparison.sharedSongs.length} canciones en común)
                      </h3>
                      <p className="text-xs text-[#a89984] mt-0.5">
                        Temas en la misma ubicación exacta del orden: {fullSetlistComparison.exactPositionMatches.length} canciones.
                      </p>
                    </div>

                    <button
                      onClick={() => onLoadSetlistToBeach(currentChallenge.fullSetlistIds)}
                      className="px-4 py-2 text-xs font-semibold bg-[#b91c1c] hover:bg-[#dc2626] text-white rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Cargar los 36 Temas Reales de {currentChallenge.city}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {currentChallenge.fullSetlistIds.map((realId, idx) => {
                      const song = songById[realId];
                      if (!song) return null;
                      const inPlayerList = setlist.some((s) => s.id === realId);
                      const exactOrder = setlist[idx]?.id === realId;

                      return (
                        <div
                          key={`${realId}-${idx}`}
                          className={`px-3 py-2 rounded border text-xs flex items-center justify-between gap-2 ${
                            exactOrder
                              ? 'bg-[#14291a] border-[#22c55e] text-white'
                              : inPlayerList
                              ? 'bg-[#291d12] border-[#f59e0b] text-[#f5efe2]'
                              : 'bg-[#14100e] border-[#29201b] text-[#8c7c68]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono tabular-nums text-[11px] text-[#a89984]">
                              #{String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className="truncate font-medium">{song.title}</span>
                          </div>
                          <span className="text-[10px] font-mono tabular-nums shrink-0">
                            {exactOrder ? 'EXACTO' : inPlayerList ? 'EN TU LISTA' : song.year}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: DUELO DE SETLISTS (MANO A MANO CONTRA LEYENDAS)                */}
        {/* ===================================================================== */}
        {activeTab === 'duelo' && (
          <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 overflow-y-auto lg:overflow-hidden">
            {/* Left Column: Choose Rival Banquete (Classic AI Legends + Community Users) */}
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#2e231e] bg-[#120e0c] p-3.5 sm:p-4 lg:overflow-y-auto space-y-3 shrink-0">
              <div className="text-xs font-mono tabular-nums text-[#f59e0b]">
                1. RIVALES LEYENDA ({gameProgress.defeatedRivalIds.length}/4 DERROTADOS)
              </div>
              {RIVAL_BANQUETES.map((riv) => {
                const isSelected = riv.id === currentRival.id;
                const isDefeated = gameProgress.defeatedRivalIds.includes(riv.id);
                return (
                  <button
                    key={riv.id}
                    onClick={() => setSelectedRivalId(riv.id)}
                    className={`w-full text-left p-3.5 rounded border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#281814] border-[#f59e0b] text-[#f5efe2]'
                        : 'sketch-card text-[#c5b8a5] hover:border-[#6e5546]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums text-[#a89984]">
                      <span>{riv.archetype}</span>
                      <span>·</span>
                      <span className="text-[#ef4444]">{riv.difficulty}</span>
                    </div>
                    <div className="text-lg font-rock text-[#f5efe2] mt-0.5 flex items-center justify-between gap-2">
                      <span>{riv.name}</span>
                      {isDefeated && (
                        <span className="text-xs font-mono text-[#22c55e]">
                          ✓ VENCIDO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#9c8c79] mt-1 italic">
                      {riv.challengeQuote}
                    </p>
                  </button>
                );
              })}

              {communityRivals.length > 0 && (
                <>
                  <div className="pt-3 border-t border-[#2e231e] text-xs font-mono tabular-nums text-[#f59e0b]">
                    2. BATALLAS CONTRA OTROS USUARIOS (RANKING GLOBAL)
                  </div>
                  {communityRivals.map((riv) => {
                    const isSelected = riv.id === currentRival.id;
                    const isDefeated = gameProgress.defeatedRivalIds.includes(riv.id);
                    return (
                      <button
                        key={riv.id}
                        onClick={() => setSelectedRivalId(riv.id)}
                        className={`w-full text-left p-3 rounded border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#281814] border-[#f59e0b] text-[#f5efe2]'
                            : 'sketch-card text-[#c5b8a5] hover:border-[#6e5546]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-[#a89984]">
                          <span className="truncate">{riv.archetype}</span>
                          <span className="text-[#fbbf24] shrink-0">{riv.difficulty}</span>
                        </div>
                        <div className="text-base font-rock text-[#f5efe2] mt-0.5 flex items-center justify-between gap-2">
                          <span>vs. {riv.name}</span>
                          {isDefeated && (
                            <span className="text-xs font-mono text-[#22c55e]">
                              ✓ VENCIDO
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#9c8c79] mt-0.5">
                          {riv.challengeQuote}
                        </p>
                      </button>
                    );
                  })}
                </>
              )}
            </div>

            {/* Right Column: Head-to-Head 5-Category Battle */}
            <div className="lg:col-span-8 p-5 overflow-y-auto flex flex-col justify-between gap-5 bg-[#0d0a09]">
              {/* Scoreboard Header */}
              <div className="sketch-card rounded p-4 grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                <div>
                  <div className="text-xs font-mono tabular-nums text-[#f59e0b]">
                    TU BANQUETE ({setlist.length}/36 TEMAS)
                  </div>
                  <div className="text-3xl font-mono tabular-nums font-bold text-[#f5efe2] mt-0.5">
                    {playerScore.totalScore.toLocaleString('es-AR')} pts
                  </div>
                  <div className="text-xs text-[#a89984] truncate">
                    {playerScore.rankTitle}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs font-mono tabular-nums text-[#a89984]">
                    ROUNDS GANADOS
                  </div>
                  <div className="text-2xl font-rock text-[#ef4444] mt-0.5 font-mono tabular-nums">
                    {duelComparison.playerRoundsWon} — VS — {duelComparison.rivalRoundsWon}
                  </div>
                  <div className="text-xs text-[#f59e0b]">
                    {duelComparison.playerWinsOverall
                      ? '¡Tu lista domina el duelo!'
                      : 'El rival supera tu puntaje actual'}
                  </div>
                </div>

                <div className="md:text-right">
                  <div className="text-xs font-mono tabular-nums text-[#ef4444]">
                    RIVAL: {currentRival.name.toUpperCase()}
                  </div>
                  <div className="text-3xl font-mono tabular-nums font-bold text-[#ef4444] mt-0.5">
                    {rivalScore.totalScore.toLocaleString('es-AR')} pts
                  </div>
                  <div className="text-xs text-[#a89984] truncate">
                    {currentRival.archetype}
                  </div>
                </div>
              </div>

              {/* 5 Category Rounds */}
              <div className="space-y-3">
                {duelComparison.rounds.map((r) => {
                  const pPct = r.maxPts > 0 ? Math.round((r.playerPts / r.maxPts) * 100) : 0;
                  const rPct = r.maxPts > 0 ? Math.round((r.rivalPts / r.maxPts) * 100) : 0;

                  return (
                    <div key={r.id} className="sketch-card rounded p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-mono tabular-nums text-[#f5efe2] font-semibold">
                          {r.playerPts.toLocaleString('es-AR')} pts ({pPct}%)
                        </span>
                        <span className="font-semibold text-[#f59e0b]">
                          {r.label} ·{' '}
                          {r.winner === 'player'
                            ? 'GANÁS VOS'
                            : r.winner === 'rival'
                            ? 'GANA RIVAL'
                            : 'EMPATE'}
                        </span>
                        <span className="font-mono tabular-nums text-[#ef4444] font-semibold">
                          {r.rivalPts.toLocaleString('es-AR')} pts ({rPct}%)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="h-2.5 bg-[#14100e] rounded overflow-hidden border border-[#2c221d] flex justify-end">
                          <div
                            className="h-full bg-[#f59e0b]"
                            style={{ width: `${pPct}%` }}
                          />
                        </div>
                        <div className="h-2.5 bg-[#14100e] rounded overflow-hidden border border-[#2c221d]">
                          <div
                            className="h-full bg-[#dc2626]"
                            style={{ width: `${rPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 mt-1.5 text-[11px] text-[#9c8c79]">
                        <span className="truncate max-w-[46%]">{r.playerVerdict}</span>
                        <span className="truncate max-w-[46%] text-right">{r.rivalVerdict}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Duel Action Footer */}
              <div className="sketch-card rounded p-4 flex flex-wrap items-center justify-between gap-4 border-[#f59e0b]/50">
                <div>
                  <div className="text-xs font-mono tabular-nums text-[#f59e0b]">
                    {duelExecutedRivalId === currentRival.id
                      ? duelComparison.playerWinsOverall
                        ? `¡DERROTASTE A ${currentRival.name.toUpperCase()} Y SELLASTE TU ENTRADA DE DUELO!`
                        : `EL RIVAL SE LLEVÓ LA VICTORIA (${rivalScore.totalScore.toLocaleString('es-AR')} A ${playerScore.totalScore.toLocaleString('es-AR')} PTS)`
                      : 'LISTO PARA EL MANO A MANO EN LA VALLA'}
                  </div>
                  <p className="text-xs text-[#c5b8a5] mt-0.5">
                    Si tu lista tiene menos de 36 temas, completala en el Armador para competir con el puntaje máximo.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => onLoadSetlistToBeach(currentRival.songIds)}
                    className="px-3.5 py-2 text-xs font-semibold sketch-card hover:bg-[#2c211c] text-[#c5b8a5] hover:text-white rounded cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Cargar Lista del Rival (36)
                  </button>
                  <button
                    onClick={handleRunDuel}
                    className="px-4 py-2 text-xs font-semibold bg-[#b91c1c] hover:bg-[#dc2626] text-white rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>Batirse a Duelo y Sellar Entrada</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: VITRINA (ENTRADAS COLECCIONABLES, EFECTOS 3D, TROFEOS & RANKING) */}
        {/* ===================================================================== */}
        {activeTab === 'vitrina' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0d0a09]">
            {/* Row 1: Collectible Ticket Generator + Perforated Ticket Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left: Register Banquete in Leaderboard & Print Ticket */}
              <div className="lg:col-span-5 sketch-card rounded p-5 flex flex-col justify-between gap-4">
                <div>
                  <div className="text-xs font-mono tabular-nums text-[#f59e0b]">
                    EMISIÓN DE ENTRADA COLECCIONABLE & SALÓN DE LA FAMA
                  </div>
                  <h3 className="text-xl font-rock text-[#f5efe2] mt-1">
                    Bautizá tu Banquete Actual ({playerScore.totalScore.toLocaleString('es-AR')} pts)
                  </h3>
                  <p className="text-xs text-[#a89984] mt-1">
                    Inscribí tu lista actual en el Ranking de Mejores Banquetes y emití tu entrada histórica troquelada con fecha, apertura, cierre y sello oficial.
                  </p>

                  <div className="space-y-3 mt-4">
                    <div>
                      <label className="block text-xs text-[#c5b8a5] mb-1">
                        Nombre de la Fecha / Banquete
                      </label>
                      <input
                        type="text"
                        value={customBanqueteName}
                        onChange={(e) => setCustomBanqueteName(e.target.value)}
                        placeholder="Ej: Banquete en la Costa de Necochea"
                        className="w-full px-3 py-1.5 text-sm bg-[#120e0c] border border-[#3a2c24] rounded text-[#f5efe2] focus:outline-none focus:border-[#f59e0b]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#c5b8a5] mb-1">
                        Armado por (Apodo o Caravana)
                      </label>
                      <input
                        type="text"
                        value={customAuthorName}
                        onChange={(e) => setCustomAuthorName(e.target.value)}
                        placeholder="Ej: Los Mismos de Siempre"
                        className="w-full px-3 py-1.5 text-sm bg-[#120e0c] border border-[#3a2c24] rounded text-[#f5efe2] focus:outline-none focus:border-[#f59e0b]"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const ticket = onRegisterLeaderboardBanquete(
                      customBanqueteName.trim() || 'Banquete en la Playa',
                      customAuthorName.trim() || 'Rengo de Caravana'
                    );
                    setHighlightedTicket(ticket);
                    rockAudio.playCrowdRoar();
                  }}
                  className="w-full py-2.5 px-4 text-xs font-semibold bg-[#b91c1c] hover:bg-[#dc2626] text-white rounded flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Inscribir en el Ranking y Emitir Entrada Histórica</span>
                </button>
              </div>

              {/* Right: Perforated Historical Concert Ticket Display */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                {highlightedTicket ? (
                  <div className="h-full bg-[#211913] border-2 border-[#c29d68] rounded p-5 relative flex flex-col sm:flex-row justify-between gap-5 shadow-lg">
                    {/* Main Ticket Body */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-[#f59e0b]">
                          <span>LA RENGA · ENTRADA HISTÓRICA OFICIAL</span>
                          <span>·</span>
                          <span>N° {highlightedTicket.serialNumber}</span>
                        </div>
                        <h3 className="text-2xl font-rock text-[#f5efe2] mt-1">
                          {highlightedTicket.title}
                        </h3>
                        <p className="text-xs text-[#d6c9b8]">
                          {highlightedTicket.subtitle} · {highlightedTicket.dateIssued}
                        </p>
                      </div>

                      <div className="my-3 py-2.5 border-y border-dashed border-[#5c4838] grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-[#9c8c79]">APERTURA (#01)</div>
                          <div className="font-semibold text-[#f5efe2] truncate">
                            {highlightedTicket.openerTitle}
                          </div>
                        </div>
                        <div>
                          <div className="text-[#9c8c79]">CIERRE SAGRADO (#36)</div>
                          <div className="font-semibold text-[#f5efe2] truncate">
                            {highlightedTicket.closerTitle}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-mono tabular-nums text-[#ef4444] font-bold tracking-wider">
                          SELLO: {highlightedTicket.stampText}
                        </div>
                        <div className="text-xs text-[#a89984]">
                          Válido para Campo & Playa Necochea
                        </div>
                      </div>
                    </div>

                    {/* Perforated Ticket Stub (Talón Troquelado) */}
                    <div className="sm:w-44 sm:border-l-2 sm:border-dashed border-[#6e5544] sm:pl-5 flex flex-col justify-between items-start sm:items-end text-left sm:text-right shrink-0">
                      <div>
                        <div className="text-[11px] font-mono tabular-nums text-[#a89984]">
                          TALÓN DE CONTROL
                        </div>
                        <div className="text-2xl font-mono tabular-nums font-bold text-[#f59e0b] mt-0.5">
                          {highlightedTicket.score.toLocaleString('es-AR')}
                        </div>
                        <div className="text-[11px] font-mono text-[#9c8c79]">
                          PUNTOS BANQUETE
                        </div>
                      </div>

                      <div className="text-[11px] font-mono tabular-nums text-[#c5b8a5] mt-3">
                        <div>CÓD: {highlightedTicket.serialNumber}</div>
                        <div className="text-[#f59e0b]">★ COLECCIONADA ★</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full sketch-card rounded p-6 flex flex-col items-center justify-center text-center">
                    <Ticket className="w-10 h-10 text-[#f59e0b] mb-2" />
                    <p className="text-base font-rock text-[#f5efe2]">
                      Todavía no emitiste tu primera Entrada Histórica
                    </p>
                    <p className="text-xs text-[#9c8c79] max-w-md mt-1">
                      Usá el formulario de la izquierda, ganá un Duelo o resolvé una fecha en el Oráculo para imprimir tu entrada troquelada.
                    </p>
                  </div>
                )}

                {/* Ticket Strip Selector if multiple tickets collected */}
                {gameProgress.tickets.length > 1 && (
                  <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-xs text-[#a89984] shrink-0">
                      Tus Entradas ({gameProgress.tickets.length}):
                    </span>
                    {gameProgress.tickets.map((tk) => (
                      <button
                        key={tk.id}
                        onClick={() => setHighlightedTicket(tk)}
                        className={`px-2.5 py-1 text-xs rounded border cursor-pointer whitespace-nowrap shrink-0 ${
                          highlightedTicket?.id === tk.id
                            ? 'bg-[#b91c1c] text-white border-[#f59e0b]'
                            : 'sketch-card text-[#c5b8a5] hover:text-white'
                        }`}
                      >
                        {tk.serialNumber} · {tk.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Unlockable Decorative 3D Stage Rewards */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xl font-rock text-[#f5efe2]">
                    Efectos Escénicos 3D & Rarezas Desbloqueables ({gameProgress.unlockedStageIds.length}/4)
                  </h3>
                  <p className="text-xs text-[#a89984]">
                    El recital en la playa es 100% decorativo: activá o desactivá tus premios para ver el escenario con fuego vivo, haces de luz de Huracán, chispas doradas o un violero leyenda invitado.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onFocusStage3D();
                    onClose();
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold sketch-card hover:bg-[#2c211c] text-[#f59e0b] rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Mirar Escenario 3D Ahora</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {STAGE_UNLOCKABLES.map((item) => {
                  const isUnlocked = gameProgress.unlockedStageIds.includes(item.id);
                  const isEnabled = gameProgress.enabledStageIds.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      className={`sketch-card rounded p-4 flex flex-col justify-between gap-3 ${
                        isEnabled ? 'border-[#f59e0b]' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums">
                          <span
                            className={
                              isUnlocked ? 'text-[#22c55e]' : 'text-[#a89984]'
                            }
                          >
                            {isUnlocked ? 'DESBLOQUEADO' : 'BLOQUEADO'}
                          </span>
                          {isUnlocked ? (
                            <Unlock className="w-3.5 h-3.5 text-[#22c55e]" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-[#8c7c68]" />
                          )}
                        </div>
                        <h4 className="text-base font-rock text-[#f5efe2] mt-1">
                          {item.name}
                        </h4>
                        <p className="text-xs text-[#c5b8a5] mt-1">
                          {item.effectDescription}
                        </p>
                        <p className="text-[11px] text-[#9c8c79] mt-2">
                          Requisito: {item.requirementText}
                        </p>
                      </div>

                      <button
                        onClick={() => onToggleStageUnlockable(item.id)}
                        className={`w-full py-2 px-3 text-xs font-semibold rounded border transition-colors cursor-pointer whitespace-nowrap ${
                          isEnabled
                            ? 'bg-[#b91c1c] text-white border-[#f59e0b]'
                            : isUnlocked
                            ? 'bg-[#211915] hover:bg-[#332720] text-[#f5efe2] border-[#544034]'
                            : 'bg-[#191310] hover:bg-[#2b201b] text-[#f59e0b] border-[#3a2c24]'
                        }`}
                      >
                        {isEnabled
                          ? 'Activo en Playa 3D (Desactivar)'
                          : isUnlocked
                          ? 'Activar en el Escenario 3D'
                          : 'Desbloquear y Probar en Playa 3D'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Row 3: Leaderboard (Salón de la Fama) & Trophies */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Leaderboard Table */}
              <div className="lg:col-span-7 sketch-card rounded p-5">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-lg font-rock text-[#f5efe2]">
                      Ranking de los Mejores Banquetes (Salón de la Fama)
                    </h3>
                    <p className="text-xs text-[#a89984]">
                      Los setlists con mayor puntuación sobre 10.000 registrados en la historia de la caravana.
                    </p>
                  </div>
                  <Trophy className="w-5 h-5 text-[#f59e0b] shrink-0" />
                </div>

                <div className="divide-y divide-[#261d19]">
                  {communityBanquetes.map((entry, idx) => (
                    <div
                      key={entry.id}
                      className={`py-2.5 px-2 flex items-center justify-between gap-3 ${
                        entry.isPlayer ? 'bg-[#b91c1c]/15 rounded' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-mono tabular-nums font-bold text-[#f59e0b] w-6">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#f5efe2] truncate">
                            {entry.banqueteName}
                          </div>
                          <div className="text-xs text-[#9c8c79] truncate">
                            Por {entry.author} · Abre: {entry.openerTitle} · {entry.albumsCount} discos
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {entry.songIds && entry.songIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRivalId(`user-${entry.id}`);
                              setActiveTab('duelo');
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-[#291811] hover:bg-[#b91c1c] text-[#fbbf24] hover:text-white border border-[#f59e0b]/40 rounded flex items-center gap-1 cursor-pointer"
                          >
                            <Swords className="w-3 h-3" />
                            <span>Batallar</span>
                          </button>
                        )}
                        <div className="text-right">
                          <div className="text-sm font-mono tabular-nums font-bold text-[#ef4444]">
                            {entry.totalScore.toLocaleString('es-AR')} pts
                          </div>
                          <div className="text-[11px] font-mono tabular-nums text-[#8c7c68]">
                            {entry.dateLabel}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trophies & Insignias Rengueras */}
              <div className="lg:col-span-5 sketch-card rounded p-5">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-lg font-rock text-[#f5efe2]">
                      Trofeos e Insignias Rengueras ({gameProgress.earnedTrophyIds.length}/{RENGA_TROPHIES.length})
                    </h3>
                    <p className="text-xs text-[#a89984]">
                      Medallas obtenidas por tus hazañas armando listas, adivinando shows y ganando duelos.
                    </p>
                  </div>
                  <Award className="w-5 h-5 text-[#f59e0b] shrink-0" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {RENGA_TROPHIES.map((tr) => {
                    const earned = gameProgress.earnedTrophyIds.includes(tr.id);
                    return (
                      <div
                        key={tr.id}
                        className={`p-3 rounded border ${
                          earned
                            ? 'bg-[#241914] border-[#f59e0b] text-[#f5efe2]'
                            : 'bg-[#120e0c] border-[#261d19] text-[#786a58]'
                        }`}
                      >
                        <div className="text-xs font-mono tabular-nums flex items-center justify-between gap-1">
                          <span className={earned ? 'text-[#f59e0b]' : 'text-[#6e6052]'}>
                            {earned ? '★ TROFEO GANADO' : 'PENDIENTE'}
                          </span>
                        </div>
                        <div className="text-sm font-semibold mt-0.5">{tr.name}</div>
                        <p className="text-[11px] mt-0.5 leading-snug">
                          {earned ? tr.description : tr.conditionText}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
