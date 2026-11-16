// src/utils/musicianSprites.ts
import * as THREE from 'three';

// Clean single-character PNGs for Tanque (3 poses!)
export const ASSET_TANQUE_01 = '/assets/aistudio/tanque01_42859113.png';
export const ASSET_TANQUE_02 = '/assets/aistudio/tanque02_934c73cb.png';
export const ASSET_TANQUE_03 = '/assets/aistudio/tanque03_5ff81653.png';

// Clean single-character PNGs for Tete (3 poses!)
export const ASSET_TETE_01 = '/assets/aistudio/Tete_b42dd1ea.png';
export const ASSET_TETE_02 = '/assets/aistudio/Tete02_7ed485db.png';
export const ASSET_TETE_03 = '/assets/aistudio/Tete03_913f8e0d.png';

// Clean single-character PNGs for Chizzo (3 poses!) & Manu (2 poses!)
export const ASSET_CHIZZO_01 = '/assets/aistudio/Chizzo01_e4451c94.png';
export const ASSET_CHIZZO_02 = '/assets/aistudio/Chizzo02_5b99260b.png';
export const ASSET_CHIZZO_03 = '/assets/aistudio/Chizzo03_c08903f3.png';
export const ASSET_MANU_01 = '/assets/aistudio/Manu01_c27bdfcb.png';
export const ASSET_MANU_02 = '/assets/aistudio/Manu02_df17bb1d.png';

// Clean single-character PNG for "Pibe a caballito" + Fan, Stage, Moon & Motorcycle sheets
export const ASSET_CABALLITO = '/assets/aistudio/caballito_1c79ac64.png';
export const ASSET_STAGE_01 = '/assets/aistudio/stage_01_d698b7e4.png';
export const ASSET_FANS_01 = '/assets/aistudio/fans01_1e63d578.png';
export const ASSET_FANS_02 = '/assets/aistudio/fans02_e6c03a26.png';
export const ASSET_FANS_03 = '/assets/aistudio/fans03_c1fd80af.png';
export const ASSET_FANS_04 = '/assets/aistudio/fans04_73351a61.png';
export const ASSET_BANDERAS_PALO = '/assets/aistudio/banderas_de_palo_01_ae48a44a.jpeg';
export const ASSET_BANDERAS_PALO_02 = '/assets/aistudio/Gemini_Generated_Image_inbccbinbccbinbc_30bd9821.jpeg';
export const ASSET_LUNA = '/assets/aistudio/Luna_623e8d94.png';
export const ASSET_MOTOS = '/assets/aistudio/Gemini_Generated_Image_ffaxx9ffaxx9ffax_6e1aff8c.jpeg';

export interface BandCutoutTextures {
  tanquePlaying: THREE.CanvasTexture;
  tanqueRoaring: THREE.CanvasTexture;
  tanqueCheering: THREE.CanvasTexture;
  manuSax: THREE.CanvasTexture;
  manuHarmonica: THREE.CanvasTexture;
  chizzoCheering: THREE.CanvasTexture;
  chizzoSinging: THREE.CanvasTexture;
  chizzoSolo: THREE.CanvasTexture;
  teteBass: THREE.CanvasTexture;
  teteRunning: THREE.CanvasTexture;
  teteJumping: THREE.CanvasTexture;
}

export interface StageCutoutTextures {
  stageDeck: THREE.CanvasTexture;
  marshallStacks: THREE.CanvasTexture;
  micStand: THREE.CanvasTexture;
  wedgeMonitors: THREE.CanvasTexture;
  guitarsOnStand: THREE.CanvasTexture;
  trussArch: THREE.CanvasTexture;
  laRengaBackdrop: THREE.CanvasTexture;
  flagLaRenga: THREE.CanvasTexture;
  flagElBanquete: THREE.CanvasTexture;
  flagLosMismos: THREE.CanvasTexture;
  flagEstrellas: THREE.CanvasTexture;
  vallaBarrier: THREE.CanvasTexture;
  cableBoxes: THREE.CanvasTexture;
}

