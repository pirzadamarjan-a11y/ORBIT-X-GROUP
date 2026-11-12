import * as THREE from 'three';

export const isCompactViewport = () => window.innerWidth < 760;

export const createRenderer = (container) => {
  const canvas = document.createElement('canvas');
  canvas.className = 'scene-canvas';
  container.append(canvas);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isCompactViewport() ? 1.6 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.setClearColor(0x000000, 0);
  return { renderer, canvas };
};

export const observeSize = (container, callback) => {
  const observer = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    const { width, height } = entry.contentRect;
    if (width > 0 && height > 0) callback(Math.round(width), Math.round(height));
  });
  observer.observe(container);
  callback(Math.max(1, container.clientWidth), Math.max(1, container.clientHeight));
  return observer;
};

const STAR_VERTEX = `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float twinkle = 0.72 + 0.28 * sin(uTime * (0.35 + aPhase * 0.16) + aPhase * 6.2831);
    gl_PointSize = aSize * uPixelRatio * (0.8 + twinkle * 0.25);
    gl_PointSize *= clamp(130.0 / max(-mvPosition.z, 1.0), 0.55, 1.9);
    vColor = aColor;
    vAlpha = 0.5 + twinkle * 0.5;
  }
`;

const STAR_FRAGMENT = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 coord = gl_PointCoord - 0.5;
    float distanceToCenter = length(coord);
    if (distanceToCenter > 0.5) discard;
    float alpha = smoothstep(0.5, 0.03, distanceToCenter) * vAlpha;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export const createStars = ({
  count = 4500,
  minRadius = 90,
  maxRadius = 320,
  pixelRatio = 1,
} = {}) => {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const palette = [
    new THREE.Color('#dce9ff'),
    new THREE.Color('#ffffff'),
    new THREE.Color('#9fc7ff'),
    new THREE.Color('#b8a9ff'),
    new THREE.Color('#ffe3bd'),
  ];

  for (let i = 0; i < count; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi);
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    const color = palette[Math.floor(Math.random() * palette.length)].clone();
    color.multiplyScalar(0.62 + Math.random() * 0.55);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
    sizes[i] = 0.7 + Math.pow(Math.random(), 3) * 3.6;
    phases[i] = Math.random();
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: STAR_VERTEX,
    fragmentShader: STAR_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(pixelRatio, 2) },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: false,
  });

  const stars = new THREE.Points(geometry, material);
  stars.frustumCulled = false;
  stars.renderOrder = -2;
  stars.userData.update = (time) => {
    material.uniforms.uTime.value = time;
  };
  return stars;
};

export const createGlowTexture = (
  inner = 'rgba(255,255,255,1)',
  mid = 'rgba(150,210,255,0.35)',
  outer = 'rgba(0,0,0,0)',
) => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.25, mid);
  gradient.addColorStop(1, outer);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

export const createGlowSprite = ({
  color = '#8ee7ff',
  scale = 10,
  opacity = 0.55,
  layers = 1,
} = {}) => {
  const group = new THREE.Group();
  for (let i = 0; i < layers; i += 1) {
    const texture = createGlowTexture(
      `rgba(255,255,255,${0.9 - i * 0.18})`,
      color.replace(')', `,${0.32 - i * 0.06})`).replace('rgb', 'rgba'),
      'rgba(0,0,0,0)',
    );
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: new THREE.Color(color),
      transparent: true,
      opacity: opacity - i * 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.setScalar(scale * (1 + i * 0.9));
    group.add(sprite);
  }
  return group;
};

export const createAtmosphereMaterial = (
  color = '#69b9ff',
  intensity = 1.4,
  power = 3.2,
) =>
  new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uIntensity;
      uniform float uPower;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        float rim = pow(1.0 - abs(dot(vNormal, vViewDir)), uPower);
        gl_FragColor = vec4(uColor, rim * uIntensity);
      }
    `,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
      uPower: { value: power },
    },
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

export const createOrbitPath = (radius, { color = '#5882ac', opacity = 0.24, segments = 192 } = {}) => {
  const points = [];
  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const line = new THREE.LineLoop(geometry, material);
  line.rotation.x = 0;
  return line;
};

export const createDashedCurve = (curve, { color = '#5fe7ff', opacity = 0.7 } = {}) => {
  const points = curve.getPoints(180);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineDashedMaterial({
    color,
    dashSize: 0.65,
    gapSize: 0.42,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const line = new THREE.Line(geometry, material);
  line.computeLineDistances();
  return line;
};

export const createPlanetRings = ({
  innerRadius,
  outerRadius,
  texture = null,
  color = '#e3d2ac',
  opacity = 0.96,
  segments = 128,
  tilt = 0,
} = {}) => {
  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, segments, 1);
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < position.count; i += 1) {
    const radius = Math.sqrt(position.getX(i) ** 2 + position.getY(i) ** 2);
    uv.setXY(i, (radius - innerRadius) / (outerRadius - innerRadius), 0.5);
  }
  uv.needsUpdate = true;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    color: new THREE.Color(color),
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.y = tilt;
  return mesh;
};

export const disposeObject = (root) => {
  if (!root) return;
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  root.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
    objectMaterials.filter(Boolean).forEach((material) => {
      materials.add(material);
      Object.values(material).forEach((value) => {
        if (value && value.isTexture) textures.add(value);
      });
      Object.values(material.uniforms ?? {}).forEach((uniform) => {
        if (uniform?.value?.isTexture) textures.add(uniform.value);
      });
    });
  });
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
};

export const getResponsivePixelRatio = () =>
  Math.min(window.devicePixelRatio || 1, isCompactViewport() ? 1.6 : 2);

export const createCamera = ({ fov = 45, near = 0.1, far = 2000 } = {}) =>
  new THREE.PerspectiveCamera(fov, 1, near, far);

export const addEdgeFade = (renderer) => {
  renderer.toneMappingExposure = 1.18;
};
