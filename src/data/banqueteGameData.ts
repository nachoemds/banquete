// src/data/banqueteGameData.ts
import { LaRengaSong } from './laRengaSongs';

export type MilestoneKey =
  | 'opener'
  | 'earlyAnthem'
  | 'cultGem'
  | 'midPogo'
  | 'preCloser'
  | 'closer';

export interface HistoricalMilestone {
  key: MilestoneKey;
  slotLabel: string;
  positionLabel: string;
  clue: string;
  songId: string;
  optionsIds: string[]; // 4 curated choices including the real songId for accessible deduction
}

export interface HistoricalChallenge {
  id: string;
  title: string;
  date: string;
  venue: string;
  city: string;
  attendance: string;
  difficulty: 'Clásico' | 'Ruta' | 'Culto';
  summary: string;
  generalClues: string[];
  milestones: HistoricalMilestone[];
  fullSetlistIds: string[];
  rewardTicketTitle: string;
  unlockableRewardId?: StageUnlockableId;
}

export type StageUnlockableId =
  | 'stage_fire'
  | 'stadium_lasers'
  | 'guest_musician'
  | 'golden_pyro';

export interface StageUnlockable {
  id: StageUnlockableId;
  name: string;
  subtitle: string;
  requirementText: string;
  effectDescription: string;
}

export interface GuestMusicianTier {
  id: string;
  name: string;
  nickname: string;
  instrument: string;
  minScore: number;
  assetUrl: string;
  iconicSongHint: string;
}

/**
 * Escalera de Invitados según los Puntos del Banquete.
 * Por ahora todos los escalones usan el asset ilustrado de El Carpo (/assets/aistudio/Carpo_01_619377f6.png)
 * hasta que vayas subiendo los PNG de los demás invitados.
 */
export const GUEST_MUSICIANS_BY_SCORE: GuestMusicianTier[] = [
  {
    id: 'guest_carpo',
    name: 'Norberto "Pappo" Napolitano',
    nickname: 'El Carpo',
    instrument: 'Guitarra Gibson Les Paul',
    minScore: 2000,
    assetUrl: '/assets/aistudio/Carpo_01_619377f6.png',
    iconicSongHint: 'Hey Hey My My / Rock and Roll y Fiebre',
  },
  {
    id: 'guest_sokol',
    name: 'Alejandro "Bocha" Sokol',
    nickname: 'El Bocha (Próx. Asset)',
    instrument: 'Voz Invitada',
    minScore: 5500,
    assetUrl: '/assets/aistudio/Carpo_01_619377f6.png',
    iconicSongHint: 'El final es en donde partí (River 2002)',
  },
  {
    id: 'guest_mollo',
    name: 'Ricardo Mollo',
    nickname: 'Mollo (Próx. Asset)',
    instrument: 'Guitarra Fender Stratocaster',
    minScore: 7500,
    assetUrl: '/assets/aistudio/Carpo_01_619377f6.png',
    iconicSongHint: 'Balada del diablo y la muerte / El final es en donde partí',
  },
  {
    id: 'guest_smilari',
    name: 'Nacho Smilari',
    nickname: 'Leyenda de Huracán (Próx. Asset)',
    instrument: 'Guitarra Invitada',
    minScore: 9000,
    assetUrl: '/assets/aistudio/Carpo_01_619377f6.png',
    iconicSongHint: 'Panic Show (Huracán 2017)',
  },
];

export function getActiveGuestForScore(score: number): GuestMusicianTier {
  const unlocked = GUEST_MUSICIANS_BY_SCORE.filter((g) => score >= g.minScore);
  return unlocked[unlocked.length - 1] || GUEST_MUSICIANS_BY_SCORE[0];
}

export interface RivalBanquete {
  id: string;
  name: string;
  archetype: string;
  difficulty: 'Accesible' | 'Picante' | 'Histórico' | 'Leyenda';
  challengeQuote: string;
  songIds: string[];
  rewardBadgeId: string;
}

export interface CollectibleTicket {
  id: string;
  serialNumber: string;
  title: string;
  subtitle: string;
  venue: string;
  dateIssued: string;
  score: number;
  mode: 'setlist' | 'oraculo' | 'duelo';
  openerTitle: string;
  closerTitle: string;
  stampText: string;
  badgesEarned: string[];
}

