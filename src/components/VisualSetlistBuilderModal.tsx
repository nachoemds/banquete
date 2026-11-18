// src/components/VisualSetlistBuilderModal.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Flame,
  Music,
  Sparkles,
  Search,
  Plus,
  Check,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Shuffle,
  Disc,
  Star,
  Zap,
  Moon,
  Gem,
  Target,
  LayoutGrid,
  List,
  X,
} from 'lucide-react';
import {
  LA_RENGA_ALBUMS,
  PRESET_BANQUETES,
  LaRengaSong,
  SongEnergy,
} from '../data/laRengaSongs';
import { BanqueteScoreResult } from '../utils/banqueteScoring';

interface VisualSetlistBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  setlist: LaRengaSong[];
  catalogSongs: LaRengaSong[];
  albumCoverMap: Record<string, string>;
  scoreResult: BanqueteScoreResult;
  selectedAlbum: string;
  onSelectAlbum: (album: string) => void;
  onAddSong: (song: LaRengaSong) => void;
  onInsertSongAt: (insertIndex: number, newSong: LaRengaSong) => void;
  onReplaceSong: (slotIndex: number, newSong: LaRengaSong) => void;
  onReorderSong: (fromIndex: number, toIndex: number) => void;
  onRemoveSong: (songId: string) => void;
  onMoveSong: (index: number, direction: -1 | 1) => void;
  onPromoteToOpener: (index: number) => void;
  onAutoFill36: () => void;
  onClearSetlist: () => void;
  onLoadPreset: (songIds: string[]) => void;
}

type SpecialFilter = 'ALL' | 'OPENERS' | 'CLOSERS';

const ENERGY_META: Record<
  SongEnergy,
  {
    label: string;
    shortLabel: string;
    borderHex: string;
    bgClass: string;
    textClass: string;
    badgeBg: string;
  }
> = {
  pogo: {
    label: 'Pogo Demoledor',
    shortLabel: 'Pogo',
    borderHex: '#ef4444',
    bgClass: 'bg-[#2a1212]',
    textClass: 'text-[#f87171]',
    badgeBg: 'bg-[#dc2626]/20 border-[#ef4444]/40 text-[#fca5a5]',
  },
  himno: {
    label: 'Himno de Estadio',
    shortLabel: 'Himno',
    borderHex: '#f59e0b',
    bgClass: 'bg-[#291d10]',
    textClass: 'text-[#fbbf24]',
    badgeBg: 'bg-[#d97706]/20 border-[#f59e0b]/40 text-[#fde68a]',
  },
  rock: {
    label: 'Rocanrol de Ruta',
    shortLabel: 'Rocanrol',
    borderHex: '#f97316',
    bgClass: 'bg-[#291710]',
    textClass: 'text-[#fb923c]',
    badgeBg: 'bg-[#ea580c]/20 border-[#f97316]/40 text-[#fed7aa]',
  },
  balada: {
    label: 'Balada / Respiro',
    shortLabel: 'Balada',
    borderHex: '#14b8a6',
    bgClass: 'bg-[#0f2422]',
    textClass: 'text-[#2dd4bf]',
    badgeBg: 'bg-[#0d9488]/20 border-[#14b8a6]/40 text-[#99f6e4]',
  },
  oculto: {
    label: 'Joya de Culto',
    shortLabel: 'Culto',
    borderHex: '#a855f7',
    bgClass: 'bg-[#21132b]',
    textClass: 'text-[#c084fc]',
    badgeBg: 'bg-[#9333ea]/20 border-[#a855f7]/40 text-[#e9d5ff]',
  },
};

