import { MISSIONS, getMission, getMissionDestination, getMissionReadiness, getRecommendedCraft, resolveMission } from '../data/missions.js';
import { SPACECRAFT, getSpacecraft } from '../data/spacecraft.js';
import { PLANET_BY_ID } from '../data/planets.js';
import { pageFooter } from '../components/Footer.js';
import { icon } from '../components/icons.js';
import { store, deriveStats, getMissionOutcome } from '../systems/store.js';

const FLIGHT_MS = 9200;
const LIVE_PLANETS = new Set(['mars', 'jupiter', 'saturn']);

const riskClass = (risk) => risk.toLowerCase();

const difficultyPips = (level) =>
  Array.from({ length: 3 }, (_, index) => `<span class="${index < level ? 'is-on' : ''}"></span>`).join('');

const missionCard = (mission) => {
  const destination = getMissionDestination(mission);
  const outcome = getMissionOutcome(store.getState(), mission.id);
  const statusLabels = { available: 'READY', complete: 'COMPLETE', failed: 'RETRY' };
  return `
    <button type="button" class="mission-card" data-mission="${mission.id}" aria-pressed="false" style="--mission-accent:${mission.accent}">
      <span class="mission-card__top">
        <span class="mission-card__code">${mission.code}</span>
        <span class="mission-card__status is-${outcome.status}" data-mission-status>${statusLabels[outcome.status]}</span>
      </span>
      <span class="mission-card__title">${mission.title}</span>
      <span class="mission-card__meta">
        <span>${destination.shortName}</span>
        <span class="meta-dot"></span>
        <span>${mission.difficulty}</span>
        <span class="meta-dot"></span>
        <span>${mission.duration}</span>
      </span>
      <span class="mission-card__footer">
        <span class="difficulty-pips" aria-hidden="true">${difficultyPips(mission.difficultyLevel)}</span>
        <span class="mission-card__risk risk-${riskClass(mission.risk)}">RISK ${mission.risk}</span>
        ${icon('chevronRight', 14)}
      </span>
    </button>
  `;
};

const craftCard = (craft, mission, selectedId) => `
  <button type="button" class="craft-card ${craft.id === selectedId ? 'is-selected' : ''}" data-craft="${craft.id}" aria-pressed="${craft.id === selectedId}" style="--craft-accent:${craft.accent}">
    ${craft.id === mission.recommendedCraft ? '<span class="craft-card__recommended">RECOMMENDED</span>' : ''}
    <span class="craft-card__head">
      <span class="craft-card__model" aria-hidden="true">${icon('simulator', 18)}</span>
      <span class="craft-card__range">${craft.rangeAU} AU</span>
    </span>
    <strong>${craft.name}</strong>
    <span class="craft-card__role">${craft.role}</span>
    <span class="craft-card__specs">
      <span>${craft.crew ? `${craft.crew} crew` : 'Autonomous'}</span>
      <span>${craft.mass}</span>
    </span>
    <span class="craft-card__check">${icon('check', 12)} ASSIGNED</span>
  </button>
`;

const stageItems = (mission, progress = 0) =>
  mission.stages
    .map((stage, index) => {
      const complete = progress >= stage.at && stage.at < 100;
      const active =
        !complete &&
        progress >= (mission.stages[index - 1]?.at ?? 0) &&
        progress < stage.at;
      const resolved = stage.at === 100 && progress >= 100;
      return `
        <li class="stage-item ${complete || resolved ? 'is-complete' : ''} ${active ? 'is-active' : ''}">
          <span class="stage-item__node">${complete || resolved ? icon('check', 10) : String(index + 1).padStart(2, '0')}</span>
          <span class="stage-item__label">${stage.label}</span>
          <span class="stage-item__at">${stage.at}%</span>
        </li>
      `;
    })
    .join('');