export interface LeaderboardEntry {
  id: string;
  banqueteName: string;
  author: string;
  totalScore: number;
  openerTitle: string;
  closerTitle: string;
  albumsCount: number;
  badgesCount: number;
  dateLabel: string;
  isPlayer: boolean;
}

export interface RengaTrophy {
  id: string;
  name: string;
  description: string;
  conditionText: string;
}

export interface GameProgressState {
  unlockedStageIds: StageUnlockableId[];
  enabledStageIds: StageUnlockableId[];
  earnedTrophyIds: string[];
  solvedOracleIds: string[];
  defeatedRivalIds: string[];
  tickets: CollectibleTicket[];
  leaderboard: LeaderboardEntry[];
}

// 3 Rare Bonus Cult Songs unlocked when Golden Pyro / Cult Rarity is unlocked
export const BONUS_CULT_SONGS: LaRengaSong[] = [
  {
    id: 'rar-1',
    title: 'Hey Hey, My My (Zapada con El Carpo)',
    album: 'La Esquina del Infinito',
    year: 2000,
    duration: '5:18',
    durationSec: 318,
    energy: 'himno',
    rarity: 3,
    isIdealCloser: true,
    albumColor: '#d97706',
    youtubeId: '1w7OgIMMRc4',
    tempoBpm: 126,
  },
  {
    id: 'rar-2',
    title: 'Moscas verdes (Versión Cruda de Ensayo 1991)',
    album: 'Esquivando Charcos',
    year: 1991,
    duration: '4:32',
    durationSec: 272,
    energy: 'oculto',
    rarity: 3,
    albumColor: '#a16207',
    youtubeId: '3JZ_D3ELwOQ',
    tempoBpm: 136,
  },
  {
    id: 'rar-3',
    title: 'Estrella de la Ruta (Instrumental de Caravana)',
    album: 'Totalmente Poseídos',
    year: 2024,
    duration: '4:48',
    durationSec: 288,
    energy: 'oculto',
    rarity: 3,
    isIdealOpener: true,
    albumColor: '#be123c',
    youtubeId: 'Zi_XLOBDo_Y',
    tempoBpm: 142,
  },
];

export const STAGE_UNLOCKABLES: StageUnlockable[] = [
  {
    id: 'stage_fire',
    name: 'Lanzallamas de Valla & Escenario',
    subtitle: '6 columnas de fuego vivo frente a Chizzo, Tete y Tanque',
    requirementText: 'Superar 7.500 pts en tu Banquete o ganar 1 Duelo de Setlists',
    effectDescription:
      'Enciende 6 bocas de fuego real en el borde delantero del escenario que lanzan llamaradas al agitar o sonar un pogo.',
  },
  {
    id: 'stadium_lasers',
    name: 'Haces de Luz de Huracán',
    subtitle: 'Reflectores aéreos cruzando el cielo nocturno de Necochea',
    requirementText: 'Adivinar al menos 4 hitos en cualquier fecha del Oráculo o ganar 2 Duelos',
    effectDescription:
      'Suma haces lumínicos volumétricos ámbar y carmesí desde los puentes de luces hacia el pogo y el mar.',
  },
  {
    id: 'guest_musician',
    name: 'Invitado en Tablas: El Carpo (Pappo)',
    subtitle: 'Se van destrabando nuevos músicos invitados en el escenario según tus puntos',
    requirementText: 'Escalones de Puntos: 2.000 pts (El Carpo) · 5.500 pts · 7.500 pts · 9.000 pts',
    effectDescription:
      'Sube al flanco derecho del escenario 3D a El Carpo con su Les Paul (y futuros invitados desbloqueables según el puntaje de tu Banquete).',
  },
  {
    id: 'golden_pyro',
    name: 'Chispas Doradas + 3 Rarezas Inéditas',
    subtitle: 'Pirotecnia dorada en las torres y 3 temas ocultos extra en el catálogo',
    requirementText: 'Coleccionar 3 Entradas Históricas o vencer al Jefe Final de Mataderos',
    effectDescription:
      'Desbloquea lluvia de chispas doradas sobre las pantallas laterales y habilita 3 canciones inéditas de culto en el armador.',
  },
];

