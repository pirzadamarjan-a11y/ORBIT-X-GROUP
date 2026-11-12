import * as THREE from 'three';
import { createAtmosphereMaterial, createGlowSprite, createPlanetRings } from './core.js';

export const TEXTURE_FILES = {
  mercury: 'textures/mercury.jpg',
  venus: 'textures/venus.jpg',
  earth: 'textures/earth_daymap.jpg',
  mars: 'textures/mars.jpg',
  jupiter: 'textures/jupiter.jpg',
  saturn: 'textures/saturn.jpg',
  uranus: 'textures/uranus.jpg',
  neptune: 'textures/neptune.jpg',
  sun: 'textures/sun.jpg',
  moon: 'textures/moon.jpg',
  earthClouds: 'textures/earth-clouds.jpg',
  saturnRing: 'textures/saturn-ring.png',
};

export const ATMOSPHERES = {
  venus: { color: '#ffd88a', intensity: 0.74, power: 3.4 },
  earth: { color: '#66b7ff', intensity: 1.3, power: 3.1 },
  mars: { color: '#ff9d76', intensity: 0.36, power: 3.8 },
  jupiter: { color: '#f2d2ac', intensity: 0.28, power: 3.8 },
  saturn: { color: '#f7e5ba', intensity: 0.2, power: 4 },
  uranus: { color: '#9cf7f8', intensity: 0.38, power: 3.4 },
  neptune: { color: '#78a4ff', intensity: 0.42, power: 3.4 },
};

const textureLoader = new THREE.TextureLoader();

export const assetUrl = (file) => {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${file.replace(/^\.?\//, '')}`;
};

export const loadTexture = (file, renderer, { srgb = true } = {}) =>
  new Promise((resolve, reject) => {
    textureLoader.load(
      assetUrl(file),
      (texture) => {
        texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.needsUpdate = true;
        resolve(texture);
      },
      undefined,
      (error) => {
        const textureError = new Error(`Unable to load texture: ${file}`);
        textureError.cause = error;
        reject(textureError);
      },
    );
  });

const planetMaterial = (id, map) => {
  if (id === 'sun') {
    return new THREE.MeshBasicMaterial({ map, toneMapped: false });
  }
  const rocky = ['mercury', 'venus', 'earth', 'mars', 'moon'].includes(id);
  const hasBumpMap = ['mercury', 'mars', 'moon'].includes(id);
  return new THREE.MeshStandardMaterial({
    map,
    color: 0xffffff,
    roughness: rocky ? (id === 'earth' ? 0.72 : 0.94) : 0.9,
    metalness: id === 'earth' ? 0.03 : 0.02,
    bumpMap: hasBumpMap ? map : null,
    ...(hasBumpMap ? { bumpScale: 0.018 } : {}),
  });
};

export async function createPlanetBody(
  id,
  radius,
  renderer,
  { segments = 64, includeClouds = true, includeRings = true } = {},
) {
  const file = TEXTURE_FILES[id] ?? TEXTURE_FILES.earth;
  const map = await loadTexture(file, renderer);
  const group = new THREE.Group();
  group.name = `body-${id}`;

  const geometry = new THREE.SphereGeometry(radius, segments, Math.max(32, Math.round(segments / 2)));
  const material = planetMaterial(id, map);
  const body = new THREE.Mesh(geometry, material);
  body.name = id;
  body.rotation.y = Math.random() * Math.PI * 2;
  group.add(body);

  let clouds = null;
  if (id === 'earth' && includeClouds) {
    const cloudMap = await loadTexture(TEXTURE_FILES.earthClouds, renderer);
    const cloudAlpha = cloudMap.clone();
    cloudAlpha.colorSpace = THREE.NoColorSpace;
    cloudAlpha.needsUpdate = true;
    const cloudMaterial = new THREE.MeshStandardMaterial({
      map: cloudMap,
      alphaMap: cloudAlpha,
      color: 0xffffff,
      transparent: true,
      opacity: 0.72,
      roughness: 1,
      metalness: 0,
      depthWrite: false,
    });
    clouds = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.012, segments, Math.max(32, Math.round(segments / 2))),
      cloudMaterial,
    );
    clouds.rotation.y = Math.random() * Math.PI;
    group.add(clouds);
    group.userData.cloudMap = cloudAlpha;
  }

  let atmosphere = null;
  const atmosphereConfig = ATMOSPHERES[id];
  if (atmosphereConfig) {
    atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.055, 48, 32),
      createAtmosphereMaterial(
        atmosphereConfig.color,
        atmosphereConfig.intensity,
        atmosphereConfig.power,
      ),
    );
    group.add(atmosphere);
  }

  let rings = null;
  if (id === 'saturn' && includeRings) {
    const ringMap = await loadTexture(TEXTURE_FILES.saturnRing, renderer);
    rings = createPlanetRings({
      innerRadius: radius * 1.32,
      outerRadius: radius * 2.28,
      texture: ringMap,
      color: '#f2e3c4',
      opacity: 0.96,
    });
    group.add(rings);
  } else if (id === 'uranus' && includeRings) {
    rings = createPlanetRings({
      innerRadius: radius * 1.5,
      outerRadius: radius * 1.9,
      color: '#a9edf2',
      opacity: 0.16,
      segments: 96,
    });
    rings.rotation.z = 0.2;
    group.add(rings);
  } else if (id === 'jupiter' && includeRings) {
    rings = createPlanetRings({
      innerRadius: radius * 1.5,
      outerRadius: radius * 1.72,
      color: '#cdbba8',
      opacity: 0.1,
      segments: 96,
    });
    group.add(rings);
  } else if (id === 'neptune' && includeRings) {
    rings = createPlanetRings({
      innerRadius: radius * 1.55,
      outerRadius: radius * 1.64,
      color: '#88a7ff',
      opacity: 0.14,
      segments: 96,
    });
    group.add(rings);
  }

  if (id === 'sun') {
    const innerGlow = createGlowSprite({ color: '#ffd7a0', scale: radius * 5.1, opacity: 0.44, layers: 2 });
    group.add(innerGlow);
  }

  group.userData.body = body;
  group.userData.clouds = clouds;
  group.userData.atmosphere = atmosphere;
  group.userData.rings = rings;
  group.userData.texture = map;
  return { group, body, clouds, atmosphere, rings };
}
