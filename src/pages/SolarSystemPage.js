import { PLANETS, PLANET_BY_ID, SUN } from '../data/planets.js';
import { icon } from '../components/icons.js';
import { SolarSystemScene } from '../scenes/SolarSystemScene.js';
import { store } from '../systems/store.js';
import { supportsWebGL, webglFallback } from '../utils/webgl.js';

const bodyChips = [
  { id: 'sun', name: 'Sun', color: '#ffc360' },
  ...PLANETS.map((planet) => ({ id: planet.id, name: planet.name, color: planet.accent })),
];

const getBodyInfo = (id) => (id === 'sun' ? SUN : PLANET_BY_ID[id]);

const inspectorHTML = (id) => {
  const body = getBodyInfo(id);
  if (!body) return '';
  const isPlanet = id !== 'sun';
  const stats = (body.stats ?? [])
    .slice(0, 6)
    .map(
      (stat) => `
        <div class="inspector-stat">
          <span>${stat.label}</span>
          <strong>${stat.value}</strong>
        </div>
      `,
    )
    .join('');
  return `
    <button class="inspector-close" type="button" data-close-inspector aria-label="Close planet data">${icon('close', 18)}</button>
    <div class="inspector-orbit" style="--body-accent:${body.accent}" aria-hidden="true"></div>
    <p class="eyebrow">${isPlanet ? `PLANETARY FILE / ${String(body.index).padStart(2, '0')}` : 'STELLAR FILE / 00'}</p>
    <div class="inspector-title">
      <span class="body-sigil" style="--body-accent:${body.accent};--body-accent2:${body.accent2}">${body.symbol}</span>
      <div>
        <h2>${body.name}</h2>
        <p>${body.type}</p>
      </div>
    </div>
    <p class="inspector-tagline">${body.tagline}</p>
    <p class="inspector-description">${body.description}</p>
    <div class="inspector-stats">${stats}</div>
    <p class="data-note">${isPlanet ? 'Planetary facts: NASA. Orbital display is artistically compressed.' : body.note}</p>
    <div class="inspector-actions">
      ${
        isPlanet
          ? `<a class="button button--primary button--sm" href="#/planet/${id}">Open planet file ${icon('arrowRight', 14)}</a>`
          : `<a class="button button--ghost button--sm" href="#/about">View sources ${icon('external', 13)}</a>`
      }
      <span class="archive-mark">${icon('check', 13)} ${store.getState().planets.includes(id) ? 'ARCHIVED' : 'CLICK TO LOG'}</span>
    </div>
  `;
};

