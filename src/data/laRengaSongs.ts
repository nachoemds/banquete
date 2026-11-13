// src/data/laRengaSongs.ts

export type SongEnergy = 'pogo' | 'himno' | 'rock' | 'balada' | 'oculto';

export interface LaRengaSong {
  id: string;
  title: string;
  album: string;
  year: number;
  duration: string;
  durationSec: number;
  energy: SongEnergy;
  rarity: 1 | 2 | 3; // 1 = Clásico Inmortal, 2 = Fija del Banquete, 3 = Joya de Culto
  isIdealOpener?: boolean;
  isIdealCloser?: boolean;
  albumColor: string;
  youtubeId: string;
  tempoBpm: number;
}

export interface AlbumInfo {
  name: string;
  year: number;
  color: string;
  coverMotif: string;
}

export const LA_RENGA_ALBUMS: AlbumInfo[] = [
  { name: 'Esquivando Charcos', year: 1991, color: '#a16207', coverMotif: 'Charco & Sombra' },
  { name: 'A Donde Me Lleva la Vida', year: 1993, color: '#dc2626', coverMotif: 'Ruta & Destino' },
  { name: 'Despedazado por Mil Partes', year: 1996, color: '#ea580c', coverMotif: 'Ángel Despedazado' },
  { name: 'La Renga (La Estrella)', year: 1998, color: '#e11d48', coverMotif: 'Estrella de Cinco Puntas' },
  { name: 'La Esquina del Infinito', year: 2000, color: '#d97706', coverMotif: 'Esquina & Abismo' },
  { name: 'Detonador de Sueños', year: 2003, color: '#ef4444', coverMotif: 'Engranaje Explosivo' },
  { name: 'Truenotierra', year: 2006, color: '#b45309', coverMotif: 'Relámpago & Barro' },
  { name: 'Algún Rayo', year: 2010, color: '#0284c7', coverMotif: 'Rayo Cósmico' },
  { name: 'Pesados Vestigios', year: 2014, color: '#991b1b', coverMotif: 'Desierto & Acantilado' },
  { name: 'Alejado de la Red', year: 2022, color: '#7c2d12', coverMotif: 'Fuga & Libertad' },
  { name: 'Totalmente Poseídos', year: 2024, color: '#be123c', coverMotif: 'Ruta & Motocicleta' },
];

