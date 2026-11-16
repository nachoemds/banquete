// src/components/BanqueteStage3D.tsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { LaRengaSong } from '../data/laRengaSongs';
import {
  drawHandLetteredLaRengaLogo,
} from '../utils/albumArtGenerator';
import {
  loadBandCutoutTextures,
  loadStageCutoutTextures,
  loadFanCutoutTextures,
  loadPoleFlagCutoutTextures,
  loadMoonCutoutTexture,
  loadMotorcycleCutoutTextures,
  loadCoastalEnvironmentTextures,
  resolvePublicAssetUrl,
  BandCutoutTextures,
} from '../utils/musicianSprites';

import { StageUnlockableId } from '../data/banqueteGameData';
import { rockAudio } from '../utils/rockAudioEngine';

export const NECOCHEA_SCREEN_URL = resolvePublicAssetUrl('/assets/aistudio/image_26d06c56.png');

export type CameraPreset = 'general' | 'pogo' | 'stage' | 'entrance';

interface BanqueteStage3DProps {
  setlist: LaRengaSong[];
  activeSong: LaRengaSong | null;
  cameraPreset: CameraPreset;
  flareActive: boolean;
  enabledUnlockables?: StageUnlockableId[];
  onSelectSlotOrStage?: () => void;
}

interface CrowdAgent {
  mesh: THREE.Mesh;
  fanVariantIndex: number;
  startX: number;
  startZ: number;
  targetX: number;
  targetZ: number;
  progress: number;
  speed: number;
  phase: number;
  hasFlag: boolean;
  flagMesh?: THREE.Mesh;
  poleMesh?: THREE.Mesh;
  baseScale: number;
}

// Pre-allocated math helpers at module scope (zero GC in loop)
const _camTargetPos = new THREE.Vector3();
const _camLookAt = new THREE.Vector3();
const _currentLookAt = new THREE.Vector3(0, 2.5, -5);

/**
 * Fallback procedural cutout sprites used only during the brief millisecond
 * while the high-res PNG/JPEG sprite sheets decode, plus coastal environment props (trees & waves).
 */
function createDontStarveCutoutTexture(
  type: 'fan_a' | 'fan_b' | 'fan_c' | 'chizzo' | 'tete' | 'tanque' | 'tree' | 'wave_crest',
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 384);

  const drawCrossHatch = (x: number, y: number, w: number, h: number, lines = 22) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(8, 6, 5, 0.65)';
    ctx.lineWidth = 2;
    for (let i = 0; i < lines; i++) {
      const lx = x + (i / lines) * w;
      ctx.beginPath();
      ctx.moveTo(lx, y);
      ctx.lineTo(lx - 10, y + h);
      ctx.stroke();
    }
    ctx.restore();
  };

  if (type === 'wave_crest') {
    ctx.save();
    ctx.fillStyle = '#0f4c5c';
    ctx.strokeStyle = '#061821';
    ctx.lineWidth = 7;

    ctx.beginPath();
    ctx.moveTo(10, 370);
    ctx.quadraticCurveTo(45, 220, 155, 165);
    ctx.quadraticCurveTo(225, 145, 232, 210);
    ctx.quadraticCurveTo(235, 255, 185, 250);
    ctx.quadraticCurveTo(145, 240, 165, 205);
    ctx.quadraticCurveTo(120, 235, 130, 370);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#5eead4';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(32, 350);
    ctx.quadraticCurveTo(68, 225, 162, 180);
    ctx.stroke();

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(192, 216, 22, 0, Math.PI * 1.4);
    ctx.stroke();

    ctx.restore();
  } else if (type === 'tree') {
    ctx.strokeStyle = '#070505';
    ctx.fillStyle = '#241c17';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(100, 380);
    ctx.quadraticCurveTo(110, 245, 142, 155);
    ctx.quadraticCurveTo(164, 245, 146, 380);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    drawCrossHatch(108, 190, 36, 180, 14);

    ctx.fillStyle = '#14261d';
    const canopies = [
      [145, 145, 78, 34],
      [115, 180, 62, 28],
      [172, 175, 64, 28],
      [148, 110, 58, 26],
    ];
    canopies.forEach(([cx, cy, rx, ry]) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  } else {
    const isBand = type === 'chizzo' || type === 'tete' || type === 'tanque';

    ctx.save();
    ctx.fillStyle = '#181411';
    ctx.strokeStyle = '#070505';
    ctx.lineWidth = 7;

    ctx.fillRect(94, 262, 24, 108);
    ctx.strokeRect(94, 262, 24, 108);
    ctx.fillRect(138, 262, 24, 108);
    ctx.strokeRect(138, 262, 24, 108);

    ctx.fillStyle = isBand ? '#2b1814' : type === 'fan_b' ? '#2c1f19' : '#171412';
    ctx.beginPath();
    ctx.moveTo(74, 142);
    ctx.lineTo(182, 142);
    ctx.lineTo(168, 272);
    ctx.lineTo(88, 272);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    drawCrossHatch(82, 150, 88, 112, 18);
    drawHandLetteredLaRengaLogo(ctx, 128, 198, 0.36);

    ctx.strokeStyle = '#070505';
    ctx.lineWidth = 13;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(80, 158);
    ctx.lineTo(44, 84);
    ctx.moveTo(176, 158);
    ctx.lineTo(212, 80);
    ctx.stroke();

    ctx.fillStyle = '#e5dac7';
    ctx.strokeStyle = '#070505';
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.moveTo(92, 68);
    ctx.lineTo(164, 68);
    ctx.lineTo(154, 142);
    ctx.lineTo(128, 154);
    ctx.lineTo(102, 142);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(113, 105, 9.5, 11.5, 0, 0, Math.PI * 2);
    ctx.ellipse(143, 105, 9.5, 11.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createFallbackFlagTexture(
  phrase: string,
  subtext: string,
  accentHex: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#5a5043';
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = '#090706';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 496, 240);

  ctx.fillStyle = '#090706';
  ctx.font = 'bold 42px "Pirata One", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(phrase, 256, 108);

  ctx.fillStyle = accentHex;
  ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(subtext, 256, 168);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Hand-illustrated Night Beach Sand texture (Playa de Necochea) with ink sand ripples & pebbles
 */
function createBeachSandTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#261e15';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#382c1e';
  ctx.lineWidth = 2.5;
  for (let y = 16; y < 512; y += 28) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 512; x += 64) {
      ctx.quadraticCurveTo(x + 32, y + (x % 128 === 0 ? 7 : -7), x + 64, y);
    }
    ctx.stroke();
  }

  ctx.strokeStyle = '#17120c';
  ctx.lineWidth = 1.8;
  for (let i = 0; i < 480; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const len = 8 + Math.random() * 18;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y + 2);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 12);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Hand-illustrated Ocean Water texture (El Mar a la Izquierda) with deep teal/turquoise & golden wave lines
 */
function createIllustratedOceanTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#07222b';
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 20; y < 512; y += 32) {
    ctx.strokeStyle = y % 64 === 0 ? '#155e75' : '#0d3b49';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    for (let x = 0; x <= 512; x += 64) {
      if (x === 0) ctx.moveTo(x, y);
      else ctx.quadraticCurveTo(x - 32, y - 12, x, y);
    }
    ctx.stroke();

    ctx.strokeStyle = y % 96 === 0 ? 'rgba(94, 234, 212, 0.45)' : 'rgba(217, 119, 6, 0.25)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(20, y + 6);
    ctx.lineTo(480, y + 6);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 14);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createLegendaryGuestTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 256, 384);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Boots & leather pants
  ctx.fillStyle = '#141110';
  ctx.strokeStyle = '#050404';
  ctx.lineWidth = 7;
  ctx.fillRect(88, 255, 26, 112);
  ctx.strokeRect(88, 255, 26, 112);
  ctx.fillRect(142, 255, 26, 112);
  ctx.strokeRect(142, 255, 26, 112);

  // Classic rocker leather jacket
  ctx.fillStyle = '#1c1816';
  ctx.beginPath();
  ctx.moveTo(68, 138);
  ctx.lineTo(188, 138);
  ctx.lineTo(172, 264);
  ctx.lineTo(84, 264);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Silver lapels & chain
  ctx.strokeStyle = '#d6c9b8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(106, 142);
  ctx.lineTo(128, 196);
  ctx.lineTo(150, 142);
  ctx.stroke();

  // Long dark mane + Rocker Top Hat ("Galera del Carpo")
  ctx.fillStyle = '#0f0c0b';
  ctx.strokeStyle = '#050404';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(128, 106, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Face + Dark Sunglasses
  ctx.fillStyle = '#dfc8b2';
  ctx.beginPath();
  ctx.moveTo(98, 76);
  ctx.lineTo(158, 76);
  ctx.lineTo(150, 138);
  ctx.lineTo(128, 148);
  ctx.lineTo(106, 138);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Sunglasses
  ctx.fillStyle = '#090707';
  ctx.fillRect(102, 92, 22, 14);
  ctx.fillRect(132, 92, 22, 14);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(102, 92, 22, 14);
  ctx.strokeRect(132, 92, 22, 14);

  // Rocker Top Hat
  ctx.fillStyle = '#181311';
  ctx.strokeStyle = '#050404';
  ctx.lineWidth = 6;
  ctx.fillRect(82, 66, 92, 12);
  ctx.strokeRect(82, 66, 92, 12);
  ctx.fillRect(96, 26, 64, 42);
  ctx.strokeRect(96, 26, 64, 42);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(98, 56, 60, 8);

  // Flying V Electric Guitar in Amber & Crimson
  ctx.save();
  ctx.translate(128, 218);
  ctx.rotate(-0.32);
  ctx.fillStyle = '#d97706';
  ctx.strokeStyle = '#050404';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-64, -22);
  ctx.lineTo(12, 0);
  ctx.lineTo(-64, 34);
  ctx.lineTo(-36, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Guitar neck
  ctx.fillStyle = '#3b2416';
  ctx.fillRect(8, -6, 88, 11);
  ctx.strokeRect(8, -6, 88, 11);
  ctx.restore();

  ctx.restore();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export const BanqueteStage3D: React.FC<BanqueteStage3DProps> = ({
  setlist,
  activeSong,
  cameraPreset,
  flareActive,
  enabledUnlockables = [],
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const songCountRef = useRef<number>(setlist.length);
  const activeSongRef = useRef<LaRengaSong | null>(activeSong);
  const cameraPresetRef = useRef<CameraPreset>(cameraPreset);
  const flareActiveRef = useRef<boolean>(flareActive);
  const enabledUnlockablesRef = useRef<StageUnlockableId[]>(enabledUnlockables);
  const userInteractingRef = useRef<boolean>(false);

  useEffect(() => {
    songCountRef.current = setlist.length;
  }, [setlist.length]);

  useEffect(() => {
    activeSongRef.current = activeSong;
  }, [activeSong]);

  useEffect(() => {
    cameraPresetRef.current = cameraPreset;
    userInteractingRef.current = false;
  }, [cameraPreset]);

  useEffect(() => {
    flareActiveRef.current = flareActive;
  }, [flareActive]);

  useEffect(() => {
    enabledUnlockablesRef.current = enabledUnlockables;
  }, [enabledUnlockables]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(
      container.clientWidth || window.innerWidth,
      container.clientHeight || window.innerHeight
    );

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    // Coastal Night Sky in Necochea
    const scene = new THREE.Scene();
    const skyHex = 0x08131a;
    scene.background = new THREE.Color(skyHex);
    scene.fog = new THREE.FogExp2(skyHex, 0.017);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      48,
      (container.clientWidth || window.innerWidth) /
        (container.clientHeight || window.innerHeight),
      0.5,
      160
    );
    camera.position.set(0, 8.8, 22);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 46;
    controls.target.set(0, 2.5, -5);

    controls.addEventListener('start', () => {
      userInteractingRef.current = true;
    });

    // Lighting Rig (Warm stage light + Cool Atlantic Ocean moonlight from the left!)
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x261e15, 0.9);
    scene.add(hemiLight);

    const stageSpotLight = new THREE.DirectionalLight(0xffb066, 2.9);
    stageSpotLight.position.set(6, 18, 10);
    stageSpotLight.castShadow = !isSoftwareGl;
    stageSpotLight.shadow.mapSize.set(1024, 1024);
    stageSpotLight.shadow.camera.left = -24;
    stageSpotLight.shadow.camera.right = 24;
    stageSpotLight.shadow.camera.top = 24;
    stageSpotLight.shadow.camera.bottom = -24;
    stageSpotLight.shadow.bias = -0.0005;
    stageSpotLight.shadow.normalBias = 0.02;
    scene.add(stageSpotLight);

    // Moonlight over the sea on the left (-X)
    const seaMoonLight = new THREE.PointLight(0x2dd4bf, 22, 55, 1.2);
    seaMoonLight.position.set(-28, 14, -8);
    scene.add(seaMoonLight);

    const rimLight = new THREE.PointLight(0xe11d48, 18, 30, 1.5);
    rimLight.position.set(0, 7.5, -13.5);
    scene.add(rimLight);

    const crowdFlareLight = new THREE.PointLight(0xff2a00, 9, 24, 1.4);
    crowdFlareLight.position.set(0, 3.5, 4);
    scene.add(crowdFlareLight);

    // ============================================================================
    // 1. BEACH SAND TERRAIN (Playa de Necochea en el centro y derecha)
    // ============================================================================
    const sandTex = createBeachSandTexture(maxAnisotropy);
    const sandMat = new THREE.MeshStandardMaterial({
      map: sandTex,
      roughness: 0.9,
      metalness: 0.04,
    });
    const beachMesh = new THREE.Mesh(new THREE.PlaneGeometry(116, 140), sandMat);
    beachMesh.rotation.x = -Math.PI / 2;
    beachMesh.position.set(40.5, 0, 0);
    beachMesh.receiveShadow = true;
    scene.add(beachMesh);

    const wetSandMat = new THREE.MeshStandardMaterial({
      color: 0x161c1d,
      roughness: 0.25,
      metalness: 0.35,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const wetShoreMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 140), wetSandMat);
    wetShoreMesh.rotation.x = -Math.PI / 2;
    wetShoreMesh.position.set(-17.2, 0.015, 0);
    scene.add(wetShoreMesh);

    // ============================================================================
    // 2. EL MAR A LA IZQUIERDA (x < -17.5, con olas animadas y espuma ilustrada)
    // ============================================================================
    const oceanTex = createIllustratedOceanTexture(maxAnisotropy);
    const oceanMat = new THREE.MeshStandardMaterial({
      map: oceanTex,
      roughness: 0.22,
      metalness: 0.55,
    });
    const oceanGeo = new THREE.PlaneGeometry(80, 140, 28, 36);
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.rotation.x = -Math.PI / 2;
    oceanMesh.position.set(-57.5, 0.02, 0);
    scene.add(oceanMesh);

    const foamMat = new THREE.MeshBasicMaterial({
      color: 0x99f6e4,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const foamRibbon = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 140, 4, 40), foamMat);
    foamRibbon.rotation.x = -Math.PI / 2;
    foamRibbon.position.set(-17.6, 0.04, 0);
    scene.add(foamRibbon);

    const waveCrestTex = createDontStarveCutoutTexture('wave_crest', maxAnisotropy);
    const makeCutoutMesh = (
      tex: THREE.CanvasTexture,
      width: number,
      height: number,
      alphaCutoff = 0.35
    ) => {
      const geo = new THREE.PlaneGeometry(width, height);
      geo.translate(0, height / 2, 0);
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        transparent: true,
        alphaTest: alphaCutoff,
        side: THREE.DoubleSide,
        roughness: 0.78,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      return mesh;
    };

    // 18 Hand-Illustrated Ocean Waves across 3 depth lines on the Left Sea (using Capa_12..Capa_18)
    const waveCrestMeshes: { mesh: THREE.Mesh; baseX: number; phase: number; waveVariant: number }[] = [];
    const waveLocations: [number, number][] = [
      // Shoreline breakers (closest to beach at x ~ -19 to -20)
      [-19.2, -22],
      [-19.8, -14],
      [-19.0, -6],
      [-19.6, 2],
      [-19.3, 10],
      [-19.9, 18],
      [-19.4, 26],
      // Mid-sea rolling waves (x ~ -24 to -26)
      [-24.2, -25],
      [-25.0, -15],
      [-23.8, -5],
      [-25.6, 5],
      [-24.4, 15],
      [-25.9, 24],
      // Deep ocean swells under the moonlight (x ~ -30 to -33)
      [-30.6, -20],
      [-32.2, -9],
      [-30.0, 1],
      [-32.8, 12],
      [-31.2, 22],
    ];
    waveLocations.forEach(([wx, wz], idx) => {
      const wMesh = makeCutoutMesh(waveCrestTex, 4.85, 2.25, 0.2);
      const scale = 0.88 + (idx % 4) * 0.12;
      wMesh.scale.set(scale, scale, scale);
      wMesh.position.set(wx, 0, wz);
      // Slight angle facing the viewer and the shoreline
      wMesh.rotation.y = 0.18 + (idx % 3) * 0.06;
      scene.add(wMesh);
      waveCrestMeshes.push({
        mesh: wMesh,
        baseX: wx,
        phase: idx * 0.75,
        waveVariant: idx % 7,
      });
    });

    // Hand-illustrated Moon (Luna_623e8d94.png) + Soft Golden-Yellow Glowing Halo
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 256;
    glowCanvas.height = 256;
    const glowCtx = glowCanvas.getContext('2d')!;
    const glowGrad = glowCtx.createRadialGradient(128, 128, 12, 128, 128, 124);
    glowGrad.addColorStop(0.0, 'rgba(254, 240, 138, 0.92)');
    glowGrad.addColorStop(0.32, 'rgba(253, 224, 71, 0.48)');
    glowGrad.addColorStop(0.68, 'rgba(56, 189, 248, 0.14)');
    glowGrad.addColorStop(1.0, 'rgba(8, 19, 26, 0.0)');
    glowCtx.fillStyle = glowGrad;
    glowCtx.fillRect(0, 0, 256, 256);
    const moonGlowTex = new THREE.CanvasTexture(glowCanvas);
    moonGlowTex.colorSpace = THREE.SRGBColorSpace;

    const moonGroup = new THREE.Group();
    moonGroup.position.set(-21, 17.5, -34);
    moonGroup.lookAt(0, 4, 10);

    const moonHaloMat = new THREE.MeshBasicMaterial({
      map: moonGlowTex,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const moonHaloMesh = new THREE.Mesh(new THREE.PlaneGeometry(23, 23), moonHaloMat);
    moonHaloMesh.position.set(0, 0, -0.4);
    moonGroup.add(moonHaloMesh);

    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xfef9c3,
      emissive: 0xfef08a,
      emissiveIntensity: 0.72,
      transparent: true,
      alphaTest: 0.15,
      roughness: 0.4,
      side: THREE.DoubleSide,
    });
    const moonMesh = new THREE.Mesh(new THREE.PlaneGeometry(14.5, 10.5), moonMat);
    moonGroup.add(moonMesh);
    scene.add(moonGroup);

    loadMoonCutoutTexture(maxAnisotropy)
      .then((moonTex) => {
        moonMat.map = moonTex;
        moonMat.emissiveMap = moonTex;
        moonMat.needsUpdate = true;
      })
      .catch(() => {
        // Keep glowing disc fallback if image fails
      });

    const pogoRingGeo = new THREE.RingGeometry(4.8, 5.25, 48);
    const pogoRingMat = new THREE.MeshBasicMaterial({
      color: 0xd97706,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const pogoRing = new THREE.Mesh(pogoRingGeo, pogoRingMat);
    pogoRing.rotation.x = -Math.PI / 2;
    pogoRing.position.set(0, 0.03, 2.5);
    scene.add(pogoRing);

    // ============================================================================
    // 3. STAGE GROUP ("El Escenario en la Playa" con los assets de stage_01)
    // ============================================================================
    const stageGroup = new THREE.Group();
    stageGroup.position.set(0, 0, -11);

    const darkWoodMat = new THREE.MeshStandardMaterial({
      color: 0x3b2c22,
      roughness: 0.88,
      metalness: 0.06,
    });
    const brushedSteelMat = new THREE.MeshStandardMaterial({
      color: 0x2b2623,
      roughness: 0.42,
      metalness: 0.72,
    });
    const crimsonEmissiveMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0x991b1b,
      emissiveIntensity: 0.9,
      roughness: 0.3,
      metalness: 0.4,
    });

    // Base 3D Stage Platform for depth & shadows (enlarged & noticeably wider)
    const stageDeck3D = new THREE.Mesh(new THREE.BoxGeometry(24.6, 1.56, 9.8), darkWoodMat);
    stageDeck3D.position.set(0, 0.78, 0);
    stageDeck3D.castShadow = true;
    stageDeck3D.receiveShadow = true;
    stageGroup.add(stageDeck3D);

    // 2.5D Illustrated Wooden Stage Deck Cutout (from stage_01.png) along the wider front lip
    const fallbackCutoutTex = createDontStarveCutoutTexture('fan_a', maxAnisotropy);
    const stageDeckCutoutMesh = makeCutoutMesh(fallbackCutoutTex, 26.6, 3.1, 0.25);
    stageDeckCutoutMesh.position.set(0, -0.06, 4.98);
    stageGroup.add(stageDeckCutoutMesh);

    // 2.5D Illustrated Steel Truss Arch + Hanging Line-Arrays & Spotlights (enlarged & wider)
    const trussArchFrontMesh = makeCutoutMesh(fallbackCutoutTex, 27.4, 14.8, 0.25);
    trussArchFrontMesh.position.set(0, 0, -1.85);
    stageGroup.add(trussArchFrontMesh);

    const trussArchBackMesh = makeCutoutMesh(fallbackCutoutTex, 26.2, 14.2, 0.25);
    trussArchBackMesh.position.set(0, 0, -4.15);
    stageGroup.add(trussArchBackMesh);

    // 2.5D Illustrated Weathered Cloth Backdrop Banner ("La Renga" Star Telón, larger & wider)
    const laRengaBackdropMesh = makeCutoutMesh(fallbackCutoutTex, 16.8, 10.4, 0.25);
    laRengaBackdropMesh.position.set(0, 1.82, -3.75);
    stageGroup.add(laRengaBackdropMesh);

    // 2.5D Illustrated Marshall Amplifier Stacks flanking the wider stage
    const marshallLeftMesh = makeCutoutMesh(fallbackCutoutTex, 5.5, 5.1, 0.25);
    marshallLeftMesh.position.set(-8.65, 1.56, -0.55);
    marshallLeftMesh.rotation.y = 0.18;
    stageGroup.add(marshallLeftMesh);

    const marshallRightMesh = makeCutoutMesh(fallbackCutoutTex, 5.5, 5.1, 0.25);
    marshallRightMesh.position.set(8.65, 1.56, -0.55);
    marshallRightMesh.rotation.y = -0.18;
    stageGroup.add(marshallRightMesh);

    // 2.5D Illustrated Wedge Floor Monitors along the wider front edge of the stage
    const wedgeMonitorMeshes: THREE.Mesh[] = [];
    [-7.2, -3.6, 0.0, 3.6, 7.2].forEach((wx) => {
      const wm = makeCutoutMesh(fallbackCutoutTex, 2.75, 1.45, 0.25);
      wm.position.set(wx, 1.56, 3.85);
      stageGroup.add(wm);
      wedgeMonitorMeshes.push(wm);
    });

    // 2.5D Illustrated Microphone Stands (in front of Chizzo & Tete)
    const micStandChizzoMesh = makeCutoutMesh(fallbackCutoutTex, 1.42, 3.25, 0.25);
    micStandChizzoMesh.position.set(-2.15, 1.56, 2.65);
    stageGroup.add(micStandChizzoMesh);

    const micStandTeteMesh = makeCutoutMesh(fallbackCutoutTex, 1.42, 3.25, 0.25);
    micStandTeteMesh.position.set(3.85, 1.56, 2.65);
    stageGroup.add(micStandTeteMesh);

    // 2.5D Illustrated Spare Electric Guitars on Stands (from stage_01.png)
    const guitarsOnStandMesh = makeCutoutMesh(fallbackCutoutTex, 3.25, 3.95, 0.25);
    guitarsOnStandMesh.position.set(6.65, 1.56, 1.35);
    guitarsOnStandMesh.rotation.y = -0.22;
    stageGroup.add(guitarsOnStandMesh);

    // 2.5D Illustrated Equipment Boxes & Coiled Cables (from stage_01.png)
    const cableBoxesLeftMesh = makeCutoutMesh(fallbackCutoutTex, 2.95, 1.95, 0.25);
    cableBoxesLeftMesh.position.set(-9.35, 1.56, 2.55);
    stageGroup.add(cableBoxesLeftMesh);

    const cableBoxesRightMesh = makeCutoutMesh(fallbackCutoutTex, 2.95, 1.95, 0.25);
    cableBoxesRightMesh.position.set(9.35, 1.56, 2.55);
    stageGroup.add(cableBoxesRightMesh);

    // 2.5D Illustrated Metal Crowd Control Barriers ("La Valla" spanning the wider stage front)
    const vallaBarrierMeshes: THREE.Mesh[] = [];
    [-10.5, -7.0, -3.5, 0, 3.5, 7.0, 10.5].forEach((vx) => {
      const vm = makeCutoutMesh(fallbackCutoutTex, 3.8, 2.28, 0.25);
      vm.position.set(vx, 0, 6.25);
      stageGroup.add(vm);
      vallaBarrierMeshes.push(vm);
    });

    // ============================================================================
    // 4. SIDE SCREENS SHOWING THE ATTACHED NECOCHEA POSTER (/assets/aistudio/image_26d06c56.png)
    // ============================================================================
    const sideScreenMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.42,
      roughness: 0.35,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    const necocheaImg = new Image();
    necocheaImg.crossOrigin = 'anonymous';
    necocheaImg.onload = () => {
      const screenTex = new THREE.Texture(necocheaImg);
      screenTex.colorSpace = THREE.SRGBColorSpace;
      screenTex.anisotropy = maxAnisotropy;
      screenTex.needsUpdate = true;
      sideScreenMat.map = screenTex;
      sideScreenMat.emissiveMap = screenTex;
      sideScreenMat.needsUpdate = true;
    };
    necocheaImg.src = NECOCHEA_SCREEN_URL;

    [-15.8, 15.8].forEach((sx) => {
      const screenFrameGroup = new THREE.Group();
      screenFrameGroup.position.set(sx, 6.1, 0.55);
      screenFrameGroup.rotation.y = sx < 0 ? 0.24 : -0.24;

      const backing = new THREE.Mesh(
        new THREE.BoxGeometry(5.9, 5.3, 0.28),
        brushedSteelMat
      );
      backing.position.set(0, 0, -0.16);
      backing.castShadow = true;
      screenFrameGroup.add(backing);

      const screenMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(5.5, 4.9),
        sideScreenMat
      );
      screenFrameGroup.add(screenMesh);

      [-2.5, 2.5].forEach((lx) => {
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.16, 6.1, 8),
          brushedSteelMat
        );
        leg.position.set(lx, -3.05, -0.16);
        screenFrameGroup.add(leg);
      });

      stageGroup.add(screenFrameGroup);
    });

    // ============================================================================
    // 4B. 4 CHOPPER MOTORCYCLES PARKED ON THE SIDES OF THE STAGE BELOW/BEHIND THE NECOCHEA SCREENS
    // ============================================================================
    const motoPositions: { x: number; z: number; ry: number }[] = [
      // Left side of stage (under & behind the Left "La Renga Necochea" screen at x = -15.8)
      { x: -14.2, z: 1.85, ry: 0.28 },
      { x: -16.8, z: -0.25, ry: 0.18 },
      // Right side of stage (under & behind the Right "La Renga Necochea" screen at x = +15.8)
      { x: 14.2, z: 1.85, ry: -0.28 },
      { x: 16.8, z: -0.25, ry: -0.18 },
    ];
    const motorcycleMeshes: THREE.Mesh[] = motoPositions.map(({ x, z, ry }) => {
      const mMesh = makeCutoutMesh(fallbackCutoutTex, 4.35, 2.95, 0.22);
      mMesh.position.set(x, 0, z);
      mMesh.rotation.y = ry;
      stageGroup.add(mMesh);
      return mMesh;
    });

    // Warm lights illuminating the 4 motorcycles under the Necochea screens
    [-15.8, 15.8].forEach((mx) => {
      const motoLight = new THREE.PointLight(0xff9e44, 12, 16, 1.3);
      motoLight.position.set(mx, 2.8, 2.4);
      stageGroup.add(motoLight);
    });

    loadMotorcycleCutoutTextures(maxAnisotropy)
      .then((motoTextures) => {
        motorcycleMeshes.forEach((mMesh, idx) => {
          const tex = motoTextures[idx % motoTextures.length];
          if (tex) {
            const mat = mMesh.material as THREE.MeshStandardMaterial;
            mat.map = tex;
            mat.needsUpdate = true;
          }
        });
      })
      .catch(() => {
        // Fallback stays if image fails
      });

    // ============================================================================
    // 5. TANQUE'S DRUM RISER + THE 4 UPLOADED MUSICIANS (Tanque with his drum kit, Manu, Chizzo, Tete)
    // ============================================================================
    const drumRiser = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.5, 0.72, 16),
      darkWoodMat
    );
    drumRiser.position.set(0, 1.92, -1.35);
    stageGroup.add(drumRiser);

    const chizzoFallbackTex = createDontStarveCutoutTexture('chizzo', maxAnisotropy);
    const teteFallbackTex = createDontStarveCutoutTexture('tete', maxAnisotropy);
    const tanqueFallbackTex = createDontStarveCutoutTexture('tanque', maxAnisotropy);

    // 1. Voz y Guitarra: CHIZZO (Front Center-Left)
    const chizzoMesh = makeCutoutMesh(chizzoFallbackTex, 3.55, 4.35);
    chizzoMesh.position.set(-2.95, 1.56, 2.05);
    stageGroup.add(chizzoMesh);

    // 2. Bajo: TETE (Front Center-Right)
    const teteMesh = makeCutoutMesh(teteFallbackTex, 3.45, 4.25);
    teteMesh.position.set(3.05, 1.56, 2.05);
    stageGroup.add(teteMesh);

    // 3. Batería: TANQUE con su propia batería "La Renga" (Center Drum Riser)
    const tanqueMesh = makeCutoutMesh(tanqueFallbackTex, 4.35, 4.85);
    tanqueMesh.position.set(0, 2.28, -0.92);
    stageGroup.add(tanqueMesh);

    // 4. Saxo y Armónica: MANU (Stage Left Flank)
    const manuMesh = makeCutoutMesh(chizzoFallbackTex, 3.0, 4.15);
    manuMesh.position.set(-6.05, 1.56, 1.15);
    stageGroup.add(manuMesh);

    let bandSprites: BandCutoutTextures | null = null;
    loadBandCutoutTextures(maxAnisotropy)
      .then((loaded) => {
        bandSprites = loaded;
        (chizzoMesh.material as THREE.MeshStandardMaterial).map = loaded.chizzoSinging;
        (chizzoMesh.material as THREE.MeshStandardMaterial).needsUpdate = true;

        (teteMesh.material as THREE.MeshStandardMaterial).map = loaded.teteBass;
        (teteMesh.material as THREE.MeshStandardMaterial).needsUpdate = true;

        (tanqueMesh.material as THREE.MeshStandardMaterial).map = loaded.tanquePlaying;
        (tanqueMesh.material as THREE.MeshStandardMaterial).needsUpdate = true;

        (manuMesh.material as THREE.MeshStandardMaterial).map = loaded.manuSax;
        (manuMesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
      })
      .catch(() => {
        // Fallback cutouts remain active if image load fails
      });

    // ============================================================================
    // 5B. UNLOCKABLE DECORATIVE STAGE REWARDS (Fire Columns, Huracán Lasers, Guest Legend, Golden Pyro)
    // ============================================================================
    // Reward 1: 6 Stage Fire Columns ("Lanzallamas de Valla & Escenario")
    const stageFireGroup = new THREE.Group();
    const fireColumnMeshes: { outer: THREE.Mesh; inner: THREE.Mesh; baseX: number; phase: number }[] = [];
    const outerFlameMat = new THREE.MeshBasicMaterial({
      color: 0xff4500,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const innerFlameMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const fireGeoOuter = new THREE.ConeGeometry(0.48, 2.65, 9);
    fireGeoOuter.translate(0, 1.325, 0);
    const fireGeoInner = new THREE.ConeGeometry(0.28, 1.85, 8);
    fireGeoInner.translate(0, 0.925, 0);

    [-8.8, -5.3, -1.8, 1.8, 5.3, 8.8].forEach((fx, idx) => {
      const nozzle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.22, 0.28, 8),
        brushedSteelMat
      );
      nozzle.position.set(fx, 1.64, 3.45);
      stageFireGroup.add(nozzle);

      const outer = new THREE.Mesh(fireGeoOuter, outerFlameMat);
      outer.position.set(fx, 1.72, 3.45);
      stageFireGroup.add(outer);

      const inner = new THREE.Mesh(fireGeoInner, innerFlameMat);
      inner.position.set(fx, 1.72, 3.45);
      stageFireGroup.add(inner);

      fireColumnMeshes.push({ outer, inner, baseX: fx, phase: idx * 1.15 });
    });
    const stageFireLight = new THREE.PointLight(0xff5500, 0, 26, 1.4);
    stageFireLight.position.set(0, 3.6, 3.8);
    stageFireGroup.add(stageFireLight);
    stageFireGroup.visible = false;
    stageGroup.add(stageFireGroup);

    // Reward 2: Stadium Volumetric Lasers ("Haces de Luz de Huracán")
    const stadiumLasersGroup = new THREE.Group();
    const laserBeamMeshes: { mesh: THREE.Mesh; phase: number; baseX: number }[] = [];
    const laserGeo = new THREE.ConeGeometry(3.2, 28, 16, 1, true);
    laserGeo.translate(0, -14, 0);
    [-9.2, -5.5, -1.85, 1.85, 5.5, 9.2].forEach((lx, idx) => {
      const isAmber = idx % 2 === 0;
      const beamMat = new THREE.MeshBasicMaterial({
        color: isAmber ? 0xf59e0b : 0xef4444,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const beam = new THREE.Mesh(laserGeo, beamMat);
      beam.position.set(lx, 11.2, 1.2);
      beam.rotation.x = 0.72;
      stadiumLasersGroup.add(beam);
      laserBeamMeshes.push({ mesh: beam, phase: idx * 0.95, baseX: lx });
    });
    stadiumLasersGroup.visible = false;
    stageGroup.add(stadiumLasersGroup);

    // Reward 3: Legendary Guest Guitarist on Stage ("Invitado Leyenda en Tablas")
    const guestGroup = new THREE.Group();
    const guestTex = createLegendaryGuestTexture(maxAnisotropy);
    const guestMesh = makeCutoutMesh(guestTex, 3.2, 4.2, 0.25);
    guestMesh.position.set(6.15, 1.56, 1.25);
    guestGroup.add(guestMesh);
    const guestSpotLight = new THREE.PointLight(0xfbbf24, 14, 12, 1.3);
    guestSpotLight.position.set(6.15, 4.6, 2.4);
    guestGroup.add(guestSpotLight);
    guestGroup.visible = false;
    stageGroup.add(guestGroup);

    // Reward 4: Golden Pyrotechnic Sparks ("Chispas Doradas del Banquete")
    const goldenPyroGroup = new THREE.Group();
    const PYRO_COUNT = 120;
    const pyroPositions = new Float32Array(PYRO_COUNT * 3);
    const pyroPhases = new Float32Array(PYRO_COUNT);
    const pyroEmitters = [-15.8, -7.8, 0, 7.8, 15.8];
    for (let p = 0; p < PYRO_COUNT; p++) {
      const emX = pyroEmitters[p % pyroEmitters.length];
      pyroPositions[p * 3] = emX + (Math.random() - 0.5) * 2.2;
      pyroPositions[p * 3 + 1] = 8.8 + Math.random() * 4.8;
      pyroPositions[p * 3 + 2] = 0.8 + (Math.random() - 0.5) * 1.4;
      pyroPhases[p] = Math.random() * Math.PI * 2;
    }
    const pyroGeo = new THREE.BufferGeometry();
    pyroGeo.setAttribute('position', new THREE.BufferAttribute(pyroPositions, 3));
    const pyroMat = new THREE.PointsMaterial({
      color: 0xfde047,
      size: 0.36,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const pyroPoints = new THREE.Points(pyroGeo, pyroMat);
    goldenPyroGroup.add(pyroPoints);
    goldenPyroGroup.visible = false;
    stageGroup.add(goldenPyroGroup);

    scene.add(stageGroup);

    // ============================================================================
    // 5C. COASTAL TREES (Capa_2..Capa_7) & DUNE BUSHES/GRASSES (Capa_8, 9, 11) ONLY ON RIGHT DUNES
    // ============================================================================
    const treeTex = createDontStarveCutoutTexture('tree', maxAnisotropy);
    const coastalTreeMeshes: { mesh: THREE.Mesh; variant: number; phase: number }[] = [];
    const rightBeachTreePositions: [number, number][] = [
      // Right-side coastal forest & dunes (Parque Miguel Lillo de Necochea, strictly x > 12)
      [20.5, -16],
      [23.5, -9],
      [20.8, -2],
      [24.0, 4],
      [19.5, 11],
      [17.2, 19],
      [24.5, 16],
      [26.5, -4],
      [25.2, -18],
      [18.8, -21],
      [14.5, -25],
      [20.5, -26],
      [22.0, 24],
    ];
    rightBeachTreePositions.forEach(([tx, tz], i) => {
      const tree = makeCutoutMesh(treeTex, 5.4, 7.4, 0.22);
      const s = 0.86 + (i % 4) * 0.14;
      tree.scale.set(s, s, s);
      tree.position.set(tx, 0, tz);
      tree.rotation.y = (i % 2 === 0 ? 1 : -1) * 0.22;
      scene.add(tree);
      coastalTreeMeshes.push({ mesh: tree, variant: i % 6, phase: i * 0.85 });
    });

    // Hand-Illustrated Dune Bushes & Beach Grasses strictly on the right-side dry sand dunes (zero in/near the sea!)
    const duneBushMeshes: { mesh: THREE.Mesh; variant: number; phase: number }[] = [];
    const duneBushPositions: [number, number][] = [
      [18.4, -12],
      [18.8, -6],
      [15.2, 1],
      [16.4, 7],
      [14.6, 14],
      [15.5, 21],
      [21.2, -12],
      [20.4, 2],
      [18.6, 15],
      [16.8, -3.2],
      [15.4, -13.5],
      [13.8, 23],
    ];
    duneBushPositions.forEach(([bx, bz], i) => {
      const bush = makeCutoutMesh(treeTex, 2.35, 2.05, 0.22);
      const s = 0.78 + (i % 3) * 0.16;
      bush.scale.set(s, s, s);
      bush.position.set(bx, 0, bz);
      bush.rotation.y = ((i % 5) - 2) * 0.18;
      scene.add(bush);
      duneBushMeshes.push({ mesh: bush, variant: i % 3, phase: i * 0.65 });
    });

    // Load all 17 hand-illustrated coastal assets (7 waves + 4 dune bushes + 6 coastal trees)
    loadCoastalEnvironmentTextures(maxAnisotropy)
      .then((envSprites) => {
        waveCrestMeshes.forEach((wc) => {
          const tex = envSprites.waves[wc.waveVariant % envSprites.waves.length];
          if (tex) {
            const mat = wc.mesh.material as THREE.MeshStandardMaterial;
            mat.map = tex;
            mat.needsUpdate = true;
          }
        });

        coastalTreeMeshes.forEach((ct) => {
          const tex = envSprites.trees[ct.variant % envSprites.trees.length];
          if (tex) {
            const mat = ct.mesh.material as THREE.MeshStandardMaterial;
            mat.map = tex;
            mat.needsUpdate = true;
          }
        });

        duneBushMeshes.forEach((db) => {
          const tex = envSprites.bushes[db.variant % envSprites.bushes.length];
          if (tex) {
            const mat = db.mesh.material as THREE.MeshStandardMaterial;
            mat.map = tex;
            mat.needsUpdate = true;
          }
        });
      })
      .catch(() => {
        // Fallback cutouts stay active if image load fails
      });

    // Beach Bonfires ("Fogones en la Playa")
    const barrelPositions = [
      [-11.8, -1.5],
      [12.4, -2.5],
      [-10.8, 9],
      [12.2, 8.5],
    ];
    barrelPositions.forEach(([bx, bz]) => {
      const barrelGroup = new THREE.Group();
      const drum = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.55, 1.4, 12),
        brushedSteelMat
      );
      drum.position.y = 0.7;
      drum.castShadow = true;
      const fireCore = new THREE.Mesh(
        new THREE.ConeGeometry(0.45, 0.9, 7),
        crimsonEmissiveMat
      );
      fireCore.position.y = 1.65;
      barrelGroup.add(drum);
      barrelGroup.add(fireCore);
      barrelGroup.position.set(bx, 0, bz);
      scene.add(barrelGroup);
    });

    // ============================================================================
    // 6. CROWD ("EL PÚBLICO") & TRAPOS FROM fans01, fans02, fans03 & stage_01
    // ============================================================================
    const initialFanTextures = [
      createDontStarveCutoutTexture('fan_a', maxAnisotropy),
      createDontStarveCutoutTexture('fan_b', maxAnisotropy),
      createDontStarveCutoutTexture('fan_c', maxAnisotropy),
    ];

    const flagConfigs = [
      { phrase: 'LA RENGA', sub: 'BANQUETE EN LA PLAYA', color: '#dc2626' },
      { phrase: 'EL BANQUETE', sub: 'DESPEDAZADO POR MIL PARTES', color: '#ea580c' },
      { phrase: 'LOS MISMOS', sub: 'DE SIEMPRE', color: '#14b8a6' },
      { phrase: 'ESTRELLAS', sub: 'TRIPA Y CORAZÓN', color: '#f59e0b' },
    ];
    const flagMaterials = flagConfigs.map((cfg) => {
      const tex = createFallbackFlagTexture(cfg.phrase, cfg.sub, cfg.color, maxAnisotropy);
      return new THREE.MeshStandardMaterial({
        map: tex,
        transparent: true,
        alphaTest: 0.25,
        side: THREE.DoubleSide,
        roughness: 0.78,
      });
    });

    // 4 Illustrated Trapos hung along the wider front Valla (subdivided for subtle wind ripple)
    const vallaTrapoGeo = new THREE.PlaneGeometry(2.75, 2.2, 12, 8);
    vallaTrapoGeo.translate(0, 1.1, 0);
    const vallaTrapoBasePos = new Float32Array(
      (vallaTrapoGeo.attributes.position as THREE.BufferAttribute).array
    );
    const vallaTrapoMeshes: THREE.Mesh[] = [];
    [-8.1, -2.7, 2.7, 8.1].forEach((bx, idx) => {
      const trapoMesh = new THREE.Mesh(vallaTrapoGeo, flagMaterials[idx % flagMaterials.length]);
      trapoMesh.position.set(bx, 0.08, -4.62);
      scene.add(trapoMesh);
      vallaTrapoMeshes.push(trapoMesh);
    });

    // Load all stage props & the 4 illustrated trapos from stage_01_d698b7e4.png
    loadStageCutoutTextures(maxAnisotropy)
      .then((stageSprites) => {
        const applyTex = (mesh: THREE.Mesh, tex: THREE.CanvasTexture) => {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.map = tex;
          mat.needsUpdate = true;
        };

        applyTex(stageDeckCutoutMesh, stageSprites.stageDeck);
        applyTex(trussArchFrontMesh, stageSprites.trussArch);
        applyTex(trussArchBackMesh, stageSprites.trussArch);
        applyTex(laRengaBackdropMesh, stageSprites.laRengaBackdrop);
        applyTex(marshallLeftMesh, stageSprites.marshallStacks);
        applyTex(marshallRightMesh, stageSprites.marshallStacks);
        applyTex(micStandChizzoMesh, stageSprites.micStand);
        applyTex(micStandTeteMesh, stageSprites.micStand);
        applyTex(guitarsOnStandMesh, stageSprites.guitarsOnStand);
        applyTex(cableBoxesLeftMesh, stageSprites.cableBoxes);
        applyTex(cableBoxesRightMesh, stageSprites.cableBoxes);

        wedgeMonitorMeshes.forEach((wm) => applyTex(wm, stageSprites.wedgeMonitors));
        vallaBarrierMeshes.forEach((vm) => applyTex(vm, stageSprites.vallaBarrier));

        // Update the 4 flag materials with the 4 hand-illustrated trapos from stage_01!
        const stageTrapos = [
          stageSprites.flagLaRenga,
          stageSprites.flagElBanquete,
          stageSprites.flagLosMismos,
          stageSprites.flagEstrellas,
        ];
        flagMaterials.forEach((mat, idx) => {
          mat.map = stageTrapos[idx % stageTrapos.length];
          mat.needsUpdate = true;
        });
      })
      .catch(() => {
        // Fallback props stay active if image fails
      });

    const MAX_AGENTS = 560; // 260 + 300 nuevos fanáticos en la playa!
    const agents: CrowdAgent[] = [];

    // 20 Shared Materials for the 20 unique hand-illustrated fans (fans01..fans04 + caballito)
    const fanVariantMaterials: THREE.MeshStandardMaterial[] = Array.from(
      { length: 20 },
      (_, vIdx) =>
        new THREE.MeshStandardMaterial({
          map: initialFanTextures[vIdx % initialFanTextures.length],
          transparent: true,
          alphaTest: 0.25,
          side: THREE.DoubleSide,
          roughness: 0.78,
        })
    );

    const standardFanGeo = new THREE.PlaneGeometry(1.55, 2.25);
    standardFanGeo.translate(0, 2.25 / 2, 0);
    const shoulderRiderFanGeo = new THREE.PlaneGeometry(1.82, 2.92);
    shoulderRiderFanGeo.translate(0, 2.92 / 2, 0);

    // 15 Materials for all 15 "Banderas de Palo" (9 from sheet 1 + 6 from sheet 2)
    const poleFlagMaterials: THREE.MeshStandardMaterial[] = Array.from({ length: 15 }, (_, idx) => {
      const fallbackTex = flagMaterials[idx % flagMaterials.length].map!;
      return new THREE.MeshStandardMaterial({
        map: fallbackTex,
        transparent: true,
        alphaTest: 0.25,
        side: THREE.DoubleSide,
        roughness: 0.78,
      });
    });

    // 3 phase-staggered subdivided geometries (18x12) with origin (0,0,0) at the BOTTOM BASE OF THE WOODEN POLE
    // so each flag rotates left-to-right from the base of the stick while the cloth undulates in the wind!
    const poleFlagWaveGeos = [0, 1, 2].map(() => {
      const geo = new THREE.PlaneGeometry(2.95, 3.65, 18, 12);
      // Original X spans [-1.475, +1.475], Y spans [-1.825, +1.825].
      // Shifting by (+1.24, +1.825) places the bottom tip of the left-side wooden pole right at (0, 0, 0)!
      geo.translate(1.24, 1.825, 0);
      return {
        geo,
        basePos: new Float32Array((geo.attributes.position as THREE.BufferAttribute).array),
      };
    });

    let flagCarrierCounter = 0;

    for (let i = 0; i < MAX_AGENTS; i++) {
      // Cycle across all 20 unique hand-illustrated fans from fans01, fans02, fans03, and fans04!
      const fanVariantIndex = i % 20;
      // Fan #0 (pibe a caballito) and Fan #16 (chica a caballito) are two people tall!
      const isShoulderRider = fanVariantIndex === 0 || fanVariantIndex === 16;
      const fanMesh = new THREE.Mesh(
        isShoulderRider ? shoulderRiderFanGeo : standardFanGeo,
        fanVariantMaterials[fanVariantIndex]
      );
      fanMesh.castShadow = true;

      const spawnAngle = ((i / MAX_AGENTS) - 0.36) * Math.PI * 0.92;
      const spawnDist = 24 + (i % 14) * 2.1;
      const startX = Math.max(-14.5, Math.sin(spawnAngle) * spawnDist);
      const startZ = Math.cos(spawnAngle) * spawnDist - 1;

      const fansPerRing = 32;
      const ringIndex = Math.floor(i / fansPerRing);
      const angleInRing =
        ((i % fansPerRing) / fansPerRing) * Math.PI * 1.48 -
        Math.PI * 0.70 +
        (ringIndex % 2) * 0.045;
      const radiusToStage = 2.2 + ringIndex * 0.88 + (Math.random() - 0.5) * 0.65;
      const targetX = Math.max(
        -14.2,
        Math.sin(angleInRing) * radiusToStage * 1.52
      );
      const targetZ = -3.8 + Math.cos(angleInRing * 0.5) * radiusToStage + ringIndex * 0.32;

      // Equip ~75 fans across the 560 crowd with all 15 Banderas de Palo (skipping Fan #8 who holds her own trapo and shoulder riders #0 & #16)
      const hasFlag =
        i % 6 === 0 &&
        fanVariantIndex !== 8 &&
        fanVariantIndex !== 0 &&
        fanVariantIndex !== 16;
      let flagMesh: THREE.Mesh | undefined;

      if (hasFlag) {
        const poleFlagIdx = flagCarrierCounter % poleFlagMaterials.length;
        const sharedWaveGeo = poleFlagWaveGeos[flagCarrierCounter % poleFlagWaveGeos.length].geo;
        flagCarrierCounter++;

        flagMesh = new THREE.Mesh(sharedWaveGeo, poleFlagMaterials[poleFlagIdx]);
        // Position the base of the wooden pole (0,0,0) right at the fan's hands!
        flagMesh.position.set(0.28, 0.92, 0.08);
        flagMesh.castShadow = true;
        fanMesh.add(flagMesh);
      }

      const baseScale = 0.88 + (i % 5) * 0.05;
      fanMesh.scale.set(baseScale, baseScale, baseScale);
      fanMesh.position.set(startX, 0, startZ);
      scene.add(fanMesh);

      agents.push({
        mesh: fanMesh,
        fanVariantIndex,
        startX,
        startZ,
        targetX,
        targetZ,
        progress: 0,
        speed: 0.25 + (i % 5) * 0.06,
        phase: i * 0.73,
        hasFlag,
        flagMesh,
        baseScale,
      });
    }

    // Load all 15 hand-illustrated "Banderas de Palo" (9 from sheet 1 + 6 from sheet 2)
    loadPoleFlagCutoutTextures(maxAnisotropy)
      .then((loadedPoleFlags) => {
        for (let idx = 0; idx < poleFlagMaterials.length; idx++) {
          const tex = loadedPoleFlags[idx % loadedPoleFlags.length];
          if (tex) {
            poleFlagMaterials[idx].map = tex;
            poleFlagMaterials[idx].needsUpdate = true;
          }
        }
      })
      .catch(() => {
        // Fallback flags remain active if image load fails
      });

    // Load all 20 hand-illustrated fan cutouts from fans01, fans02, fans03, fans04 & caballito
    loadFanCutoutTextures(maxAnisotropy)
      .then((loadedFanTextures) => {
        if (!loadedFanTextures.length) return;
        for (let vIdx = 0; vIdx < fanVariantMaterials.length; vIdx++) {
          const tex = loadedFanTextures[vIdx % loadedFanTextures.length];
          if (tex) {
            fanVariantMaterials[vIdx].map = tex;
            fanVariantMaterials[vIdx].needsUpdate = true;
          }
        }
      })
      .catch(() => {
        // Fallback fan cutouts stay active if image load fails
      });

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const clock = new THREE.Clock();
    let frameId = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      const count = songCountRef.current;
      const currentSong = activeSongRef.current;
      const isPogoSong =
        currentSong?.energy === 'pogo' ||
        flareActiveRef.current ||
        count >= 30;

      if (!userInteractingRef.current) {
        const preset = cameraPresetRef.current;
        if (preset === 'general') {
          _camTargetPos.set(2.5, 9.4, 22);
          _camLookAt.set(-1.5, 3.2, -6);
        } else if (preset === 'pogo') {
          _camTargetPos.set(0, 3.5, 7.8);
          _camLookAt.set(0, 3.6, -11);
        } else if (preset === 'stage') {
          _camTargetPos.set(0, 4.4, -1.2);
          _camLookAt.set(0, 3.8, -12.0);
        } else if (preset === 'entrance') {
          _camTargetPos.set(-16, 6.8, 18);
          _camLookAt.set(-2, 2.8, -6);
        }

        camera.position.x = THREE.MathUtils.damp(camera.position.x, _camTargetPos.x, 3.5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _camTargetPos.y, 3.5, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _camTargetPos.z, 3.5, delta);

        _currentLookAt.x = THREE.MathUtils.damp(_currentLookAt.x, _camLookAt.x, 4.0, delta);
        _currentLookAt.y = THREE.MathUtils.damp(_currentLookAt.y, _camLookAt.y, 4.0, delta);
        _currentLookAt.z = THREE.MathUtils.damp(_currentLookAt.z, _camLookAt.z, 4.0, delta);
        controls.target.copy(_currentLookAt);
      }

      controls.update();

      // Animate the ocean on the left: scroll UV towards the beach + bob the 2.5D wave crests + surf foam
      oceanTex.offset.x = -elapsed * 0.08;
      oceanTex.offset.y = Math.sin(elapsed * 0.4) * 0.04;
      foamRibbon.position.x = -17.5 + Math.sin(elapsed * 1.8) * 0.65;
      foamMat.opacity = 0.5 + Math.sin(elapsed * 3.6) * 0.25;

      for (let w = 0; w < waveCrestMeshes.length; w++) {
        const wc = waveCrestMeshes[w];
        const waveCycle = Math.sin(elapsed * 1.55 + wc.phase);
        wc.mesh.position.x = wc.baseX + waveCycle * 1.25;
        wc.mesh.position.y = Math.max(-0.35, waveCycle * 0.28);
        wc.mesh.rotation.z = Math.cos(elapsed * 1.55 + wc.phase) * 0.06;
      }

      // Gentle Atlantic wind sway on the coastal trees and dune bushes/grasses
      for (let t = 0; t < coastalTreeMeshes.length; t++) {
        const ct = coastalTreeMeshes[t];
        ct.mesh.rotation.z = Math.sin(elapsed * 1.2 + ct.phase) * 0.025;
      }
      for (let b = 0; b < duneBushMeshes.length; b++) {
        const db = duneBushMeshes[b];
        db.mesh.rotation.z = Math.sin(elapsed * 2.1 + db.phase) * 0.045;
      }

      const activeCrowdCount = Math.min(
        MAX_AGENTS,
        180 + Math.round((count / 36) * (MAX_AGENTS - 180))
      );

      const isAgitando = flareActiveRef.current;
      const jumpSpeed = isAgitando ? 16.5 : isPogoSong ? 11.5 : 6.5;
      const jumpHeight = isAgitando ? 0.68 : isPogoSong ? 0.42 : 0.16;

      for (let i = 0; i < MAX_AGENTS; i++) {
        const ag = agents[i];
        const isSummoned = i < activeCrowdCount;
        const targetProg = isSummoned ? 1 : 0;

        ag.progress = THREE.MathUtils.damp(ag.progress, targetProg, ag.speed * 4.5, delta);

        const curX = THREE.MathUtils.lerp(ag.startX, ag.targetX, ag.progress);
        const curZ = THREE.MathUtils.lerp(ag.startZ, ag.targetZ, ag.progress);

        const swirl =
          ag.progress > 0.85 && (isPogoSong || isAgitando)
            ? Math.sin(elapsed * (isAgitando ? 5.5 : 2.2) + ag.phase) *
              (isAgitando ? 0.65 : 0.35)
            : 0;

        ag.mesh.position.x = curX + swirl;
        ag.mesh.position.z = curZ;

        const bounce =
          Math.abs(Math.sin(elapsed * jumpSpeed + ag.phase)) *
          jumpHeight *
          (0.3 + 0.7 * ag.progress);
        ag.mesh.position.y = bounce;

        ag.mesh.rotation.y =
          Math.sin(elapsed * (isAgitando ? 6.0 : 2.5) + ag.phase) *
          (isAgitando ? 0.32 : 0.18);
        ag.mesh.rotation.z =
          Math.cos(elapsed * (isAgitando ? 7.5 : 3.2) + ag.phase) *
          (isAgitando ? 0.14 : 0.06);

        if (ag.hasFlag && ag.flagMesh) {
          // Rotate the pole flag left-to-right and back around the base of the wooden pole (0,0,0),
          // while the cloth vertices undulate in the wind!
          const swingSpeed = isAgitando ? 3.8 : isPogoSong ? 2.3 : 1.55;
          const swingAngleZ = isAgitando ? 0.48 : isPogoSong ? 0.34 : 0.24; // ~14° to ~28° left-to-right arc
          ag.flagMesh.rotation.z = Math.sin(elapsed * swingSpeed + ag.phase) * swingAngleZ;
          ag.flagMesh.rotation.y =
            Math.cos(elapsed * (swingSpeed * 0.85) + ag.phase) *
            (isAgitando ? 0.26 : 0.14);
        }
      }

      // Real-time cloth wave deformation on the 3 shared Banderas de Palo geometries
      // (keeps the wooden pole on the left straight while the cloth ripples towards the right tip)
      const waveSpeed = isAgitando ? 7.8 : isPogoSong ? 5.2 : 3.6;
      const waveBoost = isAgitando ? 1.55 : isPogoSong ? 1.18 : 0.85;
      for (let gIdx = 0; gIdx < poleFlagWaveGeos.length; gIdx++) {
        const { geo, basePos } = poleFlagWaveGeos[gIdx];
        const posAttr = geo.attributes.position as THREE.BufferAttribute;
        const countVerts = posAttr.count;
        const phaseOffset = gIdx * 2.1;

        for (let v = 0; v < countVerts; v++) {
          const bx = basePos[v * 3];
          const by = basePos[v * 3 + 1];
          // With translate(1.24, 1.825, 0), the wooden pole sits around bx <= 0.18; cloth extends to bx = 2.715
          const clothU = THREE.MathUtils.clamp((bx - 0.18) / 2.52, 0, 1);
          if (clothU <= 0) {
            posAttr.setXYZ(v, bx, by, 0);
          } else {
            const easeCloth = clothU * Math.sqrt(clothU);
            const primaryWave = Math.sin(
              clothU * 5.2 - elapsed * waveSpeed + phaseOffset + by * 0.42
            );
            const secondaryRipple = Math.cos(
              clothU * 9.6 - elapsed * (waveSpeed * 1.45) + phaseOffset
            );
            const dz = (primaryWave * 0.36 + secondaryRipple * 0.11) * easeCloth * waveBoost;
            const dy = primaryWave * easeCloth * 0.055 * waveBoost;
            posAttr.setXYZ(v, bx, by + dy, dz);
          }
        }
        posAttr.needsUpdate = true;
      }

      // Subtle wind ripple on the 4 valla trapos
      {
        const posAttr = vallaTrapoGeo.attributes.position as THREE.BufferAttribute;
        const countVerts = posAttr.count;
        for (let v = 0; v < countVerts; v++) {
          const bx = vallaTrapoBasePos[v * 3];
          const by = vallaTrapoBasePos[v * 3 + 1];
          // Top edge of trapo (by ~ 2.05) is tied to the valla rail; bottom hangs down to by = 0
          const hangFactor = THREE.MathUtils.clamp((2.05 - by) / 2.05, 0, 1);
          const dz =
            Math.sin(bx * 2.6 - elapsed * 3.4 + hangFactor * 3.2) *
            hangFactor *
            0.16;
          posAttr.setXYZ(v, bx, by, dz);
        }
        posAttr.needsUpdate = true;
      }

      // Shimmering Moon glow halo in the night sky
      moonHaloMat.opacity = 0.74 + Math.sin(elapsed * 2.1) * 0.16;
      const haloScale = 1.0 + Math.sin(elapsed * 1.5) * 0.045;
      moonHaloMesh.scale.set(haloScale, haloScale, 1);
      moonMat.emissiveIntensity = 0.68 + Math.sin(elapsed * 2.1) * 0.14;

      // Subtle wind sway on the stage backdrop telón
      laRengaBackdropMesh.rotation.z = Math.sin(elapsed * 1.4) * 0.015;

      // ============================================================================
      // SPEAKER & MONITOR BASS VIBRATION (Marshall Stacks, Floor Monitors & Line-Arrays)
      // ============================================================================
      const songBpm = currentSong?.tempoBpm || 134;
      const beatFreq = (songBpm / 60) * Math.PI * 2; // radians per second matching the song's BPM
      const liveAudioLevel = rockAudio.getAudioPulse(); // 0..1 when Riff / Agitar audio is playing
      const energyMult =
        (isAgitando ? 1.85 : isPogoSong ? 1.35 : 0.95) + liveAudioLevel * 1.45;

      // Sharp bass cone punch (kick + snare + guitar cabinet thump + high-freq cabinet buzz)
      const kickPulse = Math.pow(Math.max(0, Math.sin(elapsed * beatFreq)), 3);
      const doublePulse = Math.pow(Math.max(0, Math.sin(elapsed * beatFreq * 2)), 4);
      const cabinetBuzz = Math.sin(elapsed * 44.0) * (0.014 + liveAudioLevel * 0.028);

      const marshallScaleX =
        1.0 + (kickPulse * 0.085 + doublePulse * 0.045) * energyMult + cabinetBuzz;
      const marshallScaleY =
        1.0 + (kickPulse * 0.065 - doublePulse * 0.025) * energyMult - cabinetBuzz * 0.6;
      const marshallHopY = 1.56 + kickPulse * 0.09 * energyMult;
      const marshallShakeZ =
        Math.sin(elapsed * beatFreq * 1.5) * 0.028 * energyMult + cabinetBuzz * 0.8;

      marshallLeftMesh.scale.set(marshallScaleX, marshallScaleY, 1);
      marshallLeftMesh.position.y = marshallHopY;
      marshallLeftMesh.rotation.z = marshallShakeZ;

      marshallRightMesh.scale.set(marshallScaleX, marshallScaleY, 1);
      marshallRightMesh.position.y = marshallHopY;
      marshallRightMesh.rotation.z = -marshallShakeZ;

      // Floor Wedge Monitors along the front edge of the stage vibrating in phase with the bass
      for (let m = 0; m < wedgeMonitorMeshes.length; m++) {
        const wm = wedgeMonitorMeshes[m];
        const mPhase = m * 0.65;
        const mKick = Math.pow(Math.max(0, Math.sin(elapsed * beatFreq * 2 + mPhase)), 3);
        const wmSx = 1.0 + mKick * 0.095 * energyMult + cabinetBuzz * 0.7;
        const wmSy = 1.0 + mKick * 0.075 * energyMult - cabinetBuzz * 0.5;
        wm.scale.set(wmSx, wmSy, 1);
        wm.position.y = 1.56 + mKick * 0.055 * energyMult;
        wm.rotation.z = Math.cos(elapsed * 32.0 + mPhase) * 0.022 * energyMult;
      }

      // Subtle bass thump on the front truss hanging line-array speakers
      const trussPulse = 1.0 + kickPulse * 0.016 * energyMult;
      trussArchFrontMesh.scale.set(trussPulse, 1.0 + kickPulse * 0.01 * energyMult, 1);

      // Band animation & slower, natural pose switching (~9–12s per pose)
      chizzoMesh.position.y = 1.56 + Math.abs(Math.sin(elapsed * 5.2)) * 0.12;
      chizzoMesh.rotation.z = Math.sin(elapsed * 2.4) * 0.04;

      teteMesh.position.x = 3.05 + Math.sin(elapsed * 1.25) * 1.35;
      teteMesh.position.y = 1.56 + Math.abs(Math.cos(elapsed * 6.2)) * 0.18;
      teteMesh.rotation.z = Math.cos(elapsed * 3.0) * 0.05;

      tanqueMesh.scale.y = 1.0 + Math.sin(elapsed * 11.0) * 0.03;

      manuMesh.position.y = 1.56 + Math.abs(Math.sin(elapsed * 4.4 + 1.1)) * 0.10;
      manuMesh.rotation.z = Math.sin(elapsed * 2.2) * 0.04;

      if (bandSprites) {
        const chizzoMat = chizzoMesh.material as THREE.MeshStandardMaterial;
        const chizzoCycle = Math.sin(elapsed * 0.18);
        const targetChizzoTex = isAgitando
          ? bandSprites.chizzoSolo
          : chizzoCycle > 0.48
            ? bandSprites.chizzoSolo
            : chizzoCycle < -0.42
              ? bandSprites.chizzoCheering
              : bandSprites.chizzoSinging;
        if (chizzoMat.map !== targetChizzoTex) {
          chizzoMat.map = targetChizzoTex;
          chizzoMat.needsUpdate = true;
        }

        const teteMat = teteMesh.material as THREE.MeshStandardMaterial;
        const teteCycle = Math.sin(elapsed * 0.21 + 1.2);
        const targetTeteTex =
          isAgitando || teteCycle > 0.52
            ? bandSprites.teteJumping
            : teteCycle < -0.32
              ? bandSprites.teteRunning
              : bandSprites.teteBass;
        if (teteMat.map !== targetTeteTex) {
          teteMat.map = targetTeteTex;
          teteMat.needsUpdate = true;
        }

        const tanqueMat = tanqueMesh.material as THREE.MeshStandardMaterial;
        const tanqueCycle = Math.sin(elapsed * 0.16 + 2.4);
        const targetTanqueTex = isAgitando
          ? bandSprites.tanqueCheering
          : tanqueCycle > 0.55
            ? bandSprites.tanqueCheering
            : tanqueCycle < -0.45
              ? bandSprites.tanqueRoaring
              : bandSprites.tanquePlaying;
        if (tanqueMat.map !== targetTanqueTex) {
          tanqueMat.map = targetTanqueTex;
          tanqueMat.needsUpdate = true;
        }

        const manuMat = manuMesh.material as THREE.MeshStandardMaterial;
        const targetManuTex =
          Math.cos(elapsed * 0.15) > 0.22
            ? bandSprites.manuSax
            : bandSprites.manuHarmonica;
        if (manuMat.map !== targetManuTex) {
          manuMat.map = targetManuTex;
          manuMat.needsUpdate = true;
        }
      }

      const flareMultiplier = flareActiveRef.current ? 2.4 : 1.0;
      crowdFlareLight.intensity =
        (6 + Math.sin(elapsed * 9.0) * 2.5 + (count / 36) * 8) * flareMultiplier;
      rimLight.intensity = 14 + Math.cos(elapsed * 4.0) * 4;

      // Animate Unlockable Decorative 3D Stage Rewards
      const activeUnlockables = enabledUnlockablesRef.current;
      const hasFire = activeUnlockables.includes('stage_fire');
      const hasLasers = activeUnlockables.includes('stadium_lasers');
      const hasGuest = activeUnlockables.includes('guest_musician');
      const hasPyro = activeUnlockables.includes('golden_pyro');

      stageFireGroup.visible = hasFire;
      if (hasFire) {
        const fireBoost = isAgitando ? 1.65 : isPogoSong ? 1.25 : 0.85;
        for (let f = 0; f < fireColumnMeshes.length; f++) {
          const fc = fireColumnMeshes[f];
          const pulse = Math.abs(Math.sin(elapsed * 8.5 + fc.phase));
          const sy = (0.55 + pulse * 0.95) * fireBoost;
          const sx = 0.85 + Math.sin(elapsed * 14.0 + fc.phase) * 0.18;
          fc.outer.scale.set(sx, sy, sx);
          fc.inner.scale.set(sx * 0.85, sy * 0.9, sx * 0.85);
        }
        stageFireLight.intensity = (14 + Math.sin(elapsed * 12) * 6) * fireBoost;
      }

      stadiumLasersGroup.visible = hasLasers;
      if (hasLasers) {
        for (let l = 0; l < laserBeamMeshes.length; l++) {
          const lb = laserBeamMeshes[l];
          lb.mesh.rotation.z = Math.sin(elapsed * 1.45 + lb.phase) * 0.48;
          lb.mesh.rotation.x = 0.68 + Math.cos(elapsed * 1.1 + lb.phase) * 0.24;
        }
      }

      guestGroup.visible = hasGuest;
      if (hasGuest) {
        guestMesh.position.y = 1.56 + Math.abs(Math.sin(elapsed * 5.6 + 0.6)) * 0.15;
        guestMesh.rotation.z = Math.sin(elapsed * 2.8) * 0.06;
      }

      goldenPyroGroup.visible = hasPyro;
      if (hasPyro) {
        const pAttr = pyroGeo.attributes.position as THREE.BufferAttribute;
        for (let p = 0; p < PYRO_COUNT; p++) {
          const emX = pyroEmitters[p % pyroEmitters.length];
          const cycle = (elapsed * 1.8 + pyroPhases[p]) % 3.2;
          const norm = cycle / 3.2;
          const px = emX + Math.sin(p * 1.7 + elapsed * 2.0) * (0.4 + norm * 1.6);
          const py = 8.6 + Math.sin(norm * Math.PI) * 4.2 - norm * 1.8;
          const pz = 0.8 + Math.cos(p * 2.3) * (0.3 + norm * 0.9);
          pAttr.setXYZ(p, px, py, pz);
        }
        pAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-full relative overflow-hidden select-none"
      aria-label="Playa 3D de Necochea con el escenario ilustrado, público y pantallas del Banquete de La Renga"
    />
  );
};
