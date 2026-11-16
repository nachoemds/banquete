// src/utils/albumArtGenerator.ts

const BASE_URL = import.meta.env.BASE_URL || './';
function withBase(assetPath: string): string {
  const clean = assetPath.replace(/^\/+/, '');
  return `${BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`}${clean}`;
}

export const OFFICIAL_LOGO_URL = withBase('/assets/aistudio/images_1332e974.webp');

/**
 * Map of the 11 studio albums to their official original album cover artwork
 * extracted from the official streaming catalog and stored in /public/assets/albums/.
 */
export const OFFICIAL_ALBUM_COVERS: Record<string, string> = {
  'Esquivando Charcos': withBase('/assets/albums/esquivando_charcos.jpg'),
  'A Donde Me Lleva la Vida': withBase('/assets/albums/a_donde_me_lleva_la_vida.jpg'),
  'Despedazado por Mil Partes': withBase('/assets/albums/despedazado_por_mil_partes.jpg'),
  'La Renga (La Estrella)': withBase('/assets/albums/la_renga_1998.jpg'),
  'La Esquina del Infinito': withBase('/assets/albums/la_esquina_del_infinito.jpg'),
  'Detonador de Sueños': withBase('/assets/albums/detonador_de_suenos.jpg'),
  'Truenotierra': withBase('/assets/albums/truenotierra.jpg'),
  'Algún Rayo': withBase('/assets/albums/algun_rayo.jpg'),
  'Pesados Vestigios': withBase('/assets/albums/pesados_vestigios.jpg'),
  'Alejado de la Red': withBase('/assets/albums/alejado_de_la_red.jpg'),
  'Totalmente Poseídos': withBase('/assets/albums/totalmente_poseidos.jpg'),
};

/**
 * Returns the official original album cover artwork URL for any La Renga album.
 */
export function getAlbumCoverDataUrl(albumName: string): string {
  if (OFFICIAL_ALBUM_COVERS[albumName]) {
    return OFFICIAL_ALBUM_COVERS[albumName];
  }
  const matchedKey = Object.keys(OFFICIAL_ALBUM_COVERS).find((k) =>
    albumName.toLowerCase().includes(k.toLowerCase())
  );
  if (matchedKey) {
    return OFFICIAL_ALBUM_COVERS[matchedKey];
  }
  return OFFICIAL_LOGO_URL;
}

/**
 * Draws the iconic hand-lettered "LA RENGA" logo (yellow fill, red inner rim,
 * thick black 3D extrusion + underline bar) onto any 2D canvas context.
 */
export function drawHandLetteredLaRengaLogo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale = 1
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.rotate(-0.12);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = '900 46px "Pirata One", Georgia, serif';
  for (let d = 9; d >= 1; d--) {
    ctx.fillStyle = '#090706';
    ctx.fillText('LA', -22 - d * 0.9, -28 + d * 0.9);
    ctx.font = '900 62px "Pirata One", Georgia, serif';
    ctx.fillText('RENGA', 4 - d * 0.9, 18 + d * 0.9);
  }

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#090706';
  ctx.lineWidth = 11;
  ctx.font = '900 46px "Pirata One", Georgia, serif';
  ctx.strokeText('LA', -22, -28);
  ctx.font = '900 62px "Pirata One", Georgia, serif';
  ctx.strokeText('RENGA', 4, 18);

  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 5.5;
  ctx.font = '900 46px "Pirata One", Georgia, serif';
  ctx.strokeText('LA', -22, -28);
  ctx.font = '900 62px "Pirata One", Georgia, serif';
  ctx.strokeText('RENGA', 4, 18);

  ctx.fillStyle = '#f59e0b';
  ctx.font = '900 46px "Pirata One", Georgia, serif';
  ctx.fillText('LA', -22, -28);
  ctx.font = '900 62px "Pirata One", Georgia, serif';
  ctx.fillText('RENGA', 4, 18);

  ctx.beginPath();
  ctx.moveTo(-88, 52);
  ctx.quadraticCurveTo(5, 44, 102, 46);
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#090706';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-84, 49);
  ctx.quadraticCurveTo(5, 41, 100, 43);
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#dc2626';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-82, 48);
  ctx.quadraticCurveTo(5, 40, 98, 42);
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = '#f59e0b';
  ctx.stroke();

  ctx.restore();
}