export async function mount(root, ctx) {
  const discoveredCount = store.getState().planets.length;
  root.innerHTML = `
    <div class="solar-page">
      <div class="solar-stage" id="solar-stage">
        <div class="scene-loading scene-loading--overlay" id="solar-loader">
          <span class="mini-orbit"><i></i></span>
          <p class="eyebrow">ORBITAL CARTOGRAPHY</p>
          <span>Loading planetary registry</span>
        </div>
      </div>
      <div class="solar-grid-overlay" aria-hidden="true"></div>

      <header class="solar-header">
        <div class="solar-header__title">
          <p class="eyebrow">DEEP SPACE NETWORK / LIVE SIMULATION</p>
          <h1>Solar System</h1>
          <p class="solar-subtitle">Select any world to inspect its file. <span>Drag to orbit · scroll to zoom.</span></p>
        </div>
        <div class="solar-toolbar">
          <div class="speed-control requires-scene" role="group" aria-label="Simulation speed">
            <span class="speed-control__label">TIME</span>
            <button type="button" class="speed-button is-active" data-speed="0.5">0.5×</button>
            <button type="button" class="speed-button" data-speed="1">1×</button>
            <button type="button" class="speed-button" data-speed="2">2×</button>
            <button type="button" class="speed-button" data-speed="4">4×</button>
          </div>
          <button class="icon-button requires-scene" type="button" id="pause-orbit" aria-label="Pause orbital motion" aria-pressed="false" title="Pause orbital motion">${icon('pause', 17)}</button>
          <button class="icon-button requires-scene" type="button" id="reset-camera" aria-label="Reset camera" title="Reset camera">${icon('reset', 17)}</button>
        </div>
      </header>

      <div class="simulation-note">
        <span class="status-dot"></span>
        <span>EDUCATIONAL SIMULATION</span>
        <span class="simulation-note__divider"></span>
        <span>Orbital periods and distances are compressed. Planet sizes are not to scale.</span>
      </div>

      <aside class="planet-inspector" id="planet-inspector" aria-label="Selected body data" hidden></aside>

      <div class="solar-controls requires-scene">
        <button class="icon-button" type="button" data-zoom-in aria-label="Zoom in">${icon('plus', 17)}</button>
        <span>ZOOM</span>
        <button class="icon-button" type="button" data-zoom-out aria-label="Zoom out">${icon('minus', 17)}</button>
      </div>

      <div class="solar-bottom">
        <nav class="body-chips" aria-label="Select a solar system body">
          ${bodyChips
            .map(
              (body) => `
              <button type="button" class="body-chip" data-body="${body.id}" aria-label="Inspect ${body.name}">
                <span class="body-chip__dot" style="--chip-color:${body.color}"></span>
                <span>${body.name}</span>
              </button>
            `,
            )
            .join('')}
        </nav>
        <div class="solar-archive">
          <span>EXPLORATION ARCHIVE</span>
          <strong data-archive-count>${String(discoveredCount).padStart(2, '0')} / 08</strong>
        </div>
      </div>

      <a class="solar-about" href="#/about">${icon('info', 13)} Scientific data &amp; simulation notes</a>
    </div>
  `;

  const stage = root.querySelector('#solar-stage');
  const loader = root.querySelector('#solar-loader');
  const inspector = root.querySelector('#planet-inspector');
  const archiveCount = root.querySelector('[data-archive-count]');
  const pauseButton = root.querySelector('#pause-orbit');
  const speedButtons = [...root.querySelectorAll('[data-speed]')];
  let scene = null;
  let alive = true;
  let sceneReady = false;
  let paused = false;
  let currentSpeed = 0.5;
  let pendingSelection = null;

  const updateArchive = () => {
    const count = store.getState().planets.length;
    if (archiveCount) archiveCount.textContent = `${String(count).padStart(2, '0')} / 08`;
  };

  const hideInspector = () => {
    inspector.hidden = true;
    inspector.innerHTML = '';
    root.querySelectorAll('[data-body]').forEach((button) => button.classList.remove('is-active'));
  };

  const openInspector = (id) => {
    const body = getBodyInfo(id);
    if (!body) return;
    inspector.innerHTML = inspectorHTML(id);
    inspector.hidden = false;
    root.querySelectorAll('[data-body]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.body === id);
    });
    inspector.querySelector('[data-close-inspector]')?.addEventListener('click', () => {
      scene?.clearSelection();
      hideInspector();
    });
    if (id !== 'sun') {
      const alreadyDiscovered = store.getState().planets.includes(id);
      store.discoverPlanet(id);
      updateArchive();
      const mark = inspector.querySelector('.archive-mark');
      if (mark) mark.innerHTML = `${icon('check', 13)} ARCHIVED`;
      if (!alreadyDiscovered) ctx.toast(`${body.name} added to your exploration archive.`, { type: 'success' });
    }
  };

  const selectBody = (id, { focus = true } = {}) => {
    if (sceneReady) {
      scene.selectBody(id, { focus });
    } else {
      pendingSelection = { id, focus };
      openInspector(id);
    }
  };

  stage?.addEventListener('click', (event) => {
    if (!event.target.closest('.planet-inspector')) return;
  });

  root.querySelectorAll('[data-body]').forEach((button) => {
    button.addEventListener('click', () => selectBody(button.dataset.body));
  });

  pauseButton?.addEventListener('click', () => {
    paused = scene ? scene.setPaused(!paused) : !paused;
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.innerHTML = icon(paused ? 'play' : 'pause', 17);
    pauseButton.setAttribute('aria-label', paused ? 'Resume orbital motion' : 'Pause orbital motion');
  });

  speedButtons.forEach((button) => {
    button.addEventListener('click', () => {
      currentSpeed = Number(button.dataset.speed);
      scene?.setSpeed(currentSpeed);
      speedButtons.forEach((item) => item.classList.toggle('is-active', item === button));
    });
  });

  root.querySelector('#reset-camera')?.addEventListener('click', () => {
    scene?.resetView({ closeSelection: true });
    hideInspector();
  });
  root.querySelector('[data-zoom-in]')?.addEventListener('click', () => scene?.zoomBy(0.78));
  root.querySelector('[data-zoom-out]')?.addEventListener('click', () => scene?.zoomBy(1.28));

  const handleKey = (event) => {
    if (event.key === 'Escape' && !inspector.hidden) {
      scene?.clearSelection();
      hideInspector();
    }
  };
  document.addEventListener('keydown', handleKey);

  const startScene = async () => {
    if (!supportsWebGL()) {
      loader?.remove();
      stage.innerHTML = webglFallback({
        title: '3D orbital view unavailable',
        message:
          'WebGL could not be initialized on this device. Use the world selector below to inspect planetary data in a lightweight 2D mode.',
      });
      stage.classList.add('is-fallback');
      root.querySelector('.solar-page')?.classList.add('is-fallback');
      return;
    }
    scene = new SolarSystemScene(stage, {
      onReady: () => {
        sceneReady = true;
        loader?.classList.add('is-hidden');
        setTimeout(() => loader?.remove(), 500);
        if (pendingSelection) {
          const pending = pendingSelection;
          pendingSelection = null;
          scene.selectBody(pending.id, { focus: pending.focus });
        }
        scene.setPaused(paused);
        scene.setSpeed(currentSpeed);
      },
      onSelect: (id) => {
        if (id) openInspector(id);
        else hideInspector();
      },
    });
    try {
      await scene.init();
      if (!alive) scene.dispose();
    } catch (error) {
      console.error('[ORBIT X] Solar system scene failed.', error);
      if (!alive) return;
      loader?.remove();
      stage.innerHTML = webglFallback({
        title: 'Orbital renderer interrupted',
        message:
          'The interactive 3D scene could not load its planetary textures. Scientific data remains available through the world selector.',
      });
      root.querySelector('.solar-page')?.classList.add('is-fallback');
    }
  };

  requestAnimationFrame(() => {
    if (alive) startScene();
  });

  return () => {
    alive = false;
    document.removeEventListener('keydown', handleKey);
    scene?.dispose();
  };
}
