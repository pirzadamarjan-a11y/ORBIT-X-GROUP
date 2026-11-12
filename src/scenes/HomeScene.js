import * as THREE from 'three';
import {
  createCamera,
  createGlowSprite,
  createRenderer,
  createStars,
  disposeObject,
  observeSize,
} from './core.js';
import { createPlanetBody } from './planetTextures.js';

export class HomeScene {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = createCamera({ fov: 40, near: 0.1, far: 600 });
    const { renderer, canvas } = createRenderer(container);
    this.renderer = renderer;
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this.elapsed = 0;
    this.running = false;
    this.pointer = new THREE.Vector2();
    this.pointerTarget = new THREE.Vector2();
    this.frame = 0;
    this.cleanupFns = [];
    this.resizeObserver = null;
  }

  async init() {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.position.set(0, 0, 9.2);
    this.camera.lookAt(0, 0, 0);
    this.renderer.setSize(width, height, false);

    this.scene.add(new THREE.AmbientLight(0x7d97c9, 0.55));
    const keyLight = new THREE.DirectionalLight(0xfff2dd, 4.2);
    keyLight.position.set(6, 3, 5);
    this.scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x3b7eff, 2.4);
    rimLight.position.set(-7, -2, -3);
    this.scene.add(rimLight);

    this.stars = createStars({
      count: window.innerWidth < 760 ? 1600 : 2800,
      minRadius: 70,
      maxRadius: 230,
      pixelRatio: this.renderer.getPixelRatio(),
    });
    this.scene.add(this.stars);

    const blueGlow = createGlowSprite({ color: '#4e8cff', scale: 31, opacity: 0.16, layers: 1 });
    blueGlow.position.set(-8, -6, -24);
    this.scene.add(blueGlow);

    const violetGlow = createGlowSprite({ color: '#9a6dff', scale: 25, opacity: 0.11, layers: 1 });
    violetGlow.position.set(12, 7, -28);
    this.scene.add(violetGlow);

    const { group: earth, body, clouds, atmosphere } = await createPlanetBody('earth', 2.25, this.renderer, {
      segments: 96,
    });
    this.earth = earth;
    this.earthBody = body;
    this.earthClouds = clouds;
    this.earthAtmosphere = atmosphere;
    earth.rotation.z = 0.41;
    earth.rotation.x = 0.05;
    this.scene.add(earth);

    const halo = createGlowSprite({ color: '#4d9dff', scale: 7.5, opacity: 0.12, layers: 1 });
    earth.add(halo);

    const orbitGroup = new THREE.Group();
    orbitGroup.rotation.x = 1.18;
    orbitGroup.rotation.z = -0.34;
    earth.parent?.add(orbitGroup);

    const orbitPoints = [];
    for (let i = 0; i <= 220; i += 1) {
      const angle = (i / 220) * Math.PI * 2;
      orbitPoints.push(new THREE.Vector3(Math.cos(angle) * 3.25, 0, Math.sin(angle) * 3.25));
    }
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineDashedMaterial({
      color: 0x78dfff,
      transparent: true,
      opacity: 0.2,
      dashSize: 0.09,
      gapSize: 0.11,
      depthWrite: false,
    });
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    orbitLine.computeLineDistances();
    orbitGroup.add(orbitLine);

    const satellite = this.createSatellite();
    satellite.position.set(3.25, 0, 0);
    orbitGroup.add(satellite);
    this.satelliteOrbit = orbitGroup;
    this.satellite = satellite;

    const outerOrbitGroup = new THREE.Group();
    outerOrbitGroup.rotation.x = 1.32;
    outerOrbitGroup.rotation.z = 0.48;
    const outerPoints = [];
    for (let i = 0; i <= 220; i += 1) {
      const angle = (i / 220) * Math.PI * 2;
      outerPoints.push(new THREE.Vector3(Math.cos(angle) * 4.15, 0, Math.sin(angle) * 4.15));
    }
    const outerGeometry = new THREE.BufferGeometry().setFromPoints(outerPoints);
    const outerMaterial = new THREE.LineBasicMaterial({
      color: 0x9eabff,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
    });
    outerOrbitGroup.add(new THREE.LineLoop(outerGeometry, outerMaterial));
    earth.parent?.add(outerOrbitGroup);
    this.outerOrbitGroup = outerOrbitGroup;

    const handlePointer = (event) => {
      this.pointerTarget.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.pointerTarget.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('pointermove', handlePointer, { passive: true });
    this.cleanupFns.push(() => window.removeEventListener('pointermove', handlePointer));

    this.resizeObserver = observeSize(this.container, (w, h) => this.resize(w, h));
    this.resize(width, height);
    this.start();
  }

  createSatellite() {
    const group = new THREE.Group();
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xe4edf8,
      metalness: 0.7,
      roughness: 0.34,
    });
    const panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1d4c94,
      metalness: 0.48,
      roughness: 0.35,
      emissive: 0x0b1d42,
      emissiveIntensity: 0.45,
    });
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.18), bodyMaterial);
    group.add(core);
    const panelGeometry = new THREE.BoxGeometry(0.48, 0.018, 0.2);
    const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    leftPanel.position.x = -0.35;
    const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel.position.x = 0.35;
    group.add(leftPanel, rightPanel);
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.24, 6),
      new THREE.MeshBasicMaterial({ color: 0xb8dcff }),
    );
    antenna.position.y = 0.16;
    group.add(antenna);
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x7fffe0, toneMapped: false }),
    );
    beacon.position.y = -0.18;
    group.add(beacon);
    group.scale.setScalar(0.94);
    return group;
  }

  resize(width, height) {
    if (!width || !height) return;
    const aspect = width / height;
    this.camera.aspect = aspect;
    this.camera.fov = aspect < 0.82 ? 48 : 40;
    this.camera.position.z = aspect < 0.82 ? 10.9 : 9.2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);

    if (this.earth) {
      if (aspect < 0.82) {
        this.earth.position.set(0.06, 0.95, -0.2);
        this.earth.scale.setScalar(0.82);
      } else if (aspect < 1.25) {
        this.earth.position.set(1.7, 0.2, 0);
        this.earth.scale.setScalar(0.95);
      } else {
        this.earth.position.set(2.85, 0.03, 0);
        this.earth.scale.setScalar(1);
      }
    }
    if (this.satelliteOrbit) this.satelliteOrbit.position.copy(this.earth?.position ?? new THREE.Vector3());
    if (this.outerOrbitGroup) this.outerOrbitGroup.position.copy(this.earth?.position ?? new THREE.Vector3());
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
      this.pointer.lerp(this.pointerTarget, 0.035);

      if (this.earthBody) this.earthBody.rotation.y += delta * 0.035;
      if (this.earthClouds) this.earthClouds.rotation.y += delta * 0.047;
      if (this.earth) {
        this.earth.rotation.x += (0.05 + this.pointer.y * 0.035 - this.earth.rotation.x) * 0.02;
        this.earth.rotation.y += (this.pointer.x * 0.062 - this.earth.rotation.y) * 0.012;
      }
      if (this.satelliteOrbit) this.satelliteOrbit.rotation.y += delta * 0.14;
      if (this.satellite) this.satellite.rotation.y += delta * 0.75;
      if (this.outerOrbitGroup) this.outerOrbitGroup.rotation.y -= delta * 0.035;
      if (this.stars) this.stars.userData.update(this.elapsed);
      this.renderer.render(this.scene, this.camera);
    };
    tick();
  }

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.frame);
    this.cleanupFns.forEach((fn) => fn());
    this.resizeObserver?.disconnect();
    disposeObject(this.scene);
    this.renderer.dispose();
    this.renderer.forceContextLoss?.();
    this.canvas?.remove();
    this.scene.clear();
  }
}
