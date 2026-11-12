import { LaunchScene } from '../scenes/LaunchScene.js';
import { SoundSystem } from '../systems/SoundSystem.js';
import { store } from '../systems/store.js';
import { pageFooter } from '../components/Footer.js';
import { icon } from '../components/icons.js';
import { supportsWebGL } from '../utils/webgl.js';
import { formatDuration, padNumber } from '../utils/format.js';

const APOGEE_TARGET = 270;
const IGNITION_DELAY = 1600;
const FALLBACK_ASCENT_SECONDS = 11.5;

const fallbackStage = () => `
  <div class="launch-fallback" aria-hidden="true">
    <div class="launch-fallback__stars"></div>
    <div class="launch-fallback__horizon"></div>
    <div class="launch-fallback__grid"></div>
    <div class="launch-fallback__tower"></div>
    <div class="launch-fallback__rocket" data-fallback-rocket>
      <span class="launch-fallback__nose"></span>
      <span class="launch-fallback__body"></span>
      <span class="launch-fallback__booster launch-fallback__booster--a"></span>
      <span class="launch-fallback__booster launch-fallback__booster--b"></span>
      <span class="launch-fallback__flame"></span>
    </div>
    <p class="launch-fallback__label">2D PAD PROJECTION / WEBGL UNAVAILABLE</p>
  </div>
`;

