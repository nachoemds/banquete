// src/components/BanqueteOnboardingModal.tsx
import React, { useState } from 'react';
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
  X,
} from 'lucide-react';

import { SITE_COPY } from '../data/siteCopy';

interface BanqueteOnboardingModalProps {
  isOpen: boolean;
  setlistCount: number;
  onClose: () => void;
  onOpenBuilder: () => void;
  onOpenOracle: () => void;
  onAutoFillDemo: () => void;
}

const STEPS = SITE_COPY.onboarding.steps;

export const BanqueteOnboardingModal: React.FC<BanqueteOnboardingModalProps> = ({
  isOpen,
  setlistCount,
  onClose,
  onOpenBuilder,
  onOpenOracle,
  onAutoFillDemo,
}) => {
  const [stepIdx, setStepIdx] = useState<number>(0);

  if (!isOpen) return null;

  const currentStep = STEPS[stepIdx];

  return (
    <div
      className="fixed inset-0 z-40 bg-black/85 flex items-center justify-center p-4 select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="sketch-panel rounded w-full max-w-4xl overflow-hidden flex flex-col border-2 border-[#544034] bg-[#140f0d] shadow-2xl">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1b1411] border-b border-[#3a2c24]">
          <div className="flex items-center gap-3">
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
                className={`px-4 py-2.5 text-left border-r last:border-r-0 border-[#261d19] transition-colors cursor-pointer flex items-center gap-2.5 ${
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
        <div className="p-6 md:p-8 flex-1 overflow-y-auto">
          <div className="mb-6">
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
                    Elegí tema por tema entre los <strong className="text-[#f5efe2]">11 discos de estudio</strong> de La Renga. Podés ordenar la lista, escuchar el riff de cada tema o autocompletar los 36.
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
                    Tu lista de 36 canciones se mide en 5 rubros (<strong className="text-[#f5efe2]">Apertura/Cierre, Viaje por los Discos, Pogo, Joyas de Culto y Puntaje Total</strong>) contra 4 rivales legendarios como <em>La Olla del Ducó &apos;99</em> o <em>El Oráculo de Mataderos</em>.
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
        </div>

        {/* Footer Navigation & Primary CTA */}
        <div className="px-6 py-4 bg-[#191310] border-t border-[#3a2c24] flex flex-wrap items-center justify-between gap-3">
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
              onClick={() => {
                onClose();
                onOpenBuilder();
              }}
              className="px-4 py-2 text-xs font-semibold bg-[#b91c1c] hover:bg-[#dc2626] text-white rounded border border-[#f59e0b]/40 flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Empezar a Armar mi Setlist (36 Temas)</span>
            </button>

            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium sketch-card hover:bg-[#2a201b] text-[#f5efe2] rounded cursor-pointer"
            >
              Ver la Playa 3D
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
