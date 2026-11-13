// src/utils/banqueteScoring.ts
import { LaRengaSong, LA_RENGA_ALBUMS } from '../data/laRengaSongs';

export interface ScoringWeights {
  openerWeight: number;   // default 15
  closerWeight: number;   // default 20
  eraBalanceWeight: number; // default 25
  dynamicsWeight: number; // default 20
  cultMixWeight: number;  // default 20
}

export interface ScoreBreakdownItem {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  verdict: string;
  detail: string;
}

export interface BanqueteScoreResult {
  totalScore: number;
  maxPossible: number;
  completionRatio: number; // 0 to 1 (out of 36 songs)
  rankTitle: string;
  rankDescription: string;
  crowdSpirit: string;
  totalDurationFormatted: string;
  breakdown: ScoreBreakdownItem[];
  badges: string[];
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  openerWeight: 15,
  closerWeight: 20,
  eraBalanceWeight: 25,
  dynamicsWeight: 20,
  cultMixWeight: 20,
};

export function calculateBanqueteScore(
  setlist: LaRengaSong[],
  weights: ScoringWeights = DEFAULT_WEIGHTS
): BanqueteScoreResult {
  const count = setlist.length;
  const completionRatio = Math.min(count / 36, 1);

  const totalSec = setlist.reduce((acc, s) => acc + s.durationSec, 0);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const totalDurationFormatted =
    hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;

  if (count === 0) {
    return {
      totalScore: 0,
      maxPossible: 10000,
      completionRatio: 0,
      rankTitle: 'Predio Vacío (Armando Prueba de Sonido)',
      rankDescription: 'Todavía no subieron los equipos al escenario. Elegí las primeras canciones para abrir los portones.',
      crowdSpirit: 'Las banderas esperan en la entrada',
      totalDurationFormatted: '0 min',
      breakdown: [],
      badges: [],
    };
  }

  // Normalize weights so total max is 10,000
  const weightSum =
    weights.openerWeight +
    weights.closerWeight +
    weights.eraBalanceWeight +
    weights.dynamicsWeight +
    weights.cultMixWeight || 100;

  const maxOpener = Math.round((weights.openerWeight / weightSum) * 10000);
  const maxCloser = Math.round((weights.closerWeight / weightSum) * 10000);
  const maxEra = Math.round((weights.eraBalanceWeight / weightSum) * 10000);
  const maxDynamics = Math.round((weights.dynamicsWeight / weightSum) * 10000);
  const maxCult =
    10000 - (maxOpener + maxCloser + maxEra + maxDynamics);

  // 1. APERTURA DEMOLEDORA (#1)
  const firstSong = setlist[0];
  let openerRaw = 0.45;
  let openerVerdict = 'Arranque tibio';
  if (firstSong.isIdealOpener) {
    openerRaw = 1.0;
    openerVerdict = `¡Arranque demoledor con "${firstSong.title}"!`;
  } else if (firstSong.energy === 'pogo' || firstSong.energy === 'himno') {
    openerRaw = 0.8;
    openerVerdict = `Buen sacudón inicial con "${firstSong.title}"`;
  } else {
    openerVerdict = `"${firstSong.title}" es un temazo pero inusual para apagar las luces`;
  }
  const openerScore = Math.round(maxOpener * openerRaw * (0.4 + 0.6 * completionRatio));

  // 2. CIERRE SAGRADO (#36 o último actual)
  const lastSong = setlist[count - 1];
  let closerRaw = 0.35;
  let closerVerdict = 'Falta el broche ritual';
  if (lastSong.title === 'Hablando de la libertad') {
    closerRaw = 1.0;
    closerVerdict = 'Cierre sagrado e indiscutible: "Hablando de la libertad"';
  } else if (lastSong.isIdealCloser) {
    closerRaw = 0.88;
    closerVerdict = `Cierre épico de caravana con "${lastSong.title}"`;
  } else if (lastSong.energy === 'himno' || lastSong.energy === 'pogo') {
    closerRaw = 0.68;
    closerVerdict = `Cierre bien arriba con "${lastSong.title}"`;
  }
  const closerScore = Math.round(maxCloser * closerRaw * (0.3 + 0.7 * completionRatio));

  // 3. EQUILIBRIO DE ÉPOCAS (11 discos)
  const uniqueAlbums = new Set(setlist.map((s) => s.album)).size;
  const totalAlbums = LA_RENGA_ALBUMS.length; // 11
  const eraRaw = Math.min(uniqueAlbums / 9, 1); // 9+ albums gives full era score
  const eraScore = Math.round(maxEra * eraRaw * (0.25 + 0.75 * completionRatio));
  const eraVerdict =
    uniqueAlbums >= 9
      ? `Viaje completo por ${uniqueAlbums} de los ${totalAlbums} discos`
      : uniqueAlbums >= 5
      ? `Recorrido por ${uniqueAlbums} discos de la banda`
      : `Concentrado en ${uniqueAlbums} disco(s)`;

  // 4. CURVA DE POGO Y RESPIRACIÓN (Dinámica)
  const pogoCount = setlist.filter((s) => s.energy === 'pogo').length;
  const breatherCount = setlist.filter(
    (s) => s.energy === 'balada' || s.energy === 'oculto'
  ).length;
  // Check transitions so there aren't 12 slow songs or 25 pogos without air
  let transitionsBonus = 0;
  for (let i = 1; i < count; i++) {
    if (setlist[i].energy !== setlist[i - 1].energy) {
      transitionsBonus += 1;
    }
  }
  const transitionRatio = count > 1 ? Math.min(transitionsBonus / (count * 0.55), 1) : 0.5;
  const hasGoodBreathers = breatherCount >= Math.max(1, Math.floor(count * 0.14)) && breatherCount <= Math.ceil(count * 0.38);
  const dynamicsRaw = Math.min(
    1,
    transitionRatio * 0.65 + (hasGoodBreathers ? 0.35 : 0.15)
  );
  const dynamicsScore = Math.round(maxDynamics * dynamicsRaw * completionRatio);
  const dynamicsVerdict = hasGoodBreathers
    ? `${pogoCount} pogos feroces y ${breatherCount} bajadas bluseras/baladas para tomar aire`
    : pogoCount > count * 0.7
    ? '¡Pogo sin respiro! Peligro de acalambramiento masivo en el campo'
    : 'Show de pulso rockero constante';

  // 5. MÍSTICA DE CULTO + HIMNOS INMORTALES
  const classicsCount = setlist.filter((s) => s.rarity === 1).length;
  const cultCount = setlist.filter((s) => s.rarity === 3).length;
  const deepCutsRatio = Math.min(cultCount / Math.max(1, Math.floor(count * 0.18)), 1);
  const anthemsRatio = Math.min(classicsCount / Math.max(1, Math.floor(count * 0.42)), 1);
  const cultRaw = anthemsRatio * 0.6 + deepCutsRatio * 0.4;
  const cultScore = Math.round(maxCult * cultRaw * completionRatio);
  const cultVerdict =
    cultCount >= 5 && classicsCount >= 12
      ? `Mezcla ideal: ${classicsCount} himnos de estadio + ${cultCount} joyas ocultas`
      : cultCount >= 5
      ? `Banquete bien de culto (${cultCount} lados B para entendidos)`
      : `${classicsCount} himnos clásicos y ${cultCount} rarezas`;

  const totalScore =
    openerScore + closerScore + eraScore + dynamicsScore + cultScore;

  // Badges
  const badges: string[] = [];
  if (count === 36) badges.push('Banquete Completo (36/36)');
  if (firstSong.title === 'Panic Show' || firstSong.title === 'A la carga mi rocanrol') {
    badges.push('Estallido Inicial');
  }
  if (lastSong.title === 'Hablando de la libertad' && count === 36) {
    badges.push('Cierre Ritual en Libertad');
  }
  if (uniqueAlbums >= 9) {
    badges.push('Historiador de Mataderos');
  }
  if (cultCount >= 6) {
    badges.push('Arqueólogo del Charco');
  }
  if (pogoCount >= 14) {
    badges.push('Olla Popular en el Campo');
  }

  let rankTitle = 'Telonero del Camino';
  let rankDescription = 'El campo se empieza a poblar. Sumá hasta llegar a las 36 canciones para desatar el Banquete definitivo.';
  let crowdSpirit = 'Gente entrando por los portones con los primeros trapos';

  if (count < 36) {
    rankTitle = `Armando la Lista (${count}/36 canciones)`;
    rankDescription = `Tu setlist actual suma ${totalScore.toLocaleString('es-AR')} pts proyectados. Completá los ${36 - count} lugares restantes para alcanzar el puntaje final del Banquete.`;
    crowdSpirit = `${Math.round(completionRatio * 100)}% del campo ocupado acercándose a las vallas`;
  } else if (totalScore >= 9000) {
    rankTitle = 'Leyenda del Autódromo y Huracán';
    rankDescription = 'Un Banquete histórico e irrepetible. Apertura explosiva, viaje por todas las épocas, joyas para los viejos rengos y el cierre sagrado.';
    crowdSpirit = 'Campo colmado, bengalas encendidas y pogo desde la valla hasta el fondo';
  } else if (totalScore >= 7800) {
    rankTitle = 'Caudillo de Los Mismos de Siempre';
    rankDescription = 'Setlist demoledor de ruta y barro. La banda suena ajustada y la gente no deja de saltar en las 3 horas de show.';
    crowdSpirit = 'Banderas flameando bien alto y ronda gigante en el medio del campo';
  } else if (totalScore >= 6200) {
    rankTitle = 'Peregrino de la Estrella';
    rankDescription = 'Gran noche de rocanrol, aunque podés ajustar el orden de apertura/cierre o sumar algún disco olvidado para romper el récord.';
    crowdSpirit = 'El pogo se arma en cada clásico frente a las torres de sonido';
  } else {
    rankTitle = 'Banquete Experimental de Trinchera';
    rankDescription = 'Una lista fuera de todos los manuales. Ideal para sorprender, aunque varios himnos quedaron afuera.';
    crowdSpirit = 'Los fanáticos debaten la lista mientras agitan los trapos';
  }

  return {
    totalScore,
    maxPossible: 10000,
    completionRatio,
    rankTitle,
    rankDescription,
    crowdSpirit,
    totalDurationFormatted,
    badges,
    breakdown: [
      {
        id: 'opener',
        label: 'Apertura del Show (#01)',
        score: openerScore,
        maxScore: maxOpener,
        verdict: openerVerdict,
        detail: 'Evalúa la potencia del primer tema cuando se apagan las luces del estadio.',
      },
      {
        id: 'closer',
        label: 'Ritual de Cierre (#36)',
        score: closerScore,
        maxScore: maxCloser,
        verdict: closerVerdict,
        detail: 'Premia cerrar con Hablando de la libertad o himnos épicos de despedida.',
      },
      {
        id: 'eras',
        label: 'Viaje Discográfico (1991–2024)',
        score: eraScore,
        maxScore: maxEra,
        verdict: eraVerdict,
        detail: 'Puntúa la presencia de los 11 discos de estudio en las 36 canciones.',
      },
      {
        id: 'dynamics',
        label: 'Curva de Pogo & Oxígeno',
        score: dynamicsScore,
        maxScore: maxDynamics,
        verdict: dynamicsVerdict,
        detail: 'Equilibrio entre pogos demoledores y bluses/baladas para recuperar el aliento.',
      },
      {
        id: 'cult',
        label: 'Mística: Himnos + Joyas de Culto',
        score: cultScore,
        maxScore: maxCult,
        verdict: cultVerdict,
        detail: 'Combinación de clásicos infaltables con lados B profundos para fanáticos.',
      },
    ],
  };
}
