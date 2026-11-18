// src/components/BanqueteOnboardingModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Music,
  Swords,
  Ticket,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Disc,
  Play,
  Compass,
  User,
  X,
} from 'lucide-react';

import { SITE_COPY } from '../data/siteCopy';

const TETE_SALUDO_ASSET_URL = '/assets/aistudio/tetesaludo_5b6a7be9.png';

const TETE_STEP_POSES: {
  url: string;
  alt: string;
  clipPath?: string;
}[] = [
  {
    url: '/assets/aistudio/tete_senala_035fbdb4.png',
    alt: 'Tete señalando el concepto del Banquete',
  },
  {
    url: '/assets/aistudio/Capa_2_def1c217.png',
    alt: 'Tete explicando cómo armar la lista de 36 temas',
  },
  {
    url: '/assets/aistudio/Capa_3_5dcd228c.png',
    alt: 'Tete festejando con pulgares arriba en Oráculo y Duelos',
    clipPath: 'inset(0 8% 0 0)',
  },
  {
    url: '/assets/aistudio/Capa_4_8f490b5a.png',
    alt: 'Tete pensando los efectos del escenario en la Playa 3D',
    clipPath: 'inset(0 0 0 18%)',
  },
];

interface BanqueteOnboardingModalProps {
  isOpen: boolean;
  showWelcomeGreeting: boolean;
  onDismissWelcomeGreeting: () => void;
  setlistCount: number;
  playerAlias: string;
  banqueteTitle: string;
  onSaveProfile: (alias: string, title: string) => void;
  onClose: () => void;
  onOpenBuilder: () => void;
  onOpenOracle: () => void;
  onAutoFillDemo: () => void;
}

const STEPS = SITE_COPY.onboarding.steps;