export const VisualSetlistBuilderModal: React.FC<VisualSetlistBuilderModalProps> = ({
  isOpen,
  onClose,
  setlist,
  catalogSongs,
  albumCoverMap,
  scoreResult,
  selectedAlbum,
  onSelectAlbum,
  onAddSong,
  onInsertSongAt,
  onReplaceSong,
  onReorderSong,
  onRemoveSong,
  onMoveSong,
  onPromoteToOpener,
  onAutoFill36,
  onClearSetlist,
  onLoadPreset,
}) => {
  // 'batea' = Large Album Covers Grid; 'songs' = Inside a specific album or full song catalog
  const [browseStage, setBrowseStage] = useState<'batea' | 'songs'>(() =>
    selectedAlbum && selectedAlbum !== 'ALL' ? 'songs' : 'batea'
  );
  const [selectedEnergy, setSelectedEnergy] = useState<SongEnergy | 'ALL'>('ALL');
  const [specialFilter, setSpecialFilter] = useState<SpecialFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [showPresetsBar, setShowPresetsBar] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'catalog' | 'setlist'>('catalog');

  // Index (0..setlist.length-1) of the single song in "Tu Lista" selected by click to be replaced
  const [replacingSlotIndex, setReplacingSlotIndex] = useState<number | null>(null);
  // ID of the single song selected in the left catalog (clicking another song deselects the previous one)
  const [selectedCatalogSongId, setSelectedCatalogSongId] = useState<string | null>(null);

  // Drag & Drop states (for reordering inside setlist OR dragging a song from catalog to insert between / replace)
  const [draggedSetlistIndex, setDraggedSetlistIndex] = useState<number | null>(null);
  const [draggedCatalogSong, setDraggedCatalogSong] = useState<LaRengaSong | null>(null);
  const [dragOverSlotIndex, setDragOverSlotIndex] = useState<number | null>(null);
  const [dragOverMode, setDragOverMode] = useState<'before' | 'replace' | 'after' | null>(null);

  const catalogScrollRef = useRef<HTMLDivElement | null>(null);

  // Keep replacingSlotIndex valid if setlist shrinks or clears
  useEffect(() => {
    if (replacingSlotIndex !== null && replacingSlotIndex >= setlist.length) {
      setReplacingSlotIndex(null);
    }
  }, [setlist.length, replacingSlotIndex]);

  // Scroll to top whenever user enters an album, returns to the batea, or changes filters
  useEffect(() => {
    if (selectedAlbum && selectedAlbum !== 'ALL') {
      setBrowseStage('songs');
    }
  }, [selectedAlbum]);

  useEffect(() => {
    if (catalogScrollRef.current) {
      catalogScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [browseStage, selectedAlbum, selectedEnergy, specialFilter]);

  // Map songId -> 1-based position in the setlist
  const setlistSlotMap = useMemo(() => {
    const map = new Map<string, number>();
    setlist.forEach((s, idx) => map.set(s.id, idx + 1));
    return map;
  }, [setlist]);

  // Count how many songs from each album are currently in the setlist
  const albumCountsInSetlist = useMemo(() => {
    const counts: Record<string, number> = {};
    setlist.forEach((s) => {
      counts[s.album] = (counts[s.album] || 0) + 1;
    });
    return counts;
  }, [setlist]);

  // Total songs per album in catalog
  const totalSongsByAlbum = useMemo(() => {
    const totals: Record<string, number> = {};
    catalogSongs.forEach((s) => {
      totals[s.album] = (totals[s.album] || 0) + 1;
    });
    return totals;
  }, [catalogSongs]);

  // Count energy distribution in current setlist
  const energyCounts = useMemo(() => {
    const counts: Record<SongEnergy, number> = {
      pogo: 0,
      himno: 0,
      rock: 0,
      balada: 0,
      oculto: 0,
    };
    setlist.forEach((s) => {
      counts[s.energy] = (counts[s.energy] || 0) + 1;
    });
    return counts;
  }, [setlist]);

  const uniqueAlbumsCovered = Object.keys(albumCountsInSetlist).length;

  const activeAlbumIndex = useMemo(
    () => LA_RENGA_ALBUMS.findIndex((a) => a.name === selectedAlbum),
    [selectedAlbum]
  );

  const activeAlbumMeta = useMemo(
    () => (activeAlbumIndex >= 0 ? LA_RENGA_ALBUMS[activeAlbumIndex] : null),
    [activeAlbumIndex]
  );

  // Track numbers within each album
  const albumTrackNumberMap = useMemo(() => {
    const map = new Map<string, number>();
    const perAlbumCounter: Record<string, number> = {};
    catalogSongs.forEach((s) => {
      perAlbumCounter[s.album] = (perAlbumCounter[s.album] || 0) + 1;
      map.set(s.id, perAlbumCounter[s.album]);
    });
    return map;
  }, [catalogSongs]);

  const filteredSongs = useMemo(() => {
    return catalogSongs.filter((song) => {
      const matchAlbum = selectedAlbum === 'ALL' || song.album === selectedAlbum;
      const matchEnergy = selectedEnergy === 'ALL' || song.energy === selectedEnergy;
      const matchSpecial =
        specialFilter === 'ALL' ||
        (specialFilter === 'OPENERS' && song.isIdealOpener) ||
        (specialFilter === 'CLOSERS' && song.isIdealCloser);

      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        song.title.toLowerCase().includes(q) ||
        song.album.toLowerCase().includes(q) ||
        String(song.year).includes(q);

      return matchAlbum && matchEnergy && matchSpecial && matchQuery;
    });
  }, [catalogSongs, selectedAlbum, selectedEnergy, specialFilter, searchQuery]);

  if (!isOpen) return null;

  const replacingTargetSong =
    replacingSlotIndex !== null ? setlist[replacingSlotIndex] || null : null;

  const clearDragStates = () => {
    setDraggedSetlistIndex(null);
    setDraggedCatalogSong(null);
    setDragOverSlotIndex(null);
    setDragOverMode(null);
  };

  // Enter a specific album ("meterse adentro del disco")
  const handleEnterAlbum = (albumName: string) => {
    onSelectAlbum(albumName);
    setSelectedEnergy('ALL');
    setSpecialFilter('ALL');
    setSearchQuery('');
    setBrowseStage('songs');
    setMobileTab('catalog');
  };

  // Return to the large album covers view ("Volver a la Batea de Discos")
  const handleReturnToBatea = () => {
    onSelectAlbum('ALL');
    setSelectedEnergy('ALL');
    setSpecialFilter('ALL');
    setSearchQuery('');
    setBrowseStage('batea');
  };

  // Navigate to previous or next studio album when inside an album
  const handleCycleAlbum = (direction: -1 | 1) => {
    if (LA_RENGA_ALBUMS.length === 0) return;
    const currentIdx = activeAlbumIndex >= 0 ? activeAlbumIndex : 0;
    const nextIdx =
      (currentIdx + direction + LA_RENGA_ALBUMS.length) % LA_RENGA_ALBUMS.length;
    handleEnterAlbum(LA_RENGA_ALBUMS[nextIdx].name);
  };

  // Quick helper to add up to 3 classic songs from the currently open album
  const handleAddHighlightsFromAlbum = (albumName: string) => {
    const candidates = catalogSongs
      .filter((s) => s.album === albumName && !setlistSlotMap.has(s.id))
      .sort((a, b) => a.rarity - b.rarity);
    const availableSlots = Math.max(0, 36 - setlist.length);
    const toAdd = candidates.slice(0, Math.min(3, availableSlots));
    toAdd.forEach((song) => onAddSong(song));
  };

  // If the user types a search query or picks an energy filter while on the Batea, show matching songs automatically
  const isShowingSongsView =
    browseStage === 'songs' ||
    searchQuery.trim().length > 0 ||
    selectedEnergy !== 'ALL' ||
    specialFilter !== 'ALL';

  const renderEnergyIcon = (energy: SongEnergy, className = 'w-3.5 h-3.5') => {
    switch (energy) {
      case 'pogo':
        return <Flame className={className} />;
      case 'himno':
        return <Star className={className} />;
      case 'rock':
        return <Zap className={className} />;
      case 'balada':
        return <Moon className={className} />;
      case 'oculto':
        return <Gem className={className} />;
    }
  };

  const hasIdealOpenerAtFirst = Boolean(setlist[0]?.isIdealOpener);
  const hasHablandoAtEnd =
    setlist.length > 0 &&
    setlist[setlist.length - 1]?.title === 'Hablando de la libertad';

  return (
    <div
      className="fixed inset-0 z-30 bg-black/85 flex items-center justify-center p-1.5 sm:p-2 md:p-4 select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Armador Visual de Setlist del Banquete"
    >
      <div className="sketch-panel rounded w-full max-w-[1380px] h-[94dvh] sm:h-[92vh] min-h-0 flex flex-col overflow-hidden border-2 border-[#4a382d] bg-[#120e0c]">
        {/* ====================================================================
            1. TOP HEADER BAR WITH LIVE STATS & QUICK ACTIONS
           ==================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-[#3a2c24] bg-[#191310] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-[#b91c1c] border border-[#f59e0b]/50 flex items-center justify-center text-white shrink-0">
              <Disc className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg md:text-2xl font-rock tracking-wide text-[#f5efe2]">
                  Batea de Discos &amp; Armador del Banquete
                </h2>
                <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-[#2b1814] text-[#f59e0b] border border-[#f59e0b]/40">
                  {setlist.length} / 36 TEMAS
                </span>
              </div>
              <p className="text-[11px] text-[#a89984] hidden sm:block">
                Arrastrá canciones para cambiar el orden o soltalas encima de un puesto para reemplazarlo. También podés tocar un puesto de tu lista para reemplazarlo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPresetsBar((prev) => !prev)}
              className={`px-3 py-1.5 text-xs font-semibold rounded border flex items-center gap-1.5 cursor-pointer transition-colors ${
                showPresetsBar
                  ? 'bg-[#2b1f14] text-[#f59e0b] border-[#f59e0b]'
                  : 'sketch-card hover:bg-[#2c211c] text-[#d6c9b8]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span>Shows Históricos</span>
            </button>

            {setlist.length < 36 && (
              <button
                type="button"
                onClick={onAutoFill36}
                className="px-3 py-1.5 text-xs font-semibold bg-[#291811] hover:bg-[#382117] text-[#f59e0b] border border-[#f59e0b]/50 rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Completar {36 - setlist.length}</span>
              </button>
            )}

            {setlist.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setReplacingSlotIndex(null);
                  onClearSetlist();
                }}
                className="px-2.5 py-1.5 text-xs font-medium text-[#f87171] hover:bg-[#2a1615] border border-[#4a2320] rounded cursor-pointer whitespace-nowrap"
              >
                Vaciar
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold bg-[#b91c1c] hover:bg-[#dc2626] text-white rounded flex items-center gap-1.5 cursor-pointer"
            >
              <span>Listo</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Optional Collapsible Bar: Quick Preset Banquetes */}
        {showPresetsBar && (
          <div className="px-4 py-2 bg-[#1b1410] border-b border-[#3a2c24] flex flex-wrap items-center justify-between gap-2 shrink-0">
            <span className="text-xs font-mono text-[#f59e0b]">
              CARGAR UN BANQUETE COMPLETO DE 36 TEMAS:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_BANQUETES.map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => {
                    setReplacingSlotIndex(null);
                    onLoadPreset(preset.songIds);
                    setShowPresetsBar(false);
                  }}
                  className="px-3 py-1 text-xs font-semibold bg-[#261a14] hover:bg-[#b91c1c] text-[#f5efe2] border border-[#544034] rounded cursor-pointer transition-colors"
                >
                  ★ {preset.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Replace Mode Banner across top when a setlist song is selected for replacement */}
        {replacingTargetSong && replacingSlotIndex !== null && (
          <div className="px-4 py-2 bg-[#2b1c0e] border-b-2 border-[#f59e0b] flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-[#f59e0b] text-black shrink-0 flex items-center gap-1">
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>MODO REEMPLAZO · PUESTO #{String(replacingSlotIndex + 1).padStart(2, '0')}</span>
              </span>
              <p className="text-xs text-[#f5efe2] truncate">
                Vas a cambiar <strong className="text-[#fbbf24]">"{replacingTargetSong.title}"</strong> por la canción que elijas en el catálogo de la izquierda.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReplacingSlotIndex(null)}
              className="px-2.5 py-1 text-xs font-bold bg-[#140f0d] hover:bg-[#2c211c] text-[#fbbf24] border border-[#f59e0b]/50 rounded flex items-center gap-1 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancelar selección</span>
            </button>
          </div>
        )}

        {/* Mobile/Small Screen Switcher between Catalog & Setlist */}
        <div className="flex md:hidden border-b border-[#2e231e] bg-[#16110f] shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('catalog')}
            className={`flex-1 py-2 text-xs font-bold border-b-2 cursor-pointer ${
              mobileTab === 'catalog'
                ? 'border-[#f59e0b] text-[#f59e0b] bg-[#211713]'
                : 'border-transparent text-[#a89984]'
            }`}
          >
            {isShowingSongsView
              ? `Canciones (${filteredSongs.length})`
              : `Portadas de Discos (${LA_RENGA_ALBUMS.length})`}
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('setlist')}
            className={`flex-1 py-2 text-xs font-bold border-b-2 cursor-pointer ${
              mobileTab === 'setlist'
                ? 'border-[#ef4444] text-[#ef4444] bg-[#211713]'
                : 'border-transparent text-[#a89984]'
            }`}
          >
            Tu Lista ({setlist.length}/36)
          </button>
        </div>

        {/* ====================================================================
            2. MAIN 2-COLUMN WORKSPACE (min-h-0 guarantees smooth inner scrolling)
           ==================================================================== */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* LEFT COLUMN (7 cols): BATEA DE PORTADAS GRANDES or INTERIOR DEL DISCO */}
          <div
            className={`md:col-span-7 h-full min-h-0 border-r border-[#2e231e] flex flex-col overflow-hidden bg-[#120e0c] ${
              mobileTab === 'setlist' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Top Navigation & Search Bar */}
            <div className="p-3 border-b border-[#261d19] bg-[#16110f] space-y-2.5 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Toggle between Large Album Covers ("Batea") and All Songs */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleReturnToBatea}
                    className={`px-3 py-1.5 text-xs font-bold rounded border flex items-center gap-1.5 cursor-pointer transition-colors ${
                      !isShowingSongsView
                        ? 'bg-[#b91c1c] text-white border-[#ef4444]'
                        : 'bg-[#221712] hover:bg-[#2e2019] text-[#fbbf24] border-[#f59e0b]/50'
                    }`}
                  >
                    <Disc className="w-4 h-4" />
                    <span>
                      {isShowingSongsView
                        ? '← Volver a las Portadas'
                        : 'Portadas Grandes (11 Discos)'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectAlbum('ALL');
                      setBrowseStage('songs');
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded border flex items-center gap-1.5 cursor-pointer transition-colors ${
                      isShowingSongsView && selectedAlbum === 'ALL'
                        ? 'bg-[#2b1814] text-[#fbbf24] border-[#f59e0b]'
                        : 'bg-[#0d0a09] text-[#c5b8a5] border-[#2c221d] hover:text-white'
                    }`}
                  >
                    <Music className="w-3.5 h-3.5 text-[#f59e0b]" />
                    <span>Ver Todos los Temas ({catalogSongs.length})</span>
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-[#8c7c68] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.trim().length > 0) {
                        setBrowseStage('songs');
                      }
                    }}
                    placeholder="Buscar canción en todos los discos..."
                    className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#0d0a09] border border-[#3a2c24] rounded text-[#f5efe2] placeholder-[#756756] focus:outline-none focus:border-[#f59e0b]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8c7c68] hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Bar (Shown when inside an album or browsing songs) */}
              {isShowingSongsView && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#241b17]">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEnergy('ALL');
                        setSpecialFilter('ALL');
                      }}
                      className={`px-2.5 py-1 text-xs font-semibold rounded border cursor-pointer whitespace-nowrap transition-colors ${
                        selectedEnergy === 'ALL' && specialFilter === 'ALL'
                          ? 'bg-[#b91c1c] text-white border-[#ef4444]'
                          : 'bg-[#0d0a09] text-[#c5b8a5] border-[#2c221d] hover:text-white'
                      }`}
                    >
                      Todas ({filteredSongs.length})
                    </button>

                    {(
                      ['pogo', 'himno', 'rock', 'balada', 'oculto'] as SongEnergy[]
                    ).map((en) => {
                      const meta = ENERGY_META[en];
                      const isSelected = selectedEnergy === en;
                      return (
                        <button
                          type="button"
                          key={en}
                          onClick={() =>
                            setSelectedEnergy(isSelected ? 'ALL' : en)
                          }
                          className={`px-2.5 py-1 text-xs font-semibold rounded border flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                            isSelected
                              ? `${meta.bgClass} ${meta.textClass} border-current`
                              : 'bg-[#0d0a09] text-[#a89984] border-[#2c221d] hover:text-white'
                          }`}
                        >
                          <span className={meta.textClass}>
                            {renderEnergyIcon(en, 'w-3.5 h-3.5')}
                          </span>
                          <span>{meta.shortLabel}</span>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() =>
                        setSpecialFilter(
                          specialFilter === 'OPENERS' ? 'ALL' : 'OPENERS'
                        )
                      }
                      className={`px-2.5 py-1 text-xs font-semibold rounded border flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors ${
                        specialFilter === 'OPENERS'
                          ? 'bg-[#2b1f14] text-[#fbbf24] border-[#f59e0b]'
                          : 'bg-[#0d0a09] text-[#a89984] border-[#2c221d] hover:text-white'
                      }`}
                    >
                      <Target className="w-3 h-3 text-[#f59e0b]" />
                      <span>Apertura #01</span>
                    </button>
                  </div>

                  <div className="flex items-center bg-[#0d0a09] p-0.5 rounded border border-[#2c221d] shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`p-1 rounded cursor-pointer ${
                        viewMode === 'grid'
                          ? 'bg-[#2b1814] text-[#f59e0b]'
                          : 'text-[#8c7c68] hover:text-white'
                      }`}
                      title="Vista de tarjetas"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('compact')}
                      className={`p-1 rounded cursor-pointer ${
                        viewMode === 'compact'
                          ? 'bg-[#2b1814] text-[#f59e0b]'
                          : 'text-[#8c7c68] hover:text-white'
                      }`}
                      title="Vista de lista"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ================================================================
                SCROLLABLE CONTENT AREA:
                - Mode A: BATEA DE DISCOS CON PORTADAS GRANDES
                - Mode B: ADENTRO DEL DISCO SELECCIONADO (O CATÁLOGO FILTRADO)
               ================================================================ */}
            <div
              ref={catalogScrollRef}
              className="flex-1 min-h-0 overflow-y-auto p-3.5"
            >
              {!isShowingSongsView ? (
                /* ------------------------------------------------------------
                   MODE A: PORTADAS GRANDES DE LOS 11 DISCOS DE LA RENGA
                   ------------------------------------------------------------ */
                <div className="space-y-3 pb-4">
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <h3 className="text-base md:text-lg font-rock tracking-wide text-[#fbbf24]">
                        {replacingTargetSong
                          ? `Elegí un Disco para buscar el reemplazo del Puesto #${String((replacingSlotIndex ?? 0) + 1).padStart(2, '0')}`
                          : 'Seleccioná un Disco para Meterte en su Lista de Temas'}
                      </h3>
                      <p className="text-xs text-[#a89984]">
                        Cada portada te abre todos los temas de ese álbum en orden original.
                      </p>
                    </div>
                    <span className="text-xs font-mono text-[#c5b8a5] hidden sm:inline">
                      11 Discos Oficiales · {catalogSongs.length} Temas
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                    {LA_RENGA_ALBUMS.map((alb) => {
                      const countInSetlist = albumCountsInSetlist[alb.name] || 0;
                      const totalInAlbum = totalSongsByAlbum[alb.name] || 0;

                      return (
                        <button
                          type="button"
                          key={alb.name}
                          onClick={() => handleEnterAlbum(alb.name)}
                          className="group rounded-md p-2.5 border-2 border-[#33261f] hover:border-[#f59e0b] bg-[#18120f] hover:bg-[#221914] text-left transition-all cursor-pointer flex flex-col justify-between shadow-md"
                        >
                          <div>
                            {/* Large Square Album Artwork */}
                            <div className="relative w-full aspect-square rounded overflow-hidden border border-[#090706] mb-2.5 bg-[#0d0a09]">
                              <img
                                src={albumCoverMap[alb.name]}
                                alt={alb.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {/* Year Tag */}
                              <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 text-[11px] font-mono font-bold rounded bg-black/85 text-[#f5efe2] border border-[#4a382d]">
                                {alb.year}
                              </span>
                              {/* Added Songs Counter Badge */}
                              {countInSetlist > 0 && (
                                <span className="absolute top-1.5 right-1.5 px-2 py-0.5 text-[11px] font-mono font-bold rounded bg-[#15803d] text-white border border-[#4ade80] shadow">
                                  ✓ {countInSetlist}/{totalInAlbum}
                                </span>
                              )}
                            </div>

                            {/* Album Title & Motif */}
                            <div className="text-sm font-bold text-[#f5efe2] group-hover:text-[#fbbf24] leading-snug line-clamp-1">
                              {alb.name}
                            </div>
                            <div className="text-[11px] text-[#9c8c79] line-clamp-1 mt-0.5">
                              {alb.coverMotif}
                            </div>
                          </div>

                          {/* Call to action footer */}
                          <div className="mt-2.5 pt-2 border-t border-[#2b201a] flex items-center justify-between text-[11px] font-mono">
                            <span className="text-[#c5b8a5]">
                              {totalInAlbum} canciones
                            </span>
                            <span className="text-[#f59e0b] group-hover:translate-x-0.5 transition-transform font-sans font-bold">
                              Abrir disco →
                            </span>
                          </div>
                        </button>
                      );
                    })}

                    {/* 12th Card: Ver Todo el Catálogo Junto */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectAlbum('ALL');
                        setBrowseStage('songs');
                      }}
                      className="group rounded-md p-3 border-2 border-dashed border-[#4a382d] hover:border-[#ef4444] bg-[#15100d] hover:bg-[#211613] text-left transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="w-full aspect-square rounded bg-[#1d1512] border border-[#3a2c24] mb-2.5 flex flex-col items-center justify-center p-4 text-center">
                        <Disc className="w-12 h-12 text-[#ef4444] group-hover:rotate-45 transition-transform duration-300 mb-2" />
                        <span className="text-sm font-rock tracking-wide text-[#f5efe2]">
                          CATÁLOGO COMPLETO
                        </span>
                        <span className="text-[11px] font-mono text-[#f59e0b] mt-1">
                          {catalogSongs.length} temas disponibles
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#f5efe2] group-hover:text-[#f87171]">
                          Todos los Discos Juntos
                        </div>
                        <div className="text-[11px] text-[#9c8c79] mt-0.5">
                          Explorá toda la discografía
                        </div>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-[#2b201a] flex items-center justify-between text-[11px] font-mono">
                        <span className="text-[#c5b8a5]">1991 – 2024</span>
                        <span className="text-[#ef4444] font-sans font-bold">
                          Ver todos →
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                /* ------------------------------------------------------------
                   MODE B: ADENTRO DEL DISCO SELECCIONADO (HEADER + CANCIONES)
                   ------------------------------------------------------------ */
                <div className="space-y-3 pb-4">
                  {/* Rich Album Hero Card when inside a specific album */}
                  {activeAlbumMeta && (
                    <div className="rounded-md p-3.5 bg-[#1e1511] border-2 border-[#f59e0b]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={albumCoverMap[activeAlbumMeta.name]}
                          alt={activeAlbumMeta.name}
                          referrerPolicy="no-referrer"
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded object-cover border-2 border-[#f59e0b] shrink-0 shadow-lg"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-[#b91c1c] text-white">
                              DISCO ABIERTO · {activeAlbumMeta.year}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#120d0b] text-[#fbbf24] border border-[#4a382d]">
                              {albumCountsInSetlist[activeAlbumMeta.name] || 0} /{' '}
                              {totalSongsByAlbum[activeAlbumMeta.name] || 0} en tu
                              lista
                            </span>
                          </div>

                          <h3 className="text-xl sm:text-2xl font-rock tracking-wide text-[#f5efe2] mt-1 truncate">
                            {activeAlbumMeta.name}
                          </h3>
                          <p className="text-xs text-[#c5b8a5]">
                            {replacingTargetSong
                              ? `Hacé clic o arrastrá cualquier tema de abajo para reemplazar el puesto #${String((replacingSlotIndex ?? 0) + 1).padStart(2, '0')} ("${replacingTargetSong.title}").`
                              : `Arte: ${activeAlbumMeta.coverMotif} · Hacé clic para sumar o arrastrá un tema sobre cualquier puesto de tu lista a la derecha.`}
                          </p>
                        </div>
                      </div>

                      {/* Album Navigation & Quick Actions */}
                      <div className="flex flex-wrap sm:flex-col items-stretch sm:items-end gap-1.5 w-full sm:w-auto shrink-0">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCycleAlbum(-1)}
                            title="Ir al disco anterior"
                            className="px-2 py-1 text-xs font-semibold bg-[#120d0b] hover:bg-[#2c211c] text-[#d6c9b8] border border-[#4a382d] rounded flex items-center gap-1 cursor-pointer"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Anterior</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCycleAlbum(1)}
                            title="Ir al siguiente disco"
                            className="px-2 py-1 text-xs font-semibold bg-[#120d0b] hover:bg-[#2c211c] text-[#d6c9b8] border border-[#4a382d] rounded flex items-center gap-1 cursor-pointer"
                          >
                            <span>Siguiente</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {setlist.length < 36 && replacingSlotIndex === null && (
                          <button
                            type="button"
                            onClick={() =>
                              handleAddHighlightsFromAlbum(activeAlbumMeta.name)
                            }
                            className="px-2.5 py-1 text-xs font-semibold bg-[#2b1814] hover:bg-[#b91c1c] text-[#fbbf24] hover:text-white border border-[#f59e0b]/50 rounded flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Sumar 3 Clásicos del Disco</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={handleReturnToBatea}
                          className="px-2.5 py-1 text-xs font-bold bg-[#140f0d] hover:bg-[#2c211c] text-[#f59e0b] border border-[#544034] rounded flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Volver a las Portadas</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Songs List inside the Album */}
                  {filteredSongs.length === 0 ? (
                    <div className="h-60 flex flex-col items-center justify-center text-center p-8 text-[#8c7c68]">
                      <Music className="w-10 h-10 mb-2 stroke-1 text-[#f59e0b]" />
                      <p className="text-sm font-semibold text-[#f5efe2]">
                        No hay canciones con ese filtro en esta vista
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEnergy('ALL');
                          setSpecialFilter('ALL');
                          setSearchQuery('');
                        }}
                        className="mt-3 px-3 py-1.5 text-xs font-semibold bg-[#2b1814] text-[#f59e0b] border border-[#f59e0b]/40 rounded cursor-pointer"
                      >
                        Mostrar todos los temas del disco
                      </button>
                    </div>
                  ) : (
                    <div
                      className={
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 sm:grid-cols-2 gap-2.5'
                          : 'space-y-1.5'
                      }
                    >
                      {filteredSongs.map((song) => {
                        const slotNum = setlistSlotMap.get(song.id);
                        const isAdded = slotNum !== undefined;
                        const isReplacingMode = replacingSlotIndex !== null;
                        const isSameAsTarget =
                          isReplacingMode &&
                          replacingTargetSong?.id === song.id;
                        const isCatalogSelected =
                          selectedCatalogSongId === song.id;
                        const isFull =
                          !isReplacingMode && setlist.length >= 36 && !isAdded;
                        const meta = ENERGY_META[song.energy];
                        const trackNum = albumTrackNumberMap.get(song.id) || 1;
                        const isBeingDragged = draggedCatalogSong?.id === song.id;

                        return (
                          <div
                            key={song.id}
                            draggable
                            onDragStart={(e) => {
                              setSelectedCatalogSongId(song.id);
                              setDraggedCatalogSong(song);
                              setDraggedSetlistIndex(null);
                              e.dataTransfer.effectAllowed = 'copyMove';
                              e.dataTransfer.setData('text/plain', song.id);
                            }}
                            onDragEnd={clearDragStates}
                            onClick={() => {
                              // Single selection: clicking a song selects ONLY this one and deselects the previous one
                              setSelectedCatalogSongId((prev) =>
                                prev === song.id ? null : song.id
                              );
                            }}
                            title="Tocá para seleccionar este tema, usá el botón Sumar/Reemplazar o arrastralo hacia tu lista a la derecha"
                            style={{
                              borderLeftWidth: '4px',
                              borderLeftColor: isCatalogSelected
                                ? '#fbbf24'
                                : isReplacingMode
                                ? '#f59e0b'
                                : isAdded
                                ? '#22c55e'
                                : meta.borderHex,
                            }}
                            className={`group relative rounded p-2.5 border transition-all flex items-center justify-between gap-3 ${
                              isBeingDragged
                                ? 'opacity-60 border-[#f59e0b] ring-2 ring-[#f59e0b]'
                                : isCatalogSelected
                                ? 'bg-[#2c1d11] border-[#fbbf24] ring-1 ring-[#fbbf24] cursor-grab active:cursor-grabbing'
                                : isSameAsTarget
                                ? 'bg-[#2c1d11] border-[#f59e0b] ring-1 ring-[#f59e0b] cursor-grab active:cursor-grabbing'
                                : isReplacingMode
                                ? 'bg-[#1b140f] hover:bg-[#2b1f14] border-[#f59e0b]/50 hover:border-[#f59e0b] cursor-grab active:cursor-grabbing'
                                : isAdded
                                ? 'bg-[#162319] border-[#22c55e]/60 cursor-grab active:cursor-grabbing'
                                : isFull
                                ? 'bg-[#161210] border-[#261d19] opacity-65 cursor-grab active:cursor-grabbing'
                                : 'bg-[#181310] hover:bg-[#221a15] border-[#332720] hover:border-[#6e5546] cursor-grab active:cursor-grabbing'
                            }`}
                          >
                            {/* Left: Track Number / Cover Art + Song Info */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="relative w-12 h-12 rounded overflow-hidden border border-[#090706] shrink-0">
                                <img
                                  src={albumCoverMap[song.album]}
                                  alt={song.album}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover pointer-events-none"
                                />
                                <span className="absolute top-0 left-0 px-1.5 py-0.2 text-[10px] font-mono font-bold bg-black/85 text-[#fbbf24] rounded-br">
                                  {String(trackNum).padStart(2, '0')}
                                </span>
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-bold text-[#f5efe2] truncate">
                                    {song.title}
                                  </span>
                                  {isCatalogSelected && (
                                    <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-[#fbbf24] text-black shrink-0">
                                      SELECCIONADO
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] text-[#a89984] truncate mt-0.5">
                                  Pista #{String(trackNum).padStart(2, '0')} ·{' '}
                                  {song.album} ({song.year})
                                </div>

                                {/* Visual Badges Row */}
                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                  <span
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded border ${meta.badgeBg}`}
                                  >
                                    {renderEnergyIcon(
                                      song.energy,
                                      'w-2.5 h-2.5'
                                    )}
                                    <span>{meta.shortLabel}</span>
                                  </span>

                                  <span className="text-[10px] font-mono tabular-nums text-[#8c7c68]">
                                    {song.duration} · {song.tempoBpm} BPM
                                  </span>

                                  {song.isIdealOpener && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-[#d97706]/20 text-[#fbbf24] border border-[#f59e0b]/40">
                                      🎯 Apertura #01
                                    </span>
                                  )}

                                  {song.isIdealCloser && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-[#dc2626]/25 text-[#fca5a5] border border-[#ef4444]/40">
                                      🏁 Cierre #36
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right Action Buttons: Reemplazar vs Sumar / En Lista */}
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              {isReplacingMode ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (replacingSlotIndex === null) return;
                                    if (isSameAsTarget) {
                                      setReplacingSlotIndex(null);
                                    } else {
                                      onReplaceSong(replacingSlotIndex, song);
                                      setReplacingSlotIndex(null);
                                      setSelectedCatalogSongId(song.id);
                                      if (window.innerWidth < 768) {
                                        setMobileTab('setlist');
                                      }
                                    }
                                  }}
                                  className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 shadow cursor-pointer ${
                                    isSameAsTarget
                                      ? 'bg-[#3a2a18] text-[#fbbf24] border border-[#f59e0b]'
                                      : 'bg-[#f59e0b] hover:bg-[#fbbf24] text-black'
                                  }`}
                                >
                                  <ArrowLeftRight className="w-3.5 h-3.5" />
                                  <span>
                                    {isSameAsTarget
                                      ? 'Actual'
                                      : isAdded
                                      ? `Reemplazar (#${String(slotNum).padStart(2, '0')})`
                                      : 'Reemplazar'}
                                  </span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isFull && !isAdded}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCatalogSongId(song.id);
                                    if (isAdded) {
                                      onRemoveSong(song.id);
                                    } else if (!isFull) {
                                      onAddSong(song);
                                    }
                                  }}
                                  className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 cursor-pointer ${
                                    isAdded
                                      ? 'bg-[#15803d] hover:bg-[#dc2626] text-white'
                                      : isFull
                                      ? 'bg-[#261e1a] text-[#9c8c79] cursor-not-allowed'
                                      : 'bg-[#b91c1c] hover:bg-[#dc2626] text-white'
                                  }`}
                                >
                                  {isAdded ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>
                                        #{String(slotNum).padStart(2, '0')}
                                      </span>
                                    </>
                                  ) : isFull ? (
                                    <span>36/36 (Tocá lista p/ cambiar)</span>
                                  ) : (
                                    <>
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Sumar</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (5 cols): VISUAL SETLIST BOARD & DRAG-AND-DROP */}
          <div
            className={`md:col-span-5 h-full min-h-0 flex flex-col overflow-hidden bg-[#0f0b09] ${
              mobileTab === 'catalog' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Visual Setlist Summary & Energy Breakdown */}
            <div className="p-3 border-b border-[#261d19] bg-[#16110f] space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#f5efe2] flex items-center gap-2">
                    <span>Tu Lista en Orden ({setlist.length} / 36)</span>
                    <span className="text-xs font-mono text-[#f59e0b]">
                      · {scoreResult.totalScore.toLocaleString('es-AR')} PTS
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#9c8c79] font-mono">
                    Arrastrá <span className="text-[#4ade80]">entre medio</span> para agregar, o <span className="text-[#fbbf24]">encima</span> de un tema para reemplazarlo
                  </p>
                </div>

                {/* Ritual Status Indicators */}
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono rounded border ${
                      hasIdealOpenerAtFirst
                        ? 'bg-[#162319] text-[#4ade80] border-[#22c55e]/40'
                        : 'bg-[#1d1512] text-[#a89984] border-[#3a2c24]'
                    }`}
                  >
                    {hasIdealOpenerAtFirst ? '✓ Apertura #01' : '○ Apertura #01'}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono rounded border ${
                      hasHablandoAtEnd
                        ? 'bg-[#162319] text-[#4ade80] border-[#22c55e]/40'
                        : 'bg-[#1d1512] text-[#a89984] border-[#3a2c24]'
                    }`}
                  >
                    {hasHablandoAtEnd ? '✓ Cierre Ritual' : '○ Cierre Ritual'}
                  </span>
                </div>
              </div>

              {/* Mini Energy Distribution Bar */}
              <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                {(
                  ['pogo', 'himno', 'rock', 'balada', 'oculto'] as SongEnergy[]
                ).map((en) => {
                  const meta = ENERGY_META[en];
                  return (
                    <div
                      key={en}
                      className="px-2 py-1 rounded bg-[#110d0b] border border-[#261d19] flex items-center justify-between text-[11px]"
                    >
                      <span className={`font-semibold ${meta.textClass}`}>
                        {meta.shortLabel}
                      </span>
                      <span className="font-mono font-bold text-[#f5efe2]">
                        {energyCounts[en]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ordered Setlist Items (Scrollable + Drag & Drop Target!) */}
            <div
              onDragOver={(e) => {
                if (draggedCatalogSong) {
                  e.preventDefault();
                }
              }}
              onDrop={(e) => {
                // If dropped in empty container area (not on a specific slot), append at the end
                if (draggedCatalogSong && dragOverSlotIndex === null) {
                  e.preventDefault();
                  onInsertSongAt(setlist.length, draggedCatalogSong);
                  clearDragStates();
                }
              }}
              className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1.5"
            >
              {setlist.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8c7c68] border-2 border-dashed border-[#2c221d] rounded">
                  <Disc className="w-12 h-12 mb-3 stroke-1 text-[#f59e0b]" />
                  <p className="text-base font-rock tracking-wide text-[#f5efe2]">
                    Tu lista del Banquete está esperando el primer tema
                  </p>
                  <p className="text-xs mt-1 max-w-xs text-[#a89984]">
                    Entrá a cualquiera de las portadas grandes a la izquierda y hacé clic o arrastrá canciones hacia acá.
                  </p>
                  <button
                    type="button"
                    onClick={onAutoFill36}
                    className="mt-4 px-4 py-2 text-xs font-semibold bg-[#b91c1c] hover:bg-[#dc2626] text-white rounded flex items-center gap-1.5 cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Armar 36 Canciones Automáticamente</span>
                  </button>
                </div>
              ) : (
                setlist.map((song, idx) => {
                  const meta = ENERGY_META[song.energy];
                  const isOpenerSlot = idx === 0;
                  const isCloserSlot =
                    idx === 35 ||
                    (idx === setlist.length - 1 && song.isIdealCloser);
                  const isSelectedForReplace = replacingSlotIndex === idx;
                  const isBeingDragged = draggedSetlistIndex === idx;
                  const isDropTarget = dragOverSlotIndex === idx;
                  const showInsertBefore =
                    isDropTarget && dragOverMode === 'before';
                  const showInsertAfter =
                    isDropTarget && dragOverMode === 'after';
                  const showReplaceCenter =
                    isDropTarget && dragOverMode === 'replace';

                  const executeDropAction = (
                    mode: 'before' | 'replace' | 'after'
                  ) => {
                    if (draggedCatalogSong) {
                      if (mode === 'before') {
                        onInsertSongAt(idx, draggedCatalogSong);
                      } else if (mode === 'after') {
                        onInsertSongAt(idx + 1, draggedCatalogSong);
                      } else {
                        onReplaceSong(idx, draggedCatalogSong);
                      }
                      setReplacingSlotIndex(null);
                    } else if (
                      draggedSetlistIndex !== null &&
                      draggedSetlistIndex !== idx
                    ) {
                      let targetIndex = idx;
                      if (mode === 'before') {
                        targetIndex =
                          draggedSetlistIndex < idx ? idx - 1 : idx;
                      } else if (mode === 'after') {
                        targetIndex =
                          draggedSetlistIndex < idx ? idx : idx + 1;
                      }
                      targetIndex = Math.max(
                        0,
                        Math.min(setlist.length - 1, targetIndex)
                      );
                      if (targetIndex !== draggedSetlistIndex) {
                        onReorderSong(draggedSetlistIndex, targetIndex);
                        if (replacingSlotIndex === draggedSetlistIndex) {
                          setReplacingSlotIndex(targetIndex);
                        }
                      }
                    }
                    clearDragStates();
                  };

                  return (
                    <div key={`${song.id}-${idx}`} className="space-y-1">
                      {/* Visual Insertion Bar BEFORE this song when dragging in between */}
                      {showInsertBefore && (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            executeDropAction('before');
                          }}
                          className="px-3 py-1.5 rounded bg-[#14331d] border-2 border-dashed border-[#4ade80] text-[#4ade80] text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>
                            {draggedCatalogSong
                              ? `SOLTAR ENTRE MEDIO PARA AGREGAR EN EL PUESTO #${String(idx + 1).padStart(2, '0')} (SIN REEMPLAZAR)`
                              : `MOVER AL PUESTO #${String(idx + 1).padStart(2, '0')}`}
                          </span>
                        </div>
                      )}

                      <div
                        draggable
                        onDragStart={(e) => {
                          setDraggedSetlistIndex(idx);
                          setDraggedCatalogSong(null);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', String(idx));
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const relY =
                            (e.clientY - rect.top) / Math.max(1, rect.height);
                          let nextMode: 'before' | 'replace' | 'after' =
                            'replace';
                          if (relY < 0.28) {
                            nextMode = 'before';
                          } else if (relY > 0.72) {
                            nextMode = 'after';
                          } else {
                            nextMode = 'replace';
                          }
                          if (
                            dragOverSlotIndex !== idx ||
                            dragOverMode !== nextMode
                          ) {
                            setDragOverSlotIndex(idx);
                            setDragOverMode(nextMode);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          executeDropAction(dragOverMode || 'replace');
                        }}
                        onDragEnd={clearDragStates}
                        onClick={() => {
                          const nextSlot = isSelectedForReplace ? null : idx;
                          setReplacingSlotIndex(nextSlot);
                          if (nextSlot !== null && window.innerWidth < 768) {
                            setMobileTab('catalog');
                          }
                        }}
                        style={{
                          borderLeftWidth: '3px',
                          borderLeftColor:
                            isSelectedForReplace || showReplaceCenter
                              ? '#f59e0b'
                              : showInsertBefore || showInsertAfter
                              ? '#4ade80'
                              : meta.borderHex,
                        }}
                        className={`flex items-center justify-between gap-2 px-2 py-2 rounded border transition-all cursor-grab active:cursor-grabbing ${
                          isBeingDragged
                            ? 'opacity-40 border-dashed border-[#f59e0b]'
                            : showReplaceCenter
                            ? 'bg-[#362210] border-[#f59e0b] ring-2 ring-[#f59e0b]'
                            : isSelectedForReplace
                            ? 'bg-[#2c1d11] border-[#f59e0b] ring-1 ring-[#f59e0b]'
                            : isOpenerSlot
                            ? 'bg-[#221811] border-[#f59e0b]/50 hover:border-[#f59e0b]'
                            : isCloserSlot
                            ? 'bg-[#241313] border-[#ef4444]/50 hover:border-[#ef4444]'
                            : 'bg-[#17120f] border-[#2c221d] hover:border-[#6e5546]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {/* Drag Grip Handle */}
                          <GripVertical className="w-4 h-4 text-[#786856] shrink-0" />

                          <span
                            className={`text-xs font-mono tabular-nums font-bold px-1.5 py-0.5 rounded shrink-0 ${
                              isSelectedForReplace || showReplaceCenter
                                ? 'bg-[#f59e0b] text-black'
                                : isOpenerSlot
                                ? 'bg-[#d97706] text-black'
                                : idx === 35
                                ? 'bg-[#dc2626] text-white'
                                : 'bg-[#0d0a09] text-[#a89984]'
                            }`}
                          >
                            #{String(idx + 1).padStart(2, '0')}
                          </span>

                          <img
                            src={albumCoverMap[song.album]}
                            alt={song.album}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded object-cover border border-[#090706] shrink-0 pointer-events-none"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-[#f5efe2] truncate">
                                {song.title}
                              </p>
                              {showReplaceCenter && draggedCatalogSong && (
                                <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded bg-[#f59e0b] text-black shrink-0">
                                  ⇄ REEMPLAZAR ESTE TEMA
                                </span>
                              )}
                              {showReplaceCenter &&
                                draggedSetlistIndex !== null && (
                                  <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded bg-[#f59e0b] text-black shrink-0">
                                    MOVER ACÁ
                                  </span>
                                )}
                              {!showReplaceCenter && isSelectedForReplace && (
                                <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded bg-[#f59e0b] text-black shrink-0">
                                  ELEGÍ REEMPLAZO
                                </span>
                              )}
                              {!showReplaceCenter &&
                                !isSelectedForReplace &&
                                isOpenerSlot && (
                                  <span className="text-[10px] font-mono font-bold text-[#fbbf24] shrink-0">
                                    · APERTURA
                                  </span>
                                )}
                              {!showReplaceCenter &&
                                !isSelectedForReplace &&
                                idx === 35 && (
                                  <span className="text-[10px] font-mono font-bold text-[#f87171] shrink-0">
                                    · CIERRE #36
                                  </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-[#9c8c79] truncate">
                              <span className={meta.textClass}>
                                {meta.shortLabel}
                              </span>
                              <span>·</span>
                              <span className="truncate">{song.album}</span>
                              <span>·</span>
                              <span className="font-mono">{song.duration}</span>
                            </div>
                          </div>
                        </div>

                        <div
                          className="flex items-center gap-1 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {idx > 0 &&
                            song.isIdealOpener &&
                            !isSelectedForReplace && (
                              <button
                                type="button"
                                onClick={() => onPromoteToOpener(idx)}
                                title="Mandar al puesto #01 de Apertura"
                                className="px-1.5 py-0.5 text-[10px] font-mono bg-[#2b1f14] hover:bg-[#d97706] text-[#fbbf24] hover:text-black rounded border border-[#f59e0b]/40 cursor-pointer"
                              >
                                Al #01
                              </button>
                            )}
                          <button
                            type="button"
                            onClick={() => onMoveSong(idx, -1)}
                            disabled={idx === 0}
                            title="Subir un lugar"
                            className="p-2 sm:p-1 text-[#8c7c68] hover:text-white disabled:opacity-25 cursor-pointer"
                          >
                            <ArrowUp className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onMoveSong(idx, 1)}
                            disabled={idx === setlist.length - 1}
                            title="Bajar un lugar"
                            className="p-2 sm:p-1 text-[#8c7c68] hover:text-white disabled:opacity-25 cursor-pointer"
                          >
                            <ArrowDown className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (isSelectedForReplace)
                                setReplacingSlotIndex(null);
                              onRemoveSong(song.id);
                            }}
                            title="Quitar de la lista"
                            className="p-2 sm:p-1 text-[#8c7c68] hover:text-[#ef4444] cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Visual Insertion Bar AFTER this song when dragging in between */}
                      {showInsertAfter && (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            executeDropAction('after');
                          }}
                          className="px-3 py-1.5 rounded bg-[#14331d] border-2 border-dashed border-[#4ade80] text-[#4ade80] text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>
                            {draggedCatalogSong
                              ? `SOLTAR ENTRE MEDIO PARA AGREGAR EN EL PUESTO #${String(idx + 2).padStart(2, '0')} (SIN REEMPLAZAR)`
                              : `MOVER AL PUESTO #${String(idx + 2).padStart(2, '0')}`}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
