// src/components/BanqueteInAppPlayer.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Maximize2,
  Minimize2,
  Music,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  X,
  Disc,
} from 'lucide-react';
import { LaRengaSong } from '../data/laRengaSongs';
import {
  resolveLaRengaAudioStream,
  ResolvedTrackStream,
} from '../utils/realAudioStreamResolver';
import { rockAudio } from '../utils/rockAudioEngine';

interface BanqueteInAppPlayerProps {
  setlist: LaRengaSong[];
  activeSong: LaRengaSong | null;
  albumCoverMap: Record<string, string>;
  isModalOpen: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
  onSelectActiveSong: (song: LaRengaSong) => void;
  onCopySpotifyList: () => void;
  copiedSpotify: boolean;
}

export const BanqueteInAppPlayer: React.FC<BanqueteInAppPlayerProps> = ({
  setlist,
  activeSong,
  albumCoverMap,
  isModalOpen,
  onOpenModal,
  onCloseModal,
  onSelectActiveSong,
  onCopySpotifyList,
  copiedSpotify,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.85);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(30);
  const [isLoadingStream, setIsLoadingStream] = useState<boolean>(false);
  const [resolvedStream, setResolvedStream] =
    useState<ResolvedTrackStream | null>(null);
  const [miniCollapsed, setMiniCollapsed] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Determine the current song and its index in the setlist
  const currentSong = activeSong || setlist[0] || null;
  const currentIndex = currentSong
    ? setlist.findIndex((s) => s.id === currentSong.id)
    : -1;
  const displaySlotNumber = currentIndex >= 0 ? currentIndex + 1 : 1;

  // Keep 3D stage speaker vibration synced with live playback state
  useEffect(() => {
    const activeNow = isPlaying && !isMuted && Boolean(currentSong);
    rockAudio.setLiveStreamState(activeNow, currentSong?.tempoBpm || 135);
    return () => {
      rockAudio.setLiveStreamState(false, 135);
    };
  }, [isPlaying, isMuted, currentSong]);

  // Go to next track in the setlist (#01 -> #36)
  const handleNextTrack = useCallback(
    (keepPlaying = true) => {
      if (setlist.length === 0) return;
      const nextIdx =
        currentIndex >= 0 && currentIndex + 1 < setlist.length
          ? currentIndex + 1
          : 0;
      const nextSong = setlist[nextIdx];
      if (nextSong) {
        onSelectActiveSong(nextSong);
        if (keepPlaying) {
          setIsPlaying(true);
        }
      }
    },
    [setlist, currentIndex, onSelectActiveSong]
  );

  // Go to previous track in the setlist
  const handlePrevTrack = useCallback(() => {
    if (setlist.length === 0) return;
    if (currentTime > 4 && audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    const prevIdx =
      currentIndex > 0 ? currentIndex - 1 : Math.max(0, setlist.length - 1);
    const prevSong = setlist[prevIdx];
    if (prevSong) {
      onSelectActiveSong(prevSong);
      setIsPlaying(true);
    }
  }, [setlist, currentIndex, currentTime, onSelectActiveSong]);

  // Resolve and load the real audio stream whenever currentSong changes
  useEffect(() => {
    let cancelled = false;
    if (!currentSong) {
      setResolvedStream(null);
      return;
    }

    setIsLoadingStream(true);
    setCurrentTime(0);

    resolveLaRengaAudioStream(currentSong).then((stream) => {
      if (cancelled) return;
      setResolvedStream(stream);
      setIsLoadingStream(false);

      const audio = audioRef.current;
      if (audio && stream.previewUrl) {
        if (audio.src !== stream.previewUrl) {
          audio.src = stream.previewUrl;
          audio.load();
        }
        audio.volume = isMuted ? 0 : volume;
        if (isPlaying) {
          rockAudio.connectMediaElement(audio);
          audio.play().catch(() => {
            setIsPlaying(false);
          });
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentSong?.id]);

  // Sync play/pause with the persistent <audio> element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && resolvedStream?.previewUrl) {
      rockAudio.connectMediaElement(audio);
      audio.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, resolvedStream?.previewUrl]);

  // Sync volume & mute
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const togglePlayPause = () => {
    if (!currentSong && setlist.length > 0) {
      onSelectActiveSong(setlist[0]);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  const handleSelectTrackFromQueue = (song: LaRengaSong) => {
    onSelectActiveSong(song);
    setIsPlaying(true);
  };

  const formatSec = (sec: number) => {
    const s = Math.max(0, Math.floor(sec || 0));
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return `${mins}:${String(rem).padStart(2, '0')}`;
  };

  const progressPct =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <>
      {/* PERSISTENT HTML5 AUDIO ENGINE (Never unmounts when closing modal) */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        preload="auto"
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime);
        }}
        onLoadedMetadata={(e) => {
          if (e.currentTarget.duration && isFinite(e.currentTarget.duration)) {
            setDuration(e.currentTarget.duration);
          }
        }}
        onEnded={() => {
          if (autoAdvance && setlist.length > 1) {
            handleNextTrack(true);
          } else {
            setIsPlaying(false);
          }
        }}
      />

      {/* ====================================================================
          1. FLOATING MINI-PLAYER ON THE 3D BEACH VIEWPORT
          (On mobile: docked neatly below top badge; on desktop: top-right)
         ==================================================================== */}
      {currentSong && (
        <div
          className={`absolute top-[74px] left-2.5 right-2.5 sm:left-auto sm:top-4 sm:right-6 z-20 sketch-panel rounded transition-all ${
            miniCollapsed ? 'sm:w-[275px]' : 'sm:w-[365px]'
          }`}
        >
          {/* Mini-Player Top Bar */}
          <div className="flex items-center justify-between px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#1b1411] border-b border-[#3a2c24]">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <Music
                className={`w-3.5 h-3.5 shrink-0 ${
                  isPlaying ? 'text-[#ef4444]' : 'text-[#f59e0b]'
                }`}
              />
              <span className="text-[10px] sm:text-[11px] font-mono tabular-nums text-[#f59e0b] truncate">
                {isPlaying ? 'SONANDO EN VIVO' : 'REPRODUCTOR'} · #
                {String(displaySlotNumber).padStart(2, '0')}/{setlist.length}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={onOpenModal}
                title="Abrir reproductor completo y cola de 36 temas"
                className="px-2 py-0.5 text-[10px] font-semibold bg-[#271d18] hover:bg-[#3a2b24] text-[#f5efe2] border border-[#4a382d] rounded cursor-pointer"
              >
                Ver Lista ({setlist.length})
              </button>
              <button
                type="button"
                onClick={() => setMiniCollapsed((prev) => !prev)}
                title={miniCollapsed ? 'Expandir mini reproductor' : 'Compactar'}
                className="p-1 text-[#a89984] hover:text-white cursor-pointer"
              >
                {miniCollapsed ? (
                  <Maximize2 className="w-3.5 h-3.5" />
                ) : (
                  <Minimize2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Mini-Player Body */}
          <div className="p-2 sm:p-3 space-y-2.5">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <img
                src={albumCoverMap[currentSong.album]}
                alt={currentSong.album}
                referrerPolicy="no-referrer"
                onClick={onOpenModal}
                className="w-9 h-9 sm:w-12 sm:h-12 rounded border border-[#544034] object-cover shrink-0 cursor-pointer"
              />
              <div className="min-w-0 flex-1" onClick={onOpenModal}>
                <p className="text-xs sm:text-sm font-rock tracking-wide text-[#f5efe2] truncate">
                  {currentSong.title}
                </p>
                <p className="text-[11px] sm:text-xs text-[#a89984] truncate">
                  {currentSong.album} ({currentSong.year})
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Play / Pause Primary Button */}
                <button
                  type="button"
                  onClick={togglePlayPause}
                  title={isPlaying ? 'Pausar' : 'Reproducir en vivo'}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
                    isPlaying
                      ? 'bg-[#f59e0b] text-black border-[#fbbf24]'
                      : 'bg-[#b91c1c] hover:bg-[#dc2626] text-white border-[#ef4444]'
                  }`}
                >
                  {isLoadingStream ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                {miniCollapsed && (
                  <button
                    type="button"
                    onClick={() => handleNextTrack(true)}
                    title="Siguiente canción"
                    className="w-9 h-9 rounded flex items-center justify-center text-[#c5b8a5] hover:text-white bg-[#1b1411] hover:bg-[#2a1f1a] border border-[#3a2c24] cursor-pointer shrink-0"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {!miniCollapsed && (
              <>
                {/* Interactive Scrubber Bar */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={Math.max(1, duration)}
                    step={0.1}
                    value={Math.min(currentTime, duration)}
                    onChange={(e) => {
                      const nextTime = Number(e.target.value);
                      setCurrentTime(nextTime);
                      if (audioRef.current) {
                        audioRef.current.currentTime = nextTime;
                      }
                    }}
                    className="w-full h-1.5 accent-[#ef4444] bg-[#241b17] rounded cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-[#9c8c79]">
                    <span>{formatSec(currentTime)}</span>
                    <span className="truncate max-w-[175px] text-[#c5b8a5]">
                      {resolvedStream?.sourceLabel || 'Audio Oficial (iTunes)'}
                    </span>
                    <span>{formatSec(duration)}</span>
                  </div>
                </div>

                {/* Transport Controls Row */}
                <div className="flex items-center justify-between pt-1 border-t border-[#2a201b]">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrevTrack}
                      title="Canción anterior"
                      className="p-1.5 text-[#c5b8a5] hover:text-white bg-[#1b1411] hover:bg-[#2a1f1a] border border-[#3a2c24] rounded cursor-pointer"
                    >
                      <SkipBack className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNextTrack(true)}
                      title="Siguiente canción"
                      className="p-1.5 text-[#c5b8a5] hover:text-white bg-[#1b1411] hover:bg-[#2a1f1a] border border-[#3a2c24] rounded cursor-pointer"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setAutoAdvance((prev) => !prev)}
                      title="Avanzar automáticamente del tema #01 al #36"
                      className={`px-2 py-1 text-[10px] font-mono rounded border flex items-center gap-1 cursor-pointer ${
                        autoAdvance
                          ? 'bg-[#291811] text-[#f59e0b] border-[#f59e0b]/60'
                          : 'bg-[#14100d] text-[#8c7c68] border-[#2e231d]'
                      }`}
                    >
                      <Repeat className="w-3 h-3" />
                      <span>Auto 1→36</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsMuted((prev) => !prev)}
                      title={isMuted ? 'Activar sonido' : 'Silenciar'}
                      className="p-1 text-[#a89984] hover:text-white cursor-pointer"
                    >
                      {isMuted ? (
                        <VolumeX className="w-3.5 h-3.5 text-[#ef4444]" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-[#f59e0b]" />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setIsMuted(false);
                        setVolume(Number(e.target.value));
                      }}
                      className="w-16 h-1 accent-[#f59e0b] cursor-pointer"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          2. FULL MODAL VIEW ("REPRODUCTOR DEL BANQUETE EN VIVO")
         ==================================================================== */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/80 flex items-center justify-center p-2 sm:p-4 select-none"
          role="dialog"
          aria-modal="true"
          aria-label="Reproductor In-App del Banquete"
        >
          <div className="sketch-panel rounded w-full max-w-5xl max-h-[92dvh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-[#3a2c24] bg-[#191310]">
              <div>
                <h2 className="text-lg sm:text-2xl font-rock text-[#f5efe2]">
                  Reproductor del Banquete en Vivo ({setlist.length}/36 Temas)
                </h2>
                <p className="text-[11px] sm:text-xs text-[#a89984]">
                  Escuchá los previews oficiales de tu lista de corrido: al cerrar esta ventana la música sigue sonando en la playa 3D.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onCloseModal}
                  className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold bg-[#271d18] hover:bg-[#3a2b24] text-[#f5efe2] border border-[#4a382d] rounded flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Seguir en el Escenario 3D</span>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Main 2-Column Body */}
            <div className="p-3 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 min-h-0">
              {/* Left Column (7 cols): Active Deck (Audio Oficial iTunes / Apple Music) */}
              <div className="md:col-span-7 flex flex-col gap-4">
                {currentSong ? (
                  <div className="sketch-card rounded p-5 space-y-5">
                    {/* Hero Track Display with Large Illustrated Album Art */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 bg-[#120d0b] border border-[#3a2c24] rounded p-4">
                      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded border-2 border-[#f59e0b] overflow-hidden shrink-0 bg-black">
                        <img
                          src={albumCoverMap[currentSong.album]}
                          alt={currentSong.album}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        {isPlaying && (
                          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-[#b91c1c] text-white text-[10px] font-mono font-bold rounded flex items-center gap-1">
                            <Disc className="w-3 h-3 animate-spin" />
                            <span>ON AIR</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5">
                        <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-[#271912] border border-[#4d3426] text-[11px] text-[#f59e0b] font-mono tabular-nums">
                          <span>
                            PUESTO #{String(displaySlotNumber).padStart(2, '0')} DE{' '}
                            {setlist.length}
                          </span>
                          <span>·</span>
                          <span>{currentSong.tempoBpm} BPM</span>
                        </div>

                        <h3 className="text-2xl sm:text-3xl font-rock text-[#f5efe2] truncate">
                          {currentSong.title}
                        </h3>

                        <p className="text-xs text-[#c5b8a5]">
                          Disco:{' '}
                          <strong className="text-[#f5efe2]">
                            {currentSong.album}
                          </strong>{' '}
                          ({currentSong.year}) · Duración original:{' '}
                          {currentSong.duration}
                        </p>

                        <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] font-mono text-[#a89984]">
                          <span className="px-2 py-0.5 rounded bg-[#1b1410] border border-[#33261f] text-[#fbbf24]">
                            {resolvedStream?.sourceLabel ||
                              'Cargando preview oficial...'}
                          </span>
                          <span className="text-[#4ade80]">
                            ● Torres de sonido 3D activas
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Progress & Transport Console */}
                    <div className="bg-[#110d0b] border border-[#3a2c24] rounded p-4 space-y-4">
                      {/* Visual Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="h-2 w-full bg-[#241b17] rounded overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#b91c1c] via-[#ef4444] to-[#f59e0b] transition-all duration-150"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(1, duration)}
                          step={0.1}
                          value={Math.min(currentTime, duration)}
                          onChange={(e) => {
                            const nextTime = Number(e.target.value);
                            setCurrentTime(nextTime);
                            if (audioRef.current) {
                              audioRef.current.currentTime = nextTime;
                            }
                          }}
                          className="w-full h-1.5 accent-[#ef4444] bg-transparent cursor-pointer"
                        />
                        <div className="flex justify-between text-xs font-mono tabular-nums text-[#9c8c79]">
                          <span>{formatSec(currentTime)}</span>
                          <span>Preview Oficial Apple Music / iTunes</span>
                          <span>{formatSec(duration)}</span>
                        </div>
                      </div>

                      {/* Main Console Transport Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handlePrevTrack}
                            className="px-3 py-2 text-xs font-semibold bg-[#1c1512] hover:bg-[#2a201b] text-[#f5efe2] border border-[#3f3027] rounded flex items-center gap-1.5 cursor-pointer"
                          >
                            <SkipBack className="w-4 h-4" />
                            <span>Anterior</span>
                          </button>

                          <button
                            type="button"
                            onClick={togglePlayPause}
                            className={`px-5 py-2 text-xs font-bold rounded flex items-center gap-2 cursor-pointer transition-colors ${
                              isPlaying
                                ? 'bg-[#f59e0b] text-black'
                                : 'bg-[#b91c1c] hover:bg-[#dc2626] text-white'
                            }`}
                          >
                            {isLoadingStream ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isPlaying ? (
                              <>
                                <Pause className="w-4 h-4 fill-current" />
                                <span>Pausar</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 fill-current" />
                                <span>Reproducir Ahora</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleNextTrack(true)}
                            className="px-3 py-2 text-xs font-semibold bg-[#1c1512] hover:bg-[#2a201b] text-[#f5efe2] border border-[#3f3027] rounded flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Siguiente</span>
                            <SkipForward className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setAutoAdvance((prev) => !prev)}
                          className={`px-3 py-2 text-xs font-semibold rounded border flex items-center gap-1.5 cursor-pointer ${
                            autoAdvance
                              ? 'bg-[#291811] text-[#f59e0b] border-[#f59e0b]'
                              : 'bg-[#16110e] text-[#8c7c68] border-[#2e231d]'
                          }`}
                        >
                          <Repeat className="w-3.5 h-3.5" />
                          <span>
                            {autoAdvance
                              ? 'Auto-Avance 1→36: ACTIVO'
                              : 'Auto-Avance: APAGADO'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* External Links (Spotify & YouTube External Search) */}
                    <div className="pt-2 border-t border-[#2c221d] flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-[#9c8c79]">
                        ¿Querés escuchar la versión completa fuera de la app?
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={`https://open.spotify.com/search/${encodeURIComponent(
                            `La Renga ${currentSong.title}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-semibold bg-[#1db954] hover:bg-[#1ed760] text-black rounded flex items-center gap-1.5 whitespace-nowrap shrink-0"
                        >
                          <Music className="w-3.5 h-3.5" />
                          <span>Abrir en Spotify</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                            `La Renga ${currentSong.title} en vivo`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-semibold bg-[#dc2626] hover:bg-[#ef4444] text-white rounded flex items-center gap-1.5 whitespace-nowrap shrink-0"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Ver en YouTube</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Export Full Setlist Card */}
                <div className="sketch-card rounded p-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-[#f5efe2]">
                      Exportar Lista Completa ({setlist.length} canciones)
                    </h4>
                    <p className="text-xs text-[#9c8c79]">
                      Copiá el listado numerado del #01 al #36 para pegarlo o compartirlo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onCopySpotifyList}
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

              {/* Right Column (5 cols): Interactive Setlist Queue (#01 -> #36) */}
              <div className="md:col-span-5 bg-[#0d0a09] border border-[#2e231e] rounded flex flex-col max-h-[480px] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#241b17] flex items-center justify-between text-xs font-semibold text-[#d6c9b8]">
                  <span>COLA DE REPRODUCCIÓN (1 → {setlist.length})</span>
                  <span className="font-mono text-[#f59e0b]">
                    Tocá un tema para darle Play
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-[#1e1714]">
                  {setlist.map((song, idx) => {
                    const isCurrent = currentSong?.id === song.id;
                    return (
                      <button
                        type="button"
                        key={`${song.id}-${idx}`}
                        onClick={() => handleSelectTrackFromQueue(song)}
                        className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-[#2c1a14] text-white'
                            : 'hover:bg-[#191310]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`text-xs font-mono tabular-nums px-1.5 py-0.5 rounded shrink-0 ${
                              isCurrent
                                ? 'bg-[#f59e0b] text-black font-bold'
                                : 'text-[#8c7c68]'
                            }`}
                          >
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <img
                            src={albumCoverMap[song.album]}
                            alt={song.album}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded object-cover border border-[#090706] shrink-0"
                          />
                          <div className="min-w-0">
                            <p
                              className={`text-xs font-semibold truncate ${
                                isCurrent ? 'text-[#fbbf24]' : 'text-[#f5efe2]'
                              }`}
                            >
                              {song.title}
                            </p>
                            <p className="text-[10px] text-[#8c7c68] truncate">
                              {song.album}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isCurrent && isPlaying && (
                            <span className="text-[10px] font-mono font-bold text-[#ef4444]">
                              SONANDO
                            </span>
                          )}
                          <span className="text-[11px] font-mono tabular-nums text-[#8c7c68]">
                            {song.duration}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
