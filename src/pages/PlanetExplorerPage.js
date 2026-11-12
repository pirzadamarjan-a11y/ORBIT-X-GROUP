import { PLANETS, PLANET_BY_ID, NASA_FACT_SHEET_URL } from '../data/planets.js';
import { pageFooter } from '../components/Footer.js';
import { icon } from '../components/icons.js';
import { PlanetPreviewScene } from '../scenes/PlanetPreviewScene.js';
import { store } from '../systems/store.js';
import { supportsWebGL } from '../utils/webgl.js';

const planetFallback = (planet) => `
  <div class="planet-fallback" role="img" aria-label="${planet.name} visualization fallback">
    <div class="planet-fallback__stars" aria-hidden="true"></div>
    <div class="planet-fallback__sphere" style="--planet-gradient:${planet.gradient};--planet-accent:${planet.accent}">
      ${planet.id === 'saturn' ? '<span class="planet-fallback__ring"></span>' : ''}
    </div>
    <div class="planet-fallback__note">
      <p class="eyebrow">2D VISUALIZATION</p>
      <p>WebGL is unavailable. Planet data remains fully accessible.</p>
    </div>
  </div>
`;

const compositionHTML = (planet) =>
  planet.atmosphere.composition
    .map(
      (item) => `
        <div class="gas-row">
          <div class="gas-row__head"><span>${item.name}</span><strong>${item.value}%</strong></div>
          <div class="gas-track"><span style="width:${Math.min(100, item.value)}%;--gas-color:${planet.accent}"></span></div>
        </div>
      `,
    )
    .join('');