const consoleHeader = (mission, outcome) => {
  const destination = getMissionDestination(mission);
  const outcomeLabel = { available: 'MISSION READY', complete: 'PROGRAM ARCHIVED', failed: 'RETRY AUTHORIZED' }[outcome.status];
  return `
    <div class="console-head">
      <div>
        <p class="eyebrow">${mission.code} / ${mission.difficulty.toUpperCase()} PROFILE</p>
        <h2>${mission.title}</h2>
      </div>
      <span class="console-status console-status--${outcome.status}">${outcomeLabel}</span>
    </div>
    <div class="console-target">
      <span class="console-target__orb" style="--target-accent:${destination.accent}" aria-hidden="true"></span>
      <div>
        <span class="console-target__label">TARGET</span>
        <strong>${destination.name}</strong>
        <span class="console-target__type">${destination.type}</span>
      </div>
      <div class="console-target__stats">
        <span><b>${destination.distanceLabel}</b>distance</span>
        <span><b>${destination.travelTimeLabel}</b>transfer</span>
        <span><b>${destination.gravity}</b>gravity</span>
        <span><b>${destination.temperature}</b>temperature</span>
      </div>
    </div>
  `;
};

const planningMarkup = (mission, craft) => {
  const outcome = getMissionOutcome(store.getState(), mission.id);
  const destination = getMissionDestination(mission);
  const chance = getMissionReadiness(mission, craft);
  const recommended = getRecommendedCraft(mission);
  const planetId = LIVE_PLANETS.has(destination.id) ? destination.id : null;
  return `
    ${consoleHeader(mission, outcome)}
    <div class="console-grid">
      <div class="console-column">
        <div class="console-block">
          <div class="console-block__title"><span>MISSION OBJECTIVE</span>${icon('target', 15)}</div>
          <p class="console-objective">${mission.objective}</p>
          <p class="panel-copy">${mission.brief}</p>
          <div class="mission-payload">
            <span class="mission-payload__label">PAYLOAD MANIFEST</span>
            <div class="chip-row">${mission.payload.map((item) => `<span class="data-chip">${item}</span>`).join('')}</div>
          </div>
          <div class="mission-highlights">
            ${destination.highlights.map((item) => `<span>${icon('check', 12)} ${item}</span>`).join('')}
          </div>
        </div>

        <div class="console-block">
          <div class="console-block__title">
            <span>SPACECRAFT ASSIGNMENT</span>
            <span class="console-block__hint">RANGE ${craft.rangeAU} AU / REQUIRED ${destination.requiredRangeAU} AU</span>
          </div>
          <div class="craft-grid">
            ${SPACECRAFT.map((item) => craftCard(item, mission, craft.id)).join('')}
          </div>
          <div class="craft-detail">
            <div>
              <strong>${craft.name}</strong>
              <p>${craft.description}</p>
            </div>
            <div class="craft-detail__specs">
              <div><span>Propulsion</span><strong>${craft.fuelLabel}</strong></div>
              <div><span>Power</span><strong>${craft.energyLabel}</strong></div>
              <div><span>Cruise speed</span><strong>${craft.cruiseKps} km/s</strong></div>
            </div>
          </div>
          ${recommended && recommended.id !== craft.id ? `<p class="console-advice">${icon('info', 13)} The mission profile recommends ${recommended.name} for this destination.</p>` : ''}
        </div>
      </div>

      <aside class="console-column console-column--aside">
        <div class="console-block readiness-block">
          <div class="console-block__title"><span>FLIGHT READINESS</span>${icon('signal', 15)}</div>
          <div class="readiness-dial" style="--readiness:${chance};--readiness-accent:${chance >= 75 ? '#63f2c4' : chance >= 55 ? '#ffd479' : '#ff8f9a'}">
            <div class="readiness-dial__inner">
              <strong>${chance}<small>%</small></strong>
              <span>EST. SUCCESS</span>
            </div>
          </div>
          <p class="data-note">Readiness is a simulated probability based on craft range, mission difficulty and crew profile. It is not a real flight prediction.</p>
          <div class="readiness-factors">
            <div><span>Destination risk</span><strong class="risk-${riskClass(mission.risk)}">${mission.risk}</strong></div>
            <div><span>Range margin</span><strong>${Math.round((craft.rangeAU / destination.requiredRangeAU) * 100)}%</strong></div>
            <div><span>Science value</span><strong>${mission.scienceValue} / 100</strong></div>
          </div>
          <div class="readiness-bar"><span style="width:${chance}%"></span></div>
        </div>

        <div class="console-block">
          <div class="console-block__title"><span>SCIENCE RETURN</span>${icon('telescope', 15)}</div>
          <div class="science-meter">
            <strong>${mission.scienceValue}</strong>
            <div>
              <span>Science value index</span>
              <div class="science-meter__track"><i style="width:${mission.scienceValue}%;--meter-accent:${mission.accent}"></i></div>
            </div>
          </div>
          <div class="console-quickfacts">
            <span><b>${mission.duration}</b>Mission duration</span>
            <span><b>${destination.temperature}</b>Environment</span>
          </div>
        </div>

        <div class="launch-panel">
          ${
            outcome.status === 'complete'
              ? `<p class="launch-panel__archived">${icon('check', 14)} This mission is already in your flight archive. Re-running creates a new simulated flight record.</p>`
              : outcome.status === 'failed'
                ? `<p class="launch-panel__archived is-failed">${icon('alert', 14)} The last attempt failed. Adjust spacecraft assignment or re-run the simulation.</p>`
                : ''
          }
          <button class="button button--primary button--large button--full" type="button" data-initiate>
            ${icon('rocket', 18)} Initiate mission simulation
          </button>
          <p class="launch-panel__note">Crewed flights are simulated. No real launch command is issued.</p>
          ${
            planetId
              ? `<a class="text-link" href="#/planet/${planetId}">Review ${PLANET_BY_ID[planetId].name} science file ${icon('arrowRight', 14)}</a>`
              : `<a class="text-link" href="#/solar-system">Review destination in solar system ${icon('arrowRight', 14)}</a>`
          }
        </div>
      </aside>
    </div>
  `;
};

