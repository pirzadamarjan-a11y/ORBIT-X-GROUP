import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  createCamera,
  createGlowSprite,
  createGlowTexture,
  createRenderer,
  createStars,
  disposeObject,
  observeSize,
} from './core.js';
import { easeInOutCubic } from '../utils/format.js';
import { createPlanetBody } from './planetTextures.js';

const DESTINATION_TEXTURE_IDS = {
  moon: 'moon',
  mars: 'mars',
  jupiter: 'jupiter',
  saturn: 'saturn',
};

const DESTINATION_POSITION = new THREE.Vector3(0, 4.8, -37);
const FLIGHT_SECONDS = 30;

export class SpacecraftScene {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.scene = new THREE.Scene();
    this.camera = createCamera({ fov: 42, near: 0.1, far: 500 });
    const { renderer, canvas } = createRenderer(container);
    this.renderer = renderer;
    this.canvas = canvas;
    this.controls = null;
    this.running = false;
    this.frame = 0;
    this.clock = new THREE.Clock();
    this.elapsed = 0;
    this.flightRunning = false;
    this.progress = 0;
    this.speed = 2;
    this.craft = null;
    this.destinationId = null;
    this.destinationVisual = null;
    this.destinationToken = 0;
    this.resizeObserver = null;
    this.arrivalNotified = false;
    this.resetTween = null;
    this.previousCraftPosition = new THREE.Vector3();
  }

  async init() {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.position.set(4.6, 2.7, 9.4);
    this.camera.lookAt(0, 0.2, 0);

    this.scene.add(new THREE.AmbientLight(0x5b6f9c, 0.8));
    const key = new THREE.DirectionalLight(0xf0f6ff, 5.2);
    key.position.set(5, 6, 7);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x4f8cff, 3.2);
    rim.position.set(-8, -2, -5);
    this.scene.add(rim);
    const warm = new THREE.PointLight(0xffbf80, 12, 20, 2);
    warm.position.set(0, -1, 2);
    this.scene.add(warm);

    this.stars = createStars({
      count: window.innerWidth < 760 ? 1400 : 3000,
      minRadius: 70,
      maxRadius: 260,
      pixelRatio: this.renderer.getPixelRatio(),
    });
    this.scene.add(this.stars);

    const nebula = createGlowSprite({ color: '#5f6dff', scale: 55, opacity: 0.1, layers: 1 });
    nebula.position.set(-12, 8, -60);
    this.scene.add(nebula);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.rotateSpeed = 0.52;
    this.controls.zoomSpeed = 0.65;
    this.controls.enablePan = false;
    this.controls.minDistance = 3.2;
    this.controls.maxDistance = 18;
    this.controls.target.set(0, 0.15, 0);

    this.buildLaunchPad();
    this.buildRoute();
    this.cameraBase = this.camera.position.clone();
    this.targetBase = this.controls.target.clone();

    this.resizeObserver = observeSize(this.container, (w, h) => this.resize(w, h));
    this.resize(width, height);
    this.start();
    this.callbacks.onReady?.();
  }

  buildLaunchPad() {
    const group = new THREE.Group();
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x111c2e,
      metalness: 0.72,
      roughness: 0.34,
    });
    const accentMaterial = new THREE.MeshBasicMaterial({
      color: 0x67dfff,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.65, 0.18, 64), baseMaterial);
    base.position.y = -1.72;
    group.add(base);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x6de5ff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.02, 2.08, 80), ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.6;
    group.add(ring);
    const ring2 = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.405, 72), accentMaterial);
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = -1.59;
    group.add(ring2);
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      const light = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.02, 0.03),
        new THREE.MeshBasicMaterial({ color: i % 2 ? 0x89ecff : 0xffc98a }),
      );
      light.position.set(Math.cos(angle) * 2.35, -1.56, Math.sin(angle) * 2.35);
      light.rotation.y = -angle;
      group.add(light);
    }
    this.scene.add(group);
    this.pad = group;
  }

  buildRoute() {
    this.routeGroup = new THREE.Group();
    this.curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(4.2, 1.1, -6.5),
        new THREE.Vector3(3.1, 2.7, -14),
        new THREE.Vector3(-1.9, 3.2, -21),
        new THREE.Vector3(0, 2.7, -25.5),
      ],
      false,
      'catmullrom',
      0.32,
    );
    this.routePoints = this.curve.getPoints(220);
    const fullGeometry = new THREE.BufferGeometry().setFromPoints(this.routePoints);
    const fullMaterial = new THREE.LineDashedMaterial({
      color: 0x6e8bc0,
      transparent: true,
      opacity: 0.28,
      dashSize: 0.55,
      gapSize: 0.4,
      depthWrite: false,
    });
    this.routeLine = new THREE.Line(fullGeometry, fullMaterial);
    this.routeLine.computeLineDistances();
    this.routeGroup.add(this.routeLine);

    const travelGeometry = new THREE.BufferGeometry().setFromPoints(this.routePoints);
    this.travelLine = new THREE.Line(
      travelGeometry,
      new THREE.LineBasicMaterial({
        color: 0x6ef0ff,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      }),
    );
    this.travelLine.geometry.setDrawRange(0, 0);
    this.routeGroup.add(this.travelLine);

    const startMarker = new THREE.Mesh(
      new THREE.RingGeometry(0.34, 0.39, 40),
      new THREE.MeshBasicMaterial({
        color: 0x6ee7ff,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
      }),
    );
    startMarker.rotation.x = -Math.PI / 2;
    startMarker.position.y = 0.01;
    startMarker.position.z = 0;
    this.routeGroup.add(startMarker);

    const endMarker = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.49, 40),
      new THREE.MeshBasicMaterial({
        color: 0x92f5ff,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    );
    endMarker.position.copy(this.curve.getPointAt(1));
    endMarker.quaternion.copy(this.camera.quaternion);
    this.routeGroup.add(endMarker);
    this.endMarker = endMarker;

    this.scene.add(this.routeGroup);
  }

  async setCraft(craft) {
    if (!craft) return;
    if (this.craftGroup) {
      this.scene.remove(this.craftGroup);
      disposeObject(this.craftGroup);
    }
    this.craft = craft;
    this.craftGroup = new THREE.Group();
    this.craftGroup.position.copy(this.curve.getPointAt(this.progress));
    this.modelPivot = new THREE.Group();
    this.craftGroup.add(this.modelPivot);
    const model = this.buildCraftModel(craft);
    this.modelPivot.add(model);
    this.engine = this.createEnginePlume(craft.accent);
    this.modelPivot.add(this.engine);
    this.craftGroup.scale.setScalar(1.12);
    this.scene.add(this.craftGroup);
    this.previousCraftPosition.copy(this.craftGroup.position);
    if (this.travelLine) {
      this.travelLine.material.color.set(craft.accent);
    }
  }

  createEnginePlume(color) {
    const group = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.3, 14, 1, true), material);
    cone.rotation.x = Math.PI / 2;
    cone.position.z = 1.34;
    group.add(cone);
    const core = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.8, 10, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    core.rotation.x = Math.PI / 2;
    core.position.z = 1.17;
    group.add(core);
    group.userData.material = material;
    group.userData.core = core.material;
    group.visible = false;
    return group;
  }

  buildCraftModel(craft) {
    const group = new THREE.Group();
    const hull = new THREE.MeshStandardMaterial({
      color: craft.color,
      metalness: 0.72,
      roughness: 0.29,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: 0x18202d,
      metalness: 0.76,
      roughness: 0.3,
    });
    const accent = new THREE.MeshStandardMaterial({
      color: craft.accent,
      metalness: 0.42,
      roughness: 0.25,
      emissive: new THREE.Color(craft.accent),
      emissiveIntensity: 0.4,
    });
    const gold = new THREE.MeshStandardMaterial({
      color: 0xb79d68,
      metalness: 0.7,
      roughness: 0.34,
    });
    const panel = new THREE.MeshStandardMaterial({
      color: 0x153b78,
      metalness: 0.4,
      roughness: 0.3,
      emissive: 0x071e44,
      emissiveIntensity: 0.5,
    });
    const add = (geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...position);
      mesh.rotation.set(...rotation);
      group.add(mesh);
      return mesh;
    };
    const cylinderZ = (radiusTop, radiusBottom, height, material, position = [0, 0, 0]) => {
      const mesh = add(
        new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 28),
        material,
        position,
        [Math.PI / 2, 0, 0],
      );
      return mesh;
    };

    if (craft.model === 'lander') {
      const body = add(new THREE.CylinderGeometry(0.85, 0.95, 1.18, 8), gold, [0, 0.18, 0]);
      body.rotation.y = Math.PI / 8;
      add(new THREE.CylinderGeometry(0.56, 0.76, 0.6, 10), hull, [0, 0.94, 0]);
      add(new THREE.ConeGeometry(0.5, 0.46, 12), hull, [0, 1.48, 0]);
      cylinderZ(0.16, 0.16, 0.6, dark, [0, 0.2, 0.78]);
      const legMaterial = new THREE.MeshStandardMaterial({ color: 0xbcc8d8, metalness: 0.7, roughness: 0.34 });
      for (let i = 0; i < 4; i += 1) {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const leg = add(
          new THREE.CylinderGeometry(0.045, 0.045, 1.15, 8),
          legMaterial,
          [Math.cos(angle) * 0.58, -0.5, Math.sin(angle) * 0.58],
        );
        leg.rotation.z = Math.cos(angle) * 0.36;
        leg.rotation.x = -Math.sin(angle) * 0.36;
        add(
          new THREE.CylinderGeometry(0.2, 0.3, 0.08, 12),
          legMaterial,
          [Math.cos(angle) * 0.92, -1.04, Math.sin(angle) * 0.92],
        );
      }
      add(new THREE.TorusGeometry(0.66, 0.035, 10, 40), accent, [0, 0.3, 0], [Math.PI / 2, 0, 0]);
      const dish = add(new THREE.SphereGeometry(0.34, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), hull, [0.66, 0.52, 0]);
      dish.rotation.z = -0.65;
      group.scale.setScalar(0.86);
      group.position.z = -0.2;
    } else if (craft.model === 'courier') {
      cylinderZ(0.52, 0.7, 3.9, hull, [0, 0, 0]);
      const nose = add(new THREE.ConeGeometry(0.52, 0.9, 24), hull, [0, 0, -2.3], [-Math.PI / 2, 0, 0]);
      nose.rotation.z = Math.PI;
      add(new THREE.TorusGeometry(0.93, 0.18, 14, 48), hull, [0, 0, 0.2], [Math.PI / 2, 0, 0]);
      const ring = add(new THREE.TorusGeometry(0.93, 0.04, 8, 48), accent, [0, 0, 0.2], [Math.PI / 2, 0, 0]);
      ring.userData.spin = true;
      [-1.05, 1.05].forEach((x) => {
        cylinderZ(0.22, 0.28, 2.3, dark, [x, -0.12, 0.34]);
        add(new THREE.ConeGeometry(0.24, 0.45, 14), accent, [x, -0.12, 1.72], [Math.PI / 2, 0, 0]);
        add(new THREE.BoxGeometry(0.05, 0.08, 1.8), accent, [x, 0.18, 0.2]);
      });
      add(new THREE.BoxGeometry(1.95, 0.06, 0.62), panel, [0, -0.43, 0.42]);
      add(new THREE.CircleGeometry(0.2, 24), accent, [0, 0.44, -1.1], [-Math.PI / 2, 0, 0]);
    } else if (craft.model === 'cruiser') {
      cylinderZ(0.42, 0.72, 5.1, hull, [0, 0, 0]);
      add(new THREE.ConeGeometry(0.66, 1.05, 24), hull, [0, 0, -2.9], [-Math.PI / 2, 0, 0]);
      const habitat = add(new THREE.TorusGeometry(1.35, 0.19, 14, 56), gold, [0, 0, 0.4], [Math.PI / 2, 0, 0]);
      habitat.userData.spin = true;
      for (let i = 0; i < 6; i += 1) {
        const angle = (i / 6) * Math.PI * 2;
        add(
          new THREE.CylinderGeometry(0.045, 0.045, 1.35, 6),
          dark,
          [Math.cos(angle) * 0.7, Math.sin(angle) * 0.7, 0.4],
          [0, 0, angle + Math.PI / 2],
        );
      }
      add(new THREE.TorusGeometry(0.82, 0.05, 8, 40), accent, [0, 0, 0.4], [Math.PI / 2, 0, 0]);
      add(new THREE.BoxGeometry(0.36, 0.42, 2.9), dark, [1.13, 0, -0.2]);
      add(new THREE.BoxGeometry(0.36, 0.42, 2.9), dark, [-1.13, 0, -0.2]);
      add(new THREE.CylinderGeometry(0.42, 0.3, 0.7, 18), dark, [0, 0, 2.7], [Math.PI / 2, 0, 0]);
      add(new THREE.ConeGeometry(0.34, 0.55, 18), accent, [0, 0, 3.2], [Math.PI / 2, 0, 0]);
      add(new THREE.BoxGeometry(2.5, 0.04, 0.56), panel, [0, 0.4, -0.9]);
      const antenna = add(new THREE.CylinderGeometry(0.018, 0.018, 1.25, 6), hull, [0.4, 0.92, -1.4]);
      antenna.rotation.z = -0.25;
    } else if (craft.model === 'probe') {
      add(new THREE.CylinderGeometry(0.5, 0.5, 1.75, 10), hull, [0, 0, 0], [Math.PI / 2, 0, 0]);
      add(new THREE.TorusGeometry(0.52, 0.06, 8, 36), accent, [0, 0, 0.4], [Math.PI / 2, 0, 0]);
      add(new THREE.BoxGeometry(2.6, 0.04, 0.95), panel, [1.85, 0, 0.25]);
      add(new THREE.BoxGeometry(2.6, 0.04, 0.95), panel, [-1.85, 0, 0.25]);
      add(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 6), dark, [0.55, 0, 0.25], [0, 0, Math.PI / 2]);
      add(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 6), dark, [-0.55, 0, 0.25], [0, 0, Math.PI / 2]);
      add(new THREE.CylinderGeometry(0.12, 0.32, 0.7, 16), dark, [0, 0.55, -0.3]);
      add(new THREE.SphereGeometry(0.44, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), hull, [0, 0.8, -0.3], [-0.6, 0, 0]);
      add(new THREE.CylinderGeometry(0.17, 0.17, 0.22, 12), accent, [0, -0.05, 1.03], [Math.PI / 2, 0, 0]);
      add(new THREE.BoxGeometry(0.9, 0.3, 0.55), dark, [0, -0.4, 0.3]);
    } else {
      add(new THREE.CylinderGeometry(0.7, 0.42, 1.1, 10), hull, [0, 0, 0.55], [Math.PI / 2, 0, 0]);
      add(new THREE.CylinderGeometry(0.12, 0.12, 2.9, 8), dark, [0, -0.32, 0.4], [Math.PI / 2, 0, 0]);
      add(new THREE.SphereGeometry(0.62, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), hull, [0, 0.35, 0.12], [-0.38, 0, 0]);
      add(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), dark, [0, 0.8, 0.35], [0, 0, Math.PI / 2]);
      add(new THREE.CylinderGeometry(0.045, 0.045, 1.8, 8), dark, [-0.8, 0.25, 0.35], [0.35, 0, 0.18]);
      add(new THREE.BoxGeometry(0.25, 0.25, 0.55), gold, [0.35, -0.18, 0.55]);
      add(new THREE.BoxGeometry(0.25, 0.25, 0.55), gold, [0.35, -0.18, 1.15]);
      add(new THREE.TorusGeometry(0.74, 0.035, 8, 40), accent, [0, 0.48, 0.18], [Math.PI / 2, 0, 0]);
      add(new THREE.BoxGeometry(2.0, 0.035, 0.45), panel, [1.55, 0.25, 0.4], [0, 0, 0.12]);
      add(new THREE.BoxGeometry(2.0, 0.035, 0.45), panel, [-1.55, 0.25, 0.4], [0, 0, -0.12]);
      group.scale.setScalar(1.08);
    }

    const enginePositions =
      craft.model === 'lander'
        ? [[0, 0.2, 0.74]]
        : craft.model === 'probe' || craft.model === 'voyager'
          ? [[0, 0, 1.25]]
          : [[0, 0, 2.1]];
    enginePositions.forEach(([x, y, z]) => {
      const nozzle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.23, 0.32, 0.52, 14, 1, true),
        dark,
      );
      nozzle.position.set(x, y, z);
      nozzle.rotation.x = Math.PI / 2;
      group.add(nozzle);
    });

    const glow = new THREE.PointLight(new THREE.Color(craft.accent), 3, 4, 2);
    glow.position.set(0, 0, 2.5);
    group.add(glow);

    group.userData = {
      spinParts: group.children.filter((child) => child.userData?.spin),
    };
    return group;
  }

  async setDestination(destination) {
    if (!destination || this.destinationId === destination.id) return;
    const token = ++this.destinationToken;
    this.destinationId = destination.id;
    if (this.destinationGroup) {
      this.scene.remove(this.destinationGroup);
      disposeObject(this.destinationGroup);
      this.destinationGroup = null;
    }
    const group = new THREE.Group();
    group.position.copy(DESTINATION_POSITION);
    const textureId = DESTINATION_TEXTURE_IDS[destination.id];
    let radius = 5.4;
    if (textureId) {
      const visual = await createPlanetBody(textureId, radius, this.renderer, {
        segments: 64,
        includeClouds: false,
        includeRings: true,
      });
      if (token !== this.destinationToken) {
        disposeObject(visual.group);
        return;
      }
      group.add(visual.group);
      group.userData.body = visual.body;
    } else {
      const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(radius * 0.72, 3),
        new THREE.MeshStandardMaterial({
          color: 0x171734,
          metalness: 0.3,
          roughness: 0.5,
          emissive: 0x342c78,
          emissiveIntensity: 0.8,
        }),
      );
      group.add(core);
      const wire = new THREE.Mesh(
        new THREE.IcosahedronGeometry(radius * 0.76, 2),
        new THREE.MeshBasicMaterial({
          color: 0xa89cff,
          wireframe: true,
          transparent: true,
          opacity: 0.16,
        }),
      );
      group.add(wire);
      group.userData.core = core;
    }
    const glow = createGlowSprite({ color: destination.accent, scale: radius * 2.5, opacity: 0.2, layers: 1 });
    group.add(glow);

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(destination.accent),
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 1.3, radius * 1.315, 120), ringMaterial);
    ring.rotation.x = Math.PI / 2.4;
    group.add(ring);
    group.userData.ring = ring;
    this.destinationGroup = group;
    this.destinationVisual = group;
    this.scene.add(group);
    this.resizeDestinationMarker();
  }

  resizeDestinationMarker() {
    if (!this.endMarker || !this.destinationGroup) return;
    this.endMarker.position.copy(this.curve.getPointAt(1));
  }

  setCraftSpeed(speed) {
    this.speed = speed;
  }

  startFlight() {
    if (this.progress >= 0.999) {
      this.resetFlight({ silent: true });
    }
    this.resetTween = null;
    this.controls.enabled = true;
    this.flightRunning = true;
    this.arrivalNotified = false;
    this.engine.visible = true;
    this.controls.autoRotate = false;
    this.callbacks.onStateChange?.({ running: true, progress: this.progress });
  }

  pauseFlight() {
    this.flightRunning = false;
    if (this.engine) this.engine.visible = false;
    this.callbacks.onStateChange?.({ running: false, progress: this.progress });
  }

  resetFlight({ silent = false } = {}) {
    this.flightRunning = false;
    this.progress = 0;
    this.arrivalNotified = false;
    if (this.engine) this.engine.visible = false;
    if (this.travelLine) this.travelLine.geometry.setDrawRange(0, 0);
    if (this.craftGroup) {
      this.craftGroup.position.copy(this.curve.getPointAt(0));
      this.previousCraftPosition.copy(this.craftGroup.position);
      this.craftGroup.quaternion.identity();
    }
    this.resetTween = {
      start: performance.now(),
      startPos: this.camera.position.clone(),
      startTarget: this.controls.target.clone(),
      endPos: this.cameraBase.clone(),
      endTarget: this.targetBase.clone(),
      duration: 900,
    };
    this.controls.enabled = false;
    if (!silent) this.callbacks.onStateChange?.({ running: false, progress: 0, reset: true });
  }

  updateFlight(delta) {
    if (!this.flightRunning || !this.craftGroup) return;
    this.progress = Math.min(1, this.progress + (delta / FLIGHT_SECONDS) * this.speed);
    const point = this.curve.getPointAt(this.progress);
    const nextPoint = this.curve.getPointAt(Math.min(0.9999, this.progress + 0.001));
    const tangent = nextPoint.clone().sub(point).normalize();
    const previous = this.craftGroup.position.clone();
    this.craftGroup.position.copy(point);
    const movement = point.clone().sub(previous);
    this.camera.position.add(movement);
    this.controls.target.add(movement);
    const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, -1),
      tangent.lengthSq() > 0 ? tangent : new THREE.Vector3(0, 0, -1),
    );
    this.craftGroup.quaternion.slerp(targetQuaternion, 0.08);
    const traveled = Math.max(2, Math.floor(this.progress * (this.routePoints.length - 1)));
    this.travelLine.geometry.setDrawRange(0, traveled);
    this.travelLine.material.opacity = 0.95;
    this.callbacks.onProgress?.({
      progress: this.progress,
      speed: this.speed,
      running: this.flightRunning,
    });
    if (this.progress >= 1 && !this.arrivalNotified) {
      this.arrivalNotified = true;
      this.flightRunning = false;
      if (this.engine) this.engine.visible = false;
      this.callbacks.onArrival?.();
    }
  }

  resize(width, height) {
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
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
      if (this.destinationGroup?.userData.body) {
        this.destinationGroup.userData.body.rotation.y += delta * 0.03;
      }
      if (this.destinationGroup?.userData.core) {
        this.destinationGroup.userData.core.rotation.y += delta * 0.03;
      }
      if (this.destinationGroup?.userData.ring) {
        this.destinationGroup.userData.ring.rotation.z += delta * 0.02;
      }
      if (this.craftGroup) {
        if (!this.flightRunning) {
          const bob = Math.sin(this.elapsed * 1.05) * 0.055;
          this.craftGroup.position.y = this.curve.getPointAt(this.progress).y + bob;
          if (this.craftGroup.position.z > -0.1) {
            this.craftGroup.rotation.z = Math.sin(this.elapsed * 0.5) * 0.035;
            this.craftGroup.rotation.x = Math.sin(this.elapsed * 0.4) * 0.018;
          }
        }
        if (this.engine?.visible) {
          const flicker = 0.65 + Math.sin(this.elapsed * 25) * 0.18 + Math.random() * 0.16;
          this.engine.scale.set(1, 1, flicker);
          this.engine.userData.material.opacity = 0.68;
          this.engine.userData.core.opacity = 0.9;
        }
      }
      this.updateFlight(delta);

      if (this.resetTween) {
        const t = Math.min(1, (performance.now() - this.resetTween.start) / this.resetTween.duration);
        const eased = easeInOutCubic(t);
        this.camera.position.lerpVectors(this.resetTween.startPos, this.resetTween.endPos, eased);
        this.controls.target.lerpVectors(this.resetTween.startTarget, this.resetTween.endTarget, eased);
        this.camera.lookAt(this.controls.target);
        if (t >= 1) {
          this.resetTween = null;
          this.controls.enabled = true;
        }
      }
      if (this.endMarker) this.endMarker.quaternion.copy(this.camera.quaternion);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    tick();
  }

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    this.controls?.dispose();
    disposeObject(this.scene);
    this.renderer.dispose();
    this.renderer.forceContextLoss?.();
    this.canvas?.remove();
    this.scene.clear();
  }
}
