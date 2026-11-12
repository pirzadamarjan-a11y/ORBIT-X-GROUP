import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  createCamera,
  createGlowSprite,
  createRenderer,
  createStars,
  disposeObject,
  observeSize,
} from './core.js';
import { createPlanetBody } from './planetTextures.js';

export class PlanetPreviewScene {
  constructor(container, planet) {
    this.container = container;
    this.planet = planet;
    this.scene = new THREE.Scene();
    this.camera = createCamera({ fov: 34, near: 0.1, far: 300 });
    const { renderer, canvas } = createRenderer(container);
    this.renderer = renderer;
    this.canvas = canvas;
    this.controls = null;
    this.running = false;
    this.frame = 0;
    this.clock = new THREE.Clock();
    this.elapsed = 0;
    this.resizeObserver = null;
    this.model = null;
    this.defaultDistance = planet.id === 'saturn' ? 7.6 : 5.4;
  }

  async init() {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.position.set(0, 0.25, this.defaultDistance);
    this.camera.lookAt(0, 0, 0);

    this.scene.add(new THREE.AmbientLight(0x84a0d0, 0.5));
    const key = new THREE.DirectionalLight(0xfff3df, 4.6);
    key.position.set(4.5, 2.2, 4);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(this.planet.accent2, 2.1);
    rim.position.set(-5, -1.5, -3);
    this.scene.add(rim);

    this.stars = createStars({
      count: window.innerWidth < 760 ? 900 : 1800,
      minRadius: 40,
      maxRadius: 160,
      pixelRatio: this.renderer.getPixelRatio(),
    });
    this.scene.add(this.stars);

    const glow = createGlowSprite({ color: this.planet.accent, scale: 13, opacity: 0.1, layers: 1 });
    glow.position.set(-3.4, -2.8, -8);
    this.scene.add(glow);

    const visual = await createPlanetBody(this.planet.id, 1.62, this.renderer, { segments: 96 });
    this.visual = visual;
    visual.group.rotation.z = this.planet.scene.tilt;
    this.scene.add(visual.group);
    this.model = visual.group;

    const orbitRing = new THREE.Mesh(
      new THREE.RingGeometry(2.5, 2.505, 160),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(this.planet.accent),
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    orbitRing.rotation.x = Math.PI / 2 - 0.18;
    orbitRing.rotation.z = 0.22;
    this.scene.add(orbitRing);
    this.orbitRing = orbitRing;

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.rotateSpeed = 0.55;
    this.controls.zoomSpeed = 0.6;
    this.controls.minDistance = this.planet.id === 'saturn' ? 4.8 : 3.4;
    this.controls.maxDistance = this.planet.id === 'saturn' ? 12 : 9;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.32;
    this.controls.target.set(0, 0, 0);
    this.controls.addEventListener('start', () => {
      this.controls.autoRotate = false;
    });

    this.resizeObserver = observeSize(this.container, (w, h) => this.resize(w, h));
    this.resize(width, height);
    this.start();
  }

  zoomBy(factor) {
    if (!this.controls) return;
    const direction = this.camera.position.clone().normalize();
    const distance = this.camera.position.length();
    const next = THREE.MathUtils.clamp(
      distance * factor,
      this.controls.minDistance,
      this.controls.maxDistance,
    );
    this.camera.position.copy(direction.multiplyScalar(next));
    this.controls.update();
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
      if (this.visual?.body) this.visual.body.rotation.y += delta * 0.075;
      if (this.visual?.clouds) this.visual.clouds.rotation.y += delta * 0.095;
      if (this.stars) this.stars.userData.update(this.elapsed);
      if (this.orbitRing) this.orbitRing.rotation.z += delta * 0.012;
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
