import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { PLANETS, SUN } from '../data/planets.js';
import {
  createCamera,
  createGlowSprite,
  createGlowTexture,
  createOrbitPath,
  createRenderer,
  createStars,
  disposeObject,
  observeSize,
} from './core.js';
import { easeInOutCubic } from '../utils/format.js';
import { createPlanetBody } from './planetTextures.js';

const OVERVIEW = {
  desktop: new THREE.Vector3(0, 54, 112),
  wide: new THREE.Vector3(0, 48, 103),
  mobile: new THREE.Vector3(0, 72, 152),
};

const BODY_LOOKUP = new Map([
  ['sun', { ...SUN, scene: { radius: 5.6 } }],
  ...PLANETS.map((planet) => [planet.id, planet]),
]);

export class SolarSystemScene {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.scene = new THREE.Scene();
    this.camera = createCamera({ fov: 45, near: 0.1, far: 1200 });
    const { renderer, canvas } = createRenderer(container);
    this.renderer = renderer;
    this.canvas = canvas;
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.domElement.className = 'label-layer';
    this.labelRenderer.domElement.setAttribute('aria-hidden', 'true');
    container.append(this.labelRenderer.domElement);
    this.controls = null;
    this.planets = [];
    this.meshes = [];
    this.selectedId = null;
    this.hoveredId = null;
    this.paused = false;
    this.speed = 1;
    this.simulationTime = 0;
    this.elapsed = 0;
    this.running = false;
    this.frame = 0;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-2, -2);
    this.pointerDown = null;
    this.cameraTween = null;
    this.cleanupFns = [];
    this.resizeObserver = null;
    this.selectionHalo = null;
    this.overviewTarget = new THREE.Vector3();
  }

  async init() {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.position.copy(this.getOverviewPosition());
    this.camera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.045;
    this.controls.rotateSpeed = 0.55;
    this.controls.zoomSpeed = 0.7;
    this.controls.panSpeed = 0.45;
    this.controls.minDistance = 3.4;
    this.controls.maxDistance = 260;
    this.controls.maxPolarAngle = Math.PI * 0.92;
    this.controls.minPolarAngle = Math.PI * 0.08;
    this.controls.target.set(0, 0, 0);

    this.scene.add(new THREE.AmbientLight(0x39527a, 0.62));
    const sunLight = new THREE.PointLight(0xffe6bd, 4.4, 0, 0);
    sunLight.position.set(0, 0, 0);
    this.scene.add(sunLight);
    const coldFill = new THREE.DirectionalLight(0x3e6bff, 0.65);
    coldFill.position.set(-20, 18, -30);
    this.scene.add(coldFill);

    this.stars = createStars({
      count: window.innerWidth < 760 ? 2300 : 5000,
      minRadius: 100,
      maxRadius: 420,
      pixelRatio: this.renderer.getPixelRatio(),
    });
    this.scene.add(this.stars);

    const blueNebula = createGlowSprite({ color: '#356aff', scale: 120, opacity: 0.12, layers: 1 });
    blueNebula.position.set(-90, 45, -170);
    this.scene.add(blueNebula);
    const violetNebula = createGlowSprite({ color: '#8c55ff', scale: 105, opacity: 0.09, layers: 1 });
    violetNebula.position.set(130, -60, -140);
    this.scene.add(violetNebula);

    const sun = await createPlanetBody('sun', 5.6, this.renderer, { segments: 64, includeRings: false });
    sun.group.userData.bodyId = 'sun';
    sun.body.userData.bodyId = 'sun';
    this.sun = sun;
    this.scene.add(sun.group);
    this.sunHalo = createGlowSprite({ color: '#ffb75b', scale: 28, opacity: 0.28, layers: 2 });
    this.scene.add(this.sunHalo);
    this.meshes.push(sun.body);
    this.sunBody = sun.body;

    const loadedPlanets = await Promise.all(
      PLANETS.map(async (planet) => {
        const visual = await createPlanetBody(planet.id, planet.scene.radius, this.renderer, {
          segments: window.innerWidth < 760 ? 48 : 64,
        });
        return { planet, visual };
      }),
    );

    loadedPlanets.forEach(({ planet, visual }, index) => {
      const orbitGroup = new THREE.Group();
      orbitGroup.rotation.x = 0;
      this.scene.add(orbitGroup);

      const anchor = new THREE.Group();
      orbitGroup.add(anchor);
      anchor.position.set(Math.cos(planet.scene.initialAngle) * planet.scene.orbitRadius, 0, Math.sin(planet.scene.initialAngle) * planet.scene.orbitRadius);

      visual.group.rotation.z = planet.scene.tilt;
      anchor.add(visual.group);
      visual.body.userData.bodyId = planet.id;
      visual.group.userData.planetId = planet.id;
      this.meshes.push(visual.body);

      const orbit = createOrbitPath(planet.scene.orbitRadius, {
        color: index % 2 === 0 ? '#6b9fd1' : '#6873bd',
        opacity: 0.15 + index * 0.006,
      });
      this.scene.add(orbit);

      const label = this.createLabel(planet, visual.group);
      anchor.add(label);

      const selectionHalo = this.createHalo(planet.scene.radius);
      selectionHalo.visible = false;
      anchor.add(selectionHalo);

      this.planets.push({
        ...planet,
        orbitGroup,
        anchor,
        visual,
        orbit,
        label,
        selectionHalo,
        angle: planet.scene.initialAngle,
      });
    });

    this.asteroidBelt = this.createAsteroidBelt();
    this.scene.add(this.asteroidBelt);

    const handlePointerMove = (event) => this.updatePointer(event);
    const handlePointerDown = (event) => {
      this.pointerDown = { x: event.clientX, y: event.clientY };
    };
    const handlePointerUp = (event) => {
      if (!this.pointerDown) return;
      const moved = Math.hypot(event.clientX - this.pointerDown.x, event.clientY - this.pointerDown.y);
      this.pointerDown = null;
      if (moved > 7) return;
      this.updatePointer(event);
      const id = this.pickBody();
      if (id) this.selectBody(id, { focus: true, source: 'canvas' });
    };
    const handlePointerLeave = () => {
      this.pointer.set(-2, -2);
      this.setHovered(null);
    };
    this.canvas.addEventListener('pointermove', handlePointerMove, { passive: true });
    this.canvas.addEventListener('pointerdown', handlePointerDown, { passive: true });
    this.canvas.addEventListener('pointerup', handlePointerUp, { passive: true });
    this.canvas.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    this.cleanupFns.push(() => {
      this.canvas.removeEventListener('pointermove', handlePointerMove);
      this.canvas.removeEventListener('pointerdown', handlePointerDown);
      this.canvas.removeEventListener('pointerup', handlePointerUp);
      this.canvas.removeEventListener('pointerleave', handlePointerLeave);
    });

    this.resizeObserver = observeSize(this.container, (w, h) => this.resize(w, h));
    this.resize(width, height);
    this.start();
    this.callbacks.onReady?.();
  }

  getOverviewPosition() {
    const aspect = this.container.clientWidth / Math.max(1, this.container.clientHeight);
    if (aspect < 0.86) return OVERVIEW.mobile.clone();
    if (aspect < 1.42) return OVERVIEW.desktop.clone();
    return OVERVIEW.wide.clone();
  }

  createLabel(planet, parent) {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = 'planet-label';
    element.dataset.planetLabel = planet.id;
    element.setAttribute('aria-label', `Inspect ${planet.name}`);
    element.innerHTML = `
      <span class="planet-label__dot" style="--label-color:${planet.accent}"></span>
      <span class="planet-label__name">${planet.name}</span>
      <span class="planet-label__index">${String(planet.index).padStart(2, '0')}</span>
    `;
    element.addEventListener('click', (event) => {
      event.stopPropagation();
      this.selectBody(planet.id, { focus: true, source: 'label' });
    });
    const label = new CSS2DObject(element);
    label.position.set(0, planet.scene.radius + 0.5, 0);
    label.userData.planetId = planet.id;
    return label;
  }

  createHalo(radius) {
    const geometry = new THREE.RingGeometry(radius * 1.44, radius * 1.47, 80);
    const material = new THREE.MeshBasicMaterial({
      color: 0x78e5ff,
      transparent: true,
      opacity: 0.68,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const halo = new THREE.Mesh(geometry, material);
    halo.renderOrder = 4;
    return halo;
  }

  createAsteroidBelt() {
    const count = window.innerWidth < 760 ? 420 : 900;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 29.2 + Math.random() * 3.8;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.9;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const texture = createGlowTexture(
      'rgba(255,255,255,1)',
      'rgba(212,194,165,0.55)',
      'rgba(0,0,0,0)',
    );
    const material = new THREE.PointsMaterial({
      map: texture,
      color: 0xb3a18b,
      size: 0.22,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const belt = new THREE.Points(geometry, material);
    belt.rotation.y = 0.2;
    return belt;
  }

  updatePointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.updateHover();
  }

  pickBody() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersections = this.raycaster.intersectObjects(this.meshes, false);
    return intersections[0]?.object?.userData?.bodyId ?? null;
  }

  updateHover() {
    if (!this.running) return;
    if (this.pointer.x < -1.5) return;
    const id = this.pickBody();
    this.setHovered(id);
  }

  setHovered(id) {
    if (this.hoveredId === id) return;
    this.hoveredId = id;
    this.canvas.style.cursor = id ? 'pointer' : 'grab';
    this.planets.forEach((planet) => {
      planet.label.element.classList.toggle('is-hovered', planet.id === id);
    });
  }

  selectBody(id, { focus = true } = {}) {
    const body = BODY_LOOKUP.get(id);
    if (!body) return;
    this.selectedId = id;
    this.planets.forEach((planet) => {
      const active = planet.id === id;
      planet.label.element.classList.toggle('is-selected', active);
      planet.orbit.material.opacity = active ? 0.6 : 0.15;
      planet.orbit.material.color.set(active ? '#6ee7ff' : '#6586b6');
      planet.selectionHalo.visible = active;
      if (active) this.selectionHalo = planet.selectionHalo;
      if (active && focus) this.focusOnObject(planet.anchor, planet.scene.radius);
    });
    if (id === 'sun') {
      this.focusOnObject(this.sun.group, 5.6, 23);
      this.selectionHalo = null;
    }
    this.callbacks.onSelect?.(id);
  }

  focusOnObject(object, radius, overrideDistance = null) {
    const target = new THREE.Vector3();
    object.getWorldPosition(target);
    const distance = overrideDistance ?? Math.max(4.6, radius * 4.9 + 1.6);
    const direction = this.camera.position.clone().sub(target);
    if (direction.lengthSq() < 0.01) direction.set(0.7, 0.32, 0.7);
    direction.normalize();
    direction.y = Math.max(direction.y, 0.24);
    direction.normalize();
    const endPosition = target.clone().add(direction.multiplyScalar(distance));
    this.cameraTween = {
      startPos: this.camera.position.clone(),
      endPos: endPosition,
      startTarget: this.controls.target.clone(),
      endTarget: target,
      start: performance.now(),
      duration: 1150,
    };
    this.controls.enabled = false;
  }

  resetView({ closeSelection = false } = {}) {
    const target = new THREE.Vector3(0, 0, 0);
    this.cameraTween = {
      startPos: this.camera.position.clone(),
      endPos: this.getOverviewPosition(),
      startTarget: this.controls.target.clone(),
      endTarget: target,
      start: performance.now(),
      duration: 1300,
    };
    this.controls.enabled = false;
    if (closeSelection) this.clearSelection();
  }

  clearSelection() {
    if (!this.selectedId) return;
    this.selectedId = null;
    this.selectionHalo = null;
    this.planets.forEach((planet) => {
      planet.label.element.classList.remove('is-selected');
      planet.orbit.material.opacity = 0.15;
      planet.orbit.material.color.set('#6586b6');
      planet.selectionHalo.visible = false;
    });
    this.callbacks.onSelect?.(null);
  }

  zoomBy(factor) {
    if (!this.controls) return;
    const offset = this.camera.position.clone().sub(this.controls.target);
    const distance = THREE.MathUtils.clamp(
      offset.length() * factor,
      this.controls.minDistance,
      this.controls.maxDistance,
    );
    offset.setLength(distance);
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
  }

  setSelectedWithoutFocus(id) {
    this.selectBody(id, { focus: false });
  }

  setPaused(paused) {
    this.paused = paused;
    return this.paused;
  }

  setSpeed(speed) {
    this.speed = speed;
    return this.speed;
  }

  resize(width, height) {
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.labelRenderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 760 ? 1.6 : 2));
    this.renderer.setSize(width, height, false);
    this.labelRenderer.setSize(width, height);
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
      if (!this.paused) this.simulationTime += delta * this.speed;

      if (this.stars) this.stars.userData.update(this.elapsed);
      if (this.sunBody) this.sunBody.rotation.y += delta * 0.014;
      if (this.sunHalo) {
        const pulse = 1 + Math.sin(this.elapsed * 0.55) * 0.018;
        this.sunHalo.scale.setScalar(pulse);
      }
      if (this.asteroidBelt && !this.paused) this.asteroidBelt.rotation.y += delta * 0.0055 * this.speed;

      this.planets.forEach((planet) => {
        planet.anchor.position.set(
          Math.cos(planet.angle + this.simulationTime * planet.scene.orbitSpeed) * planet.scene.orbitRadius,
          0,
          Math.sin(planet.angle + this.simulationTime * planet.scene.orbitSpeed) * planet.scene.orbitRadius,
        );
        if (!this.paused) {
          planet.visual.body.rotation.y += delta * planet.scene.spinSpeed * this.speed;
          if (planet.visual.clouds) planet.visual.clouds.rotation.y += delta * planet.scene.spinSpeed * 1.28 * this.speed;
        }
        if (planet.selectionHalo.visible) planet.selectionHalo.quaternion.copy(this.camera.quaternion);
      });

      if (this.cameraTween) {
        const t = Math.min(1, (performance.now() - this.cameraTween.start) / this.cameraTween.duration);
        const eased = easeInOutCubic(t);
        this.camera.position.lerpVectors(this.cameraTween.startPos, this.cameraTween.endPos, eased);
        this.controls.target.lerpVectors(this.cameraTween.startTarget, this.cameraTween.endTarget, eased);
        this.camera.lookAt(this.controls.target);
        if (t >= 1) {
          this.cameraTween = null;
          this.controls.enabled = true;
        }
      } else {
        this.controls.update();
      }

      this.renderer.render(this.scene, this.camera);
      this.labelRenderer.render(this.scene, this.camera);
    };
    tick();
  }

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.frame);
    this.cleanupFns.forEach((fn) => fn());
    this.resizeObserver?.disconnect();
    this.controls?.dispose();
    this.planets.forEach((planet) => {
      planet.label.element.remove();
    });
    disposeObject(this.scene);
    this.labelRenderer.domElement.remove();
    this.renderer.dispose();
    this.renderer.forceContextLoss?.();
    this.canvas?.remove();
    this.scene.clear();
  }
}
