// src/components/BanqueteShareModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Share2,
  Download,
  Copy,
  Check,
  MessageCircle,
  Globe,
  Sparkles,
  User,
  ExternalLink,
  X,
} from 'lucide-react';
import { LaRengaSong } from '../data/laRengaSongs';
import { BanqueteScoreResult } from '../utils/banqueteScoring';
import {
  GuestMusicianTier,
  NECOCHEA_TICKETS_OFFICIAL_URL,
} from '../data/banqueteGameData';
import {
  encodeShareBanqueteUrl,
  isSupabaseConfigured,
} from '../utils/supabaseClient';

interface BanqueteShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  setlist: LaRengaSong[];
  scoreResult: BanqueteScoreResult;
  playerAlias: string;
  banqueteTitle: string;
  activeGuestTier: GuestMusicianTier;
  onSaveProfile: (alias: string, title: string) => void;
  onPublishToGlobalRanking: (
    banqueteName: string,
    authorName: string
  ) => Promise<{ savedToSupabase: boolean }>;
}

export const BanqueteShareModal: React.FC<BanqueteShareModalProps> = ({
  isOpen,
  onClose,
  setlist,
  scoreResult,
  playerAlias,
  banqueteTitle,
  activeGuestTier,
  onSaveProfile,
  onPublishToGlobalRanking,
}) => {
  const [aliasInput, setAliasInput] = useState<string>(playerAlias);
  const [titleInput, setTitleInput] = useState<string>(banqueteTitle);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [publishedStatus, setPublishedStatus] = useState<string | null>(null);
  const [flyerDataUrl, setFlyerDataUrl] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setAliasInput(playerAlias);
    setTitleInput(banqueteTitle);
  }, [playerAlias, banqueteTitle, isOpen]);

  const shareUrl = encodeShareBanqueteUrl({
    author: aliasInput.trim() || 'Renguero',
    title: titleInput.trim() || 'Mi Banquete en Necochea',
    score: scoreResult.totalScore,
    songIds: setlist.map((s) => s.id),
  });

  const shareMessage = `🔥 Armé mi Banquete de La Renga en Necochea: "${
    titleInput.trim() || 'Mi Banquete'
  }" por ${
    aliasInput.trim() || 'Renguero'
  } (${scoreResult.totalScore.toLocaleString('es-AR')} pts · ${
    setlist.length
  } temas). ¡Entrá a escuchar mi lista o desafiame en un Duelo de Setlists!`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `${shareMessage}\n${shareUrl}`
  )}`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareMessage
  )}&url=${encodeURIComponent(shareUrl)}`;

  // Generate 1080x1920 Social Story / Flyer PNG on Canvas whenever inputs or setlist change
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    // 1. Background Gradient (Necochea Night Sky -> Warm Bonfire Sand)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#091319');
    bgGrad.addColorStop(0.45, '#130e0c');
    bgGrad.addColorStop(1, '#1f130e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle hand-drawn crosshatch lines
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.06)';
    ctx.lineWidth = 2;
    for (let y = 0; y < H; y += 36) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y + 18);
      ctx.stroke();
    }

    // 2. Outer Double Frame ("Don't Starve" Ink & Amber Border)
    ctx.strokeStyle = '#4a382d';
    ctx.lineWidth = 10;
    ctx.strokeRect(32, 32, W - 64, H - 64);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.strokeRect(48, 48, W - 96, H - 96);

    // 3. Top Header Banner
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(80, 82, W - 160, 56);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      'PLAYA DE NECOCHEA · ARMADOR DE SETLIST & DUELOS',
      W / 2,
      119
    );

    // Main Title
    ctx.fillStyle = '#f5efe2';
    ctx.font = 'bold 74px "Germania One", Georgia, serif';
    ctx.fillText('LA RENGA · EL BANQUETE', W / 2, 220);

    // Custom Banquete Title & Author
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 44px "Germania One", Georgia, serif';
    ctx.fillText(
      `"${(titleInput.trim() || 'Mi Banquete en Necochea').slice(0, 38)}"`,
      W / 2,
      284
    );

    ctx.fillStyle = '#d6c9b8';
    ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      `Curado por: ${aliasInput.trim() || 'Renguero'}  ·  Invitado en Tablas: ${
        activeGuestTier.nickname
      }`,
      W / 2,
      334
    );

    // 4. Score & Rank Box
    ctx.fillStyle = '#18110e';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.fillRect(80, 370, W - 160, 150);
    ctx.strokeRect(80, 370, W - 160, 150);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillText('RANGO DEL BANQUETE', 115, 415);

    ctx.fillStyle = '#f5efe2';
    ctx.font = 'bold 44px "Germania One", Georgia, serif';
    ctx.fillText(scoreResult.rankTitle, 115, 468);

    ctx.fillStyle = '#a89984';
    ctx.font = '500 22px "JetBrains Mono", monospace';
    ctx.fillText(
      `${setlist.length}/36 Temas · Duración: ${scoreResult.totalDurationFormatted}`,
      115,
      504
    );

    ctx.textAlign = 'right';
    ctx.fillStyle = '#9c8c79';
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillText('PUNTAJE OFICIAL', W - 115, 415);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 68px "JetBrains Mono", monospace';
    ctx.fillText(
      `${scoreResult.totalScore.toLocaleString('es-AR')} PTS`,
      W - 115,
      488
    );

    // 5. Two-Column Tracklist (#01 to #36)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.fillText('LISTA OFICIAL DE TEMAS (EN ORDEN DE SHOW):', 80, 568);

    const startY = 610;
    const rowH = 56;
    const colW = (W - 180) / 2;

    const displayedSongs = setlist.slice(0, 36);
    displayedSongs.forEach((song, idx) => {
      const col = idx < 18 ? 0 : 1;
      const row = idx < 18 ? idx : idx - 18;
      const x = 80 + col * (colW + 20);
      const y = startY + row * rowH;

      const isOpener = idx === 0;
      const isCloser = idx === displayedSongs.length - 1;

      ctx.fillStyle = isOpener
        ? '#2b1911'
        : isCloser
        ? '#2b1212'
        : '#140f0c';
      ctx.strokeStyle = isOpener
        ? '#f59e0b'
        : isCloser
        ? '#ef4444'
        : '#2b201a';
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, colW, rowH - 8);
      ctx.strokeRect(x, y, colW, rowH - 8);

      ctx.fillStyle = isOpener || isCloser ? '#fbbf24' : '#8c7c68';
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillText(String(idx + 1).padStart(2, '0'), x + 14, y + 32);

      ctx.fillStyle = '#f5efe2';
      ctx.font = 'bold 23px "Plus Jakarta Sans", sans-serif';
      const maxTitle = song.title.length > 25 ? `${song.title.slice(0, 24)}…` : song.title;
      ctx.fillText(maxTitle, x + 58, y + 32);
    });

    // 6. Footer CTA Banner
    ctx.fillStyle = '#19120e';
    ctx.strokeStyle = '#4a382d';
    ctx.lineWidth = 3;
    ctx.fillRect(80, H - 185, W - 160, 110);
    ctx.strokeRect(80, H - 185, W - 160, 110);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 28px "Germania One", Georgia, serif';
    ctx.fillText(
      '¿TE ANIMÁS A SUPERAR ESTE SETLIST EN LA PLAYA DE NECOCHEA?',
      W / 2,
      H - 138
    );

    ctx.fillStyle = '#c5b8a5';
    ctx.font = '500 22px "JetBrains Mono", monospace';
    ctx.fillText(
      'Escuchá esta lista y armá tu Banquete 3D · Los Mismos de Siempre',
      W / 2,
      H - 98
    );

    setFlyerDataUrl(canvas.toDataURL('image/png'));
  }, [isOpen, aliasInput, titleInput, setlist, scoreResult, activeGuestTier]);

  if (!isOpen) return null;

  const handleCopyShareLink = () => {
    onSaveProfile(
      aliasInput.trim() || 'Renguero',
      titleInput.trim() || 'Mi Banquete en Necochea'
    );
    navigator.clipboard.writeText(`${shareMessage}\n${shareUrl}`);
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 2600);
  };

  const handleDownloadFlyer = () => {
    if (!flyerDataUrl) return;
    onSaveProfile(
      aliasInput.trim() || 'Renguero',
      titleInput.trim() || 'Mi Banquete en Necochea'
    );
    const link = document.createElement('a');
    const safeName = (aliasInput.trim() || 'renguero')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-');
    link.download = `banquete-la-renga-${safeName}.png`;
    link.href = flyerDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePublishClick = async () => {
    const cleanAlias = aliasInput.trim() || 'Renguero';
    const cleanTitle = titleInput.trim() || 'Mi Banquete en Necochea';
    onSaveProfile(cleanAlias, cleanTitle);
    setPublishing(true);
    setPublishedStatus(null);
    const res = await onPublishToGlobalRanking(cleanTitle, cleanAlias);
    setPublishing(false);
    setPublishedStatus(
      res.savedToSupabase
        ? '¡Publicado en el Ranking Global de Supabase y habilitado para Duelos!'
        : '¡Guardado en el Ranking y en la caché de tu navegador!'
    );
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/85 flex items-center justify-center p-4 select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Compartir tu Banquete e Invitar Amigos"
    >
      <canvas ref={canvasRef} className="hidden" />

      <div className="sketch-panel rounded w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3a2c24] bg-[#191310]">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-[#f59e0b]" />
            <div>
              <h2 className="text-2xl font-rock text-[#f5efe2]">
                Compartir mi Banquete, Invitar Amigos & Descargar Flyer
              </h2>
              <p className="text-xs text-[#a89984]">
                Mandá tu lista por WhatsApp o redes para que tus amigos la escuchen o compitan en un Duelo contra vos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#a89984] hover:text-white rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          {/* Left Column (7 cols): Profile, Social Links & Global Ranking Publish */}
          <div className="lg:col-span-7 space-y-4">
            {/* Step 1: Tu Nombre / Apodo en Caché */}
            <div className="sketch-card rounded p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#f59e0b] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>1. TU FIRMA RENGUERA (GUARDADA EN CACHÉ DEL NAVEGADOR)</span>
                </span>
                <span className="text-[11px] font-mono text-[#4ade80]">
                  ● Guardado automático
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#a89984] mb-1">
                    Tu Nombre o Apodo
                  </label>
                  <input
                    type="text"
                    value={aliasInput}
                    onChange={(e) => {
                      setAliasInput(e.target.value);
                      onSaveProfile(
                        e.target.value.trim() || 'Renguero',
                        titleInput.trim() || 'Mi Banquete en Necochea'
                      );
                    }}
                    placeholder="Ej: Nacho_Mataderos"
                    maxLength={40}
                    className="w-full px-3 py-2 text-xs bg-[#0d0a09] border border-[#3a2c24] rounded text-[#f5efe2] focus:outline-none focus:border-[#f59e0b]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#a89984] mb-1">
                    Título de tu Playlist / Banquete
                  </label>
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => {
                      setTitleInput(e.target.value);
                      onSaveProfile(
                        aliasInput.trim() || 'Renguero',
                        e.target.value.trim() || 'Mi Banquete en Necochea'
                      );
                    }}
                    placeholder="Ej: Noche de Huracán en Necochea"
                    maxLength={60}
                    className="w-full px-3 py-2 text-xs bg-[#0d0a09] border border-[#3a2c24] rounded text-[#f5efe2] focus:outline-none focus:border-[#f59e0b]"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Share Link & Social Networks */}
            <div className="sketch-card rounded p-4 space-y-3">
              <div className="text-xs font-mono text-[#f59e0b]">
                2. INVITAR AMIGOS A ESCUCHAR TU LISTA O JUGAR UN DUELO
              </div>
              <p className="text-xs text-[#a89984]">
                Este link lleva cargadas tus {setlist.length} canciones. Cuando un amigo entra, puede darle Play a tu Banquete o enfrentarte en un Duelo de Setlists:
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-[#0b0807] border border-[#3a2c24] rounded text-[#c5b8a5] select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="px-4 py-2 text-xs font-bold bg-[#f59e0b] hover:bg-[#fbbf24] text-black rounded flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>¡Link Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Link</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-1 flex flex-wrap items-center gap-2.5">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-xs font-bold bg-[#22c55e] hover:bg-[#16a34a] text-black rounded flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Invitar por WhatsApp</span>
                </a>

                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-xs font-bold bg-[#1d9bf0] hover:bg-[#38bdf8] text-black rounded flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Compartir en X / Twitter</span>
                </a>

                <button
                  type="button"
                  onClick={handleDownloadFlyer}
                  className="px-4 py-2 text-xs font-bold bg-[#b91c1c] hover:bg-[#dc2626] text-white rounded flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Flyer PNG (Instagram Stories)</span>
                </button>
              </div>
            </div>

            {/* Step 3: Publish to Global Ranking (Supabase) */}
            <div className="sketch-card rounded p-4 space-y-3 border border-[#f59e0b]/40">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-[#f59e0b] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>3. SUBIR AL RANKING GLOBAL Y HABILITAR BATALLAS</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1b1410] border border-[#3a2c24] text-[#c5b8a5]">
                  {isSupabaseConfigured()
                    ? 'Supabase Cloud Conectado'
                    : 'Modo Local + SQL Listo para Supabase'}
                </span>
              </div>

              <p className="text-xs text-[#a89984]">
                Publicá tu playlist para aparecer en la Tabla Mundial y que otros usuarios puedan elegir tu Banquete como rival en el Duelo de Setlists.
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={publishing}
                  onClick={handlePublishClick}
                  className="px-4 py-2 text-xs font-bold bg-[#b91c1c] hover:bg-[#dc2626] text-white rounded border border-[#f59e0b]/40 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-[#fbbf24]" />
                  <span>
                    {publishing
                      ? 'Publicando Banquete...'
                      : 'Publicar mi Playlist en el Ranking Global'}
                  </span>
                </button>

                <a
                  href={NECOCHEA_TICKETS_OFFICIAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 text-xs font-semibold bg-[#241b17] hover:bg-[#352822] text-[#fbbf24] border border-[#544034] rounded flex items-center gap-1.5"
                >
                  <span>Sacar Entradas Oficiales Necochea</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {publishedStatus && (
                <div className="p-2.5 rounded bg-[#142417] border border-[#22c55e]/50 text-xs text-[#4ade80] font-medium">
                  ✓ {publishedStatus}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (5 cols): Live Preview of the Generated Social Flyer */}
          <div className="lg:col-span-5 flex flex-col items-center justify-between sketch-card rounded p-4 bg-[#0d0a09]">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#d6c9b8]">
                VISTA PREVIA DEL FLYER (1080×1920)
              </span>
              <button
                type="button"
                onClick={handleDownloadFlyer}
                className="text-xs font-semibold text-[#f59e0b] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Guardar PNG</span>
              </button>
            </div>

            {flyerDataUrl ? (
              <img
                src={flyerDataUrl}
                alt="Flyer de tu Banquete de La Renga"
                className="max-h-[420px] w-auto rounded border border-[#4a382d] shadow-xl object-contain"
              />
            ) : (
              <div className="h-[400px] flex items-center justify-center text-xs text-[#8c7c68]">
                Generando flyer ilustrado...
              </div>
            )}

            <p className="mt-2 text-[11px] text-center text-[#8c7c68]">
              Formato vertical listo para subir a Instagram Stories, WhatsApp Status o X.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
