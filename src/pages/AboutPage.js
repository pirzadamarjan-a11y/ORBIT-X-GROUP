import { pageFooter } from '../components/Footer.js';
import { icon } from '../components/icons.js';
import { ORBITX_STORAGE_KEY } from '../systems/store.js';

const SOURCES = [
  {
    title: 'NASA Solar System Exploration',
    description: 'Planetary overviews, mission context and comparative world data.',
    href: 'https://science.nasa.gov/solar-system/',
    tag: 'PLANETARY SCIENCE',
  },
  {
    title: 'NASA Planetary Fact Sheet',
    description: 'Reference values for diameter, mass, distance, temperature, rotation and moons.',
    href: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/',
    tag: 'REFERENCE DATA',
  },
  {
    title: 'NASA Mars Exploration Program',
    description: 'Mars mission history, surface science and sample-return planning.',
    href: 'https://science.nasa.gov/mars/',
    tag: 'MARS',
  },
  {
    title: 'NASA James Webb Space Telescope',
    description: 'Infrared astronomy, exoplanet atmospheres and deep-field observation.',
    href: 'https://science.nasa.gov/mission/webb/',
    tag: 'OBSERVATION',
  },
  {
    title: 'NASA Voyager Mission',
    description: 'Interstellar space, heliosphere science and long-duration operations.',
    href: 'https://science.nasa.gov/mission/voyager/',
    tag: 'DEEP SPACE',
  },
  {
    title: 'NASA Europa Clipper',
    description: "Europa's ocean, ice shell and the search for habitable environments.",
    href: 'https://science.nasa.gov/mission/europa-clipper/',
    tag: 'OCEAN WORLDS',
  },
  {
    title: 'Solar System Scope Textures',
    description: 'Open planetary texture maps used for the interactive 3D worlds.',
    href: 'https://www.solarsystemscope.com/textures/',
    tag: 'CC BY 4.0',
  },
  {
    title: 'Three.js',
    description: 'Open-source 3D rendering library powering every interactive scene.',
    href: 'https://threejs.org/',
    tag: 'RENDERING',
  },
];