export const RENGA_TROPHIES: RengaTrophy[] = [
  {
    id: 'tr_first_banquete',
    name: 'Boleto de Caravana',
    description: 'Armaste y evaluaste un Banquete completo de 36 canciones.',
    conditionText: 'Completar 36 canciones en la lista',
  },
  {
    id: 'tr_huracan_oracle',
    name: 'Vidente del Ducó',
    description: 'Descifraste los momentos clave de una noche histórica en el Oráculo.',
    conditionText: 'Lograr 4 o más aciertos en el Oráculo de Shows Reales',
  },
  {
    id: 'tr_duel_winner',
    name: 'Rey de la Valla',
    description: 'Derrotaste a un setlist rival en el Mano a Mano por rubros.',
    conditionText: 'Ganar tu primer Duelo de Setlists',
  },
  {
    id: 'tr_nine_thousand',
    name: 'Leyenda de los 9.000',
    description: 'Alcanzaste un puntaje de excelencia superior a 9.000 puntos sobre 10.000.',
    conditionText: 'Superar 9.000 pts con un Banquete de 36 temas',
  },
  {
    id: 'tr_all_eras',
    name: 'Historiador de Mataderos',
    description: 'Incluiste canciones de al menos 9 discos de estudio distintos en tu show.',
    conditionText: 'Representar 9 o más discos en tu setlist',
  },
  {
    id: 'tr_cult_digger',
    name: 'Arqueólogo del Charco',
    description: 'Desenterraste al menos 6 joyas ocultas (Lados B) en una misma noche.',
    conditionText: 'Sumar 6 o más Joyas de Culto en la lista',
  },
  {
    id: 'tr_boss_slayer',
    name: 'Caudillo de Los Mismos de Siempre',
    description: 'Venciste al Oráculo de Mataderos, el rival más difícil del juego.',
    conditionText: 'Derrotar a El Oráculo de Mataderos en modo Duelo',
  },
  {
    id: 'tr_collector',
    name: 'Archivo Vivo del Banquete',
    description: 'Reuniste 4 o más Entradas Históricas troqueladas en tu vitrina.',
    conditionText: 'Coleccionar 4 Entradas Históricas',
  },
];

