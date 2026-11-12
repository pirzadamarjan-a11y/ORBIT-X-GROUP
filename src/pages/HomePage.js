import { pageFooter } from '../components/Footer.js';
import { icon } from '../components/icons.js';
import { store, deriveStats } from '../systems/store.js';
import { HomeScene } from '../scenes/HomeScene.js';
import { supportsWebGL } from '../utils/webgl.js';

const fallbackMarkup = `
  <div class="hero-fallback" aria-hidden="true">
    <div class="hero-fallback__orb"></div>
    <span class="hero-fallback__ring hero-fallback__ring--a"></span>
    <span class="hero-fallback__ring hero-fallback__ring--b"></span>
  </div>
`;

export async function mount(root, ctx) {
  const snapshot = store.getState();
  const stats = deriveStats(snapshot);
  const quizDisplay = stats.quizAttempts > 0 ? `${stats.quizBest}%` : '—';
  const dateLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
    .format(new Date())
    .toUpperCase();

  root.innerHTML = `
    <div class="home-page">
      <section class="home-hero" aria-labelledby="home-title">
        <div class="hero-scene" id="hero-scene" aria-hidden="true">
          <div class="scene-loading">
            <span class="mini-orbit"><i></i></span>
            <span>CALIBRATING OPTICS</span>
          </div>
        </div>
        <div class="hero-shade" aria-hidden="true"></div>
        <div class="hero-topline">
          <span class="signal-pill"><span class="status-dot"></span>SIMULATION ONLINE</span>
          <span class="hero-topline__date">SOL / ${dateLabel}</span>
        </div>

        <div class="hero-content">
          <p class="eyebrow hero-kicker">DEEP SPACE NETWORK <span>/</span> SECTOR 001</p>
          <h1 class="hero-title" id="home-title">
            <span class="hero-title__line">EXPLORE THE</span>
            <span class="hero-title__line hero-title__line--accent">UNIVERSE<span>.</span></span>
          </h1>
          <p class="hero-copy">Discover planets. Launch missions.<br class="desktop-break" /> Explore the unknown.</p>
          <div class="hero-actions">
            <a class="button button--primary button--large" href="#/solar-system">
              <span>${icon('orbit', 18)} Start exploring</span>
              ${icon('arrowRight', 17)}
            </a>
            <a class="button button--glass button--large" href="#/mission-control">
              ${icon('mission', 18)} Mission control
            </a>
          </div>
          <div class="hero-telemetry">
            <div class="hero-telemetry__item">
              <span>MISSIONS FLOWN</span>
              <strong>${String(stats.totalMissions).padStart(2, '0')}</strong>
            </div>
            <div class="hero-telemetry__item">
              <span>WORLDS LOGGED</span>
              <strong>${String(stats.planetsDiscovered).padStart(2, '0')}<small>/08</small></strong>
            </div>
            <div class="hero-telemetry__item">
              <span>KNOWLEDGE INDEX</span>
              <strong>${quizDisplay}</strong>
            </div>
          </div>
        </div>

        <div class="hero-hud" aria-hidden="true">
          <span>ALT 408 KM</span>
          <span>VEL 7.66 KM/S</span>
          <span>LINK NOMINAL</span>
        </div>

        <div class="hero-scroll">
          <span class="scroll-line"></span>
          <span>SCROLL TO CONTINUE</span>
        </div>
      </section>

      <section class="home-modules" aria-labelledby="modules-title">
        <div class="home-section-head reveal">
          <div>
            <p class="eyebrow">MISSION PLATFORM</p>
            <h2 id="modules-title">One interface. <span class="text-dim">An entire solar system.</span></h2>
          </div>
          <p class="home-section-head__copy">Navigate real planetary science, then put that knowledge to work in the flight deck.</p>
        </div>

        <div class="module-grid">
          <a class="module-card module-card--solar reveal" href="#/solar-system">
            <div class="module-card__head">
              <span class="module-index">01 / NAVIGATE</span>
              <span class="module-arrow">${icon('arrowRight', 18)}</span>
            </div>
            <div class="module-visual module-visual--orbit" aria-hidden="true">
              <span class="module-sun"></span>
              <span class="module-orbit module-orbit--one"><i></i></span>
              <span class="module-orbit module-orbit--two"><i></i></span>
              <span class="module-orbit module-orbit--three"><i></i></span>
            </div>
            <h3>Solar System</h3>
            <p>Eight worlds, one star. Inspect orbital data, surface science and the forces shaping our neighborhood.</p>
            <span class="module-card__footer">Open interactive map ${icon('chevronRight', 14)}</span>
          </a>

          <a class="module-card module-card--mission reveal" href="#/mission-control">
            <div class="module-card__head">
              <span class="module-index">02 / OPERATE</span>
              <span class="module-arrow">${icon('arrowRight', 18)}</span>
            </div>
            <div class="module-visual module-visual--signal" aria-hidden="true">
              <span class="signal-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
              <span class="signal-crosshair"></span>
            </div>
            <h3>Mission Control</h3>
            <p>Build a flight profile, match a spacecraft to the destination and simulate the launch decision.</p>
            <div class="module-stats">
              <span><strong>${stats.successful}</strong> successful</span>
              <span><strong>${stats.totalMissions}</strong> logged</span>
            </div>
            <span class="module-card__footer">Plan a mission ${icon('chevronRight', 14)}</span>
          </a>

          <a class="module-card module-card--quiz reveal" href="#/quiz">
            <div class="module-card__head">
              <span class="module-index">03 / LEARN</span>
              <span class="module-arrow">${icon('arrowRight', 18)}</span>
            </div>
            <div class="module-visual module-visual--score" aria-hidden="true">
              <span class="score-ring" style="--score:${stats.quizBest || 0}"><b>${quizDisplay}</b></span>
              <span class="score-orbit"></span>
            </div>
            <h3>Flight Academy</h3>
            <p>Thirty mission-grade questions across three difficulty levels. Test your knowledge, then review every answer.</p>
            <span class="module-card__footer">Begin knowledge check ${icon('chevronRight', 14)}</span>
          </a>
        </div>
      </section>

      <section class="home-progress reveal">
        <div class="home-progress__copy">
          <p class="eyebrow">PERSONAL FLIGHT RECORD</p>
          <h2>Your mission, <span class="text-dim">at a glance.</span></h2>
          <p>Every planet you inspect and every mission you complete is recorded locally on this device.</p>
          <a class="text-link" href="#/dashboard">Open mission dashboard ${icon('arrowRight', 15)}</a>
        </div>
        <div class="home-progress__panel">
          <div class="progress-dial" style="--progress:${stats.programProgress}">
            <div class="progress-dial__inner">
              <strong>${stats.programProgress}<small>%</small></strong>
              <span>PROGRAM</span>
            </div>
          </div>
          <div class="progress-breakdown">
            <div><span>Worlds explored</span><strong>${stats.planetsDiscovered} / 8</strong></div>
            <div><span>Missions successful</span><strong>${stats.successful}</strong></div>
            <div><span>Knowledge best</span><strong>${quizDisplay}</strong></div>
          </div>
        </div>
      </section>

      ${pageFooter()}
    </div>
  `;

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
      });
    },
    { threshold: 0.12 },
  );
  root.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

  const sceneContainer = root.querySelector('#hero-scene');
  let scene = null;
  let alive = true;

  if (supportsWebGL() && sceneContainer) {
    scene = new HomeScene(sceneContainer);
    scene
      .init()
      .then(() => {
        if (!alive) return;
        sceneContainer.querySelector('.scene-loading')?.remove();
        sceneContainer.classList.add('is-ready');
      })
      .catch((error) => {
        console.error('[ORBIT X] Hero scene failed to start.', error);
        if (!alive) return;
        sceneContainer.innerHTML = fallbackMarkup;
      });
  } else if (sceneContainer) {
    sceneContainer.innerHTML = fallbackMarkup;
  }

  return () => {
    alive = false;
    revealObserver.disconnect();
    scene?.dispose();
  };
}