export function resolvePublicAssetUrl(src: string): string {
  if (/^(https?:|data:|blob:)/.test(src)) return src;
  const base = import.meta.env.BASE_URL || './';
  const clean = src.replace(/^\/+/, '');
  return `${base.endsWith('/') ? base : `${base}/`}${clean}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = resolvePublicAssetUrl(src);
  });
}

/**
 * Crops a sprite from a white-background or pre-cutout PNG (Chizzo01..03, Manu01..02,
 * Tete01..03, tanque01..03, caballito, Luna, Motos, stage_01, fans01..04) and removes any
 * white background + interior gaps while preserving eyes & logos.
 */
function extractWhiteBgCutoutTexture(
  img: HTMLImageElement,
  crop: { x0: number; y0: number; x1: number; y1: number },
  maxAnisotropy: number,
  outW = 512,
  outH = 640,
  options: {
    clearAllWhiteGaps?: boolean;
    clearLowerWhiteGaps?: boolean;
    lowerGapYThreshold?: number;
    maskOutBoxes?: { x0: number; y0: number; x1: number; y1: number }[];
  } = {}
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;

  const sx = Math.floor(crop.x0 * img.width);
  const sy = Math.floor(crop.y0 * img.height);
  const sw = Math.floor((crop.x1 - crop.x0) * img.width);
  const sh = Math.floor((crop.y1 - crop.y0) * img.height);

  const pad = 6;
  ctx.clearRect(0, 0, outW, outH);
  ctx.drawImage(img, sx, sy, sw, sh, pad, pad, outW - pad * 2, outH - pad * 2);

  if (options.maskOutBoxes) {
    for (const box of options.maskOutBoxes) {
      const bx = Math.floor(box.x0 * outW);
      const by = Math.floor(box.y0 * outH);
      const bw = Math.ceil((box.x1 - box.x0) * outW);
      const bh = Math.ceil((box.y1 - box.y0) * outH);
      ctx.clearRect(bx, by, bw, bh);
    }
  }

  const imgData = ctx.getImageData(0, 0, outW, outH);
  const data = imgData.data;
  const total = outW * outH;
  const visited = new Uint8Array(total);

  const isWhiteBg = (idx4: number): boolean => {
    const a = data[idx4 + 3];
    if (a < 20) return true;
    const r = data[idx4];
    const g = data[idx4 + 1];
    const b = data[idx4 + 2];
    return (
      r > 224 &&
      g > 224 &&
      b > 224 &&
      Math.abs(r - g) < 16 &&
      Math.abs(g - b) < 16
    );
  };

  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const pushIfWhite = (x: number, y: number) => {
    if (x < 0 || x >= outW || y < 0 || y >= outH) return;
    const p = y * outW + x;
    if (visited[p]) return;
    const idx4 = p * 4;
    if (isWhiteBg(idx4)) {
      visited[p] = 1;
      queue[tail++] = p;
    }
  };

  for (let x = 0; x < outW; x++) {
    pushIfWhite(x, 0);
    pushIfWhite(x, outH - 1);
    pushIfWhite(x, pad);
    pushIfWhite(x, outH - 1 - pad);
  }
  for (let y = 0; y < outH; y++) {
    pushIfWhite(0, y);
    pushIfWhite(outW - 1, y);
    pushIfWhite(pad, y);
    pushIfWhite(outW - 1 - pad, y);
  }

  for (let y = pad; y < outH - pad; y += 2) {
    for (let x = pad; x < outW - pad; x += 2) {
      const p = y * outW + x;
      if (data[p * 4 + 3] < 20) {
        pushIfWhite(x, y);
      }
    }
  }

  while (head < tail) {
    const p = queue[head++];
    const idx4 = p * 4;
    data[idx4 + 3] = 0;

    const x = p % outW;
    const y = (p - x) / outW;

    if (x > 0) pushIfWhite(x - 1, y);
    if (x + 1 < outW) pushIfWhite(x + 1, y);
    if (y > 0) pushIfWhite(x, y - 1);
    if (y + 1 < outH) pushIfWhite(x, y + 1);
  }

  if (options.clearAllWhiteGaps || options.clearLowerWhiteGaps) {
    const yStart = options.clearAllWhiteGaps
      ? pad
      : Math.floor(outH * (options.lowerGapYThreshold ?? 0.45));

    for (let y = yStart; y < outH - pad; y++) {
      for (let x = pad; x < outW - pad; x++) {
        const p = y * outW + x;
        if (visited[p]) continue;
        const idx4 = p * 4;
        const r = data[idx4];
        const g = data[idx4 + 1];
        const b = data[idx4 + 2];
        if (
          r > 234 &&
          g > 234 &&
          b > 234 &&
          Math.abs(r - g) < 10 &&
          Math.abs(g - b) < 10
        ) {
          data[idx4 + 3] = 0;
        }
      }
    }
  }

  // 2-pass anti-aliasing white halo removal along the black ink outline
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 1; y < outH - 1; y++) {
      for (let x = 1; x < outW - 1; x++) {
        const p = y * outW + x;
        const idx4 = p * 4;
        if (data[idx4 + 3] === 0) continue;
        const r = data[idx4];
        const g = data[idx4 + 1];
        const b = data[idx4 + 2];
        if (r > 195 && g > 195 && b > 195 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15) {
          const hasTransparentNeighbor =
            data[(p - 1) * 4 + 3] === 0 ||
            data[(p + 1) * 4 + 3] === 0 ||
            data[(p - outW) * 4 + 3] === 0 ||
            data[(p + outW) * 4 + 3] === 0;
          if (hasTransparentNeighbor) {
            data[idx4 + 3] = 0;
          }
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Crops a pole flag ("bandera de palo") from banderas_de_palo_01_ae48a44a.jpeg,
 * which has a dark neutral-grey checkerboard background, and removes the checkerboard
 * via perimeter flood-fill + narrow pole-slit cleanup, stopping at the heavy black ink outlines.
 */
function extractCheckerboardCutoutTexture(
  img: HTMLImageElement,
  crop: { x0: number; y0: number; x1: number; y1: number },
  maxAnisotropy: number,
  outW = 520,
  outH = 620,
  maskOutSubRect?: { xMinRatio: number; yMinRatio: number }
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;

  const sx = Math.floor(crop.x0 * img.width);
  const sy = Math.floor(crop.y0 * img.height);
  const sw = Math.floor((crop.x1 - crop.x0) * img.width);
  const sh = Math.floor((crop.y1 - crop.y0) * img.height);

  const pad = 6;
  ctx.clearRect(0, 0, outW, outH);
  ctx.drawImage(img, sx, sy, sw, sh, pad, pad, outW - pad * 2, outH - pad * 2);

  if (maskOutSubRect) {
    const mx = Math.floor(outW * maskOutSubRect.xMinRatio);
    const my = Math.floor(outH * maskOutSubRect.yMinRatio);
    ctx.clearRect(mx, my, outW - mx, outH - my);
  }

  const imgData = ctx.getImageData(0, 0, outW, outH);
  const data = imgData.data;
  const total = outW * outH;
  const visited = new Uint8Array(total);

  const isInkOutline = (idx4: number): boolean => {
    const a = data[idx4 + 3];
    if (a < 20) return false;
    const r = data[idx4];
    const g = data[idx4 + 1];
    const b = data[idx4 + 2];
    return r < 34 && g < 33 && b < 32;
  };

  const isCheckerboardCandidate = (idx4: number): boolean => {
    const a = data[idx4 + 3];
    if (a < 20) return true;
    if (isInkOutline(idx4)) return false;

    const r = data[idx4];
    const g = data[idx4 + 1];
    const b = data[idx4 + 2];

    const isNeutralGrey =
      r >= 40 &&
      r <= 110 &&
      g >= 40 &&
      g <= 110 &&
      b >= 40 &&
      b <= 110 &&
      Math.abs(r - g) <= 10 &&
      Math.abs(g - b) <= 10 &&
      Math.abs(r - b) <= 12;

    return isNeutralGrey;
  };

  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const pushIfBg = (x: number, y: number) => {
    if (x < 0 || x >= outW || y < 0 || y >= outH) return;
    const p = y * outW + x;
    if (visited[p]) return;
    const idx4 = p * 4;
    if (isCheckerboardCandidate(idx4)) {
      visited[p] = 1;
      queue[tail++] = p;
    }
  };

  for (let x = 0; x < outW; x++) {
    pushIfBg(x, 0);
    pushIfBg(x, outH - 1);
    pushIfBg(x, pad);
    pushIfBg(x, outH - 1 - pad);
  }
  for (let y = 0; y < outH; y++) {
    pushIfBg(0, y);
    pushIfBg(outW - 1, y);
    pushIfBg(pad, y);
    pushIfBg(outW - 1 - pad, y);
  }

  if (maskOutSubRect) {
    const mx = Math.floor(outW * maskOutSubRect.xMinRatio);
    const my = Math.floor(outH * maskOutSubRect.yMinRatio);
    for (let x = mx; x < outW; x++) pushIfBg(x, my - 1);
    for (let y = my; y < outH; y++) pushIfBg(mx - 1, y);
  }

  while (head < tail) {
    const p = queue[head++];
    const idx4 = p * 4;
    data[idx4 + 3] = 0;

    const x = p % outW;
    const y = (p - x) / outW;

    if (x > 0) pushIfBg(x - 1, y);
    if (x + 1 < outW) pushIfBg(x + 1, y);
    if (y > 0) pushIfBg(x, y - 1);
    if (y + 1 < outH) pushIfBg(x, y + 1);
  }

  const slitXMin = Math.floor(outW * 0.06);
  const slitXMax = Math.floor(outW * 0.24);
  const slitYMin = Math.floor(outH * 0.08);
  const slitYMax = Math.floor(outH * 0.68);
  for (let y = slitYMin; y < slitYMax; y++) {
    for (let x = slitXMin; x < slitXMax; x++) {
      const p = y * outW + x;
      if (visited[p]) continue;
      const idx4 = p * 4;
      const r = data[idx4];
      const g = data[idx4 + 1];
      const b = data[idx4 + 2];
      if (
        r >= 46 &&
        r <= 92 &&
        Math.abs(r - g) <= 5 &&
        Math.abs(g - b) <= 5 &&
        Math.abs(r - b) <= 6
      ) {
        data[idx4 + 3] = 0;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

export async function loadBandCutoutTextures(
  maxAnisotropy: number
): Promise<BandCutoutTextures> {
  const [
    tanque01Img,
    tanque02Img,
    tanque03Img,
    tete01Img,
    tete02Img,
    tete03Img,
    chizzo01Img,
    chizzo02Img,
    chizzo03Img,
    manu01Img,
    manu02Img,
  ] = await Promise.all([
    loadImage(ASSET_TANQUE_01),
    loadImage(ASSET_TANQUE_02),
    loadImage(ASSET_TANQUE_03),
    loadImage(ASSET_TETE_01),
    loadImage(ASSET_TETE_02),
    loadImage(ASSET_TETE_03),
    loadImage(ASSET_CHIZZO_01),
    loadImage(ASSET_CHIZZO_02),
    loadImage(ASSET_CHIZZO_03),
    loadImage(ASSET_MANU_01),
    loadImage(ASSET_MANU_02),
  ]);

  const cleanMusicianOpts = {
    clearLowerWhiteGaps: true,
    lowerGapYThreshold: 0.28,
  };

  return {
    // Clean single-character PNGs for Tanque (3 poses on his "La Renga" drum kit!)
    tanquePlaying: extractWhiteBgCutoutTexture(
      tanque01Img,
      { x0: 0.0, y0: 0.0, x1: 1.0, y1: 1.0 },
      maxAnisotropy,
      580,
      680,
      cleanMusicianOpts
    ),
    tanqueRoaring: extractWhiteBgCutoutTexture(
      tanque02Img,
      { x0: 0.0, y0: 0.0, x1: 1.0, y1: 1.0 },
      maxAnisotropy,
      580,
      680,
      cleanMusicianOpts
    ),
    tanqueCheering: extractWhiteBgCutoutTexture(
      tanque03Img,
      { x0: 0.0, y0: 0.0, x1: 1.0, y1: 1.0 },
      maxAnisotropy,
      580,
      680,
      cleanMusicianOpts
    ),
    // Clean single-character PNG: Manu playing Saxophone (Manu01)
    manuSax: extractWhiteBgCutoutTexture(
      manu01Img,
      { x0: 0.0, y0: 0.0, x1: 1.0, y1: 1.0 },
      maxAnisotropy,
      460,
      680,
      cleanMusicianOpts
    ),
    // Clean single-character PNG: Manu playing Harmonica with fist raised (Manu02)
    manuHarmonica: extractWhiteBgCutoutTexture(
      manu02Img,
      { x0: 0.0, y0: 0.0, x1: 1.0, y1: 1.0 },
      maxAnisotropy,
      460,
      680,
      cleanMusicianOpts
    ),
    // Clean single-character PNG: Chizzo cheering with fist raised & Stratocaster (Chizzo01)
    chizzoCheering: extractWhiteBgCutoutTexture(
      chizzo01Img,
      { x0: 0.0, y0: 0.0, x1: 1.0, y1: 1.0 },
      maxAnisotropy,
      540,
      680,
      cleanMusicianOpts
    ),
    // Clean single-character PNG: Chizzo singing with his Stratocaster (Chizzo02)
    chizzoSinging: extractWhiteBgCutoutTexture(
      chizzo02Img,
      { x0: 0.0, y0: 0.0, x1: 1.0, y1: 1.0 },
      maxAnisotropy,
      540,
      680,
      cleanMusicianOpts
    ),
    // Clean single-character PNG: Chizzo screaming a guitar solo on his Firebird (Chizzo03)
    chizzoSolo: extractWhiteBgCutoutTexture(
      chizzo03Img,
      { x0: 0.0, y0: 0.0, x1: 1.0, y1: 1.0 },
      maxAnisotropy,
      540,
      680,
      cleanMusicianOpts
    ),
    // Clean single-character PNGs for Tete (3 poses: standing, running, jumping!)
    teteBass: extractWhiteBgCutoutTexture(
      tete01Img,
      { x0: 0.0, y0: 0.0, x1: 1.0, y1: 1.0 },
      maxAnisotropy,
      540,
      680,
      cleanMusicianOpts
    ),
    teteRunning: extractWhiteBgCutoutTexture(
      tete02Img,
      { x0: 0.0, y0: 0.0, x1: 1.0, y1: 1.0 },
      maxAnisotropy,
      560,
      680,
      cleanMusicianOpts
    ),
    teteJumping: extractWhiteBgCutoutTexture(
      tete03Img,
      { x0: 0.0, y0: 0.0, x1: 1.0, y1: 1.0 },
      maxAnisotropy,
      540,
      680,
      cleanMusicianOpts
    ),
  };
}

/**
 * Extracts the hand-illustrated Full Moon & Swirling Night Clouds from Luna_623e8d94.png
 */
export async function loadMoonCutoutTexture(
  maxAnisotropy: number
): Promise<THREE.CanvasTexture> {
  const moonImg = await loadImage(ASSET_LUNA);
  return extractWhiteBgCutoutTexture(
    moonImg,
    { x0: 0.02, y0: 0.02, x1: 0.98, y1: 0.98 },
    maxAnisotropy,
    720,
    520,
    { clearAllWhiteGaps: false, clearLowerWhiteGaps: false }
  );
}

/**
 * Extracts the 4 hand-illustrated Chopper Motorcycles from Gemini_Generated_Image_ffaxx9ffaxx9ffax_6e1aff8c.jpeg
 * (clearing all white gaps between wheel spokes, forks, and handlebars)
 */
export async function loadMotorcycleCutoutTextures(
  maxAnisotropy: number
): Promise<THREE.CanvasTexture[]> {
  const motosImg = await loadImage(ASSET_MOTOS);
  const opts = { clearAllWhiteGaps: true };

  return [
    // 1. Top-Left: Chopper roja con llamas en el tanque y horquilla larga
    extractWhiteBgCutoutTexture(
      motosImg,
      { x0: 0.02, y0: 0.015, x1: 0.51, y1: 0.505 },
      maxAnisotropy,
      640,
      440,
      opts
    ),
    // 2. Top-Right: Chopper negra con la Estrella de La Renga en el tanque
    extractWhiteBgCutoutTexture(
      motosImg,
      { x0: 0.515, y0: 0.015, x1: 0.98, y1: 0.495 },
      maxAnisotropy,
      640,
      440,
      opts
    ),
    // 3. Bottom-Left: Chopper oscura con escapes cola de pescado
    extractWhiteBgCutoutTexture(
      motosImg,
      { x0: 0.015, y0: 0.505, x1: 0.495, y1: 0.985 },
      maxAnisotropy,
      640,
      440,
      opts
    ),
    // 4. Bottom-Right: Chopper azul oxidada con alforjas de cuero y respaldo alto
    extractWhiteBgCutoutTexture(
      motosImg,
      { x0: 0.505, y0: 0.495, x1: 0.98, y1: 0.985 },
      maxAnisotropy,
      640,
      440,
      opts
    ),
  ];
}

/**
 * Extracts all stage props from /assets/aistudio/stage_01_d698b7e4.png
 * NOTE: The drum kit in stage_01 is intentionally ignored because Tanque already
 * includes his drum kit in his own musician asset.
 */
export async function loadStageCutoutTextures(
  maxAnisotropy: number
): Promise<StageCutoutTextures> {
  const stageImg = await loadImage(ASSET_STAGE_01);

  return {
    stageDeck: extractWhiteBgCutoutTexture(
      stageImg,
      { x0: 0.022, y0: 0.095, x1: 0.208, y1: 0.305 },
      maxAnisotropy,
      640,
      260,
      { clearLowerWhiteGaps: true, lowerGapYThreshold: 0.65 }
    ),
    marshallStacks: extractWhiteBgCutoutTexture(
      stageImg,
      { x0: 0.405, y0: 0.035, x1: 0.59, y1: 0.43 },
      maxAnisotropy,
      540,
      540,
      { clearLowerWhiteGaps: true, lowerGapYThreshold: 0.72 }
    ),
    micStand: extractWhiteBgCutoutTexture(
      stageImg,
      { x0: 0.60, y0: 0.05, x1: 0.66, y1: 0.43 },
      maxAnisotropy,
      260,
      560,
      { clearAllWhiteGaps: true }
    ),
    wedgeMonitors: extractWhiteBgCutoutTexture(
      stageImg,
      { x0: 0.668, y0: 0.19, x1: 0.82, y1: 0.40 },
      maxAnisotropy,
      520,
      300,
      { clearAllWhiteGaps: true }
    ),
    guitarsOnStand: extractWhiteBgCutoutTexture(
      stageImg,
      { x0: 0.822, y0: 0.03, x1: 0.968, y1: 0.478 },
      maxAnisotropy,
      480,
      600,
      { clearLowerWhiteGaps: true, lowerGapYThreshold: 0.65 }
    ),
    trussArch: extractWhiteBgCutoutTexture(
      stageImg,
      { x0: 0.042, y0: 0.34, x1: 0.232, y1: 0.955 },
      maxAnisotropy,
      680,
      760,
      { clearAllWhiteGaps: true }
    ),
    laRengaBackdrop: extractWhiteBgCutoutTexture(
      stageImg,
      { x0: 0.252, y0: 0.458, x1: 0.422, y1: 0.892 },
      maxAnisotropy,
      640,
      580,
      { clearAllWhiteGaps: false, clearLowerWhiteGaps: false }
    ),
    flagLaRenga: extractWhiteBgCutoutTexture(
      stageImg,
      { x0: 0.431, y0: 0.478, x1: 0.510, y1: 0.735 },
      maxAnisotropy,
      380,
      420
    ),
    flagElBanquete: extractWhiteBgCutoutTexture(
      stageImg,
      { x0: 0.511, y0: 0.472, x1: 0.581, y1: 0.688 },
      maxAnisotropy,
      380,
      380
    ),
    flagLosMismos: extractWhiteBgCutoutTexture(
      stageImg,
      { x0: 0.581, y0: 0.472, x1: 0.652, y1: 0.805 },
      maxAnisotropy,
      360,
      480
    ),
    flagEstrellas: extractWhiteBgCutoutTexture(
      stageImg,
      { x0: 0.502, y0: 0.692, x1: 0.580, y1: 0.945 },
      maxAnisotropy,
      380,
      420
    ),
    vallaBarrier: extractWhiteBgCutoutTexture(
      stageImg,
      { x0: 0.662, y0: 0.578, x1: 0.820, y1: 0.935 },
      maxAnisotropy,
      600,
      440,
      { clearAllWhiteGaps: true }
    ),
    cableBoxes: extractWhiteBgCutoutTexture(
      stageImg,
      { x0: 0.822, y0: 0.638, x1: 0.980, y1: 0.915 },
      maxAnisotropy,
      520,
      380,
      { clearAllWhiteGaps: true }
    ),
  };
}

/**
 * Extracts all 20 hand-illustrated fan cutouts from caballito_1c79ac64.png + fans01, fans02, fans03, and fans04
 */
export async function loadFanCutoutTextures(
  maxAnisotropy: number
): Promise<THREE.CanvasTexture[]> {
  const [caballitoImg, fans01Img, fans02Img, fans03Img, fans04Img] = await Promise.all([
    loadImage(ASSET_CABALLITO),
    loadImage(ASSET_FANS_01),
    loadImage(ASSET_FANS_02),
    loadImage(ASSET_FANS_03),
    loadImage(ASSET_FANS_04),
  ]);

  const opts = { clearLowerWhiteGaps: true, lowerGapYThreshold: 0.62 };

  return [
    // 0: Clean Single-Character PNG: Pibe a caballito revoleando la remera (caballito_1c79ac64.png)
    extractWhiteBgCutoutTexture(caballitoImg, { x0: 0.0, y0: 0.0, x1: 1.0, y1: 1.0 }, maxAnisotropy, 440, 680, opts),
    // 1..4 from fans01_1e63d578.png
    extractWhiteBgCutoutTexture(fans01Img, { x0: 0.232, y0: 0.20,  x1: 0.388, y1: 0.955 }, maxAnisotropy, 360, 560, opts),
    extractWhiteBgCutoutTexture(fans01Img, { x0: 0.388, y0: 0.055, x1: 0.582, y1: 0.955 }, maxAnisotropy, 400, 600, opts),
    extractWhiteBgCutoutTexture(fans01Img, { x0: 0.582, y0: 0.14,  x1: 0.778, y1: 0.92  }, maxAnisotropy, 400, 580, opts),
    extractWhiteBgCutoutTexture(fans01Img, { x0: 0.778, y0: 0.11,  x1: 0.975, y1: 0.95  }, maxAnisotropy, 400, 580, opts),

    // Sheet 2 (fans02_e6c03a26.png) — Indices 5..9
    extractWhiteBgCutoutTexture(fans02Img, { x0: 0.035, y0: 0.035, x1: 0.235, y1: 0.965 }, maxAnisotropy, 400, 600, opts),
    extractWhiteBgCutoutTexture(fans02Img, { x0: 0.235, y0: 0.08,  x1: 0.405, y1: 0.96  }, maxAnisotropy, 380, 580, opts),
    extractWhiteBgCutoutTexture(fans02Img, { x0: 0.405, y0: 0.09,  x1: 0.575, y1: 0.965 }, maxAnisotropy, 380, 580, opts),
    extractWhiteBgCutoutTexture(fans02Img, { x0: 0.575, y0: 0.12,  x1: 0.782, y1: 0.965 }, maxAnisotropy, 420, 580, opts),
    extractWhiteBgCutoutTexture(fans02Img, { x0: 0.782, y0: 0.08,  x1: 0.975, y1: 0.86  }, maxAnisotropy, 400, 560, opts),

    // Sheet 3 (fans03_c1fd80af.png) — Indices 10..14
    extractWhiteBgCutoutTexture(fans03Img, { x0: 0.025, y0: 0.04,  x1: 0.242, y1: 0.965 }, maxAnisotropy, 420, 600, opts),
    extractWhiteBgCutoutTexture(fans03Img, { x0: 0.242, y0: 0.07,  x1: 0.398, y1: 0.96  }, maxAnisotropy, 360, 580, opts),
    extractWhiteBgCutoutTexture(fans03Img, { x0: 0.398, y0: 0.06,  x1: 0.572, y1: 0.96  }, maxAnisotropy, 380, 580, opts),
    extractWhiteBgCutoutTexture(fans03Img, { x0: 0.572, y0: 0.09,  x1: 0.775, y1: 0.96  }, maxAnisotropy, 400, 580, opts),
    extractWhiteBgCutoutTexture(fans03Img, { x0: 0.775, y0: 0.11,  x1: 0.98,  y1: 0.96  }, maxAnisotropy, 400, 580, opts),

    // Sheet 4 (fans04_73351a61.png) — Indices 15..19
    extractWhiteBgCutoutTexture(fans04Img, { x0: 0.02,  y0: 0.04,  x1: 0.215, y1: 0.62  }, maxAnisotropy, 400, 580, opts),
    extractWhiteBgCutoutTexture(fans04Img, { x0: 0.218, y0: 0.05,  x1: 0.462, y1: 0.99  }, maxAnisotropy, 440, 660, {
      ...opts,
      maskOutBoxes: [{ x0: 0.80, y0: 0.23, x1: 1.0, y1: 0.65 }],
    }),
    extractWhiteBgCutoutTexture(fans04Img, { x0: 0.422, y0: 0.135, x1: 0.630, y1: 0.635 }, maxAnisotropy, 420, 560, {
      ...opts,
      maskOutBoxes: [{ x0: 0.0, y0: 0.0, x1: 0.22, y1: 0.22 }],
    }),
    extractWhiteBgCutoutTexture(fans04Img, { x0: 0.598, y0: 0.045, x1: 0.805, y1: 0.695 }, maxAnisotropy, 400, 580, {
      ...opts,
      maskOutBoxes: [{ x0: 0.0, y0: 0.12, x1: 0.16, y1: 0.36 }],
    }),
    extractWhiteBgCutoutTexture(fans04Img, { x0: 0.805, y0: 0.065, x1: 0.985, y1: 0.74  }, maxAnisotropy, 380, 580, opts),
  ];
}

/**
 * Extracts all 15 hand-illustrated "Banderas de Palo" (flags with wooden poles):
 * - 9 from /assets/aistudio/banderas_de_palo_01_ae48a44a.jpeg
 * - 6 from /assets/aistudio/Gemini_Generated_Image_inbccbinbccbinbc_30bd9821.jpeg
 */
export async function loadPoleFlagCutoutTextures(
  maxAnisotropy: number
): Promise<THREE.CanvasTexture[]> {
  const [img1, img2] = await Promise.all([
    loadImage(ASSET_BANDERAS_PALO),
    loadImage(ASSET_BANDERAS_PALO_02),
  ]);

  return [
    // --- Sheet 1 (banderas_de_palo_01_ae48a44a.jpeg: 9 flags) ---
    extractCheckerboardCutoutTexture(
      img1,
      { x0: 0.028, y0: 0.035, x1: 0.302, y1: 0.575 },
      maxAnisotropy,
      540,
      640,
      { xMinRatio: 0.24, yMinRatio: 0.53 }
    ),
    extractCheckerboardCutoutTexture(
      img1,
      { x0: 0.095, y0: 0.325, x1: 0.312, y1: 0.606 },
      maxAnisotropy,
      500,
      460
    ),
    extractCheckerboardCutoutTexture(
      img1,
      { x0: 0.326, y0: 0.042, x1: 0.485, y1: 0.565 },
      maxAnisotropy,
      440,
      640
    ),
    extractCheckerboardCutoutTexture(
      img1,
      { x0: 0.515, y0: 0.025, x1: 0.745, y1: 0.562 },
      maxAnisotropy,
      540,
      640
    ),
    extractCheckerboardCutoutTexture(
      img1,
      { x0: 0.755, y0: 0.045, x1: 0.975, y1: 0.568 },
      maxAnisotropy,
      520,
      640
    ),
    extractCheckerboardCutoutTexture(
      img1,
      { x0: 0.032, y0: 0.592, x1: 0.245, y1: 0.978 },
      maxAnisotropy,
      500,
      580
    ),
    extractCheckerboardCutoutTexture(
      img1,
      { x0: 0.252, y0: 0.592, x1: 0.438, y1: 0.980 },
      maxAnisotropy,
      460,
      580
    ),
    extractCheckerboardCutoutTexture(
      img1,
      { x0: 0.460, y0: 0.585, x1: 0.722, y1: 0.978 },
      maxAnisotropy,
      560,
      580
    ),
    extractCheckerboardCutoutTexture(
      img1,
      { x0: 0.745, y0: 0.590, x1: 0.965, y1: 0.978 },
      maxAnisotropy,
      520,
      580
    ),

    // --- Sheet 2 (Gemini_Generated_Image_inbccbinbccbinbc_30bd9821.jpeg: 6 new flags on white background) ---
    // 10. Top-Left: "LA RENGA - EL BANQUETE" con estrella blanca y roja
    extractWhiteBgCutoutTexture(
      img2,
      { x0: 0.02, y0: 0.015, x1: 0.435, y1: 0.725 },
      maxAnisotropy,
      580,
      640,
      {
        clearLowerWhiteGaps: false,
        maskOutBoxes: [{ x0: 0.17, y0: 0.75, x1: 1.0, y1: 1.0 }],
      }
    ),
    // 11. Top-Center: "LOS MISMOS DE SIEMPRE" con estrella roja
    extractWhiteBgCutoutTexture(
      img2,
      { x0: 0.445, y0: 0.025, x1: 0.708, y1: 0.605 },
      maxAnisotropy,
      500,
      640,
      { clearAllWhiteGaps: true }
    ),
    // 12. Top-Right: "EN EL BALDÍO - LA RENGA" (Esqueleto con guitarra y luna)
    extractWhiteBgCutoutTexture(
      img2,
      { x0: 0.735, y0: 0.03, x1: 0.978, y1: 0.568 },
      maxAnisotropy,
      500,
      620,
      { clearLowerWhiteGaps: true, lowerGapYThreshold: 0.68 }
    ),
    // 13. Bottom-Left: "A LA CARGA MI ROCANROL - LA RENGA"
    extractWhiteBgCutoutTexture(
      img2,
      { x0: 0.098, y0: 0.585, x1: 0.352, y1: 0.985 },
      maxAnisotropy,
      500,
      580,
      { clearLowerWhiteGaps: true, lowerGapYThreshold: 0.78 }
    ),
    // 14. Bottom-Center: "MATADEROS ★ EL BANQUETE"
    extractWhiteBgCutoutTexture(
      img2,
      { x0: 0.462, y0: 0.588, x1: 0.722, y1: 0.975 },
      maxAnisotropy,
      520,
      580,
      { clearAllWhiteGaps: true }
    ),
    // 15. Bottom-Right: "LA RENGA - RUTA 40" (Calavera con casco y moto)
    extractWhiteBgCutoutTexture(
      img2,
      { x0: 0.722, y0: 0.585, x1: 0.978, y1: 0.945 },
      maxAnisotropy,
      520,
      560,
      { clearLowerWhiteGaps: true, lowerGapYThreshold: 0.68 }
    ),
  ];
}

// ============================================================================
// 17 HAND-ILLUSTRATED COASTAL ENVIRONMENT ASSETS (Waves, Dune Bushes & Trees)
// ============================================================================
export const ASSET_WAVE_18 = '/assets/aistudio/Capa_18_5ab5e1bd.png';
export const ASSET_WAVE_17 = '/assets/aistudio/Capa_17_4baefd73.png';
export const ASSET_WAVE_16 = '/assets/aistudio/Capa_16_ff897a1c.png';
export const ASSET_WAVE_15 = '/assets/aistudio/Capa_15_c08c1ab7.png';
export const ASSET_WAVE_14 = '/assets/aistudio/Capa_14_8ccffb42.png';
export const ASSET_WAVE_13 = '/assets/aistudio/Capa_13_00d6651b.png';
export const ASSET_WAVE_12 = '/assets/aistudio/Capa_12_a9d2d418.png';

export const ASSET_BUSH_11 = '/assets/aistudio/Capa_11_a2f83a54.png';
export const ASSET_BUSH_10 = '/assets/aistudio/Capa_10_532b0e04.png';
export const ASSET_BUSH_09 = '/assets/aistudio/Capa_9_2df1a0e8.png';
export const ASSET_BUSH_08 = '/assets/aistudio/Capa_8_cb3536f2.png';

export const ASSET_TREE_07 = '/assets/aistudio/Capa_7_0b171ce8.png';
export const ASSET_TREE_06 = '/assets/aistudio/Capa_6_d19285c8.png';
export const ASSET_TREE_05 = '/assets/aistudio/Capa_5_b38b0a5f.png';
export const ASSET_TREE_04 = '/assets/aistudio/Capa_4_bbba0bb7.png';
export const ASSET_TREE_03 = '/assets/aistudio/Capa_3_07a28d82.png';
export const ASSET_TREE_02 = '/assets/aistudio/Capa_2_17310f12.png';

export interface CoastalEnvironmentTextures {
  waves: THREE.CanvasTexture[]; // 7 unique hand-illustrated ocean waves (Capa_18..Capa_12)
  bushes: THREE.CanvasTexture[]; // 4 unique hand-illustrated dune bushes/grasses (Capa_11..Capa_8)
  trees: THREE.CanvasTexture[]; // 6 unique hand-illustrated coastal trees/pines/palms (Capa_7..Capa_2)
}

function createDirectAlphaCutoutTexture(
  img: HTMLImageElement,
  maxAnisotropy: number,
  outW: number,
  outH: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;
  const pad = 4;
  ctx.clearRect(0, 0, outW, outH);
  ctx.drawImage(
    img,
    0,
    0,
    img.width,
    img.height,
    pad,
    pad,
    outW - pad * 2,
    outH - pad * 2
  );

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

export async function loadCoastalEnvironmentTextures(
  maxAnisotropy: number
): Promise<CoastalEnvironmentTextures> {
  const waveUrls = [
    ASSET_WAVE_18,
    ASSET_WAVE_17,
    ASSET_WAVE_16,
    ASSET_WAVE_15,
    ASSET_WAVE_14,
    ASSET_WAVE_13,
    ASSET_WAVE_12,
  ];
  const bushUrls = [ASSET_BUSH_11, ASSET_BUSH_09, ASSET_BUSH_08];
  const treeUrls = [
    ASSET_TREE_07,
    ASSET_TREE_06,
    ASSET_TREE_05,
    ASSET_TREE_04,
    ASSET_TREE_03,
    ASSET_TREE_02,
  ];

  const [waveImgs, bushImgs, treeImgs] = await Promise.all([
    Promise.all(waveUrls.map((u) => loadImage(u))),
    Promise.all(bushUrls.map((u) => loadImage(u))),
    Promise.all(treeUrls.map((u) => loadImage(u))),
  ]);

  return {
    waves: waveImgs.map((img) =>
      createDirectAlphaCutoutTexture(img, maxAnisotropy, 560, 260)
    ),
    bushes: bushImgs.map((img) =>
      createDirectAlphaCutoutTexture(img, maxAnisotropy, 360, 320)
    ),
    trees: treeImgs.map((img) =>
      createDirectAlphaCutoutTexture(img, maxAnisotropy, 520, 680)
    ),
  };
}