const flightMarkup = (mission, craft, chance) => {
  const destination = getMissionDestination(mission);
  return `
    ${consoleHeader(mission, getMissionOutcome(store.getState(), mission.id))}
    <div class="flight-shell">
      <div class="flight-banner">
        <div class="flight-banner__pulse" aria-hidden="true"></div>
        <div class="flight-banner__copy">
          <p class="eyebrow">SIMULATED FLIGHT IN PROGRESS</p>
          <h3>${craft.name} <span>→</span> ${destination.name}</h3>
          <p>${mission.objective}</p>
        </div>
        <div class="flight-banner__telemetry">
          <span>READINESS<strong>${chance}%</strong></span>
          <span>ELAPSED<strong data-flight-clock>00:00</strong></span>
        </div>
      </div>

      <div class="flight-progress">
        <div class="flight-progress__head">
          <span>MISSION PROGRESS</span>
          <strong data-progress-value>0%</strong>
        </div>
        <div class="flight-progress__track"><span data-progress-fill></span></div>
        <div class="flight-progress__meta">
          <span class="status-dot"></span>
          <span data-flight-state>FLIGHT PROFILE ACCEPTED</span>
          <span data-flight-phase>STAGE 01</span>
        </div>
      </div>

      <div class="flight-grid">
        <div class="console-block">
          <div class="console-block__title"><span>SEQUENCE</span>${icon('mission', 15)}</div>
          <ol class="stage-list">${stageItems(mission)}</ol>
        </div>
        <div class="console-block">
          <div class="console-block__title"><span>FLIGHT LOG</span>${icon('signal', 15)}</div>
          <div class="flight-log" data-flight-log aria-live="polite">
            <div class="flight-log__line"><span>T+00:00</span><p>Flight profile accepted. Simulated command authority granted.</p></div>
            <div class="flight-log__line"><span>T+00:01</span><p>${craft.name} systems nominal. Guidance aligned to ${destination.name}.</p></div>
          </div>
          <div class="flight-actions">
            <button class="button button--danger button--ghost" type="button" data-abort>${icon('x', 16)} Abort simulation</button>
            <span class="data-note">Aborting does not record a mission.</span>
          </div>
        </div>
      </div>
    </div>
  `;
};