export async function mount(root, ctx) {
  const sound = new SoundSystem();
  let soundEnabled = Boolean(store.getState().settings.sound);
  let phase = 'loading';
  let countdown = 10;
  let scene = null;
  let sceneReady = false;
  let fallbackMode = false;
  let fallbackRaf = 0;
  let fallbackStart = 0;
  let launchRecorded = false;
  let alive = true;
  let lastTelemetry = { altitude: 0, velocity: 0, missionElapsed: 0 };

  root.innerHTML = `
    <div class="page-shell launch-page">
      <header class="page-topbar">
        <div class="breadcrumb">
          <a href="#/">ORBIT X</a><span>/</span><span>LAUNCH COMPLEX / PAD 07</span>
          <span class="archive-tag">${icon('flame', 12)} CREW VEHICLE</span>
        </div>
        <div class="launch-tools">
          <button class="sound-button" type="button" id="sound-toggle" aria-pressed="false">
            <span class="sound-button__icon">${icon('mute', 16)}</span>
            <span class="sound-button__label">SOUND OFF</span>
          </button>
          <a class="text-link" href="#/about">Safety &amp; simulation notes ${icon('info', 13)}</a>
        </div>
      </header>

      <main class="launch-main">
        <section class="launch-stage" id="launch-stage" aria-label="Rocket launch visualization">
          <div class="scene-loading" id="launch-loader">
            <span class="mini-orbit"><i></i></span>
            <span>PREPARING LAUNCH PAD</span>
          </div>
          <div class="launch-vignette" aria-hidden="true"></div>
          <div class="launch-scanlines" aria-hidden="true"></div>

          <div class="launch-hud launch-hud--top">
            <div>
              <p class="eyebrow">ORBIT X / HEAVY LIFT COMPLEX</p>
              <h1>Launch Sequence</h1>
            </div>
            <span class="status-pill status-pill--dark"><span class="status-dot"></span><span data-pad-status>PAD SYSTEMS NOMINAL</span></span>
          </div>

          <div class="launch-telemetry" aria-live="off">
            <div class="launch-telemetry__item">
              <span>MISSION ELAPSED</span>
              <strong data-met>00:00</strong>
            </div>
            <div class="launch-telemetry__item">
              <span>ALTITUDE</span>
              <strong><b data-altitude>0.0</b><small>km</small></strong>
            </div>
            <div class="launch-telemetry__item">
              <span>VELOCITY</span>
              <strong><b data-velocity>0</b><small>km/h</small></strong>
            </div>
            <div class="launch-telemetry__item">
              <span>TARGET APOGEE</span>
              <strong><b>${APOGEE_TARGET}</b><small>km</small></strong>
            </div>
          </div>

          <div class="countdown-display" data-countdown-shell data-phase="idle">
            <span class="countdown-display__label" data-countdown-label>T-MINUS</span>
            <strong data-countdown>00:10</strong>
            <span class="countdown-display__state" data-countdown-state>HOLD / AWAITING AUTHORITY</span>
          </div>

          <div class="launch-log" aria-label="Launch event log">
            <div class="launch-log__title"><span>SEQUENCE LOG</span><span>UTC</span></div>
            <div class="launch-log__entries" data-launch-log></div>
          </div>

          <div class="launch-controls" data-launch-controls>
            <button class="button button--primary button--large" type="button" id="launch-button" disabled>
              ${icon('rocket', 20)} <span data-launch-label>Preparing pad</span>
            </button>
            <button class="button button--ghost" type="button" id="secondary-button">
              ${icon('reset', 16)} <span data-secondary-label>Reset pad</span>
            </button>
            <p class="launch-note">Launch begins only when you press the control. Audio is off by default.</p>
          </div>

          <div class="launch-result" id="launch-result" hidden>
            <div class="launch-result__badge">${icon('check', 26)}</div>
            <p class="eyebrow">SIMULATED FLIGHT COMPLETE</p>
            <h2>Orbit achieved.</h2>
            <p class="launch-result__copy">The simulated ORBIT X vehicle completed its ascent profile. This outcome has been added to your launch record.</p>
            <div class="launch-result__stats">
              <div><span>APOGEE</span><strong data-result-altitude>${APOGEE_TARGET} km</strong></div>
              <div><span>MAX VELOCITY</span><strong data-result-velocity>—</strong></div>
              <div><span>FLIGHT TIME</span><strong data-result-time>—</strong></div>
            </div>
            <div class="button-row">
              <button class="button button--primary" type="button" id="launch-again">${icon('rocket', 16)} Launch again</button>
              <a class="button button--ghost" href="#/dashboard">Open dashboard ${icon('arrowRight', 15)}</a>
              <a class="button button--ghost" href="#/mission-control">Plan a mission</a>
            </div>
          </div>
        </section>

        <p class="launch-footnote">${icon('info', 13)} This is an educational animation. No vehicle is launched, no propellant is consumed and no live telemetry is shown. Launch outcomes are deterministic in this simulation.</p>
      </main>

      ${pageFooter()}
    </div>
  `;

  const stage = root.querySelector('#launch-stage');
  const loader = root.querySelector('#launch-loader');
  const launchButton = root.querySelector('#launch-button');
  const launchLabel = root.querySelector('[data-launch-label]');
  const secondaryButton = root.querySelector('#secondary-button');
  const secondaryLabel = root.querySelector('[data-secondary-label]');
  const resultPanel = root.querySelector('#launch-result');
  const countdownShell = root.querySelector('[data-countdown-shell]');
  const countdownValue = root.querySelector('[data-countdown]');
  const countdownLabel = root.querySelector('[data-countdown-label]');
  const countdownState = root.querySelector('[data-countdown-state]');
  const padStatus = root.querySelector('[data-pad-status]');
  const logRoot = root.querySelector('[data-launch-log]');
  const soundButton = root.querySelector('#sound-toggle');
  const timers = new Set();

  const clearTimers = () => {
    timers.forEach((timer) => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    timers.clear();
  };

  const later = (fn, delay) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      fn();
    }, delay);
    timers.add(timer);
    return timer;
  };

  const updateSoundButton = () => {
    soundButton.classList.toggle('is-on', soundEnabled);
    soundButton.setAttribute('aria-pressed', String(soundEnabled));
    soundButton.querySelector('.sound-button__icon').innerHTML = icon(soundEnabled ? 'sound' : 'mute', 16);
    soundButton.querySelector('.sound-button__label').textContent = soundEnabled ? 'SOUND ON' : 'SOUND OFF';
  };

  const addLog = (message, tone = '') => {
    const now = new Date();
    const stamp = `${padNumber(now.getUTCHours())}:${padNumber(now.getUTCMinutes())}:${padNumber(now.getUTCSeconds())}`;
    const row = document.createElement('div');
    row.className = `launch-log__row ${tone ? `is-${tone}` : ''}`;
    row.innerHTML = `<span>${stamp}</span><p>${message}</p>`;
    logRoot.append(row);
    logRoot.scrollTop = logRoot.scrollHeight;
  };

  const setTelemetry = ({ altitude = lastTelemetry.altitude, velocity = lastTelemetry.velocity, missionElapsed = lastTelemetry.missionElapsed }) => {
    lastTelemetry = { altitude, velocity, missionElapsed };
    root.querySelector('[data-altitude]').textContent = altitude.toFixed(1);
    root.querySelector('[data-velocity]').textContent = Math.round(velocity * 3.6).toLocaleString('en-US');
    root.querySelector('[data-met]').textContent = formatDuration(missionElapsed * 1000);
  };

  const updateCountdown = () => {
    countdownShell.dataset.phase = phase;
    if (phase === 'loading' || phase === 'idle') {
      countdownValue.textContent = `00:${padNumber(countdown)}`;
      countdownLabel.textContent = 'T-MINUS';
      countdownState.textContent = 'HOLD / AWAITING AUTHORITY';
    } else if (phase === 'countdown') {
      countdownValue.textContent = `00:${padNumber(countdown)}`;
      countdownLabel.textContent = 'T-MINUS';
      countdownState.textContent = countdown <= 3 ? 'TERMINAL COUNT' : 'COUNT AUTOMATED';
    } else if (phase === 'ignition') {
      countdownValue.textContent = 'IGNITION';
      countdownLabel.textContent = 'T-ZERO';
      countdownState.textContent = 'MAIN ENGINE START';
    } else if (phase === 'ascent') {
      countdownValue.textContent = 'ASCENT';
      countdownLabel.textContent = 'FLIGHT';
      countdownState.textContent = 'TRAJECTORY NOMINAL';
    } else if (phase === 'complete') {
      countdownValue.textContent = 'SUCCESS';
      countdownLabel.textContent = 'ORBIT';
      countdownState.textContent = 'SIMULATED INSERTION COMPLETE';
    }
  };

  const updatePadStatus = () => {
    const labels = {
      loading: 'PAD SYSTEMS CHECK',
      idle: 'PAD SYSTEMS NOMINAL',
      countdown: 'TERMINAL COUNT ACTIVE',
      ignition: 'IGNITION / HOLD DOWN',
      ascent: 'VEHICLE IN FLIGHT',
      complete: 'ASCENT COMPLETE',
    };
    padStatus.textContent = labels[phase] ?? 'PAD SYSTEMS NOMINAL';
    stage.dataset.phase = phase;
  };

  const updateControls = () => {
    if (phase === 'loading') {
      launchButton.disabled = true;
      launchLabel.textContent = 'Preparing pad';
    } else if (phase === 'idle') {
      launchButton.disabled = !sceneReady;
      launchLabel.textContent = sceneReady ? 'Initiate launch' : 'Preparing pad';
    } else if (phase === 'complete') {
      launchButton.disabled = true;
      launchLabel.textContent = 'Ascent complete';
    } else {
      launchButton.disabled = true;
      launchLabel.textContent = phase === 'countdown' ? 'Countdown active' : phase === 'ignition' ? 'Ignition' : 'In flight';
    }

    if (phase === 'countdown' || phase === 'ignition') {
      secondaryLabel.textContent = 'Abort sequence';
    } else if (phase === 'ascent') {
      secondaryLabel.textContent = 'Reset simulation';
    } else {
      secondaryLabel.textContent = 'Reset pad';
    }
    secondaryButton.disabled = phase === 'loading';
  };

  const resetFallbackRocket = () => {
    const rocket = root.querySelector('[data-fallback-rocket]');
    if (rocket) {
      rocket.style.transform = '';
      rocket.classList.remove('is-ignited');
    }
  };

  const clearFlightState = () => {
    clearTimers();
    cancelAnimationFrame(fallbackRaf);
    fallbackRaf = 0;
    sound.stopRumble();
    resetFallbackRocket();
  };

  const resetSequence = ({ silent = false } = {}) => {
    clearFlightState();
    scene?.reset();
    phase = 'idle';
    countdown = 10;
    launchRecorded = false;
    lastTelemetry = { altitude: 0, velocity: 0, missionElapsed: 0 };
    setTelemetry(lastTelemetry);
    resultPanel.hidden = true;
    updateCountdown();
    updatePadStatus();
    updateControls();
    if (!silent) {
      addLog('Pad reset. Vehicle configured for a new simulated countdown.', 'muted');
      ctx.toast('Pad reset. Launch controls are ready.', { type: 'info' });
    }
  };

  const completeLaunch = (altitudeKm = APOGEE_TARGET, maxVelocity = lastTelemetry.velocity) => {
    if (phase === 'complete' || !alive) return;
    phase = 'complete';
    clearTimers();
    cancelAnimationFrame(fallbackRaf);
    sound.stopRumble();
    sound.chime();
    const apogee = Math.round(Math.max(altitudeKm, APOGEE_TARGET));
    setTelemetry({ altitude: apogee, velocity: maxVelocity || 7800, missionElapsed: lastTelemetry.missionElapsed });
    const elapsed = lastTelemetry.missionElapsed || 11.5;
    resultPanel.hidden = false;
    resultPanel.querySelector('[data-result-altitude]').textContent = `${apogee} km`;
    resultPanel.querySelector('[data-result-velocity]').textContent = `${Math.round((maxVelocity || 7800) * 3.6).toLocaleString('en-US')} km/h`;
    resultPanel.querySelector('[data-result-time]').textContent = formatDuration(elapsed * 1000);
    if (!launchRecorded) {
      launchRecorded = true;
      store.recordLaunch({ success: true, apogeeKm: apogee });
    }
    addLog('Ascent profile complete. Simulated orbit insertion confirmed.', 'success');
    updateCountdown();
    updatePadStatus();
    updateControls();
    ctx.toast(`Simulated launch complete at ${apogee} km apogee.`, { type: 'success', title: 'Orbit achieved' });
    resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const fallbackAscent = (now) => {
    if (!alive || phase !== 'ascent') return;
    const elapsed = (now - fallbackStart) / 1000;
    const progress = Math.min(1, elapsed / FALLBACK_ASCENT_SECONDS);
    const eased = Math.pow(progress, 2.2);
    const altitude = eased * APOGEE_TARGET;
    const velocity = progress * 7800;
    setTelemetry({ altitude, velocity, missionElapsed: elapsed });
    const rocket = root.querySelector('[data-fallback-rocket]');
    if (rocket) rocket.style.transform = `translateY(${-eased * 320}px)`;
    if (progress >= 1) {
      completeLaunch(APOGEE_TARGET, 7800);
      return;
    }
    fallbackRaf = requestAnimationFrame(fallbackAscent);
  };

  const enterIgnition = () => {
    phase = 'ignition';
    countdownValue.textContent = 'IGNITION';
    updateCountdown();
    updatePadStatus();
    updateControls();
    addLog('Main engine ignition. Hold-down clamps released in the simulation.', 'warn');
    if (soundEnabled) sound.startRumble();
    root.querySelector('[data-fallback-rocket]')?.classList.add('is-ignited');
    if (scene && !fallbackMode) scene.ignite();
    later(() => {
      if (!alive || phase !== 'ignition') return;
      phase = 'ascent';
      fallbackStart = performance.now();
      lastTelemetry.missionElapsed = 0;
      updateCountdown();
      updatePadStatus();
      updateControls();
      addLog('Liftoff. Vehicle clear of the launch tower.', 'success');
      if (scene && !fallbackMode) scene.launch();
      if (fallbackMode) fallbackRaf = requestAnimationFrame(fallbackAscent);
    }, IGNITION_DELAY);
  };

  const beginCountdown = () => {
    if (phase !== 'idle' || !sceneReady) return;
    if (soundEnabled) sound.setEnabled(true);
    phase = 'countdown';
    countdown = 10;
    resultPanel.hidden = true;
    updateCountdown();
    updatePadStatus();
    updateControls();
    addLog('Launch authority confirmed. Terminal count initiated by operator.', 'warn');
    if (soundEnabled) sound.beep({ frequency: 620, duration: 0.1, gain: 0.1 });
    const interval = setInterval(() => {
      if (!alive || phase !== 'countdown') {
        clearInterval(interval);
        return;
      }
      countdown -= 1;
      if (countdown > 0) {
        updateCountdown();
        if (soundEnabled) {
          sound.beep({ frequency: countdown <= 3 ? 820 : 540, duration: 0.09, gain: 0.08 });
        }
      } else {
        clearInterval(interval);
        timers.delete(interval);
        updateCountdown();
        enterIgnition();
      }
    }, 1000);
    timers.add(interval);
  };

  const secondaryAction = () => {
    if (phase === 'countdown' || phase === 'ignition') {
      clearFlightState();
      scene?.reset();
      phase = 'idle';
      countdown = 10;
      updateCountdown();
      updatePadStatus();
      updateControls();
      addLog('Sequence aborted by operator. No launch record filed.', 'danger');
      ctx.toast('Launch sequence aborted before liftoff.', { type: 'warning' });
    } else {
      resetSequence();
    }
  };

  const toggleSound = async () => {
    const next = !soundEnabled;
    if (next) {
      await sound.setEnabled(true);
      if (!sound.context) {
        soundEnabled = false;
        updateSoundButton();
        ctx.toast('Audio is unavailable in this browser. The simulation works without sound.', { type: 'warning' });
        return;
      }
    } else {
      sound.setEnabled(false);
      sound.stopRumble();
    }
    soundEnabled = next;
    store.setSetting('sound', next);
    updateSoundButton();
    ctx.toast(next ? 'Launch audio enabled for this session.' : 'Launch audio muted.', { type: 'info' });
  };

  const addLaunchListeners = () => {
    launchButton.addEventListener('click', beginCountdown);
    secondaryButton.addEventListener('click', secondaryAction);
    soundButton.addEventListener('click', toggleSound);
    root.querySelector('#launch-again')?.addEventListener('click', () => {
      resetSequence({ silent: true });
      addLog('Vehicle re-configured. Launch control ready.');
      beginCountdown();
    });
  };

  const initializeFallback = () => {
    fallbackMode = true;
    sceneReady = true;
    loader?.remove();
    stage.classList.add('is-fallback');
    const hud = stage.querySelector('.launch-hud');
    stage.insertAdjacentHTML('afterbegin', fallbackStage());
    if (hud) hud.style.display = '';
    if (phase === 'loading') phase = 'idle';
    updateCountdown();
    updateControls();
    updatePadStatus();
  };

  const startScene = async () => {
    if (!supportsWebGL()) {
      initializeFallback();
      return;
    }
    try {
      scene = new LaunchScene(stage, {
        onReady: () => {
          sceneReady = true;
          loader?.classList.add('is-hidden');
          setTimeout(() => loader?.remove(), 400);
          updateControls();
        },
        onIgnition: () => {
          if (!alive) return;
          updatePadStatus();
        },
        onLiftoff: () => {
          if (!alive) return;
          addLog('Vehicle has cleared the pad. Ascent telemetry streaming.', 'success');
        },
        onTelemetry: ({ altitude, velocity, missionElapsed }) => {
          if (!alive) return;
          setTelemetry({ altitude, velocity, missionElapsed });
        },
        onComplete: ({ altitudeKm }) => {
          if (!alive) return;
          completeLaunch(altitudeKm, lastTelemetry.velocity || 7800);
        },
      });
      await scene.init();
      if (!alive) {
        scene.dispose();
        return;
      }
      phase = 'idle';
      updateCountdown();
      updatePadStatus();
      updateControls();
    } catch (error) {
      console.error('[ORBIT X] Launch scene failed.', error);
      if (!alive) return;
      scene?.dispose();
      scene = null;
      initializeFallback();
    }
  };

  updateSoundButton();
  updateCountdown();
  updatePadStatus();
  updateControls();
  addLog('Pad systems online. Vehicle configured for a simulated flight.', 'muted');
  addLog('Audio is muted until enabled. Launch requires operator input.', 'muted');
  addLaunchListeners();

  requestAnimationFrame(() => {
    if (alive) startScene();
  });

  return () => {
    alive = false;
    clearTimers();
    cancelAnimationFrame(fallbackRaf);
    sound.dispose();
    scene?.dispose();
  };
}