export const LA_RENGA_SONGS: LaRengaSong[] = [
  // 1991 - Esquivando Charcos
  { id: 'ec-1', title: 'Somos los mismos de siempre', album: 'Esquivando Charcos', year: 1991, duration: '3:28', durationSec: 208, energy: 'pogo', rarity: 1, isIdealOpener: true, albumColor: '#a16207', youtubeId: 'L_jWHffIx5E', tempoBpm: 152 },
  { id: 'ec-2', title: 'Moscas verdes, para el charlatán', album: 'Esquivando Charcos', year: 1991, duration: '3:55', durationSec: 235, energy: 'rock', rarity: 2, albumColor: '#a16207', youtubeId: '3JZ_D3ELwOQ', tempoBpm: 132 },
  { id: 'ec-3', title: 'Embrolos, fatos y paquetes', album: 'Esquivando Charcos', year: 1991, duration: '4:12', durationSec: 252, energy: 'oculto', rarity: 3, albumColor: '#a16207', youtubeId: 'kXYiU_JCYtU', tempoBpm: 118 },
  { id: 'ec-4', title: 'Luciendo mi saquito blusero', album: 'Esquivando Charcos', year: 1991, duration: '3:16', durationSec: 196, energy: 'rock', rarity: 2, albumColor: '#a16207', youtubeId: '9bZkp7q19f0', tempoBpm: 124 },
  { id: 'ec-5', title: 'Voy a bailar a la nave del olvido', album: 'Esquivando Charcos', year: 1991, duration: '4:20', durationSec: 260, energy: 'himno', rarity: 1, albumColor: '#a16207', youtubeId: 'fJ9rUzIMcZQ', tempoBpm: 128 },
  { id: 'ec-6', title: 'Buseca y vino tinto', album: 'Esquivando Charcos', year: 1991, duration: '3:08', durationSec: 188, energy: 'oculto', rarity: 3, albumColor: '#a16207', youtubeId: '60ItHLz5WEA', tempoBpm: 136 },
  { id: 'ec-7', title: 'El juicio del ganso', album: 'Esquivando Charcos', year: 1991, duration: '4:45', durationSec: 285, energy: 'rock', rarity: 2, albumColor: '#a16207', youtubeId: 'YQHsXMglC9A', tempoBpm: 126 },
  { id: 'ec-8', title: 'Negra mi alma, negro mi corazón', album: 'Esquivando Charcos', year: 1991, duration: '4:05', durationSec: 245, energy: 'oculto', rarity: 2, albumColor: '#a16207', youtubeId: 'hT_nvWreIhg', tempoBpm: 115 },
  { id: 'ec-9', title: 'Blues de Bolivia', album: 'Esquivando Charcos', year: 1991, duration: '5:30', durationSec: 330, energy: 'oculto', rarity: 3, albumColor: '#a16207', youtubeId: 'JGwWNGJdvx8', tempoBpm: 96 },

  // 1993 - A Donde Me Lleva la Vida
  { id: 'ad-1', title: 'El camino del deshielo', album: 'A Donde Me Lleva la Vida', year: 1993, duration: '4:18', durationSec: 258, energy: 'rock', rarity: 2, albumColor: '#dc2626', youtubeId: 'RgKAFK5djSk', tempoBpm: 134 },
  { id: 'ad-2', title: 'Cortala y olvidala', album: 'A Donde Me Lleva la Vida', year: 1993, duration: '3:32', durationSec: 212, energy: 'pogo', rarity: 2, albumColor: '#dc2626', youtubeId: 'OPf0YbXqDm0', tempoBpm: 146 },
  { id: 'ad-3', title: 'El rito de los corazones sangrando', album: 'A Donde Me Lleva la Vida', year: 1993, duration: '4:05', durationSec: 245, energy: 'himno', rarity: 1, albumColor: '#dc2626', youtubeId: '09R8_2nJtjg', tempoBpm: 130 },
  { id: 'ad-4', title: 'Blues cardíaco', album: 'A Donde Me Lleva la Vida', year: 1993, duration: '4:50', durationSec: 290, energy: 'balada', rarity: 2, albumColor: '#dc2626', youtubeId: 'pRpeEdMmmQ0', tempoBpm: 92 },
  { id: 'ad-5', title: 'Pisando el césped', album: 'A Donde Me Lleva la Vida', year: 1993, duration: '3:44', durationSec: 224, energy: 'oculto', rarity: 3, albumColor: '#dc2626', youtubeId: 'uelHwf8o7_U', tempoBpm: 122 },
  { id: 'ad-6', title: '2+2=3', album: 'A Donde Me Lleva la Vida', year: 1993, duration: '3:58', durationSec: 238, energy: 'rock', rarity: 2, albumColor: '#dc2626', youtubeId: 'e-ORhEE9VVg', tempoBpm: 135 },
  { id: 'ad-7', title: 'El sátiro de la mala leche', album: 'A Donde Me Lleva la Vida', year: 1993, duration: '3:22', durationSec: 202, energy: 'pogo', rarity: 3, albumColor: '#dc2626', youtubeId: 'CevxZvSJLk8', tempoBpm: 148 },
  { id: 'ad-8', title: 'Triste canción de amor', album: 'A Donde Me Lleva la Vida', year: 1993, duration: '5:02', durationSec: 302, energy: 'balada', rarity: 1, albumColor: '#dc2626', youtubeId: 'nfWlot6h_JM', tempoBpm: 88 },
  { id: 'ad-9', title: 'El mambo de la botella', album: 'A Donde Me Lleva la Vida', year: 1993, duration: '3:40', durationSec: 220, energy: 'pogo', rarity: 2, albumColor: '#dc2626', youtubeId: 'lp-EO5I60KA', tempoBpm: 150 },
  { id: 'ad-10', title: 'Debbie el fantasma', album: 'A Donde Me Lleva la Vida', year: 1993, duration: '3:28', durationSec: 208, energy: 'oculto', rarity: 3, albumColor: '#dc2626', youtubeId: 'RBumgq5yVrA', tempoBpm: 140 },
  { id: 'ad-11', title: 'El circo romano', album: 'A Donde Me Lleva la Vida', year: 1993, duration: '4:09', durationSec: 249, energy: 'pogo', rarity: 2, albumColor: '#dc2626', youtubeId: '2Vv-BfVoq4g', tempoBpm: 145 },

  // 1996 - Despedazado por Mil Partes
  { id: 'dp-1', title: 'Desnudo para siempre (o Despedazado por mil partes)', album: 'Despedazado por Mil Partes', year: 1996, duration: '4:08', durationSec: 248, energy: 'himno', rarity: 1, isIdealOpener: true, albumColor: '#ea580c', youtubeId: 'ktvTqknDobU', tempoBpm: 132 },
  { id: 'dp-2', title: 'A la carga mi rocanrol', album: 'Despedazado por Mil Partes', year: 1996, duration: '3:52', durationSec: 232, energy: 'pogo', rarity: 1, isIdealOpener: true, albumColor: '#ea580c', youtubeId: 'bo_efYhYU2A', tempoBpm: 162 },
  { id: 'dp-3', title: 'Lo frágil de la locura', album: 'Despedazado por Mil Partes', year: 1996, duration: '4:15', durationSec: 255, energy: 'himno', rarity: 1, albumColor: '#ea580c', youtubeId: '7wtfhZwyrcc', tempoBpm: 128 },
  { id: 'dp-4', title: 'Veneno', album: 'Despedazado por Mil Partes', year: 1996, duration: '4:02', durationSec: 242, energy: 'himno', rarity: 1, albumColor: '#ea580c', youtubeId: 'hLQl3WQQoQ0', tempoBpm: 130 },
  { id: 'dp-5', title: 'El final es en donde partí', album: 'Despedazado por Mil Partes', year: 1996, duration: '4:38', durationSec: 278, energy: 'himno', rarity: 1, isIdealCloser: true, albumColor: '#ea580c', youtubeId: 'fKopy74weus', tempoBpm: 134 },
  { id: 'dp-6', title: 'Balada del diablo y la muerte', album: 'Despedazado por Mil Partes', year: 1996, duration: '6:42', durationSec: 402, energy: 'himno', rarity: 1, albumColor: '#ea580c', youtubeId: '1w7OgIMMRc4', tempoBpm: 108 },
  { id: 'dp-7', title: 'Cuando vendrán', album: 'Despedazado por Mil Partes', year: 1996, duration: '4:20', durationSec: 260, energy: 'rock', rarity: 2, albumColor: '#ea580c', youtubeId: 'v2AC41dglnM', tempoBpm: 125 },
  { id: 'dp-8', title: 'Psilocybe mexicana', album: 'Despedazado por Mil Partes', year: 1996, duration: '5:26', durationSec: 326, energy: 'oculto', rarity: 3, albumColor: '#ea580c', youtubeId: '5NPBIwQyPWE', tempoBpm: 112 },
  { id: 'dp-9', title: 'Paja brava', album: 'Despedazado por Mil Partes', year: 1996, duration: '6:10', durationSec: 370, energy: 'oculto', rarity: 3, albumColor: '#ea580c', youtubeId: 'lDK9QqIzhwk', tempoBpm: 116 },
  { id: 'dp-10', title: 'Hablando de la libertad', album: 'Despedazado por Mil Partes', year: 1996, duration: '6:02', durationSec: 362, energy: 'himno', rarity: 1, isIdealCloser: true, albumColor: '#ea580c', youtubeId: 'n4RjJKxsamQ', tempoBpm: 124 },
  { id: 'dp-11', title: 'El viento que todo empuja', album: 'Despedazado por Mil Partes', year: 1996, duration: '5:35', durationSec: 335, energy: 'himno', rarity: 1, isIdealCloser: true, albumColor: '#ea580c', youtubeId: '8SbUC-UaAxE', tempoBpm: 120 },

  // 1998 - La Renga (La Estrella)
  { id: 'lr-1', title: 'El terco', album: 'La Renga (La Estrella)', year: 1998, duration: '4:12', durationSec: 252, energy: 'pogo', rarity: 1, isIdealOpener: true, albumColor: '#e11d48', youtubeId: 'YR5ApYxkU-U', tempoBpm: 144 },
  { id: 'lr-2', title: 'Tripa y corazón', album: 'La Renga (La Estrella)', year: 1998, duration: '3:35', durationSec: 215, energy: 'pogo', rarity: 1, isIdealOpener: true, albumColor: '#e11d48', youtubeId: 'tAGnKpE4NCI', tempoBpm: 156 },
  { id: 'lr-3', title: 'Bien alto', album: 'La Renga (La Estrella)', year: 1998, duration: '3:48', durationSec: 228, energy: 'pogo', rarity: 1, albumColor: '#e11d48', youtubeId: 'CD-E-LDc384', tempoBpm: 152 },
  { id: 'lr-4', title: 'El hombre de la estrella', album: 'La Renga (La Estrella)', year: 1998, duration: '4:05', durationSec: 245, energy: 'himno', rarity: 1, albumColor: '#e11d48', youtubeId: 'vx2u5uUu3DE', tempoBpm: 136 },
  { id: 'lr-5', title: 'Vende patria clon', album: 'La Renga (La Estrella)', year: 1998, duration: '3:20', durationSec: 200, energy: 'pogo', rarity: 2, albumColor: '#e11d48', youtubeId: '0J2QdDbelmY', tempoBpm: 158 },
  { id: 'lr-6', title: 'El revelde', album: 'La Renga (La Estrella)', year: 1998, duration: '3:55', durationSec: 235, energy: 'himno', rarity: 1, albumColor: '#e11d48', youtubeId: 'gCYcHz2k5x0', tempoBpm: 142 },
  { id: 'lr-7', title: 'Me hice canción', album: 'La Renga (La Estrella)', year: 1998, duration: '4:30', durationSec: 270, energy: 'balada', rarity: 2, albumColor: '#e11d48', youtubeId: 'hTWKbfoikeg', tempoBpm: 95 },
  { id: 'lr-8', title: 'Cuando estés acá', album: 'La Renga (La Estrella)', year: 1998, duration: '4:18', durationSec: 258, energy: 'rock', rarity: 2, albumColor: '#e11d48', youtubeId: 'XFkzRNyygfk', tempoBpm: 122 },
  { id: 'lr-9', title: 'El twist del pibe', album: 'La Renga (La Estrella)', year: 1998, duration: '3:12', durationSec: 192, energy: 'pogo', rarity: 2, albumColor: '#e11d48', youtubeId: 'Zi_XLOBDo_Y', tempoBpm: 160 },
  { id: 'lr-10', title: 'Reíte', album: 'La Renga (La Estrella)', year: 1998, duration: '5:08', durationSec: 308, energy: 'himno', rarity: 2, albumColor: '#e11d48', youtubeId: '450p7goxZqg', tempoBpm: 124 },
  { id: 'lr-11', title: 'Ser yo', album: 'La Renga (La Estrella)', year: 1998, duration: '3:50', durationSec: 230, energy: 'oculto', rarity: 3, albumColor: '#e11d48', youtubeId: 'kffacxfA7G4', tempoBpm: 118 },

  // 2000 - La Esquina del Infinito
  { id: 'ei-1', title: 'La vida, las mismas calles', album: 'La Esquina del Infinito', year: 2000, duration: '3:42', durationSec: 222, energy: 'pogo', rarity: 1, isIdealOpener: true, albumColor: '#d97706', youtubeId: 'b8m9zhNAgKs', tempoBpm: 150 },
  { id: 'ei-2', title: 'Motoralmaisangre', album: 'La Esquina del Infinito', year: 2000, duration: '3:54', durationSec: 234, energy: 'pogo', rarity: 1, albumColor: '#d97706', youtubeId: 'uelHwf8o7_U', tempoBpm: 154 },
  { id: 'ei-3', title: 'Al que he sangrado', album: 'La Esquina del Infinito', year: 2000, duration: '3:30', durationSec: 210, energy: 'rock', rarity: 2, albumColor: '#d97706', youtubeId: 'fJ9rUzIMcZQ', tempoBpm: 132 },
  { id: 'ei-4', title: 'Panic Show', album: 'La Esquina del Infinito', year: 2000, duration: '3:25', durationSec: 205, energy: 'pogo', rarity: 1, isIdealOpener: true, albumColor: '#d97706', youtubeId: '1w7OgIMMRc4', tempoBpm: 164 },
  { id: 'ei-5', title: 'El cielo del desengaño', album: 'La Esquina del Infinito', year: 2000, duration: '4:40', durationSec: 280, energy: 'balada', rarity: 2, albumColor: '#d97706', youtubeId: 'n4RjJKxsamQ', tempoBpm: 98 },
  { id: 'ei-6', title: 'Arte infernal', album: 'La Esquina del Infinito', year: 2000, duration: '3:46', durationSec: 226, energy: 'rock', rarity: 2, albumColor: '#d97706', youtubeId: 'v2AC41dglnM', tempoBpm: 138 },
  { id: 'ei-7', title: 'En el baldío', album: 'La Esquina del Infinito', year: 2000, duration: '4:06', durationSec: 246, energy: 'himno', rarity: 1, albumColor: '#d97706', youtubeId: '8SbUC-UaAxE', tempoBpm: 126 },
  { id: 'ei-8', title: 'En pie', album: 'La Esquina del Infinito', year: 2000, duration: '4:15', durationSec: 255, energy: 'oculto', rarity: 3, albumColor: '#d97706', youtubeId: 'tAGnKpE4NCI', tempoBpm: 112 },
  { id: 'ei-9', title: 'El rey de la triste felicidad', album: 'La Esquina del Infinito', year: 2000, duration: '4:22', durationSec: 262, energy: 'himno', rarity: 1, albumColor: '#d97706', youtubeId: 'CD-E-LDc384', tempoBpm: 134 },
  { id: 'ei-10', title: 'Estalla', album: 'La Esquina del Infinito', year: 2000, duration: '4:02', durationSec: 242, energy: 'pogo', rarity: 1, albumColor: '#d97706', youtubeId: 'vx2u5uUu3DE', tempoBpm: 156 },
  { id: 'ei-11', title: 'Las cosas que hace', album: 'La Esquina del Infinito', year: 2000, duration: '4:55', durationSec: 295, energy: 'oculto', rarity: 3, albumColor: '#d97706', youtubeId: 'gCYcHz2k5x0', tempoBpm: 118 },

  // 2003 - Detonador de Sueños
  { id: 'ds-1', title: 'A tu lado', album: 'Detonador de Sueños', year: 2003, duration: '3:50', durationSec: 230, energy: 'himno', rarity: 1, isIdealOpener: true, albumColor: '#ef4444', youtubeId: 'hTWKbfoikeg', tempoBpm: 146 },
  { id: 'ds-2', title: 'Detonador de sueños', album: 'Detonador de Sueños', year: 2003, duration: '3:28', durationSec: 208, energy: 'pogo', rarity: 1, isIdealOpener: true, albumColor: '#ef4444', youtubeId: 'XFkzRNyygfk', tempoBpm: 162 },
  { id: 'ds-3', title: 'El ojo del huracán', album: 'Detonador de Sueños', year: 2003, duration: '4:08', durationSec: 248, energy: 'pogo', rarity: 2, albumColor: '#ef4444', youtubeId: 'Zi_XLOBDo_Y', tempoBpm: 150 },
  { id: 'ds-4', title: 'La razón que te demora', album: 'Detonador de Sueños', year: 2003, duration: '4:56', durationSec: 296, energy: 'himno', rarity: 1, isIdealCloser: true, albumColor: '#ef4444', youtubeId: '450p7goxZqg', tempoBpm: 128 },
  { id: 'ds-5', title: 'Dementes en el espacio', album: 'Detonador de Sueños', year: 2003, duration: '3:45', durationSec: 225, energy: 'rock', rarity: 2, albumColor: '#ef4444', youtubeId: 'kffacxfA7G4', tempoBpm: 138 },
  { id: 'ds-6', title: 'Estado', album: 'Detonador de Sueños', year: 2003, duration: '3:32', durationSec: 212, energy: 'oculto', rarity: 3, albumColor: '#ef4444', youtubeId: 'b8m9zhNAgKs', tempoBpm: 140 },
  { id: 'ds-7', title: 'Las palabras gastadas', album: 'Detonador de Sueños', year: 2003, duration: '4:14', durationSec: 254, energy: 'rock', rarity: 2, albumColor: '#ef4444', youtubeId: 'L_jWHffIx5E', tempoBpm: 126 },
  { id: 'ds-8', title: 'Noche vudú', album: 'Detonador de Sueños', year: 2003, duration: '4:02', durationSec: 242, energy: 'rock', rarity: 2, albumColor: '#ef4444', youtubeId: '3JZ_D3ELwOQ', tempoBpm: 132 },
  { id: 'ds-9', title: 'En los brazos del sol', album: 'Detonador de Sueños', year: 2003, duration: '5:10', durationSec: 310, energy: 'balada', rarity: 1, albumColor: '#ef4444', youtubeId: 'kXYiU_JCYtU', tempoBpm: 94 },
  { id: 'ds-10', title: 'Míralos', album: 'Detonador de Sueños', year: 2003, duration: '3:55', durationSec: 235, energy: 'pogo', rarity: 2, albumColor: '#ef4444', youtubeId: '9bZkp7q19f0', tempoBpm: 148 },
  { id: 'ds-11', title: 'Hielasangre', album: 'Detonador de Sueños', year: 2003, duration: '4:42', durationSec: 282, energy: 'oculto', rarity: 3, albumColor: '#ef4444', youtubeId: '60ItHLz5WEA', tempoBpm: 116 },

  // 2006 - Truenotierra
  { id: 'tt-1', title: 'El monstruo que crece', album: 'Truenotierra', year: 2006, duration: '3:48', durationSec: 228, energy: 'pogo', rarity: 1, isIdealOpener: true, albumColor: '#b45309', youtubeId: 'YQHsXMglC9A', tempoBpm: 152 },
  { id: 'tt-2', title: 'Almohada de piedra', album: 'Truenotierra', year: 2006, duration: '4:05', durationSec: 245, energy: 'rock', rarity: 1, albumColor: '#b45309', youtubeId: 'hT_nvWreIhg', tempoBpm: 134 },
  { id: 'tt-3', title: 'Ruta 40', album: 'Truenotierra', year: 2006, duration: '3:58', durationSec: 238, energy: 'himno', rarity: 1, albumColor: '#b45309', youtubeId: 'JGwWNGJdvx8', tempoBpm: 140 },
  { id: 'tt-4', title: 'La boca del lobo', album: 'Truenotierra', year: 2006, duration: '4:12', durationSec: 252, energy: 'pogo', rarity: 2, albumColor: '#b45309', youtubeId: 'RgKAFK5djSk', tempoBpm: 146 },
  { id: 'tt-5', title: 'Montaña roja', album: 'Truenotierra', year: 2006, duration: '4:30', durationSec: 270, energy: 'rock', rarity: 2, albumColor: '#b45309', youtubeId: 'OPf0YbXqDm0', tempoBpm: 124 },
  { id: 'tt-6', title: 'Oscuro diamante', album: 'Truenotierra', year: 2006, duration: '4:16', durationSec: 256, energy: 'himno', rarity: 1, albumColor: '#b45309', youtubeId: '09R8_2nJtjg', tempoBpm: 130 },
  { id: 'tt-7', title: 'Entre la niebla', album: 'Truenotierra', year: 2006, duration: '5:04', durationSec: 304, energy: 'balada', rarity: 2, albumColor: '#b45309', youtubeId: 'pRpeEdMmmQ0', tempoBpm: 98 },
  { id: 'tt-8', title: 'Cuadrado obviado', album: 'Truenotierra', year: 2006, duration: '3:50', durationSec: 230, energy: 'oculto', rarity: 3, albumColor: '#b45309', youtubeId: 'e-ORhEE9VVg', tempoBpm: 128 },
  { id: 'tt-9', title: 'Palabras estorbantes', album: 'Truenotierra', year: 2006, duration: '4:45', durationSec: 285, energy: 'oculto', rarity: 2, albumColor: '#b45309', youtubeId: 'CevxZvSJLk8', tempoBpm: 120 },

  // 2010 - Algún Rayo
  { id: 'ar-1', title: 'Canibalismo galáctico', album: 'Algún Rayo', year: 2010, duration: '3:56', durationSec: 236, energy: 'pogo', rarity: 1, isIdealOpener: true, albumColor: '#0284c7', youtubeId: 'nfWlot6h_JM', tempoBpm: 148 },
  { id: 'ar-2', title: 'Destino ciudad futura', album: 'Algún Rayo', year: 2010, duration: '3:44', durationSec: 224, energy: 'rock', rarity: 2, albumColor: '#0284c7', youtubeId: 'lp-EO5I60KA', tempoBpm: 138 },
  { id: 'ar-3', title: 'La furia de la bestia rock', album: 'Algún Rayo', year: 2010, duration: '4:20', durationSec: 260, energy: 'himno', rarity: 1, albumColor: '#0284c7', youtubeId: 'RBumgq5yVrA', tempoBpm: 126 },
  { id: 'ar-4', title: 'Poder', album: 'Algún Rayo', year: 2010, duration: '3:52', durationSec: 232, energy: 'pogo', rarity: 2, albumColor: '#0284c7', youtubeId: '2Vv-BfVoq4g', tempoBpm: 144 },
  { id: 'ar-5', title: 'Algún rayo', album: 'Algún Rayo', year: 2010, duration: '4:18', durationSec: 258, energy: 'himno', rarity: 1, albumColor: '#0284c7', youtubeId: 'ktvTqknDobU', tempoBpm: 132 },
  { id: 'ar-6', title: 'Cristálida', album: 'Algún Rayo', year: 2010, duration: '4:48', durationSec: 288, energy: 'balada', rarity: 2, albumColor: '#0284c7', youtubeId: 'bo_efYhYU2A', tempoBpm: 96 },
  { id: 'ar-7', title: 'Desoriente blues', album: 'Algún Rayo', year: 2010, duration: '4:35', durationSec: 275, energy: 'oculto', rarity: 3, albumColor: '#0284c7', youtubeId: '7wtfhZwyrcc', tempoBpm: 108 },
  { id: 'ar-8', title: 'Caricias de asfalto', album: 'Algún Rayo', year: 2010, duration: '3:58', durationSec: 238, energy: 'rock', rarity: 2, albumColor: '#0284c7', youtubeId: 'hLQl3WQQoQ0', tempoBpm: 136 },

  // 2014 - Pesados Vestigios
  { id: 'pv-1', title: 'Corazón fugitivo', album: 'Pesados Vestigios', year: 2014, duration: '4:06', durationSec: 246, energy: 'pogo', rarity: 1, isIdealOpener: true, albumColor: '#991b1b', youtubeId: 'fKopy74weus', tempoBpm: 152 },
  { id: 'pv-2', title: 'Nómades', album: 'Pesados Vestigios', year: 2014, duration: '4:12', durationSec: 252, energy: 'himno', rarity: 2, albumColor: '#991b1b', youtubeId: '5NPBIwQyPWE', tempoBpm: 134 },
  { id: 'pv-3', title: 'Mirada de acantilado', album: 'Pesados Vestigios', year: 2014, duration: '3:54', durationSec: 234, energy: 'rock', rarity: 2, albumColor: '#991b1b', youtubeId: 'lDK9QqIzhwk', tempoBpm: 138 },
  { id: 'pv-4', title: 'San Miguel', album: 'Pesados Vestigios', year: 2014, duration: '4:22', durationSec: 262, energy: 'himno', rarity: 1, albumColor: '#991b1b', youtubeId: 'YR5ApYxkU-U', tempoBpm: 124 },
  { id: 'pv-5', title: 'Sabes que', album: 'Pesados Vestigios', year: 2014, duration: '4:02', durationSec: 242, energy: 'balada', rarity: 2, albumColor: '#991b1b', youtubeId: '0J2QdDbelmY', tempoBpm: 102 },
  { id: 'pv-6', title: 'Pole', album: 'Pesados Vestigios', year: 2014, duration: '3:45', durationSec: 225, energy: 'pogo', rarity: 2, albumColor: '#991b1b', youtubeId: '1w7OgIMMRc4', tempoBpm: 156 },
  { id: 'pv-7', title: 'Motorock', album: 'Pesados Vestigios', year: 2014, duration: '3:38', durationSec: 218, energy: 'pogo', rarity: 2, albumColor: '#991b1b', youtubeId: 'n4RjJKxsamQ', tempoBpm: 160 },
  { id: 'pv-8', title: 'Masomenos blues', album: 'Pesados Vestigios', year: 2014, duration: '4:40', durationSec: 280, energy: 'oculto', rarity: 3, albumColor: '#991b1b', youtubeId: 'v2AC41dglnM', tempoBpm: 106 },

  // 2022 - Alejado de la Red
  { id: 'al-1', title: 'Parece un caso perdido', album: 'Alejado de la Red', year: 2022, duration: '4:04', durationSec: 244, energy: 'rock', rarity: 1, isIdealOpener: true, albumColor: '#7c2d12', youtubeId: '8SbUC-UaAxE', tempoBpm: 140 },
  { id: 'al-2', title: 'Buena pipa', album: 'Alejado de la Red', year: 2022, duration: '3:48', durationSec: 228, energy: 'pogo', rarity: 2, albumColor: '#7c2d12', youtubeId: 'tAGnKpE4NCI', tempoBpm: 148 },
  { id: 'al-3', title: 'Flecha en la clave', album: 'Alejado de la Red', year: 2022, duration: '4:10', durationSec: 250, energy: 'rock', rarity: 1, albumColor: '#7c2d12', youtubeId: 'CD-E-LDc384', tempoBpm: 136 },
  { id: 'al-4', title: 'Elefantes pogueando', album: 'Alejado de la Red', year: 2022, duration: '4:26', durationSec: 266, energy: 'pogo', rarity: 2, albumColor: '#7c2d12', youtubeId: 'vx2u5uUu3DE', tempoBpm: 138 },
  { id: 'al-5', title: 'Llegó la hora', album: 'Alejado de la Red', year: 2022, duration: '3:55', durationSec: 235, energy: 'himno', rarity: 2, albumColor: '#7c2d12', youtubeId: 'gCYcHz2k5x0', tempoBpm: 142 },
  { id: 'al-6', title: 'En bicicleta', album: 'Alejado de la Red', year: 2022, duration: '4:18', durationSec: 258, energy: 'rock', rarity: 2, albumColor: '#7c2d12', youtubeId: 'hTWKbfoikeg', tempoBpm: 128 },
  { id: 'al-7', title: 'Alejado de la red', album: 'Alejado de la Red', year: 2022, duration: '4:32', durationSec: 272, energy: 'oculto', rarity: 3, albumColor: '#7c2d12', youtubeId: 'XFkzRNyygfk', tempoBpm: 118 },

  // 2024 - Totalmente Poseídos
  { id: 'tp-1', title: 'Totalmente poseídos', album: 'Totalmente Poseídos', year: 2024, duration: '3:50', durationSec: 230, energy: 'pogo', rarity: 1, isIdealOpener: true, albumColor: '#be123c', youtubeId: 'Zi_XLOBDo_Y', tempoBpm: 158 },
  { id: 'tp-2', title: 'Buena ruta hermano', album: 'Totalmente Poseídos', year: 2024, duration: '4:14', durationSec: 254, energy: 'himno', rarity: 2, albumColor: '#be123c', youtubeId: '450p7goxZqg', tempoBpm: 136 },
  { id: 'tp-3', title: 'Ese lugar de ninguna parte', album: 'Totalmente Poseídos', year: 2024, duration: '4:42', durationSec: 282, energy: 'rock', rarity: 2, albumColor: '#be123c', youtubeId: 'kffacxfA7G4', tempoBpm: 124 },
];