export const HISTORICAL_CHALLENGES: HistoricalChallenge[] = [
  {
    id: 'huracan-1999',
    title: 'Huracán 1999 · El Rito del Fin de Milenio',
    date: '4 de Diciembre de 1999',
    venue: 'Estadio Tomás Adolfo Ducó',
    city: 'Parque Patricios, CABA',
    attendance: '42.000 fanáticos',
    difficulty: 'Clásico',
    summary:
      'Una de las noches más míticas de los años 90. Con el disco de la Estrella recién consagrado, La Renga hizo temblar el cemento de Huracán en dos noches históricas grabadas a fuego.',
    generalClues: [
      'El show abrió sin anestesia con una ráfaga del disco de la Estrella (1998).',
      'Despedazado por Mil Partes (1996) aportó los himnos más coreados y el cierre ritual.',
      'En el tramo medio desenterraron un blues lento y largo de Esquivando Charcos (1991).',
    ],
    milestones: [
      {
        key: 'opener',
        slotLabel: 'Hito #01 · Apertura Explosiva',
        positionLabel: 'Tema #01',
        clue: 'Del disco de la Estrella (1998): pura víscera y sentimiento desde el primer acorde.',
        songId: 'lr-2', // Tripa y corazón
        optionsIds: ['lr-2', 'dp-2', 'ec-1', 'lr-1'],
      },
      {
        key: 'earlyAnthem',
        slotLabel: 'Hito #02 · Himno del Primer Tramo',
        positionLabel: 'Tema #06',
        clue: 'Clásico de 1996 sobre una pócima amarga que corre por las venas.',
        songId: 'dp-4', // Veneno
        optionsIds: ['dp-4', 'ad-3', 'lr-6', 'dp-3'],
      },
      {
        key: 'cultGem',
        slotLabel: 'Hito #03 · Joya Oculta / Respiro Blusero',
        positionLabel: 'Tema #14',
        clue: 'Blues espeso de más de 5 minutos perteneciente al primer disco de 1991.',
        songId: 'ec-9', // Blues de Bolivia
        optionsIds: ['ec-9', 'ad-4', 'dp-8', 'lr-7'],
      },
      {
        key: 'midPogo',
        slotLabel: 'Hito #04 · Estallido de la Olla Central',
        positionLabel: 'Tema #21',
        clue: 'Orden de batalla rocanrolera de 1996 a 162 BPM que hizo saltar todo el Ducó.',
        songId: 'dp-2', // A la carga mi rocanrol
        optionsIds: ['dp-2', 'lr-3', 'ad-9', 'ec-1'],
      },
      {
        key: 'preCloser',
        slotLabel: 'Hito #05 · Antesala de los Bises',
        positionLabel: 'Tema #35',
        clue: 'Reflexión de ruta donde el final y el punto de partida se vuelven uno solo.',
        songId: 'dp-5', // El final es en donde partí
        optionsIds: ['dp-5', 'dp-11', 'lr-4', 'ec-5'],
      },
      {
        key: 'closer',
        slotLabel: 'Hito #06 · Cierre Sagrado',
        positionLabel: 'Tema #36',
        clue: 'El himno innegociable cuando se encienden las luces del estadio.',
        songId: 'dp-10', // Hablando de la libertad
        optionsIds: ['dp-10', 'dp-6', 'lr-6', 'ec-1'],
      },
    ],
    fullSetlistIds: [
      'lr-2', 'lr-1', 'lr-3', 'ec-1', 'ad-2', 'dp-4', 'dp-1', 'dp-3', 'lr-5',
      'lr-6', 'lr-9', 'ec-2', 'ec-4', 'ec-9', 'ad-1', 'ad-3', 'ad-6', 'ad-8',
      'ad-9', 'ad-11', 'dp-2', 'dp-6', 'dp-7', 'dp-8', 'dp-9', 'lr-4', 'lr-7',
      'lr-8', 'lr-10', 'lr-11', 'ec-5', 'ec-7', 'ec-8', 'dp-11', 'dp-5', 'dp-10',
    ],
    rewardTicketTitle: 'Entrada Histórica: Huracán 04/12/1999',
    unlockableRewardId: 'stadium_lasers',
  },
  {
    id: 'autodromo-2007',
    title: 'Autódromo 2007 · El Monstruo de 90.000 Almas',
    date: '17 de Noviembre de 2007',
    venue: 'Autódromo Óscar y Juan Gálvez',
    city: 'Villa Riachuelo, CABA',
    attendance: '90.000 fanáticos',
    difficulty: 'Ruta',
    summary:
      'La consagración multitudinaria presentando Truenotierra en el asfalto del Autódromo. Un escenario colosal de 36 canciones recorriendo toda la ruta de la banda.',
    generalClues: [
      'La apertura fue con el primer corte demoledor de Truenotierra (2006).',
      'Sonó el himno rutero por excelencia dedicado a la carretera que cruza el país.',
      'Rescataron una joya oculta psicodélica de Despedazado por Mil Partes (1996).',
    ],
    milestones: [
      {
        key: 'opener',
        slotLabel: 'Hito #01 · Apertura en el Asfalto',
        positionLabel: 'Tema #01',
        clue: 'Primer tema de Truenotierra (2006): una bestia que no para de agigantarse.',
        songId: 'tt-1', // El monstruo que crece
        optionsIds: ['tt-1', 'ei-4', 'ds-2', 'dp-2'],
      },
      {
        key: 'earlyAnthem',
        slotLabel: 'Hito #02 · Himno de Carretera',
        positionLabel: 'Tema #08',
        clue: 'Homenaje de 2006 a la mítica ruta nacional que bordea la Cordillera.',
        songId: 'tt-3', // Ruta 40
        optionsIds: ['tt-3', 'tt-6', 'ei-2', 'ds-1'],
      },
      {
        key: 'cultGem',
        slotLabel: 'Hito #03 · Joya Oculta Psicodélica',
        positionLabel: 'Tema #17',
        clue: 'Lado B hipnótico de 1996 inspirado en un hongo sagrado mexicano.',
        songId: 'dp-8', // Psilocybe mexicana
        optionsIds: ['dp-8', 'tt-8', 'ds-11', 'ei-8'],
      },
      {
        key: 'midPogo',
        slotLabel: 'Hito #04 · Rugido del León en la Recta',
        positionLabel: 'Tema #24',
        clue: 'Clásico del año 2000 a 164 BPM que desató el pogo más grande del Gálvez.',
        songId: 'ei-4', // Panic Show
        optionsIds: ['ei-4', 'ei-10', 'ds-2', 'lr-2'],
      },
      {
        key: 'preCloser',
        slotLabel: 'Hito #05 · Clásico de Detonador antes del Final',
        positionLabel: 'Tema #34',
        clue: 'Himno emotivo de 2003 que pregunta por el motivo que te frena en el camino.',
        songId: 'ds-4', // La razón que te demora
        optionsIds: ['ds-4', 'dp-5', 'ei-9', 'tt-6'],
      },
      {
        key: 'closer',
        slotLabel: 'Hito #06 · Despedida de las 90.000 Almas',
        positionLabel: 'Tema #36',
        clue: 'El broche eterno de cada Banquete.',
        songId: 'dp-10', // Hablando de la libertad
        optionsIds: ['dp-10', 'dp-11', 'ds-4', 'ec-1'],
      },
    ],
    fullSetlistIds: [
      'tt-1', 'tt-2', 'ds-1', 'ds-2', 'ei-1', 'ei-2', 'lr-2', 'tt-3', 'tt-4',
      'tt-6', 'dp-1', 'dp-2', 'dp-3', 'ec-1', 'ec-5', 'ad-3', 'dp-8', 'tt-7',
      'tt-8', 'ds-5', 'ds-8', 'ds-9', 'ei-7', 'ei-4', 'ei-9', 'ei-10', 'lr-1',
      'lr-4', 'lr-6', 'dp-4', 'dp-6', 'tt-5', 'dp-11', 'ds-4', 'dp-5', 'dp-10',
    ],
    rewardTicketTitle: 'Entrada Histórica: Autódromo Gálvez 17/11/2007',
    unlockableRewardId: 'stage_fire',
  },
  {
    id: 'potrero-2018',
    title: 'Potrero de los Funes 2018 · Banquete entre las Sierras',
    date: '7 de Abril de 2018',
    venue: 'Circuito Internacional Potrero de los Funes',
    city: 'San Luis',
    attendance: '45.000 fanáticos',
    difficulty: 'Ruta',
    summary:
      'Caravana federal de todo el país rodeando el lago y las sierras de San Luis, con fuerte presencia de Pesados Vestigios y joyas de los 90.',
    generalClues: [
      'El arranque fue con el tema que abre Pesados Vestigios (2014).',
      'Dedicaron el himno rutero de ese mismo disco a los viajeros y peregrinos.',
      'Sorprendieron con un lado B filosófico de La Esquina del Infinito (2000).',
    ],
    milestones: [
      {
        key: 'opener',
        slotLabel: 'Hito #01 · Arranque en las Sierras',
        positionLabel: 'Tema #01',
        clue: 'Apertura de Pesados Vestigios (2014): un pulso que se escapa a toda velocidad.',
        songId: 'pv-1', // Corazón fugitivo
        optionsIds: ['pv-1', 'ar-1', 'pv-7', 'dp-2'],
      },
      {
        key: 'earlyAnthem',
        slotLabel: 'Hito #02 · Himno de los Viajeros',
        positionLabel: 'Tema #07',
        clue: 'Canción de 2014 dedicada a las tribus que van de ciudad en ciudad sin dueño.',
        songId: 'pv-2', // Nómades
        optionsIds: ['pv-2', 'pv-4', 'tt-3', 'ar-3'],
      },
      {
        key: 'cultGem',
        slotLabel: 'Hito #03 · Perla Oculta del 2000',
        positionLabel: 'Tema #16',
        clue: 'Joya de culto de La Esquina del Infinito sobre resistir erguido.',
        songId: 'ei-8', // En pie
        optionsIds: ['ei-8', 'pv-8', 'ar-7', 'ec-3'],
      },
      {
        key: 'midPogo',
        slotLabel: 'Hito #04 · Rueda de Motos y Pogo',
        positionLabel: 'Tema #23',
        clue: 'Riff valvular de 2014 que une las dos pasiones: los motores y el rock.',
        songId: 'pv-7', // Motorock
        optionsIds: ['pv-7', 'ei-2', 'pv-6', 'ar-4'],
      },
      {
        key: 'preCloser',
        slotLabel: 'Hito #05 · Clásico del Diablo',
        positionLabel: 'Tema #34',
        clue: 'Relato épico de más de 6 minutos donde dos personajes cruzan la calle.',
        songId: 'dp-6', // Balada del diablo y la muerte
        optionsIds: ['dp-6', 'ds-4', 'dp-5', 'lr-6'],
      },
      {
        key: 'closer',
        slotLabel: 'Hito #06 · Cierre Frente al Lago',
        positionLabel: 'Tema #36',
        clue: 'La despedida sagrada bajo las estrellas de San Luis.',
        songId: 'dp-10',
        optionsIds: ['dp-10', 'dp-11', 'dp-5', 'ec-1'],
      },
    ],
    fullSetlistIds: [
      'pv-1', 'pv-6', 'ar-1', 'ar-3', 'tt-1', 'ds-1', 'pv-2', 'pv-3', 'pv-4',
      'dp-1', 'dp-2', 'lr-2', 'lr-4', 'ei-1', 'ei-2', 'ei-8', 'pv-5', 'pv-8',
      'ar-5', 'ar-7', 'tt-3', 'tt-6', 'pv-7', 'ei-4', 'ei-7', 'ei-9', 'ds-2',
      'ds-9', 'ec-1', 'ec-5', 'ad-3', 'ad-8', 'lr-6', 'dp-6', 'dp-5', 'dp-10',
    ],
    rewardTicketTitle: 'Entrada Histórica: Potrero de los Funes 07/04/2018',
    unlockableRewardId: 'guest_musician',
  },
  {
    id: 'necochea-2024',
    title: 'Playa de Necochea 2024 · El Banquete Junto al Mar',
    date: '28 de Diciembre de 2024',
    venue: 'Predio Costero / Playa de Necochea',
    city: 'Necochea, Costa Atlántica',
    attendance: '50.000 fanáticos',
    difficulty: 'Culto',
    summary:
      'El show que inspira nuestro escenario 3D: las olas a la izquierda, las 4 motos chopper estacionadas bajo las pantallas y el estreno de Totalmente Poseídos.',
    generalClues: [
      'Abrieron con el tema homónimo de la película documental estrenada en 2024.',
      'Combinaron la frescura de Alejado de la Red (2022) con himnos de todas las décadas.',
      'Desenterraron una joya oculta de Detonador de Sueños (2003) muy pedida en los trapos.',
    ],
    milestones: [
      {
        key: 'opener',
        slotLabel: 'Hito #01 · Apertura frente al Océano',
        positionLabel: 'Tema #01',
        clue: 'Estreno furioso de 2024 que le da nombre al documental de ruta de la banda.',
        songId: 'tp-1', // Totalmente poseídos
        optionsIds: ['tp-1', 'al-1', 'ei-4', 'dp-2'],
      },
      {
        key: 'earlyAnthem',
        slotLabel: 'Hito #02 · Saludo de Ruta 2024',
        positionLabel: 'Tema #05',
        clue: 'Himno fraternal de 2024 deseando buen viaje a cada compañero de caravana.',
        songId: 'tp-2', // Buena ruta hermano
        optionsIds: ['tp-2', 'tp-3', 'al-3', 'tt-3'],
      },
      {
        key: 'cultGem',
        slotLabel: 'Hito #03 · Joya Oculta en la Arena',
        positionLabel: 'Tema #15',
        clue: 'Rareza intensa de Detonador de Sueños (2003) con sangre helada en el título.',
        songId: 'ds-11', // Hielasangre
        optionsIds: ['ds-11', 'al-7', 'ec-6', 'ad-10'],
      },
      {
        key: 'midPogo',
        slotLabel: 'Hito #04 · Pogo Pesado de 2022',
        positionLabel: 'Tema #20',
        clue: 'De Alejado de la Red (2022): paquidermos haciendo temblar la costa.',
        songId: 'al-4', // Elefantes pogueando
        optionsIds: ['al-4', 'al-2', 'pv-7', 'ei-10'],
      },
      {
        key: 'preCloser',
        slotLabel: 'Hito #05 · El Viento Costero',
        positionLabel: 'Tema #35',
        clue: 'Clásico de 1996 ideal para cuando sopla la brisa del Atlántico.',
        songId: 'dp-11', // El viento que todo empuja
        optionsIds: ['dp-11', 'dp-5', 'ds-4', 'ei-9'],
      },
      {
        key: 'closer',
        slotLabel: 'Hito #06 · Cierre Bajo la Luna de Necochea',
        positionLabel: 'Tema #36',
        clue: 'El himno final con las 15 banderas de palo flameando frente al mar.',
        songId: 'dp-10',
        optionsIds: ['dp-10', 'dp-5', 'lr-6', 'ec-1'],
      },
    ],
    fullSetlistIds: [
      'tp-1', 'al-1', 'al-2', 'dp-2', 'tp-2', 'tp-3', 'al-3', 'pv-1', 'pv-4',
      'ar-1', 'ar-3', 'tt-1', 'tt-3', 'ds-1', 'ds-11', 'ei-2', 'ei-4', 'ei-7',
      'ei-9', 'al-4', 'al-5', 'al-7', 'lr-1', 'lr-2', 'lr-4', 'lr-6', 'dp-1',
      'dp-3', 'dp-4', 'dp-6', 'ad-3', 'ad-8', 'ec-1', 'ec-5', 'dp-11', 'dp-10',
    ],
    rewardTicketTitle: 'Entrada Histórica: Necochea Playa 28/12/2024',
    unlockableRewardId: 'golden_pyro',
  },
];

