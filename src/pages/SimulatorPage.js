import { SPACECRAFT, getSpacecraft } from '../data/spacecraft.js';
import { DESTINATIONS, DESTINATION_BY_ID } from '../data/destinations.js';
import { pageFooter } from '../components/Footer.js';
import { icon } from '../components/icons.js';
import { SpacecraftScene } from '../scenes/SpacecraftScene.js';
import { supportsWebGL } from '../utils/webgl.js';
import { clamp, formatNumber } from '../utils/format.js';

const FALLBACK_SECONDS = 30;
const SIM_TRAVEL_DAYS = { moon: 3, mars: 210, jupiter: 730, saturn: 2480, 'deep-space': 6570 };

const fallbackMarkup = (destination) => `
  <div class="sim-fallback" aria-hidden="true">
    <div class="sim-fallback__stars"></div>
    <div class="sim-fallback__planet" style="--dest-accent:${destination.accent}" data-fallback-planet>
      <span></span>
    </div>
    <div class="sim-fallback__route">
      <span class="sim-fallback__start"></span>
      <span class="sim-fallback__path"></span>
      <span class="sim-fallback__ship" data-fallback-ship>${icon('simulator', 20)}</span>
      <span class="sim-fallback__end"></span>
    </div>
    <p class="sim-fallback__label">2D FLIGHT PROJECTION / ${destination.name.toUpperCase()}</p>
  </div>
`;

const craftOptions = SPACECRAFT.map(
  (craft) => `<option value="${craft.id}">${craft.name} — ${craft.role}</option>`,
).join('');

const destinationOptions = DESTINATIONS.map(
  (destination) => `<option value="${destination.id}">${destination.name}</option>`,
).join('');