export async function mount(root) {
  root.innerHTML = `
    <div class="page-shell about-page">
      <header class="page-topbar">
        <div class="breadcrumb">
          <a href="#/">ORBIT X</a><span>/</span><span>REFERENCE</span>
          <span class="archive-tag">${icon('info', 12)} ABOUT &amp; SOURCES</span>
        </div>
        <div class="control-topstats">
          <span>VERSION <b>1.0</b></span>
          <a class="text-link" href="#/dashboard">Flight record ${icon('arrowRight', 13)}</a>
        </div>
      </header>

      <main class="about-main">
        <section class="about-hero">
          <div>
            <p class="eyebrow">ABOUT THE PLATFORM</p>
            <h1>Built to make the solar system explorable.</h1>
            <p class="page-lede">ORBIT X is an independent, browser-based educational simulation. It combines NASA-sourced planetary facts with a fictional flight program so that learning about space also feels like operating a mission.</p>
          </div>
          <div class="about-mark" aria-hidden="true">
            <span class="about-mark__orbit"></span>
            <span class="about-mark__orbit about-mark__orbit--b"></span>
            <span class="about-mark__core"></span>
            <span class="about-mark__label">ORBIT X / DEEP SPACE PROGRAM</span>
          </div>
        </section>

        <section class="about-disclaimer">
          <span class="about-disclaimer__icon">${icon('alert', 22)}</span>
          <div>
            <h2>Educational project. Not an official space agency interface.</h2>
            <p>ORBIT X is not affiliated with NASA, ESA, SpaceX or any space agency. It shows no live telemetry and commands no real hardware. Planet facts are sourced from public NASA references; spacecraft, mission outcomes, readiness estimates, fuel levels and launch sequences are fictional and generated inside this application.</p>
          </div>
        </section>

        <section class="about-split">
          <article class="about-card about-card--fact">
            <div class="about-card__head">
              <span class="about-card__icon">${icon('globe', 20)}</span>
              <div>
                <p class="eyebrow">GROUNDED IN REFERENCE DATA</p>
                <h2>What is factual</h2>
              </div>
            </div>
            <ul class="about-list">
              <li>${icon('check', 14)} Planet diameters, distances, temperatures, rotation periods, orbital periods, gravity and confirmed moon counts are drawn from NASA public fact sheets.</li>
              <li>${icon('check', 14)} Atmosphere compositions, ring status and selected mission dates follow NASA planetary and mission summaries.</li>
              <li>${icon('check', 14)} Quiz questions and explanations use established astronomy and mission science, with sources listed on this page.</li>
              <li>${icon('check', 14)} Distances and physical units are stated explicitly in kilometres, astronomical units, degrees Celsius and Earth days or years.</li>
            </ul>
          </article>

          <article class="about-card about-card--sim">
            <div class="about-card__head">
              <span class="about-card__icon">${icon('spark', 20)}</span>
              <div>
                <p class="eyebrow">FICTIONAL FLIGHT PROGRAM</p>
                <h2>What is simulated</h2>
              </div>
            </div>
            <ul class="about-list">
              <li>${icon('alert', 14)} Spacecraft names, ranges, propulsion systems and mission profiles are fictional vehicles created for this project. They are not real flight hardware.</li>
              <li>${icon('alert', 14)} Mission readiness percentages and success or failure outcomes are probabilistic gameplay values. They are not engineering predictions.</li>
              <li>${icon('alert', 14)} Simulator velocity, fuel, power, distance remaining and arrival states are illustrative calculations, clearly labelled as simulated.</li>
              <li>${icon('alert', 14)} The launch animation, countdown, altitude and velocity telemetry are cinematic and deterministic. No vehicle is launched and no propellant is modeled.</li>
            </ul>
          </article>
        </section>

        <section class="about-scale">
          <div class="block-heading">
            <p class="eyebrow">VISUALIZATION NOTES</p>
            <h2>Beautiful, but not to scale.</h2>
          </div>
          <div class="about-scale__grid">
            <div>
              <h3>Orbital distances are compressed.</h3>
              <p>The solar system view packs planetary orbits into a navigable space. Real orbital radii span from 0.39 AU at Mercury to 30 AU at Neptune. If drawn to scale, the inner planets would be invisible at useful screen sizes.</p>
            </div>
            <div>
              <h3>Planet sizes are exaggerated.</h3>
              <p>Planet radii and moon sizes are enlarged relative to orbital distance so surfaces are legible. Comparative sizes between planets are approximate rather than a strict scale model.</p>
            </div>
            <div>
              <h3>Textures are illustrative.</h3>
              <p>Surface maps are open-licensed texture imagery, often enhanced for visibility. Cloud layers, atmospheres, glows and rings are artistic interpretations, not calibrated scientific imagery.</p>
            </div>
            <div>
              <h3>Time is accelerated.</h3>
              <p>Orbital motion runs faster than reality so that revolution and rotation are visible. The solar system page labels the display as an accelerated educational simulation.</p>
            </div>
          </div>
        </section>

        <section class="about-sources">
          <div class="block-heading block-heading--row">
            <div>
              <p class="eyebrow">SCIENTIFIC SOURCES</p>
              <h2>Where the facts come from.</h2>
            </div>
            <span class="block-count">${String(SOURCES.length).padStart(2, '0')} SOURCES</span>
          </div>
          <div class="source-grid">
            ${SOURCES.map(
              (source) => `
                <a class="source-card" href="${source.href}" target="_blank" rel="noopener noreferrer">
                  <span class="source-card__tag">${source.tag}</span>
                  <strong>${source.title}</strong>
                  <p>${source.description}</p>
                  <span class="source-card__link">${icon('external', 13)} Visit source</span>
                </a>
              `,
            ).join('')}
          </div>
          <p class="data-note">Moon counts and mission timelines can change as new discoveries are confirmed. Values in ORBIT X reflect published public references available at the time of writing and are intended for education, not navigation or engineering.</p>
        </section>

        <section class="about-progress">
          <div>
            <p class="eyebrow">LOCAL BY DESIGN</p>
            <h2>Your flight record stays on this device.</h2>
            <p>ORBIT X does not require an account and sends no mission data to a server. Mission outcomes, discovered planets, quiz attempts and launch records are stored in your browser's localStorage under <code>${ORBITX_STORAGE_KEY}</code>.</p>
            <p>Clearing browser data or selecting <strong>Reset progress</strong> on the dashboard erases the archive permanently. No analytics or tracking scripts are included.</p>
            <div class="button-row">
              <a class="button button--primary" href="#/dashboard">Open flight record ${icon('arrowRight', 15)}</a>
              <a class="button button--ghost" href="#/quiz">Test your knowledge</a>
            </div>
          </div>
          <div class="about-progress__panel">
            <div class="about-progress__row"><span>Storage</span><strong>Browser localStorage</strong></div>
            <div class="about-progress__row"><span>Account required</span><strong>None</strong></div>
            <div class="about-progress__row"><span>Network telemetry</span><strong>None</strong></div>
            <div class="about-progress__row"><span>WebGL fallback</span><strong>2D data modes</strong></div>
            <div class="about-progress__row"><span>Audio</span><strong>Off until enabled</strong></div>
            <div class="about-progress__row"><span>Progress key</span><strong><code>${ORBITX_STORAGE_KEY}</code></strong></div>
          </div>
        </section>

        <section class="about-credits">
          <div class="block-heading">
            <p class="eyebrow">CREDITS &amp; LICENSING</p>
            <h2>Standing on open work.</h2>
          </div>
          <div class="credit-list">
            <div><strong>Planetary texture maps</strong><span>Solar System Scope, licensed CC BY 4.0. Earth cloud and night-light maps also draw on Three.js example assets.</span></div>
            <div><strong>3D rendering</strong><span>Three.js, MIT License. OrbitControls and CSS2DRenderer from the Three.js examples.</span></div>
            <div><strong>Charts</strong><span>Chart.js, MIT License.</span></div>
            <div><strong>Typography</strong><span>Space Grotesk, Inter and JetBrains Mono via Fontsource, under the SIL Open Font License.</span></div>
            <div><strong>Scientific reference</strong><span>NASA public fact sheets and mission pages, linked above. NASA content is used for factual reference; this project does not imply endorsement.</span></div>
          </div>
          <p class="about-closing">Built as an independent educational experience. Explore carefully, question the data, and remember that the real solar system is stranger and more wonderful than any simulation.</p>
        </section>
      </main>

      ${pageFooter()}
    </div>
  `;
  return () => {};
}