export const PRESET_BANQUETES: {
  id: string;
  name: string;
  subtitle: string;
  songIds: string[];
}[] = [
  {
    id: 'autodromo-10000',
    name: 'Banquete Perfecto (Estadio & Culto)',
    subtitle: '36 temas equilibrando apertura explosiva, joyas de todas las épocas y cierre con Hablando de la libertad',
    songIds: [
      'ei-4', 'dp-2', 'lr-2', 'ec-1', 'ds-1', 'tt-1', 'ar-1', 'pv-1', 'tp-1',
      'dp-1', 'lr-4', 'ei-2', 'ds-2', 'tt-3', 'ar-3', 'al-1', 'ad-3', 'ec-5',
      'dp-8', 'ec-9', 'ad-8', 'dp-3', 'lr-6', 'ei-7', 'ds-9', 'tt-6', 'ar-5',
      'pv-4', 'al-3', 'dp-6', 'ei-9', 'ei-10', 'lr-1', 'ds-4', 'dp-5', 'dp-10',
    ],
  },
  {
    id: 'huracan-clasico',
    name: 'Noche de Huracán (Puro Pogo Noventoso)',
    subtitle: '36 himnos de trinchera con predominio de Esquivando Charcos, Despedazado y La Estrella',
    songIds: [
      'lr-1', 'lr-2', 'lr-3', 'dp-2', 'ec-1', 'ad-2', 'ad-9', 'ad-11', 'dp-1',
      'dp-3', 'dp-4', 'lr-4', 'lr-5', 'lr-6', 'lr-9', 'ec-2', 'ec-4', 'ec-5',
      'ec-7', 'ad-1', 'ad-3', 'ad-6', 'ad-8', 'dp-6', 'dp-7', 'dp-8', 'dp-9',
      'lr-7', 'lr-8', 'lr-10', 'ei-1', 'ei-2', 'ei-4', 'dp-11', 'dp-5', 'dp-10',
    ],
  },
  {
    id: 'ruta-federal',
    name: 'Caravana Federal (Ruta & Lados B)',
    subtitle: 'Para los que viajan miles de kilómetros buscando perlas ocultas y bluseras',
    songIds: [
      'tp-1', 'tp-2', 'al-1', 'al-4', 'pv-1', 'pv-2', 'ar-1', 'tt-3', 'ds-1',
      'ec-3', 'ec-6', 'ec-8', 'ec-9', 'ad-4', 'ad-5', 'ad-7', 'ad-10', 'dp-8',
      'dp-9', 'lr-11', 'ei-5', 'ei-8', 'ei-11', 'ds-6', 'ds-8', 'ds-11', 'tt-5',
      'tt-7', 'tt-8', 'tt-9', 'ar-6', 'ar-7', 'pv-8', 'al-7', 'ds-4', 'dp-10',
    ],
  },
];