export async function mount(root, ctx) {
  const firstCraft = SPACECRAFT[1];
  const firstDestination = DESTINATION_BY_ID.mars;

  root.innerHTML = `
    <div class="page-shell sim-page">
      <header class="page-topbar">
        <div class="breadcrumb">
          <a href="#/">ORBIT X</a><span>/</span><span>FLIGHT DECK</span>
          <span class="archive-tag archive-tag--warn">${icon('info', 12)} SIMULATED TELEMETRY</span>
        </div>
        <div class="control-topstats">
          <a class="text-link" href="#/mission-control">Assign a mission ${icon('arrowRight', 13)}</a>
        </div>
      </header>

      <main class="sim-main">
        <section class="control-intro sim-intro">
          <div>
            <p class="eyebrow">VEHICLE OPERATIONS / FLIGHT DECK</p>
            <h1>Spacecraft Simulator</h1>
            <p class="page-lede">Configure a spacecraft, choose a destination and fly a simulated transfer. Speed, fuel and position are illustrative values produced by this application.</p>
          </div>
          <span class="status-pill"><span class="status-dot"></span> FLIGHT DECK ACTIVE</span>
        </section>

        <div class="sim-layout">
          <section class="sim-viewport" aria-label="Spacecraft flight visualization">
            <div class="sim-stage" id="sim-stage">
              <div class="scene-loading" id="sim-loader">
                <span class="mini-orbit"><i></i></span>
                <span>ASSEMBLING SPACECRAFT</span>
              </div>
            </div>
            <div class="sim-hud sim-hud--top">
              <span class="status-pill status-pill--dark"><span class="status-dot"></span><span data-flight-status>STANDBY</span></span>
              <span class="sim-hud__tag">SIMULATED VISUALIZATION</span>
            </div>
            <div class="sim-hud sim-hud--bottom">
              <div class="sim-hud__mission">
                <span>FLIGHT PROFILE</span>
                <strong><span data-hud-craft>—</span><i>→</i><span data-hud-destination>—</span></strong>
              </div>
              <div class="sim-hud__progress">
                <div class="sim-hud__progress-head"><span>TRANSFER PROGRESS</span><b data-progress>0%</b></div>
                <div class="sim-progress-track"><span data-progress-bar></span></div>
              </div>
              <div class="sim-hud__readouts">
                <span>VELOCITY <b data-hud-velocity>0.0 km/s</b></span>
                <span>MET <b data-hud-met>0 d</b></span>
              </div>
            </div>

            <div class="sim-arrival" id="sim-arrival" hidden>
              <div class="sim-arrival__orb" aria-hidden="true"></div>
              <p class="eyebrow">SIMULATED ARRIVAL CONFIRMED</p>
              <h2 data-arrival-title>Destination reached.</h2>
              <p data-arrival-copy>The transfer simulation is complete. No real spacecraft was flown.</p>
              <div class="button-row">
                <button class="button button--primary" type="button" data-arrival-reset>${icon('reset', 16)} Reset flight</button>
                <a class="button button--ghost" href="#/mission-control">Plan a mission ${icon('arrowRight', 15)}</a>
              </div>
            </div>
          </section>

          <aside class="sim-panel" aria-label="Spacecraft controls">
            <div class="sim-panel__section">
              <div class="panel-head">
                <span class="eyebrow">VEHICLE CONFIGURATION</span>
                <span class="panel-head__count">05 CRAFT</span>
              </div>
              <label class="field-label" for="craft-select">SPACECRAFT</label>
              <div class="select-wrap">
                <select id="craft-select" class="select-input">${craftOptions}</select>
                ${icon('chevronDown', 15)}
              </div>
              <div class="sim-selection" id="craft-summary"></div>
            </div>

            <div class="sim-panel__section">
              <label class="field-label" for="destination-select">DESTINATION</label>
              <div class="select-wrap">
                <select id="destination-select" class="select-input">${destinationOptions}</select>
                ${icon('chevronDown', 15)}
              </div>
              <div class="sim-selection sim-selection--destination" id="destination-summary"></div>
            </div>

            <div class="sim-panel__section">
              <div class="panel-head">
                <span class="eyebrow">FLIGHT SYSTEMS</span>
                <span class="panel-head__count">SIMULATED</span>
              </div>
              <div class="telemetry-gauge" data-fuel-gauge>
                <div class="telemetry-gauge__head"><span>${icon('fuel', 14)} Fuel reserve</span><strong data-fuel>100%</strong></div>
                <div class="telemetry-gauge__track"><span data-fuel-bar style="width:100%"></span></div>
                <span class="telemetry-gauge__label" data-fuel-label>—</span>
              </div>
              <div class="telemetry-gauge telemetry-gauge--energy">
                <div class="telemetry-gauge__head"><span>${icon('bolt', 14)} Power reserve</span><strong data-energy>100%</strong></div>
                <div class="telemetry-gauge__track"><span data-energy-bar style="width:100%"></span></div>
                <span class="telemetry-gauge__label" data-energy-label>—</span>
              </div>
              <div class="sim-stats">
                <span><b data-craft-speed>—</b>Cruise speed</span>
                <span><b data-distance-left>—</b>Distance left</span>
              </div>
            </div>

            <div class="sim-panel__section sim-panel__section--controls">
              <span class="field-label">SIMULATION RATE</span>
              <div class="speed-control speed-control--wide" role="group" aria-label="Simulation rate">
                <button type="button" class="speed-button" data-sim-speed="1">1×</button>
                <button type="button" class="speed-button is-active" data-sim-speed="2">2×</button>
                <button type="button" class="speed-button" data-sim-speed="4">4×</button>
              </div>
              <div class="sim-flight-actions">
                <button class="button button--primary button--full" type="button" id="sim-toggle" disabled>
                  ${icon('play', 17)} <span data-toggle-label>Loading flight systems</span>
                </button>
                <button class="icon-button" type="button" id="sim-reset" aria-label="Reset flight" title="Reset flight">${icon('reset', 17)}</button>
              </div>
              <p class="data-note">${icon('info', 12)} All velocities, fuel levels, distances and arrivals are simulated for education. They do not represent a real mission.</p>
            </div>
          </aside>
        </div>
      </main>

      ${pageFooter()}
    </div>
  `;

  const stage = root.querySelector('#sim-stage');
  const loader = root.querySelector('#sim-loader');
  const craftSelect = root.querySelector('#craft-select');
  const destinationSelect = root.querySelector('#destination-select');
  const craftSummary = root.querySelector('#craft-summary');
  const destinationSummary = root.querySelector('#destination-summary');
  const toggleButton = root.querySelector('#sim-toggle');
  const arrivalPanel = root.querySelector('#sim-arrival');
  const speedButtons = [...root.querySelectorAll('[data-sim-speed]')];

  craftSelect.value = firstCraft.id;
  destinationSelect.value = firstDestination.id;

  let craft = firstCraft;
  let destination = firstDestination;
  let speed = 2;
  let progress = 0;
  let running = false;
  let arrived = false;
  let scene = null;
  let sceneReady = false;
  let fallbackMode = false;
  let fallbackRaf = 0;
  let fallbackStartedAt = 0;
  let fallbackBaseProgress = 0;
  let alive = true;

  const setStatus = (label, state = 'idle') => {
    const status = root.querySelector('[data-flight-status]');
    if (status) status.textContent = label;
    stage.classList.toggle('is-running', state === 'running');
    stage.classList.toggle('is-arrived', state === 'arrived');
  };

  const fuelValue = () => Math.max(0, 100 - progress * 78);
  const energyValue = () => Math.max(0, 100 - progress * 36);

  const updateFallbackVisual = () => {
    const ship = root.querySelector('[data-fallback-ship]');
    if (ship) ship.style.left = `${4 + progress * 0.9}%`;
    const planet = root.querySelector('[data-fallback-planet]');
    if (planet) planet.style.setProperty('--dest-accent', destination.accent);
  };

  const updateTelemetry = () => {
    const progressPercent = Math.round(progress * 100);
    const velocity = running || progress > 0 ? craft.cruiseKps * (0.3 + progress * 0.7) : 0;
    const remaining = Math.max(0, destination.distanceKm * (1 - progress));
    const metDays = Math.round((SIM_TRAVEL_DAYS[destination.id] ?? 30) * progress);

    root.querySelectorAll('[data-progress]').forEach((element) => {
      element.textContent = `${progressPercent}%`;
    });
    const bar = root.querySelector('[data-progress-bar]');
    if (bar) bar.style.width = `${progressPercent}%`;

    root.querySelector('[data-fuel]').textContent = `${Math.round(fuelValue())}%`;
    root.querySelector('[data-energy]').textContent = `${Math.round(energyValue())}%`;
    root.querySelector('[data-fuel-bar]').style.width = `${fuelValue()}%`;
    root.querySelector('[data-energy-bar]').style.width = `${energyValue()}%`;
    root.querySelector('[data-fuel-label]').textContent = craft.fuelLabel;
    root.querySelector('[data-energy-label]').textContent = craft.energyLabel;

    root.querySelector('[data-hud-velocity]').textContent = `${velocity.toFixed(1)} km/s`;
    root.querySelector('[data-hud-met]').textContent = `${metDays} d`;
    root.querySelector('[data-distance-left]').textContent = `${formatNumber(Math.round(remaining))} km`;

    updateFallbackVisual();
    updateToggle();
  };

  const updateToggle = () => {
    if (!sceneReady) {
      toggleButton.disabled = true;
      toggleButton.innerHTML = `${icon('play', 17)} <span data-toggle-label>Loading flight systems</span>`;
      return;
    }
    toggleButton.disabled = false;
    if (running) {
      toggleButton.innerHTML = `${icon('pause', 17)} <span data-toggle-label>Pause transfer</span>`;
    } else if (arrived) {
      toggleButton.innerHTML = `${icon('reset', 17)} <span data-toggle-label>Fly again</span>`;
    } else if (progress > 0) {
      toggleButton.innerHTML = `${icon('play', 17)} <span data-toggle-label>Resume transfer</span>`;
    } else {
      toggleButton.innerHTML = `${icon('play', 17)} <span data-toggle-label>Begin transfer</span>`;
    }
  };

  const updateSummaries = () => {
    craftSummary.innerHTML = `
      <div class="selection-head">
        <span class="selection-head__icon" style="--selection-accent:${craft.accent}">${icon('simulator', 18)}</span>
        <div>
          <strong>${craft.name}</strong>
          <span>${craft.role}</span>
        </div>
        <span class="selection-range">${craft.rangeAU} AU RANGE</span>
      </div>
      <p class="panel-copy">${craft.description}</p>
      <div class="selection-specs">
        <span><b>${craft.crew || 'None'}</b>Crew</span>
        <span><b>${craft.mass}</b>Mass</span>
        <span><b>${craft.cruiseKps} km/s</b>Cruise</span>
      </div>
      <div class="chip-row">${craft.features.map((feature) => `<span class="data-chip">${feature}</span>`).join('')}</div>
    `;
    destinationSummary.innerHTML = `
      <div class="selection-head">
        <span class="selection-head__icon" style="--selection-accent:${destination.accent}">${icon('orbit', 18)}</span>
        <div>
          <strong>${destination.name}</strong>
          <span>${destination.type}</span>
        </div>
        <span class="selection-range">${destination.reachability.toUpperCase()}</span>
      </div>
      <p class="panel-copy">${destination.description}</p>
      <div class="selection-specs">
        <span><b>${destination.distanceLabel}</b>Distance</span>
        <span><b>${destination.travelTimeLabel}</b>Transfer</span>
        <span><b>${destination.gravity}</b>Gravity</span>
      </div>
      <div class="chip-row">${destination.highlights.map((item) => `<span class="data-chip">${item}</span>`).join('')}</div>
    `;
    root.querySelector('[data-hud-craft]').textContent = craft.name;
    root.querySelector('[data-hud-destination]').textContent = destination.shortName;
    root.querySelector('[data-craft-speed]').textContent = `${craft.cruiseKps} km/s`;
    root.querySelector('[data-fuel-label]').textContent = craft.fuelLabel;
    root.querySelector('[data-energy-label]').textContent = craft.energyLabel;
    if (fallbackMode) {
      const label = root.querySelector('.sim-fallback__label');
      if (label) label.textContent = `2D FLIGHT PROJECTION / ${destination.name.toUpperCase()}`;
    }
    updateTelemetry();
  };

  const showArrival = () => {
    if (arrived) return;
    arrived = true;
    running = false;
    progress = 1;
    cancelAnimationFrame(fallbackRaf);
    setStatus('ARRIVAL CONFIRMED', 'arrived');
    arrivalPanel.hidden = false;
    arrivalPanel.querySelector('[data-arrival-title]').textContent = `${destination.name} reached.`;
    arrivalPanel.querySelector('[data-arrival-copy]').textContent =
      `${craft.name} completed the simulated ${destination.travelTimeLabel.replace('≈', '')} transfer. All telemetry remained within the fictional flight envelope.`;
    updateTelemetry();
    ctx.toast(`Simulated arrival at ${destination.name}.`, { type: 'success', title: 'Transfer complete' });
  };

  const fallbackTick = (now) => {
    if (!alive || !running || !fallbackMode) return;
    const elapsed = (now - fallbackStartedAt) / 1000;
    progress = clamp(fallbackBaseProgress + (elapsed / FALLBACK_SECONDS) * speed, 0, 1);
    updateTelemetry();
    if (progress >= 1) {
      showArrival();
      return;
    }
    fallbackRaf = requestAnimationFrame(fallbackTick);
  };

  const beginFallback = () => {
    fallbackMode = true;
    sceneReady = true;
    loader?.remove();
    stage.classList.add('is-fallback');
    stage.innerHTML = fallbackMarkup(destination);
    updateFallbackVisual();
    updateToggle();
  };

  const startSimulation = () => {
    if (!sceneReady || running) return;
    if (arrived || progress >= 0.999) resetSimulation();
    running = true;
    arrived = false;
    arrivalPanel.hidden = true;
    setStatus('TRANSFER IN PROGRESS', 'running');
    if (scene && !fallbackMode) {
      scene.startFlight();
    } else {
      fallbackBaseProgress = progress;
      fallbackStartedAt = performance.now();
      fallbackRaf = requestAnimationFrame(fallbackTick);
    }
    updateToggle();
  };

  const pauseSimulation = () => {
    if (!running) return;
    running = false;
    if (scene && !fallbackMode) scene.pauseFlight();
    cancelAnimationFrame(fallbackRaf);
    setStatus('TRANSFER PAUSED', 'idle');
    updateToggle();
  };

  const resetSimulation = () => {
    running = false;
    arrived = false;
    progress = 0;
    cancelAnimationFrame(fallbackRaf);
    if (scene && !fallbackMode) scene.resetFlight({ silent: true });
    arrivalPanel.hidden = true;
    setStatus('STANDBY', 'idle');
    updateTelemetry();
    updateToggle();
  };

  const setCraft = async (craftId) => {
    craft = getSpacecraft(craftId);
    craftSelect.value = craft.id;
    if (running || progress > 0) resetSimulation();
    if (scene && !fallbackMode) {
      try {
        await scene.setCraft(craft);
      } catch (error) {
        console.error('[ORBIT X] Spacecraft model swap failed.', error);
      }
    }
    updateSummaries();
  };

  const setDestination = async (destinationId) => {
    destination = DESTINATION_BY_ID[destinationId] ?? DESTINATIONS[0];
    destinationSelect.value = destination.id;
    if (running || progress > 0) resetSimulation();
    if (fallbackMode) {
      stage.innerHTML = fallbackMarkup(destination);
      updateFallbackVisual();
    } else if (scene) {
      try {
        await scene.setDestination(destination);
      } catch (error) {
        console.error('[ORBIT X] Destination render failed.', error);
      }
    }
    updateSummaries();
  };

  craftSelect.addEventListener('change', () => setCraft(craftSelect.value));
  destinationSelect.addEventListener('change', () => setDestination(destinationSelect.value));
  speedButtons.forEach((button) => {
    button.addEventListener('click', () => {
      speed = Number(button.dataset.simSpeed);
      speedButtons.forEach((item) => item.classList.toggle('is-active', item === button));
      scene?.setCraftSpeed(speed);
    });
  });
  toggleButton.addEventListener('click', () => {
    if (running) pauseSimulation();
    else startSimulation();
  });
  root.querySelector('#sim-reset').addEventListener('click', resetSimulation);
  root.querySelector('[data-arrival-reset]')?.addEventListener('click', resetSimulation);

  updateSummaries();
  setStatus('STANDBY', 'idle');

  const startScene = async () => {
    if (!supportsWebGL()) {
      beginFallback();
      return;
    }
    try {
      scene = new SpacecraftScene(stage, {
        onReady: () => {
          sceneReady = true;
          loader?.classList.add('is-hidden');
          setTimeout(() => loader?.remove(), 400);
          updateToggle();
        },
        onProgress: ({ progress: value }) => {
          if (!alive) return;
          progress = value;
          updateTelemetry();
        },
        onArrival: () => {
          if (!alive) return;
          showArrival();
        },
        onStateChange: ({ running: isRunning }) => {
          if (!alive) return;
          running = Boolean(isRunning);
          updateToggle();
        },
      });
      await scene.init();
      if (!alive) {
        scene.dispose();
        return;
      }
      await scene.setCraft(craft);
      await scene.setDestination(destination);
      scene.setCraftSpeed(speed);
      updateToggle();
    } catch (error) {
      console.error('[ORBIT X] Spacecraft scene failed.', error);
      if (!alive) return;
      scene?.dispose();
      scene = null;
      beginFallback();
    }
  };

  requestAnimationFrame(() => {
    if (alive) startScene();
  });

  return () => {
    alive = false;
    cancelAnimationFrame(fallbackRaf);
    scene?.dispose();
  };
}
