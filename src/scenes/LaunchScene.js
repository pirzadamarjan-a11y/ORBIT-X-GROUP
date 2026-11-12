import * as THREE from 'three';
import {
  createCamera,
  createGlowTexture,
  createRenderer,
  createStars,
  disposeObject,
  observeSize,
} from './core.js';
import { loadTexture, TEXTURE_FILES } from './planetTextures.js';
import { clamp } from '../utils/format.js';

const EARTH_RADIUS = 180;
const MAX_ALTITUDE = 146;

class SmokeField {
  constructor(pixelRatio) {
    this.count = window.innerWidth < 760 ? 190 : 360;
    this.positions = new Float32Array(this.count * 3);
    this.sizes = new Float32Array(this.count);
    this.alphas = new Float32Array(this.count);
    this.particles = Array.from({ length: this.count }, () => ({
      life: 0,
      maxLife: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      size: 0,
    }));
    this.cursor = 0;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphas, 1));
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: pixelRatio },
        uColor: { value: new THREE.Color('#b8c4d4') },
        uLight: { value: new THREE.Vector3(0, 5, 8) },
      },
      vertexShader: `
        uniform float uPixelRatio;
        attribute float aSize;
        attribute float aAlpha;
        varying float vAlpha;
        varying vec3 vNormalizedPosition;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = aSize * uPixelRatio * (260.0 / max(-mvPosition.z, 1.0));
          vAlpha = aAlpha;
          vNormalizedPosition = vec3(0.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        varying vec3 vNormalizedPosition;
        void main() {
          vec2 coord = gl_PointCoord - 0.5;
          float dist = length(coord);
          if (dist > 0.5) discard;
          float soft = smoothstep(0.5, 0.02, dist);
          float noise = 0.82 + 0.18 * sin((gl_PointCoord.x + gl_PointCoord.y) * 19.0);
          gl_FragColor = vec4(uColor * noise, vAlpha * soft);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    this.points = new THREE.Points(geometry, material);
    this.points.frustumCulled = false;
    this.geometry = geometry;
    this.material = material;
  }

  emit(origin, count, { spread = 1.4, upward = 0.45, size = 1.4, lifetime = 3.5 } = {}) {
    for (let i = 0; i < count; i += 1) {
      const index = this.cursor;
      this.cursor = (this.cursor + 1) % this.count;
      const particle = this.particles[index];
      const angle = Math.random() * Math.PI * 2;
      const radial = Math.random() * spread;
      this.positions[index * 3] = origin.x + Math.cos(angle) * radial * 0.35;
      this.positions[index * 3 + 1] = origin.y + Math.random() * 0.6;
      this.positions[index * 3 + 2] = origin.z + Math.sin(angle) * radial * 0.35;
      particle.vx = Math.cos(angle) * radial;
      particle.vy = Math.random() * upward + 0.1;
      particle.vz = Math.sin(angle) * radial;
      particle.maxLife = lifetime * (0.55 + Math.random() * 0.75);
      particle.life = particle.maxLife;
      particle.size = size * (0.6 + Math.random() * 1.5);
      this.sizes[index] = particle.size;
      this.alphas[index] = 0;
    }
  }

  update(delta) {
    for (let i = 0; i < this.count; i += 1) {
      const particle = this.particles[i];
      if (particle.life <= 0) {
        this.alphas[i] = 0;
        continue;
      }
      particle.life -= delta;
      const age = 1 - Math.max(0, particle.life) / particle.maxLife;
      this.positions[i * 3] += particle.vx * delta;
      this.positions[i * 3 + 1] += particle.vy * delta;
      this.positions[i * 3 + 2] += particle.vz * delta;
      particle.vx *= 1 - delta * 0.38;
      particle.vz *= 1 - delta * 0.38;
      particle.vy += delta * 0.07;
      this.sizes[i] = particle.size * (1 + age * 2.2);
      this.alphas[i] = Math.sin(Math.min(1, age * 1.6) * Math.PI * 0.5) * (1 - age) * 0.4;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.aSize.needsUpdate = true;
    this.geometry.attributes.aAlpha.needsUpdate = true;
  }

  reset() {
    this.particles.forEach((particle) => {
      particle.life = 0;
    });
    this.alphas.fill(0);
    this.geometry.attributes.aAlpha.needsUpdate = true;
  }
}

export class LaunchScene {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.scene = new THREE.Scene();
    this.camera = createCamera({ fov: 42, near: 0.1, far: 900 });
    const { renderer, canvas } = createRenderer(container);
    this.renderer = renderer;
    this.canvas = canvas;
    this.running = false;
    this.frame = 0;
    this.clock = new THREE.Clock();
    this.elapsed = 0;
    this.ignited = false;
    this.launching = false;
    this.flightTime = 0;
    this.completed = false;
    this.resizeObserver = null;
    this.telemetryClock = 0;
    this.cameraShake = 0;
    this.lastTime = 0;
  }

  async init() {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.setDefaultCamera(true);

    this.scene.add(new THREE.AmbientLight(0x4f617e, 0.6));
    const moonLight = new THREE.DirectionalLight(0xccdcff, 2.6);
    moonLight.position.set(-18, 30, 12);
    this.scene.add(moonLight);
    const warmFill = new THREE.DirectionalLight(0xffa968, 1.2);
    warmFill.position.set(14, 6, 8);
    this.scene.add(warmFill);

    this.stars = createStars({
      count: window.innerWidth < 760 ? 1600 : 3600,
      minRadius: 140,
      maxRadius: 460,
      pixelRatio: this.renderer.getPixelRatio(),
    });
    this.scene.add(this.stars);

    const earthMap = await loadTexture(TEXTURE_FILES.earth, this.renderer);
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_RADIUS, 96, 64),
      new THREE.MeshBasicMaterial({ map: earthMap, color: 0x4e5e76 }),
    );
    earth.position.y = -EARTH_RADIUS - 1.35;
    this.scene.add(earth);
    this.earth = earth;

    const horizonGlow = new THREE.Mesh(
      new THREE.RingGeometry(EARTH_RADIUS + 2, EARTH_RADIUS + 4, 160),
      new THREE.MeshBasicMaterial({
        color: 0x5aa0ff,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    horizonGlow.rotation.x = -Math.PI / 2;
    horizonGlow.position.y = -0.8;
    this.scene.add(horizonGlow);

    this.buildPad();
    this.buildRocket();
    this.smoke = new SmokeField(this.renderer.getPixelRatio());
    this.scene.add(this.smoke.points);

    this.resizeObserver = observeSize(this.container, (w, h) => this.resize(w, h));
    this.resize(width, height);
    this.start();
    this.callbacks.onReady?.();
  }

  setDefaultCamera(immediate = false) {
    const mobile = window.innerWidth < 760;
    const targetPos = mobile
      ? new THREE.Vector3(10.5, 6.2, 20)
      : new THREE.Vector3(7.5, 4.9, 14.5);
    this.cameraBase = targetPos;
    this.cameraTargetBase = new THREE.Vector3(0, 4.3, 0);
    if (immediate) {
      this.camera.position.copy(targetPos);
      this.camera.lookAt(this.cameraTargetBase);
    }
  }

  buildPad() {
    const pad = new THREE.Group();
    const concrete = new THREE.MeshStandardMaterial({
      color: 0x151b24,
      metalness: 0.3,
      roughness: 0.75,
    });
    const metal = new THREE.MeshStandardMaterial({
      color: 0x26303c,
      metalness: 0.8,
      roughness: 0.3,
    });
    const accent = new THREE.MeshBasicMaterial({
      color: 0x5edfff,
      transparent: true,
      opacity: 0.72,
    });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(7.4, 8.2, 1.2, 64), concrete);
    base.position.y = -0.8;
    pad.add(base);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(6.7, 7.25, 0.18, 64), metal);
    top.position.y = -0.16;
    pad.add(top);
    const padRing = new THREE.Mesh(new THREE.RingGeometry(3.3, 3.38, 96), accent);
    padRing.rotation.x = -Math.PI / 2;
    padRing.position.y = -0.06;
    pad.add(padRing);
    const padRing2 = new THREE.Mesh(
      new THREE.RingGeometry(5.55, 5.6, 96),
      new THREE.MeshBasicMaterial({ color: 0xffc278, transparent: true, opacity: 0.35 }),
    );
    padRing2.rotation.x = -Math.PI / 2;
    padRing2.position.y = -0.06;
    pad.add(padRing2);

    const grateMaterial = new THREE.MeshStandardMaterial({
      color: 0x0b1016,
      metalness: 0.5,
      roughness: 0.5,
    });
    for (let i = -2; i <= 2; i += 1) {
      const grid = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 6.8), grateMaterial);
      grid.position.set(i * 0.65, -0.043, 0);
      pad.add(grid);
    }
    for (let i = -3; i <= 3; i += 1) {
      const grid = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.02, 0.08), grateMaterial);
      grid.position.set(0, -0.043, i * 0.65);
      pad.add(grid);
    }

    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      const light = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), accent);
      light.position.set(Math.cos(angle) * 6.15, -0.04, Math.sin(angle) * 6.15);
      pad.add(light);
    }

    const tower = new THREE.Group();
    tower.position.set(-4.6, 0, -0.2);
    const towerHeight = 11.8;
    [-1.25, 1.25].forEach((x) => {
      [-0.8, 0.8].forEach((z) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, towerHeight, 0.16), metal);
        leg.position.set(x, towerHeight / 2, z);
        tower.add(leg);
      });
    });
    for (let y = 0.8; y < towerHeight; y += 1.35) {
      const beamX = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.1, 0.1), metal);
      beamX.position.set(0, y, -0.8);
      tower.add(beamX);
      const beamZ = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.65), metal);
      beamZ.position.set(1.25, y, 0);
      tower.add(beamZ);
      if (y < 8) {
        const brace = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.55, 0.06), metal);
        brace.position.set(0, y + 0.55, -0.8);
        brace.rotation.z = y % 2.7 < 1.4 ? 0.75 : -0.75;
        tower.add(brace);
      }
    }
    const armPivot = new THREE.Group();
    armPivot.position.set(1.25, 7.8, 0);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.17, 0.28), metal);
    arm.position.x = 1.4;
    armPivot.add(arm);
    const armCable = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.32), accent);
    armCable.position.set(2.7, 0, 0);
    armPivot.add(armCable);
    tower.add(armPivot);
    this.serviceArm = armPivot;

    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xff6779, toneMapped: false }),
    );
    beacon.position.set(0, towerHeight + 0.2, 0);
    tower.add(beacon);
    this.beacon = beacon;
    pad.add(tower);

    for (const [x, z] of [
      [6.2, 4.2],
      [-6.2, 4.8],
      [4.9, -5.2],
      [-5.6, -4.6],
    ]) {
      const pylon = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.3, 8), metal);
      pole.position.y = 1.65;
      pylon.add(pole);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.16), metal);
      head.position.y = 3.35;
      head.lookAt(0, 3.7, 0);
      pylon.add(head);
      const beam = new THREE.Mesh(
        new THREE.ConeGeometry(1.7, 6.4, 24, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0xc9e8ff,
          transparent: true,
          opacity: 0.035,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      beam.position.y = 6.5;
      beam.rotation.z = Math.PI;
      pylon.add(beam);
      const point = new THREE.PointLight(0xd7ecff, 6, 12, 2);
      point.position.y = 3.25;
      pylon.add(point);
      pylon.position.set(x, 0, z);
      pylon.lookAt(0, 1.5, 0);
      pad.add(pylon);
    }

    const padLight = new THREE.PointLight(0xffc080, 38, 22, 2);
    padLight.position.set(0, 1, 4);
    pad.add(padLight);
    this.scene.add(pad);
    this.pad = pad;
  }

  buildRocket() {
    const rocket = new THREE.Group();
    const white = new THREE.MeshStandardMaterial({
      color: 0xf1f4f8,
      metalness: 0.45,
      roughness: 0.32,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: 0x1b222b,
      metalness: 0.68,
      roughness: 0.28,
    });
    const copper = new THREE.MeshStandardMaterial({
      color: 0xb96a42,
      metalness: 0.65,
      roughness: 0.3,
    });
    const accent = new THREE.MeshBasicMaterial({ color: 0x78e9ff, toneMapped: false });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.84, 5.8, 32), white);
    body.position.y = 3.45;
    rocket.add(body);
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.78, 1.45, 32), white);
    upper.position.y = 7.06;
    rocket.add(upper);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.72, 2.1, 32), white);
    nose.position.y = 8.83;
    rocket.add(nose);
    const noseTip = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.48, 20), copper);
    noseTip.position.y = 10.08;
    rocket.add(noseTip);

    [1.55, 4.6, 6.45].forEach((y) => {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.16, 32), dark);
      band.position.y = y;
      rocket.add(band);
    });
    const accentBand = new THREE.Mesh(new THREE.CylinderGeometry(0.795, 0.805, 0.055, 32), accent);
    accentBand.position.y = 5.15;
    rocket.add(accentBand);

    [-1.06, 1.06].forEach((x) => {
      const booster = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.4, 3.5, 24), white);
      booster.position.set(x, 2.25, 0);
      rocket.add(booster);
      const boosterNose = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.0, 24), white);
      boosterNose.position.set(x, 4.5, 0);
      rocket.add(boosterNose);
      const boosterBand = new THREE.Mesh(new THREE.CylinderGeometry(0.412, 0.412, 0.12, 24), dark);
      boosterBand.position.set(x, 1.35, 0);
      rocket.add(boosterBand);
    });

    for (let i = 0; i < 4; i += 1) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.25, 1.1), copper);
      fin.position.set(Math.cos(angle) * 0.91, 0.85, Math.sin(angle) * 0.91);
      fin.rotation.y = -angle;
      fin.rotation.z = 0.18;
      rocket.add(fin);
    }

    [-1.06, 1.06].forEach((x) => {
      const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 0.55, 18, 1, true), dark);
      bell.position.set(x, 0.26, 0);
      rocket.add(bell);
    });
    [-0.34, 0.34].forEach((x) => {
      const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 0.62, 18, 1, true), dark);
      bell.position.set(x, 0.2, 0);
      rocket.add(bell);
    });

    const decalCanvas = document.createElement('canvas');
    decalCanvas.width = 512;
    decalCanvas.height = 128;
    const ctx = decalCanvas.getContext('2d');
    ctx.clearRect(0, 0, 512, 128);
    ctx.fillStyle = '#0a1420';
    ctx.font = '700 55px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ORBIT X', 256, 73);
    ctx.fillStyle = '#5fe7ff';
    ctx.fillRect(128, 89, 256, 4);
    ctx.fillStyle = '#8ea6c8';
    ctx.font = '500 19px Arial';
    ctx.fillText('DEEP SPACE PROGRAM', 256, 116);
    const decalTexture = new THREE.CanvasTexture(decalCanvas);
    decalTexture.colorSpace = THREE.SRGBColorSpace;
    const decal = new THREE.Mesh(
      new THREE.PlaneGeometry(1.18, 0.3),
      new THREE.MeshBasicMaterial({ map: decalTexture, transparent: true, toneMapped: false }),
    );
    decal.position.set(0, 4.05, 0.841);
    rocket.add(decal);
    this.decalTexture = decalTexture;

    const smallDecal = decal.clone();
    smallDecal.position.set(0, 4.05, -0.841);
    smallDecal.rotation.y = Math.PI;
    rocket.add(smallDecal);

    const flameGroup = new THREE.Group();
    flameGroup.position.y = 0.04;
    const outerFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.55, 3.2, 20, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xff9b42,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    outerFlame.rotation.x = Math.PI;
    outerFlame.position.y = -1.55;
    flameGroup.add(outerFlame);
    const innerFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 1.9, 18, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xc8f8ff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    innerFlame.rotation.x = Math.PI;
    innerFlame.position.y = -0.95;
    flameGroup.add(innerFlame);
    const flameLight = new THREE.PointLight(0xff9b50, 0, 18, 2);
    flameLight.position.y = -0.8;
    flameGroup.add(flameLight);
    flameGroup.visible = false;
    rocket.add(flameGroup);
    this.flame = {
      group: flameGroup,
      outer: outerFlame,
      inner: innerFlame,
      light: flameLight,
    };

    rocket.position.y = 0.05;
    this.scene.add(rocket);
    this.rocket = rocket;
    this.rocketBaseY = 0.05;
    this.nozzlePosition = new THREE.Vector3();
  }

  ignite() {
    if (this.ignited) return;
    this.ignited = true;
    this.flame.group.visible = true;
    this.cameraShake = 0.12;
    this.smoke.emit(this.rocket.position.clone().add(new THREE.Vector3(0, 0.2, 0)), 26, {
      spread: 2.4,
      upward: 0.9,
      size: 1.6,
      lifetime: 4.4,
    });
    this.callbacks.onIgnition?.();
  }

  launch() {
    if (this.launching) return;
    this.launching = true;
    this.completed = false;
    this.flightTime = 0;
    this.callbacks.onLiftoff?.();
  }

  reset() {
    this.ignited = false;
    this.launching = false;
    this.completed = false;
    this.flightTime = 0;
    this.cameraShake = 0;
    this.rocket.position.y = this.rocketBaseY;
    this.rocket.rotation.set(0, 0, 0);
    if (this.flame) {
      this.flame.group.visible = false;
      this.flame.outer.material.opacity = 0;
      this.flame.inner.material.opacity = 0;
      this.flame.light.intensity = 0;
    }
    this.smoke?.reset();
    this.setDefaultCamera(true);
    this.callbacks.onReset?.();
  }

  resize(width, height) {
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.fov = width < 760 ? 52 : 42;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  updateTelemetry() {
    const t = this.flightTime;
    const altitude = Math.max(0, (this.rocket.position.y - this.rocketBaseY) * 1.85);
    const velocity = this.launching ? Math.min(28400, Math.pow(t, 1.28) * 1180) : this.ignited ? 0 : 0;
    this.callbacks.onTelemetry?.({
      altitude,
      velocity,
      missionElapsed: this.flightTime,
      maxAltitude: MAX_ALTITUDE,
    });
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.clock.start();
    const tick = () => {
      if (!this.running) return;
      this.frame = requestAnimationFrame(tick);
      const delta = Math.min(this.clock.getDelta(), 0.05);
      this.elapsed += delta;
      if (this.stars) this.stars.userData.update(this.elapsed);
      if (this.beacon) {
        this.beacon.material.opacity = 0.45 + Math.abs(Math.sin(this.elapsed * 2.2)) * 0.55;
        this.beacon.material.transparent = true;
      }

      if (this.ignited) {
        const flicker = 0.82 + Math.sin(this.elapsed * 31) * 0.1 + Math.random() * 0.14;
        this.flame.outer.material.opacity = 0.85;
        this.flame.inner.material.opacity = 0.95;
        this.flame.outer.scale.set(0.88 + flicker * 0.15, flicker, 0.88 + flicker * 0.15);
        this.flame.inner.scale.set(0.9, 0.8 + flicker * 0.28, 0.9);
        this.flame.light.intensity = 18 + flicker * 10;
        if (this.serviceArm) {
          this.serviceArm.rotation.y += (1.15 - this.serviceArm.rotation.y) * delta * 1.8;
        }
      }

      if (this.launching) {
        this.flightTime += delta;
        const t = this.flightTime;
        const progress = clamp(t / 11.5, 0, 1);
        const eased = Math.pow(progress, 2.2);
        const lift = eased * MAX_ALTITUDE;
        this.rocket.position.y = this.rocketBaseY + lift;
        this.rocket.rotation.z = Math.sin(t * 0.8) * 0.003 * (1 - progress);
        this.cameraShake = Math.max(0, 0.11 * (1 - progress * 0.55));

        if (this.ignited) {
          const worldNozzle = this.rocket.localToWorld(new THREE.Vector3(0, 0.2, 0));
          this.smoke.emit(worldNozzle, 3, {
            spread: 0.8,
            upward: -0.2,
            size: 1.1,
            lifetime: 3.2,
          });
          if (lift < 10) {
            this.smoke.emit(new THREE.Vector3(0, 0.4, 0), 4, {
              spread: 3.3,
              upward: 0.65,
              size: 2.1,
              lifetime: 4.4,
            });
          }
        }

        const tween = Math.min(1, progress * 1.6);
        const offset = new THREE.Vector3(
          7.5 - tween * 1.2,
          4.9 - tween * 1.5,
          14.5 + tween * 8,
        );
        const desiredCam = this.rocket.position.clone().add(offset);
        this.camera.position.lerp(desiredCam, 0.045);
        const lookTarget = this.rocket.position.clone().add(new THREE.Vector3(0, 1.9, 0));
        this.camera.lookAt(lookTarget);
        this.cameraShake *= 0.97;
        this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
        this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;

        this.telemetryClock += delta;
        if (this.telemetryClock > 0.09) {
          this.telemetryClock = 0;
          this.updateTelemetry();
        }

        if (progress >= 1 && !this.completed) {
          this.completed = true;
          this.launching = false;
          this.flame.group.visible = false;
          this.callbacks.onComplete?.({ altitudeKm: MAX_ALTITUDE * 1.85 });
        }
      } else if (!this.launching && !this.completed) {
        const drift = this.elapsed * 0.11;
        this.camera.position.x = this.cameraBase.x + Math.sin(drift) * 0.22;
        this.camera.position.y = this.cameraBase.y + Math.sin(drift * 0.7) * 0.08;
        this.camera.lookAt(this.cameraTargetBase);
      }

      this.smoke.update(delta);
      this.renderer.render(this.scene, this.camera);
    };
    tick();
  }

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    this.decalTexture?.dispose();
    disposeObject(this.scene);
    this.renderer.dispose();
    this.renderer.forceContextLoss?.();
    this.canvas?.remove();
    this.scene.clear();
  }
}