const resultMarkup = (result) => {
  const mission = getMission(result.missionId);
  const destination = getMissionDestination(mission);
  const success = result.status === 'success';
  return `
    <div class="mission-result ${success ? 'is-success' : 'is-failure'}">
      <div class="mission-result__badge">${icon(success ? 'check' : 'x', 30)}</div>
      <p class="eyebrow">${success ? 'MISSION RESOLVED / OBJECTIVE ACHIEVED' : 'MISSION RESOLVED / OBJECTIVE NOT ACHIEVED'}</p>
      <h2>${success ? 'Mission successful.' : 'Mission unsuccessful.'}</h2>
      <p class="mission-result__summary">${
        success
          ? `${result.craftName} completed the ${mission.title} profile. ${destination.name} science data has been added to your flight archive.`
          : `${result.craftName} could not complete the ${mission.title} profile. Mission Control recommends reviewing spacecraft range and re-running the simulation.`
      }</p>
      <div class="mission-result__grid">
        <div><span>DESTINATION</span><strong>${destination.name}</strong></div>
        <div><span>SPACECRAFT</span><strong>${result.craftName}</strong></div>
        <div><span>READINESS</span><strong>${result.chance}%</strong></div>
        <div><span>SCIENCE VALUE</span><strong>${mission.scienceValue} / 100</strong></div>
      </div>
      <p class="mission-result__note">${icon('info', 13)} Outcome generated from the simulated readiness probability. Real mission outcomes depend on engineering, operations and conditions not modeled here.</p>
      <div class="button-row">
        <button class="button button--primary" type="button" data-rerun>${icon('reset', 16)} Run simulation again</button>
        <a class="button button--ghost" href="#/dashboard">Open mission dashboard ${icon('arrowRight', 15)}</a>
        <button class="button button--ghost" type="button" data-other>Choose another mission</button>
      </div>
    </div>
  `;
};