export const RIVAL_BANQUETES: RivalBanquete[] = [
  {
    id: 'rival-charco-91',
    name: 'El Rengo del Charco \'91',
    archetype: 'Purista de la Primera Época (91–96)',
    difficulty: 'Accesible',
    challengeQuote:
      '«Para mí el Banquete son los tres primeros discos al palo y blues del barro. ¡A ver si tu lista tiene más mística!»',
    songIds: [
      'ec-1', 'ec-2', 'ec-3', 'ec-4', 'ec-5', 'ec-6', 'ec-7', 'ec-8', 'ec-9',
      'ad-1', 'ad-2', 'ad-3', 'ad-4', 'ad-5', 'ad-6', 'ad-7', 'ad-8', 'ad-9',
      'ad-10', 'ad-11', 'dp-1', 'dp-2', 'dp-3', 'dp-4', 'dp-6', 'dp-7', 'dp-8',
      'dp-9', 'lr-1', 'lr-2', 'lr-4', 'lr-6', 'ei-4', 'dp-11', 'dp-5', 'dp-10',
    ],
    rewardBadgeId: 'tr_duel_winner',
  },
  {
    id: 'rival-pogo-sin-aire',
    name: 'La Olla del Ducó \'99',
    archetype: 'Fanático del Pogo Demoledor',
    difficulty: 'Picante',
    challengeQuote:
      '«En mi lista nadie se sienta a descansar: 25 pogos seguidos desde que se apagan las luces. ¿Te da el aire para ganarme?»',
    songIds: [
      'ei-4', 'dp-2', 'lr-2', 'lr-1', 'lr-3', 'lr-5', 'lr-9', 'ec-1', 'ad-2',
      'ad-7', 'ad-9', 'ad-11', 'ei-1', 'ei-2', 'ei-10', 'ds-2', 'ds-3', 'ds-10',
      'tt-1', 'tt-4', 'ar-1', 'ar-4', 'pv-1', 'pv-6', 'pv-7', 'al-2', 'al-4',
      'tp-1', 'dp-1', 'dp-4', 'lr-4', 'lr-6', 'tt-3', 'ds-4', 'dp-5', 'dp-10',
    ],
    rewardBadgeId: 'tr_duel_winner',
  },
  {
    id: 'rival-ruta-40',
    name: 'Caudillo de la Ruta 40',
    archetype: 'Viajero Federal de los 11 Discos',
    difficulty: 'Histórico',
    challengeQuote:
      '«Recorrí cada kilómetro desde Ushuaia a La Quiaca. Mi lista equilibra todas las épocas y tiene los respiros justos.»',
    songIds: [
      'dp-2', 'tt-1', 'lr-2', 'ei-2', 'ds-1', 'ar-1', 'pv-1', 'al-1', 'tp-1',
      'ec-1', 'ad-3', 'dp-4', 'lr-4', 'ei-7', 'ds-9', 'tt-3', 'tt-6', 'ar-3',
      'pv-2', 'al-3', 'tp-2', 'ec-9', 'ad-4', 'dp-8', 'lr-11', 'ei-8', 'ds-6',
      'tt-8', 'ar-7', 'pv-4', 'dp-6', 'ei-4', 'lr-6', 'ds-4', 'dp-5', 'dp-10',
    ],
    rewardBadgeId: 'tr_all_eras',
  },
  {
    id: 'rival-oraculo-mataderos',
    name: 'El Oráculo de Mataderos',
    archetype: 'Jefe Final · Curador Supremo del Banquete',
    difficulty: 'Leyenda',
    challengeQuote:
      '«Armé la lista definitiva: apertura con Panic Show, los 11 discos presentes, 7 joyas de culto, curva perfecta de oxígeno y cierre en libertad.»',
    songIds: [
      'ei-4', 'dp-2', 'lr-2', 'ec-1', 'ds-1', 'tt-1', 'ar-1', 'pv-1', 'tp-1',
      'dp-1', 'lr-4', 'ei-2', 'ds-2', 'tt-3', 'ar-3', 'al-1', 'ad-3', 'ec-5',
      'dp-8', 'ec-9', 'ad-8', 'dp-3', 'lr-6', 'ei-7', 'ds-9', 'tt-6', 'ar-5',
      'pv-4', 'al-3', 'dp-6', 'ei-8', 'ds-11', 'tt-8', 'ds-4', 'dp-5', 'dp-10',
    ],
    rewardBadgeId: 'tr_boss_slayer',
  },
];

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'seed-1',
    banqueteName: 'El Oráculo de Mataderos (Récord)',
    author: 'Archivo Histórico',
    totalScore: 9520,
    openerTitle: 'Panic Show',
    closerTitle: 'Hablando de la libertad',
    albumsCount: 11,
    badgesCount: 6,
    dateLabel: 'Récord Histórico',
    isPlayer: false,
  },
  {
    id: 'seed-2',
    banqueteName: 'Caravana de la Ruta 40',
    author: 'Caudillo Federal',
    totalScore: 8940,
    openerTitle: 'A la carga mi rocanrol',
    closerTitle: 'Hablando de la libertad',
    albumsCount: 11,
    badgesCount: 5,
    dateLabel: 'Potrero 2018',
    isPlayer: false,
  },
  {
    id: 'seed-3',
    banqueteName: 'Noche Mítica en el Ducó',
    author: 'La Olla del 99',
    totalScore: 8380,
    openerTitle: 'Tripa y corazón',
    closerTitle: 'Hablando de la libertad',
    albumsCount: 9,
    badgesCount: 4,
    dateLabel: 'Huracán 1999',
    isPlayer: false,
  },
  {
    id: 'seed-4',
    banqueteName: 'Trinchera del Charco 1991',
    author: 'Viejo Rengo',
    totalScore: 7690,
    openerTitle: 'Somos los mismos de siempre',
    closerTitle: 'Hablando de la libertad',
    albumsCount: 6,
    badgesCount: 4,
    dateLabel: 'Obras 1995',
    isPlayer: false,
  },
];