export const BanqueteOnboardingModal: React.FC<BanqueteOnboardingModalProps> = ({
  isOpen,
  showWelcomeGreeting,
  onDismissWelcomeGreeting,
  setlistCount,
  playerAlias,
  banqueteTitle,
  onSaveProfile,
  onClose,
  onOpenBuilder,
  onOpenOracle,
  onAutoFillDemo,
}) => {
  const [stepIdx, setStepIdx] = useState<number>(0);
  // Two-step welcome bubble: first Tete asks your name ('ask_name'), then gives the welcome ('greeting')
  const [welcomePhase, setWelcomePhase] = useState<'ask_name' | 'greeting'>('ask_name');
  const [aliasInput, setAliasInput] = useState<string>(() =>
    playerAlias === 'Renguero' ? '' : playerAlias
  );
  const [titleInput, setTitleInput] = useState<string>(banqueteTitle);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStepIdx(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && showWelcomeGreeting && welcomePhase === 'ask_name') {
      const timer = window.setTimeout(() => {
        nameInputRef.current?.focus();
      }, 80);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen, showWelcomeGreeting, welcomePhase]);

  const handleConfirmInitialName = () => {
    const cleanAlias = aliasInput.trim() || 'Renguero';
    const nextTitle =
      !titleInput.trim() || titleInput.trim() === 'Mi Banquete en Necochea'
        ? cleanAlias !== 'Renguero'
          ? `El Banquete de ${cleanAlias}`
          : 'Mi Banquete en Necochea'
        : titleInput.trim();

    setAliasInput(cleanAlias);
    setTitleInput(nextTitle);
    onSaveProfile(cleanAlias, nextTitle);
    setWelcomePhase('greeting');
  };

  const commitProfileAndRun = (cb: () => void) => {
    const cleanAlias = aliasInput.trim() || 'Renguero';
    const cleanTitle = titleInput.trim() || 'Mi Banquete en Necochea';
    onSaveProfile(cleanAlias, cleanTitle);
    cb();
  };

  if (!isOpen) return null;

  const currentStep = STEPS[stepIdx];
  const currentPose = TETE_STEP_POSES[stepIdx] || TETE_STEP_POSES[0];
  const displayAlias = aliasInput.trim() || playerAlias || 'locura';

  return (
    <div
      className="fixed inset-0 z-40 bg-black/85 flex items-center justify-center p-3 sm:p-5 select-none overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      {/* Wrapper with Tete standing alongside the Onboarding Window in Steps 01-04 */}
      <div
        className={`w-full max-w-[1200px] flex items-end justify-center gap-3 lg:gap-6 transition-all duration-300 ${
          showWelcomeGreeting
            ? 'blur-[6px] opacity-30 scale-[0.97] pointer-events-none select-none'
            : 'blur-0 opacity-100 scale-100'
        }`}
      >
        {/* Tete Character Alongside the Left of the Modal Window (Steps 01, 02, 03, 04) */}
        {/* Fixed height + max-w-none ensures Tete has the EXACT same head-to-toe height across all 4 poses */}
        {!showWelcomeGreeting && (
          <div className="hidden md:flex items-end justify-center shrink-0 w-[220px] lg:w-[270px] xl:w-[295px] h-[60vh] lg:h-[70vh] max-h-[560px] pointer-events-none select-none overflow-visible">
            <img
              key={currentPose.url}
              src={currentPose.url}
              alt={currentPose.alt}
              style={
                currentPose.clipPath
                  ? { clipPath: currentPose.clipPath }
                  : undefined
              }
              className="h-full w-auto max-w-none object-contain object-bottom drop-shadow-[0_18px_34px_rgba(0,0,0,0.95)] transition-all duration-200"
            />
          </div>
        )}

        {/* Main 4-Step Onboarding Window */}
        <div className="sketch-panel rounded w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border-2 border-[#544034] bg-[#140f0d] shadow-2xl">
          {/* Top Header Bar */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 bg-[#1b1411] border-b border-[#3a2c24]">
            <div className="flex items-center gap-3">
              {/* Compact Tete Pose Badge on Mobile (< md) */}
              {!showWelcomeGreeting && (
                <img
                  src={currentPose.url}
                  alt={currentPose.alt}
                  className="md:hidden w-9 h-11 object-contain object-top rounded bg-[#0d0a09] border border-[#4a382d] shrink-0"
                />
              )}
              <span className="px-2.5 py-1 text-xs font-mono font-bold bg-[#b91c1c] text-white rounded border border-[#f59e0b]/40">
                GUÍA RÁPIDA · PASO {currentStep.number}/04
              </span>
              <span className="text-xs font-mono uppercase tracking-wider text-[#f59e0b]">
                {currentStep.tag}
              </span>
            </div>

            <button
              onClick={onClose}
              className="px-3 py-1 text-xs font-medium text-[#a89984] hover:text-white bg-[#241b17] hover:bg-[#312520] border border-[#3a2c24] rounded flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>Saltar introducción</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Step Navigation Tabs */}
          <div className="grid grid-cols-4 bg-[#0f0b09] border-b border-[#2e231d]">
            {STEPS.map((st, idx) => {
              const isActive = idx === stepIdx;
              const isCompleted = idx < stepIdx;
              return (
                <button
                  key={st.number}
                  onClick={() => setStepIdx(idx)}
                  className={`px-3 sm:px-4 py-2.5 text-left border-r last:border-r-0 border-[#261d19] transition-colors cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#261914] text-[#f5efe2] border-b-2 border-b-[#ef4444]'
                      : isCompleted
                      ? 'bg-[#14100e] text-[#d6c9b8] hover:bg-[#1c1613]'
                      : 'bg-[#0f0b09] text-[#786a58] hover:text-[#a89984]'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                      isActive
                        ? 'bg-[#dc2626] text-white'
                        : isCompleted
                        ? 'bg-[#2e231d] text-[#f59e0b]'
                        : 'bg-[#1a1411] text-[#786a58]'
                    }`}
                  >
                    {isCompleted ? '✓' : st.number}
                  </span>
                  <span className="text-xs font-semibold truncate">{st.tag}</span>
                </button>
              );
            })}
          </div>

          {/* Main Content Body */}
          <div className="p-5 sm:p-6 md:p-7 flex-1 overflow-y-auto">
            <div className="mb-5">
              <h2
                id="onboarding-title"
                className="text-2xl md:text-3xl font-rock tracking-wide text-[#f5efe2]"
              >
                {currentStep.title}
              </h2>
              <p className="mt-1.5 text-sm text-[#c5b8a5] max-w-3xl leading-relaxed">
                {currentStep.subtitle}
              </p>
            </div>

            {/* STEP 1 CONTENT: ¿DE QUÉ VA LA WEB? */}
            {stepIdx === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="sketch-card rounded p-4 border border-[#3a2c24] bg-[#191310] flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded bg-[#2b1814] border border-[#ef4444]/40 flex items-center justify-center text-[#ef4444] mb-3">
                      <Music className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-rock tracking-wide text-[#f5efe2]">
                      1. Armá las 36 Canciones
                    </h3>
                    <p className="mt-1.5 text-xs text-[#a89984] leading-relaxed">
                      Elegí tema por tema entre los <strong className="text-[#f5efe2]">11 discos de estudio</strong> de La Renga. Podés ordenar la lista, escuchar el preview de cada tema o autocompletar los 36.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#2a201b] text-[11px] font-mono text-[#f59e0b]">
                    Actualmente tenés {setlistCount}/36 temas en lista
                  </div>
                </div>

                <div className="sketch-card rounded p-4 border border-[#3a2c24] bg-[#191310] flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded bg-[#2b1f14] border border-[#f59e0b]/40 flex items-center justify-center text-[#f59e0b] mb-3">
                      <Flame className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-rock tracking-wide text-[#f5efe2]">
                      2. Convocá a la Hinchada en 3D
                    </h3>
                    <p className="mt-1.5 text-xs text-[#a89984] leading-relaxed">
                      El escenario en la playa de Necochea reacciona a tu lista: cuantas más canciones sumás, <strong className="text-[#f5efe2]">más fanáticos y banderas de palo</strong> se acercan a la valla y al pogo.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#2a201b] text-[11px] font-mono text-[#c5b8a5]">
                    Rotá la cámara con clic izquierdo y hacé zoom con la rueda
                  </div>
                </div>

                <div className="sketch-card rounded p-4 border border-[#3a2c24] bg-[#191310] flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded bg-[#261816] border border-[#dc2626]/40 flex items-center justify-center text-[#ef4444] mb-3">
                      <Swords className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-rock tracking-wide text-[#f5efe2]">
                      3. Jugá al Oráculo y Duelos
                    </h3>
                    <p className="mt-1.5 text-xs text-[#a89984] leading-relaxed">
                      Adiviná qué temas tocó La Renga en recitales reales históricos o batallá con el puntaje de tu Setlist para ganar <strong className="text-[#f5efe2]">entradas coleccionables y efectos 3D</strong>.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#2a201b] text-[11px] font-mono text-[#f59e0b]">
                    Hasta 10.000 PTS de mística renguera
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 CONTENT: CÓMO ARMAR LA PLAYLIST PASO A PASO */}
            {stepIdx === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="sketch-card rounded p-4 border border-[#3a2c24] bg-[#191310]">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#f59e0b] mb-1">
                      <Disc className="w-4 h-4 text-[#ef4444]" />
                      <span>REGLA #1 · APERTURA Y CIERRE RITUAL</span>
                    </div>
                    <h3 className="text-base font-semibold text-[#f5efe2]">
                      Cómo abrir (#01) y cómo cerrar (#36)
                    </h3>
                    <p className="mt-1 text-xs text-[#a89984] leading-relaxed">
                      Los temas marcados como <strong className="text-[#f59e0b]">Ideal Apertura</strong> (como <em>Panic Show</em>, <em>Tripa y corazón</em> o <em>A tu lado</em>) suman bonus si van en el puesto #01. Y como manda la historia, cerrar el puesto #36 con <strong className="text-[#ef4444]">&ldquo;Hablando de la libertad&rdquo;</strong> otorga el premio máximo de cierre.
                    </p>
                  </div>

                  <div className="sketch-card rounded p-4 border border-[#3a2c24] bg-[#191310]">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#f59e0b] mb-1">
                      <Flame className="w-4 h-4 text-[#f59e0b]" />
                      <span>REGLA #2 · CURVA DE ENERGÍA Y RESPIROS</span>
                    </div>
                    <h3 className="text-base font-semibold text-[#f5efe2]">
                      Alterná Pogo, Himnos, Baladas y Culto
                    </h3>
                    <p className="mt-1 text-xs text-[#a89984] leading-relaxed">
                      Cada canción tiene su energía (<strong className="text-[#f5efe2]">Pogo, Himno, Rock, Balada o Culto</strong>). Si ponés 36 temas al palo sin ningún respiro, la banda y el público se agotan; intercalá baladas y joyas ocultas para disparar tu puntaje.
                    </p>
                  </div>
                </div>

                <div className="sketch-card rounded p-4 border border-[#4a382d] bg-[#1d1512] flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-mono text-[#f59e0b]">
                      ¿QUERÉS EMPEZAR A ARMARLA YA MISMO?
                    </div>
                    <p className="text-xs text-[#d6c9b8]">
                      Podés abrir el catálogo ilustrado con los 11 discos para elegir canción por canción, o autocompletar las 36 de un clic para ver el recital lleno.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={onAutoFillDemo}
                      className="px-3.5 py-2 text-xs font-semibold sketch-card hover:bg-[#2c211c] text-[#f59e0b] border border-[#f59e0b]/40 rounded flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Autocompletar 36 Temas</span>
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenBuilder();
                      }}
                      className="px-4 py-2 text-xs font-semibold bg-[#b91c1c] hover:bg-[#dc2626] text-white rounded flex items-center gap-1.5 cursor-pointer"
                    >
                      <Music className="w-3.5 h-3.5" />
                      <span>Ir al Armador de Canciones</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 CONTENT: ORÁCULO & DUELO DE SETLISTS */}
            {stepIdx === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="sketch-card rounded p-5 border border-[#3a2c24] bg-[#191310] flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-[#2b1f14] text-[#f59e0b] border border-[#f59e0b]/30 rounded">
                      MODO 1 · DEDUCCIÓN HISTÓRICA
                    </span>
                    <h3 className="mt-2.5 text-xl font-rock tracking-wide text-[#f5efe2]">
                      El Oráculo de los Shows Reales
                    </h3>
                    <p className="mt-1.5 text-xs text-[#a89984] leading-relaxed">
                      Elegí un banquete real mítico (<strong className="text-[#f5efe2]">Huracán 1999, Autódromo 2007, Potrero 2018 o Necochea 2024</strong>) y adiviná los 6 momentos clave del show real, o compará tus 36 temas contra la lista oficial que sonó esa noche.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#2a201b] flex items-center justify-between text-xs">
                    <span className="text-[#c5b8a5] font-mono">4 Recitales Históricos</span>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenOracle();
                      }}
                      className="text-[#f59e0b] hover:underline font-semibold cursor-pointer"
                    >
                      Probar el Oráculo →
                    </button>
                  </div>
                </div>

                <div className="sketch-card rounded p-5 border border-[#3a2c24] bg-[#191310] flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-[#2b1814] text-[#ef4444] border border-[#ef4444]/30 rounded">
                      MODO 2 · BATALLA EN 5 RONDAS
                    </span>
                    <h3 className="mt-2.5 text-xl font-rock tracking-wide text-[#f5efe2]">
                      Duelo de Setlists (Mano a Mano)
                    </h3>
                    <p className="mt-1.5 text-xs text-[#a89984] leading-relaxed">
                      Tu lista de 36 canciones se mide en 5 rubros (<strong className="text-[#f5efe2]">Apertura/Cierre, Viaje por los Discos, Pogo, Joyas de Culto y Puntaje Total</strong>) contra rivales históricos o playlists de otros usuarios.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#2a201b] flex items-center justify-between text-xs">
                    <span className="text-[#c5b8a5] font-mono">Desbloquea Fuego y Luces 3D</span>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenOracle();
                      }}
                      className="text-[#ef4444] hover:underline font-semibold cursor-pointer"
                    >
                      Ir a los Duelos →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4 CONTENT: CONTROLES DE LA PLAYA 3D Y EFECTOS */}
            {stepIdx === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="sketch-card rounded p-4 border border-[#3a2c24] bg-[#191310]">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#f59e0b] mb-2">
                    <Compass className="w-4 h-4 text-[#f59e0b]" />
                    <span>BARRA INFERIOR DE CONTROLES</span>
                  </div>
                  <h3 className="text-base font-semibold text-[#f5efe2]">
                    Cámaras, Agite y Modo Cine
                  </h3>
                  <ul className="mt-2 space-y-1.5 text-xs text-[#a89984]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#ef4444] shrink-0" />
                      <span>
                        <strong className="text-[#f5efe2]">4 Cámaras rápidas:</strong> Playa &amp; Mar, Pantallas &amp; Batería, Olla del Pogo y Costa &amp; Olas.
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#ef4444] shrink-0" />
                      <span>
                        <strong className="text-[#f5efe2]">Botón ¡Agitar! y Reproductor In-App:</strong> Enciende las bengalas del campo, acelera el pogo y escuchá los previews oficiales de tu lista.
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#ef4444] shrink-0" />
                      <span>
                        <strong className="text-[#f5efe2]">Tecla H (Modo Cine):</strong> Oculta o muestra el panel de controles para disfrutar el escenario limpio.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="sketch-card rounded p-4 border border-[#3a2c24] bg-[#191310]">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#f59e0b] mb-2">
                    <Ticket className="w-4 h-4 text-[#ef4444]" />
                    <span>VITRINA Y 4 EFECTOS ESCÉNICOS 3D</span>
                  </div>
                  <h3 className="text-base font-semibold text-[#f5efe2]">
                    Encendé el Escenario a tu gusto
                  </h3>
                  <p className="mt-1.5 text-xs text-[#a89984] leading-relaxed">
                    Desde la barra inferior podés activar o desactivar en tiempo real los <strong className="text-[#f5efe2]">4 efectos especiales del escenario</strong>:
                  </p>
                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                    <div className="px-2.5 py-1.5 rounded bg-[#120e0c] border border-[#2e231d] text-[#f59e0b]">
                      ★ Fuego en la Valla
                    </div>
                    <div className="px-2.5 py-1.5 rounded bg-[#120e0c] border border-[#2e231d] text-[#f59e0b]">
                      ★ Luces de Huracán
                    </div>
                    <div className="px-2.5 py-1.5 rounded bg-[#120e0c] border border-[#2e231d] text-[#f59e0b]">
                      ★ Invitado Leyenda
                    </div>
                    <div className="px-2.5 py-1.5 rounded bg-[#120e0c] border border-[#2e231d] text-[#f59e0b]">
                      ★ Chispas Doradas
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Persistent Player Profile Input (Saved in Browser Cache) */}
            <div className="mt-5 p-4 rounded border-2 border-[#f59e0b]/50 bg-[#1b130f] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex items-start gap-2.5">
                <User className="w-5 h-5 text-[#f59e0b] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-[#f5efe2]">
                    Tu Nombre o Apodo Renguero (Guardado en tu navegador)
                  </h4>
                  <p className="text-xs text-[#a89984]">
                    Ya queda listo para cuando guardes o compartas tu lista en el Ranking Mundial.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
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
                  placeholder="Tu apodo (ej. Nacho_73)"
                  maxLength={40}
                  className="px-3 py-1.5 text-xs bg-[#0d0a09] border border-[#4a382d] rounded text-[#f5efe2] focus:outline-none focus:border-[#f59e0b] w-full sm:w-44"
                />
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
                  placeholder="Nombre de tu Banquete"
                  maxLength={60}
                  className="px-3 py-1.5 text-xs bg-[#0d0a09] border border-[#4a382d] rounded text-[#f5efe2] focus:outline-none focus:border-[#f59e0b] w-full sm:w-52"
                />
              </div>
            </div>
          </div>

          {/* Footer Navigation & Primary CTA */}
          <div className="px-5 sm:px-6 py-4 bg-[#191310] border-t border-[#3a2c24] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStepIdx((prev) => Math.max(0, prev - 1))}
                disabled={stepIdx === 0}
                className="px-3 py-2 text-xs font-medium sketch-card hover:bg-[#2a201b] text-[#d6c9b8] disabled:opacity-35 rounded flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              {stepIdx < STEPS.length - 1 ? (
                <button
                  onClick={() => setStepIdx((prev) => Math.min(STEPS.length - 1, prev + 1))}
                  className="px-4 py-2 text-xs font-semibold bg-[#2e231d] hover:bg-[#3d2f27] text-[#f5efe2] border border-[#544034] rounded flex items-center gap-1 cursor-pointer"
                >
                  <span>Siguiente paso</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() =>
                  commitProfileAndRun(() => {
                    onClose();
                    onOpenBuilder();
                  })
                }
                className="px-4 py-2 text-xs font-semibold bg-[#b91c1c] hover:bg-[#dc2626] text-white rounded border border-[#f59e0b]/40 flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Guardar Apodo y Armar mi Setlist</span>
              </button>

              <button
                onClick={() => commitProfileAndRun(onClose)}
                className="px-3.5 py-2 text-xs font-medium sketch-card hover:bg-[#2a201b] text-[#f5efe2] rounded cursor-pointer"
              >
                Entrar a la Playa 3D
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* INITIAL WELCOME OVERLAY WITH TETE WAVING & PARCHMENT SPEECH BUBBLE    */}
      {/* Phase 1: Tete asks your Name/Alias -> Phase 2: Tete welcomes you!     */}
      {/* ===================================================================== */}
      {showWelcomeGreeting && (
        <div className="fixed inset-0 z-50 flex flex-col md:flex-row items-center justify-start md:justify-center px-3.5 pt-4 pb-4 md:p-8 pointer-events-auto overflow-y-auto md:overflow-hidden">
          {/* Tete Cutout Character on Bottom-Left (Responsive scaling across mobile, tablet & desktop) */}
          <img
            src={TETE_SALUDO_ASSET_URL}
            alt="Tete dándote la bienvenida al Banquete"
            className="fixed bottom-0 left-0 sm:left-2 lg:left-8 h-[35vh] sm:h-[52vh] md:h-[74vh] lg:h-[85vh] max-w-[56vw] sm:max-w-[48vw] md:max-w-[42vw] w-auto object-contain object-left-bottom pointer-events-none z-20 drop-shadow-[0_18px_36px_rgba(0,0,0,0.95)]"
          />

          {/* Parchment Speech Bubble + External Action Buttons Container */}
          <div className="relative z-30 w-full max-w-[540px] md:max-w-[620px] lg:max-w-[690px] md:ml-[28vw] lg:ml-[26vw] md:-mt-[10vh] flex flex-col items-end">
            {/* Auto-Sizing Hand-Drawn Parchment Speech Bubble */}
            <div
              onClick={() => {
                if (welcomePhase === 'greeting') {
                  onDismissWelcomeGreeting();
                }
              }}
              role={welcomePhase === 'greeting' ? 'button' : undefined}
              tabIndex={welcomePhase === 'greeting' ? 0 : undefined}
              onKeyDown={(e) => {
                if (
                  welcomePhase === 'greeting' &&
                  (e.key === 'Enter' || e.key === ' ')
                ) {
                  onDismissWelcomeGreeting();
                }
              }}
              className={`relative w-full rounded-[28px] sm:rounded-[44px] bg-gradient-to-br from-[#f6e8cd] via-[#ebd7b4] to-[#d9be92] border-[4px] sm:border-[6px] border-[#0b0908] shadow-[0_24px_54px_rgba(0,0,0,0.92)] px-5 py-5 sm:px-10 sm:py-8 lg:px-14 lg:py-10 transition-transform duration-200 ${
                welcomePhase === 'greeting'
                  ? 'cursor-pointer group hover:scale-[1.01]'
                  : ''
              }`}
            >
              {/* Inner Sketchy Ink Border */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-1.5 sm:inset-2 rounded-[22px] sm:rounded-[36px] border-2 border-[#181310]/85"
              />

              {/* Top & Bottom Hand-Drawn Crosshatch Corner Accents */}
              <svg
                aria-hidden="true"
                viewBox="0 0 120 50"
                className="pointer-events-none absolute top-2 left-5 w-14 sm:w-24 h-auto text-[#181310] opacity-85"
              >
                <path
                  d="M4 38 L34 8 M14 42 L48 8 M26 42 L64 8 M40 40 L78 8 M56 38 L92 10"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
              <svg
                aria-hidden="true"
                viewBox="0 0 120 50"
                className="pointer-events-none absolute top-2 right-5 w-14 sm:w-24 h-auto text-[#181310] opacity-85 scale-x-[-1]"
              >
                <path
                  d="M4 38 L34 8 M14 42 L48 8 M26 42 L64 8 M40 40 L78 8 M56 38 L92 10"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
              <svg
                aria-hidden="true"
                viewBox="0 0 120 50"
                className="pointer-events-none absolute bottom-2 right-5 w-14 sm:w-24 h-auto text-[#181310] opacity-80 scale-x-[-1] scale-y-[-1]"
              >
                <path
                  d="M4 38 L34 8 M14 42 L48 8 M26 42 L64 8 M40 40 L78 8"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>

              {/* PHASE 1: TETE ASKS YOUR NAME BEFORE WELCOMING YOU */}
              {welcomePhase === 'ask_name' ? (
                <div className="relative z-10 text-[#1d1814]">
                  <h2 className="font-rock tracking-wide text-[#181310] leading-tight text-[clamp(1.35rem,3vw,2.5rem)]">
                    ¡Hola, locura! ¿Cómo te llamás?
                  </h2>

                  <p className="mt-2 sm:mt-3 text-[#26201b] leading-relaxed font-normal text-[clamp(0.88rem,1.4vw,1.18rem)]">
                    Antes de abrirte el portón del predio en Necochea, decime tu{' '}
                    <strong>nombre o apodo </strong> así ya queda anotado
                    para tu lista y tus entradas:
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleConfirmInitialName();
                    }}
                    className="mt-3.5 sm:mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                  >
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={aliasInput}
                      onChange={(e) => setAliasInput(e.target.value)}
                      placeholder="Escribí tu nombre o apodo (ej. Nacho)..."
                      maxLength={40}
                      className="flex-1 px-3.5 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base font-bold bg-[#fdf6e7] text-[#181310] placeholder-[#7a6852] border-2 border-[#181310] rounded-xl focus:outline-none focus:border-[#b91c1c] shadow-inner"
                    />
                  </form>
                </div>
              ) : (
                /* PHASE 2: TETE PERSONALIZED WELCOME SPEECH BUBBLE */
                <div className="relative z-10 text-[#1d1814]">
                  <h2 className="font-rock tracking-wide text-[#181310] leading-tight text-[clamp(1.4rem,3.1vw,2.65rem)]">
                    ¡Salud, {displayAlias}! ¡Bienvenido!
                  </h2>

                  <p className="mt-2.5 sm:mt-4 text-[#26201b] leading-relaxed font-normal text-[clamp(0.9rem,1.45vw,1.25rem)]">
                    Ya sabés cómo es esto: me toca abrirte las puertas y darte el
                    primer abrazo. Por ser el primero en copar el predio, con los
                    muchachos te elegimos para armar la LISTA de esta noche.{' '}
                    <strong className="font-bold text-[#110d0a] group-hover:text-[#b91c1c] transition-colors">
                      ¡Vení que te muestro cómo!
                    </strong>
                  </p>
                </div>
              )}

              {/* Speech Bubble Tail Pointing Down-Left Toward Tete */}
              <svg
                aria-hidden="true"
                viewBox="0 0 140 90"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="pointer-events-none absolute -bottom-[42px] sm:-bottom-[66px] left-6 sm:left-14 w-20 sm:w-32 h-auto"
              >
                <path d="M 38 0 L 6 84 L 116 4 Z" fill="#0b0908" />
                <path d="M 45 0 L 18 68 L 104 2 Z" fill="#dec499" />
                <path
                  d="M 42 4 L 18 68 L 102 4"
                  stroke="#181310"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* External Action Buttons (Outside the Speech Bubble, Bottom-Right) */}
            <div className="mt-6 sm:mt-10 mr-1 sm:mr-3 flex flex-wrap items-center justify-end gap-3 sm:gap-6">
              {welcomePhase === 'ask_name' ? (
                <>
                  <button
                    type="button"
                    onClick={handleConfirmInitialName}
                    className="px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider bg-[#b91c1c] hover:bg-[#dc2626] text-[#f5efe2] border-2 border-[#f59e0b]/70 rounded flex items-center gap-2 cursor-pointer transition-all shadow-[0_8px_24px_rgba(0,0,0,0.85)] hover:scale-[1.02]"
                  >
                    <span>Confirmar Nombre y Entrar</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleConfirmInitialName();
                      onClose();
                    }}
                    className="px-2 py-1.5 text-xs sm:text-sm font-semibold tracking-widest uppercase text-[#f5efe2] hover:text-[#f59e0b] underline underline-offset-4 cursor-pointer transition-colors"
                  >
                    OMITIR
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onDismissWelcomeGreeting}
                    className="px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider bg-[#b91c1c] hover:bg-[#dc2626] text-[#f5efe2] border-2 border-[#f59e0b]/70 rounded flex items-center gap-2 cursor-pointer transition-all shadow-[0_8px_24px_rgba(0,0,0,0.85)] hover:scale-[1.02]"
                  >
                    <span>Ver guía rápida</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-2 py-1.5 text-xs sm:text-sm font-semibold tracking-widest uppercase text-[#f5efe2] hover:text-[#f59e0b] underline underline-offset-4 cursor-pointer transition-colors"
                  >
                    OMITIR
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