export async function mount(root, ctx) {
  const stats = deriveStats(store.getState());
  const initialMission = MISSIONS[0];

  const craftState = {
    selectedMissionId: initialMission.id,
    selectedCraftId: initialMission.recommendedCraft,
  };

  root.innerHTML = `
    <div class="page-shell control-page">
      <header class="page-topbar">
        <div class="breadcrumb">
          <a href="#/">ORBIT X</a><span>/</span><span>FLIGHT OPERATIONS</span>
          <span class="archive-tag">${icon('signal', 12)} SIMULATION ONLINE</span>
        </div>
        <div class="control-topstats">
          <span><b>${String(stats.totalMissions).padStart(2, '0')}</b> logged</span>
          <span><b>${String(stats.successful).padStart(2, '0')}</b> successful</span>
          <a class="text-link" href="#/dashboard">Mission archive ${icon('arrowRight', 13)}</a>
        </div>
      </header>

      <main class="control-main">
        <section class="control-intro">
          <div>
            <p class="eyebrow">DEEP SPACE PROGRAM / MISSION PLANNING</p>
            <h1>Mission Control</h1>
            <p class="page-lede">Select a mission profile, assign a spacecraft and simulate the flight. Every readiness estimate and outcome is generated locally for education.</p>
          </div>
          <div class="control-intro__meta">
            <span class="status-pill"><span class="status-dot"></span> COMMAND LINK NOMINAL</span>
            <span class="mono-tag">FIVE ACTIVE PROFILES</span>
          </div>
        </section>

        <div class="control-layout">
          <aside class="mission-selector" aria-label="Mission profiles">
            <div class="panel-head">
              <span class="eyebrow">MISSION LIBRARY</span>
              <span class="panel-head__count">${String(MISSIONS.length).padStart(2, '0')} PROFILES</span>
            </div>
            <div class="mission-list" role="group" aria-label="Choose a mission profile">
              ${MISSIONS.map(missionCard).join('')}
            </div>
            <div class="selector-note">
              ${icon('info', 14)}
              <p>Completing a mission logs a record to your local flight archive. Failed attempts can be retried with a different spacecraft.</p>
            </div>
          </aside>

          <section class="mission-console" aria-label="Mission console">
            <div id="mission-console"></div>
          </section>
        </div>
      </main>

      ${pageFooter()}
    </div>
  `;

  const consoleRoot = root.querySelector('#mission-console');
  const missionButtons = [...root.querySelectorAll('[data-mission]')];
  let mode = 'planning';
  let rafId = 0;
  let flightStart = 0;
  let progress = 0;
  let plannedSuccess = false;
  let loggedStage = -1;
  let alive = true;
  let currentChance = 0;
  let currentCraft = null;
  let currentMission = null;
  let flightRefs = null;

  const getSelectedMission = () => getMission(craftState.selectedMissionId);
  const getSelectedCraft = () => getSpacecraft(craftState.selectedCraftId);

  const refreshMissionCards = () => {
    missionButtons.forEach((button) => {
      const missionId = button.dataset.mission;
      const outcome = getMissionOutcome(store.getState(), missionId);
      const active = missionId === craftState.selectedMissionId;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
      const status = button.querySelector('[data-mission-status]');
      if (status) {
        status.className = `mission-card__status is-${outcome.status}`;
        status.textContent = { available: 'READY', complete: 'COMPLETE', failed: 'RETRY' }[outcome.status];
      }
    });
  };

  const bindCraftSelection = () => {
    consoleRoot.querySelectorAll('[data-craft]').forEach((button) => {
      button.addEventListener('click', () => {
        if (mode !== 'planning') return;
        craftState.selectedCraftId = button.dataset.craft;
        renderPlanning();
      });
    });
  };

  const renderPlanning = () => {
    mode = 'planning';
    currentMission = getSelectedMission();
    currentCraft = getSelectedCraft();
    consoleRoot.innerHTML = planningMarkup(currentMission, currentCraft);
    bindCraftSelection();
    consoleRoot.querySelector('[data-initiate]')?.addEventListener('click', beginFlight);
    refreshMissionCards();
  };

  const updateFlightVisuals = () => {
    if (!flightRefs) return;
    const { fill, value, clock, state, phase, stages } = flightRefs;
    if (fill) fill.style.width = `${progress}%`;
    if (value) value.textContent = `${Math.round(progress)}%`;
    const elapsedSeconds = Math.min(999, Math.floor((progress / 100) * 84));
    if (clock) {
      clock.textContent = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(elapsedSeconds % 60).padStart(2, '0')}`;
    }
    const stageList = currentMission.stages;
    let activeIndex = 0;
    stageList.forEach((stage, index) => {
      if (progress >= stage.at) activeIndex = index;
    });
    if (state && progress < 100) {
      state.textContent = progress < 6 ? 'LAUNCH WINDOW OPEN' : progress < 90 ? 'FLIGHT NOMINAL' : 'TERMINAL APPROACH';
    }
    if (phase) phase.textContent = `STAGE ${String(Math.min(activeIndex + 1, stageList.length)).padStart(2, '0')}`;
    stages.forEach((item, index) => {
      const stage = stageList[index];
      const resolved = stage.at === 100 && progress >= 100;
      const complete = progress >= stage.at && stage.at < 100;
      item.classList.toggle('is-complete', complete || resolved);
      item.classList.toggle('is-active', !complete && !resolved && index === activeIndex);
    });
  };

  const appendFlightLog = (message) => {
    if (!flightRefs?.log) return;
    const seconds = Math.floor((progress / 100) * 84);
    const line = document.createElement('div');
    line.className = 'flight-log__line is-new';
    line.innerHTML = `<span>T+${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}</span><p>${message}</p>`;
    flightRefs.log.append(line);
    flightRefs.log.scrollTop = flightRefs.log.scrollHeight;
  };

  const beginFlight = () => {
    if (mode === 'running') return;
    mode = 'running';
    currentMission = getSelectedMission();
    currentCraft = getSelectedCraft();
    currentChance = getMissionReadiness(currentMission, currentCraft);
    plannedSuccess = resolveMission(currentChance);
    progress = 0;
    loggedStage = -1;
    consoleRoot.innerHTML = flightMarkup(currentMission, currentCraft, currentChance);
    flightRefs = {
      fill: consoleRoot.querySelector('[data-progress-fill]'),
      value: consoleRoot.querySelector('[data-progress-value]'),
      clock: consoleRoot.querySelector('[data-flight-clock]'),
      state: consoleRoot.querySelector('[data-flight-state]'),
      phase: consoleRoot.querySelector('[data-flight-phase]'),
      log: consoleRoot.querySelector('[data-flight-log]'),
      stages: [...consoleRoot.querySelectorAll('.stage-item')],
    };
    updateFlightVisuals();
    consoleRoot.querySelector('[data-abort]')?.addEventListener('click', abortFlight);
    flightStart = performance.now();
    rafId = requestAnimationFrame(tickFlight);
  };

  const tickFlight = (now) => {
    if (!alive || mode !== 'running') return;
    progress = Math.min(100, ((now - flightStart) / FLIGHT_MS) * 100);
    updateFlightVisuals();
    const stageIndex = currentMission.stages.findIndex((stage) => stage.at <= progress && stage.at < 100);
    if (stageIndex > loggedStage) {
      for (let index = loggedStage + 1; index <= stageIndex; index += 1) {
        appendFlightLog(`${currentMission.stages[index].label}. Telemetry within simulated limits.`);
      }
      loggedStage = stageIndex;
    }
    if (progress >= 100) {
      finishFlight();
      return;
    }
    rafId = requestAnimationFrame(tickFlight);
  };

  const finishFlight = () => {
    if (mode !== 'running') return;
    cancelAnimationFrame(rafId);
    mode = 'result';
    updateFlightVisuals();
    const status = plannedSuccess ? 'success' : 'failure';
    const destination = getMissionDestination(currentMission);
    const record = {
      id: `mission-${Date.now()}`,
      missionId: currentMission.id,
      missionTitle: currentMission.title,
      destinationId: destination.id,
      destinationPlanetId: LIVE_PLANETS.has(destination.id) ? destination.id : null,
      craftId: currentCraft.id,
      craftName: currentCraft.name,
      difficulty: currentMission.difficulty,
      chance: currentChance,
      status,
      scienceValue: currentMission.scienceValue,
      timestamp: new Date().toISOString(),
    };
    store.recordMission(record);
    if (plannedSuccess) {
      ctx.toast(`${currentMission.title} completed. Flight record archived.`, { type: 'success', title: 'Mission resolved' });
    } else {
      ctx.toast(`${currentMission.title} did not complete. Review the flight profile and retry.`, {
        type: 'warning',
        title: 'Mission resolved',
      });
    }
    consoleRoot.innerHTML = resultMarkup(record);
    refreshMissionCards();
    consoleRoot.querySelector('[data-rerun]')?.addEventListener('click', beginFlight);
    consoleRoot.querySelector('[data-other]')?.addEventListener('click', () => {
      renderPlanning();
      root.querySelector('.mission-selector')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      missionButtons[0]?.focus({ preventScroll: true });
    });
  };

  const abortFlight = () => {
    if (mode !== 'running') return;
    cancelAnimationFrame(rafId);
    mode = 'planning';
    ctx.toast('Simulation aborted. No flight record was filed.', { type: 'info' });
    renderPlanning();
  };

  const selectMission = (missionId) => {
    if (mode === 'running') return;
    craftState.selectedMissionId = missionId;
    craftState.selectedCraftId = getRecommendedCraft(getMission(missionId)).id;
    renderPlanning();
  };

  missionButtons.forEach((button) => {
    button.addEventListener('click', () => selectMission(button.dataset.mission));
  });

  const handleKey = (event) => {
    if (event.key === 'Escape' && mode === 'running') abortFlight();
  };
  document.addEventListener('keydown', handleKey);

  renderPlanning();

  return () => {
    alive = false;
    cancelAnimationFrame(rafId);
    document.removeEventListener('keydown', handleKey);
  };
}