export async function mount(root, ctx) {
  const requestedId = ctx.params?.planetId;
  if (!requestedId) {
    ctx.navigate('/planet/earth', { replace: true });
    return () => {};
  }
  const planet = PLANET_BY_ID[requestedId];
  if (!planet) {
    ctx.navigate('/planet/earth', { replace: true });
    return () => {};
  }

  document.title = `${planet.name} — Planet Explorer — ORBIT X`;
  const currentIndex = PLANETS.findIndex((item) => item.id === planet.id);
  const prev = PLANETS[(currentIndex - 1 + PLANETS.length) % PLANETS.length];
  const next = PLANETS[(currentIndex + 1) % PLANETS.length];
  const wasDiscovered = store.getState().planets.includes(planet.id);
  store.discoverPlanet(planet.id);
  if (!wasDiscovered) {
    ctx.toast(`${planet.name} logged in your exploration archive.`, { type: 'success' });
  }

  const statRows = planet.stats
    .map(
      (stat) => `
        <div class="data-row">
          <span>${stat.label}</span>
          <strong>${stat.value}</strong>
        </div>
      `,
    )
    .join('');

  const facts = planet.facts
    .map(
      (fact) => `
        <article class="science-fact">
          <span class="science-fact__index"></span>
          <h3>${fact.title}</h3>
          <p>${fact.text}</p>
        </article>
      `,
    )
    .join('');

  const discoveries = planet.discoveries
    .map(
      (item, index) => `
        <div class="discovery-item">
          <span class="discovery-item__index">${String(index + 1).padStart(2, '0')}</span>
          <div>
            <h3>${item.title}</h3>
            <p>${item.text}</p>
          </div>
        </div>
      `,
    )
    .join('');

  const exploration = planet.exploration
    .map(
      (item) => `
        <li class="timeline-item">
          <span class="timeline-item__year">${item.year}</span>
          <div>
            <h3>${item.name}</h3>
            <p>${item.text}</p>
          </div>
        </li>
      `,
    )
    .join('');

  const notableMoons = planet.moons.notable.length
    ? planet.moons.notable
        .map(
          (moon) => `
            <div class="moon-item">
              <span class="moon-dot"></span>
              <span><strong>${moon.name}</strong><small>${moon.note}</small></span>
            </div>
          `,
        )
        .join('')
    : `<p class="muted-copy">No natural satellites are known.</p>`;

  root.innerHTML = `
    <div class="page-shell explorer-page">
      <header class="page-topbar">
        <div class="breadcrumb">
          <a href="#/planets">EXPLORATION ARCHIVE</a>
          <span>/</span>
          <span>PLANET FILE</span>
          <span class="archive-tag">${icon('check', 12)} ARCHIVED</span>
        </div>
        <div class="explorer-pager">
          <a class="pager-button" href="#/planet/${prev.id}" aria-label="Previous planet: ${prev.name}">${icon('chevronLeft', 16)}<span>${prev.name}</span></a>
          <span class="pager-count">${String(planet.index).padStart(2, '0')} <i>/</i> 08</span>
          <a class="pager-button" href="#/planet/${next.id}" aria-label="Next planet: ${next.name}"><span>${next.name}</span>${icon('chevronRight', 16)}</a>
        </div>
      </header>

      <main>
        <section class="planet-hero-shell" style="--planet-accent:${planet.accent};--planet-accent2:${planet.accent2}">
          <div class="planet-visual-panel">
            <div class="planet-visual-panel__bg" aria-hidden="true"></div>
            <div class="planet-scene" id="planet-scene">
              <div class="scene-loading" id="planet-scene-loader">
                <span class="mini-orbit"><i></i></span>
                <span>GENERATING PLANETARY MODEL</span>
              </div>
            </div>
            <div class="visual-label">
              <span class="status-dot"></span>
              <span>PLANETARY VISUALIZATION</span>
              <span class="visual-label__id">${planet.id.toUpperCase()} / ${planet.index}</span>
            </div>
            <div class="visual-tools requires-webgl">
              <button type="button" class="icon-button" data-zoom-in aria-label="Zoom in">${icon('plus', 16)}</button>
              <button type="button" class="icon-button" data-zoom-out aria-label="Zoom out">${icon('minus', 16)}</button>
            </div>
            <div class="visual-hint requires-webgl">DRAG TO ROTATE <span>·</span> SCROLL TO ZOOM</div>
            <div class="planet-visual-panel__gradient" style="background:${planet.gradient}" aria-hidden="true"></div>
          </div>

          <div class="planet-hero-copy">
            <div class="planet-hero-copy__meta">
              <span>${planet.type.toUpperCase()}</span>
              <span class="meta-divider"></span>
              <span>NASA PLANETARY DATA</span>
            </div>
            <div class="planet-title-row">
              <h1>${planet.name}</h1>
              <span class="planet-symbol" aria-hidden="true">${planet.symbol}</span>
            </div>
            <p class="planet-tagline">${planet.tagline}</p>
            <p class="planet-description">${planet.description}</p>

            <div class="quick-facts">
              <div><span>Gravity</span><strong>${planet.quickStats.gravity}</strong></div>
              <div><span>Mean radius</span><strong>${planet.quickStats.radius}</strong></div>
              <div><span>Solar day</span><strong>${planet.quickStats.solarDay}</strong></div>
              <div><span>Orbital speed</span><strong>${planet.quickStats.orbitalSpeed}</strong></div>
            </div>

            <div class="button-row planet-actions">
              <a class="button button--primary" href="#/solar-system">${icon('orbit', 16)} View in solar system</a>
              <a class="button button--ghost" href="#/planet/${next.id}">Next: ${next.name} ${icon('arrowRight', 15)}</a>
            </div>
          </div>
        </section>

        <section class="planet-dossier">
          <div class="planet-dossier__main">
            <article class="dossier-block">
              <div class="block-heading">
                <p class="eyebrow">SCIENCE BRIEF</p>
                <h2>The ${planet.name} system.</h2>
              </div>
              <p class="large-copy">${planet.overview}</p>
              <div class="science-facts">
                ${facts}
              </div>
            </article>

            <article class="dossier-block surface-block">
              <div class="surface-visual">
                <span class="surface-sphere" style="background:${planet.gradient}"></span>
                <span class="surface-grid" aria-hidden="true"></span>
              </div>
              <div>
                <p class="eyebrow">SURFACE &amp; GEOLOGY</p>
                <h2>${planet.id === 'earth' ? 'A world in motion.' : planet.id === 'jupiter' || planet.id === 'saturn' || planet.id === 'uranus' || planet.id === 'neptune' ? 'Below the clouds.' : 'Reading the terrain.'}</h2>
                <p>${planet.surface}</p>
              </div>
            </article>

            <article class="dossier-block">
              <div class="block-heading block-heading--row">
                <div>
                  <p class="eyebrow">DISCOVERY LOG</p>
                  <h2>What exploration revealed.</h2>
                </div>
                <span class="block-count">${String(planet.discoveries.length).padStart(2, '0')} ENTRIES</span>
              </div>
              <div class="discovery-list">
                ${discoveries}
              </div>
            </article>

            <article class="dossier-block">
              <div class="block-heading block-heading--row">
                <div>
                  <p class="eyebrow">MISSION HISTORY</p>
                  <h2>Past and planned exploration.</h2>
                </div>
              </div>
              <ol class="mission-timeline">
                ${exploration}
              </ol>
            </article>
          </div>

          <aside class="planet-dossier__side" aria-label="Planetary reference data">
            <div class="dossier-panel dossier-panel--data">
              <div class="panel-title"><span>VITAL RECORD</span>${icon('archive', 15)}</div>
              <div class="data-list">${statRows}</div>
              <p class="data-source">Source: <a href="${NASA_FACT_SHEET_URL}" target="_blank" rel="noopener noreferrer">NASA Planetary Fact Sheet ${icon('external', 11)}</a></p>
            </div>

            <div class="dossier-panel">
              <div class="panel-title"><span>ATMOSPHERE</span>${icon('globe', 15)}</div>
              <p class="panel-copy">${planet.atmosphere.summary}</p>
              <div class="gas-list">${compositionHTML(planet)}</div>
              ${planet.atmosphere.pressure ? `<div class="atmosphere-pressure"><span>SURFACE PRESSURE</span><strong>${planet.atmosphere.pressure}</strong></div>` : ''}
              ${planet.atmosphere.note ? `<p class="data-note">${planet.atmosphere.note}</p>` : ''}
            </div>

            <div class="dossier-panel">
              <div class="panel-title"><span>MOONS</span>${icon('orbit', 15)}</div>
              <div class="moon-count">
                <strong>${String(planet.moons.count).padStart(2, '0')}</strong>
                <span>${planet.moons.label}</span>
              </div>
              <p class="panel-copy">${planet.moons.text}</p>
              <div class="moon-list">${notableMoons}</div>
            </div>

            <div class="dossier-panel dossier-panel--rings">
              <div class="panel-title"><span>RING SYSTEM</span>${icon('target', 15)}</div>
              <div class="ring-status ${planet.rings.present ? 'is-present' : ''}">
                <span class="ring-status__icon"></span>
                <strong>${planet.rings.present ? 'DETECTED' : 'NOT DETECTED'}</strong>
              </div>
              <p class="panel-copy">${planet.rings.text}</p>
            </div>
          </aside>
        </section>

        <section class="planet-switcher" aria-labelledby="planet-switcher-title">
          <div class="planet-switcher__head">
            <div>
              <p class="eyebrow">CONTINUE EXPLORING</p>
              <h2 id="planet-switcher-title">Planetary archive</h2>
            </div>
            <span class="planet-switcher__count">${String(PLANETS.length).padStart(2, '0')} WORLDS</span>
          </div>
          <div class="planet-switcher__grid">
            ${PLANETS.map(
              (item) => `
                <a class="planet-switch-card ${item.id === planet.id ? 'is-active' : ''}" href="#/planet/${item.id}" style="--planet-accent:${item.accent}">
                  <span class="planet-switch-card__dot"></span>
                  <span class="planet-switch-card__name">${item.name}</span>
                  <span class="planet-switch-card__index">${String(item.index).padStart(2, '0')}</span>
                  ${
                    store.getState().planets.includes(item.id)
                      ? `<span class="planet-switch-card__check">${icon('check', 12)}</span>`
                      : ''
                  }
                </a>
              `,
            ).join('')}
          </div>
        </section>

        <nav class="planet-page-nav" aria-label="Previous and next planet">
          <a class="planet-page-link" href="#/planet/${prev.id}">
            <span class="planet-page-link__dir">${icon('arrowLeft', 16)} PREVIOUS WORLD</span>
            <strong>${prev.name}</strong>
            <span>${prev.type}</span>
          </a>
          <a class="planet-page-link planet-page-link--next" href="#/planet/${next.id}">
            <span class="planet-page-link__dir">NEXT WORLD ${icon('arrowRight', 16)}</span>
            <strong>${next.name}</strong>
            <span>${next.type}</span>
          </a>
        </nav>
        <p class="explorer-footnote">Scientific values are sourced from NASA public fact sheets. Orbital visualizations and comparative scales are illustrative, not to scale.</p>
      </main>

      ${pageFooter()}
    </div>
  `;

  const sceneContainer = root.querySelector('#planet-scene');
  const loader = root.querySelector('#planet-scene-loader');
  const visualPanel = root.querySelector('.planet-visual-panel');
  let scene = null;
  let alive = true;

  root.querySelector('[data-zoom-in]')?.addEventListener('click', () => scene?.zoomBy(0.82));
  root.querySelector('[data-zoom-out]')?.addEventListener('click', () => scene?.zoomBy(1.22));

  if (supportsWebGL() && sceneContainer) {
    scene = new PlanetPreviewScene(sceneContainer, planet);
    scene
      .init()
      .then(() => {
        if (!alive) return;
        loader?.remove();
        sceneContainer.classList.add('is-ready');
      })
      .catch((error) => {
        console.error('[ORBIT X] Planet preview failed.', error);
        if (!alive) return;
        sceneContainer.innerHTML = planetFallback(planet);
        visualPanel?.classList.add('is-fallback');
      });
  } else if (sceneContainer) {
    sceneContainer.innerHTML = planetFallback(planet);
    visualPanel?.classList.add('is-fallback');
  }

  return () => {
    alive = false;
    scene?.dispose();
  };
}