const STORAGE_KEY = 'la_renga_banquete_game_v1';

export function loadGameProgress(): GameProgressState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GameProgressState;
      return {
        unlockedStageIds: Array.isArray(parsed.unlockedStageIds) ? parsed.unlockedStageIds : [],
        enabledStageIds: Array.isArray(parsed.enabledStageIds) ? parsed.enabledStageIds : [],
        earnedTrophyIds: Array.isArray(parsed.earnedTrophyIds) ? parsed.earnedTrophyIds : [],
        solvedOracleIds: Array.isArray(parsed.solvedOracleIds) ? parsed.solvedOracleIds : [],
        defeatedRivalIds: Array.isArray(parsed.defeatedRivalIds) ? parsed.defeatedRivalIds : [],
        tickets: Array.isArray(parsed.tickets) ? parsed.tickets : [],
        leaderboard:
          Array.isArray(parsed.leaderboard) && parsed.leaderboard.length > 0
            ? parsed.leaderboard
            : INITIAL_LEADERBOARD,
      };
    }
  } catch {
    // Ignore storage read issues
  }
  return {
    unlockedStageIds: ['guest_musician'],
    enabledStageIds: ['guest_musician'],
    earnedTrophyIds: [],
    solvedOracleIds: [],
    defeatedRivalIds: [],
    tickets: [],
    leaderboard: INITIAL_LEADERBOARD,
  };
}

export function saveGameProgress(state: GameProgressState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota issues
  }
}
