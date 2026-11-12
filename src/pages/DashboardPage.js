import Chart from 'chart.js/auto';
import { PLANETS } from '../data/planets.js';
import { MISSION_BY_ID } from '../data/missions.js';
import { DESTINATION_BY_ID } from '../data/destinations.js';
import { QUIZ_DIFFICULTIES } from '../data/quiz.js';
import { pageFooter } from '../components/Footer.js';
import { icon } from '../components/icons.js';
import { store, deriveStats } from '../systems/store.js';
import { formatDateTime } from '../utils/format.js';

const difficultyMeta = Object.fromEntries(QUIZ_DIFFICULTIES.map((item) => [item.id, item]));

const missionOutcomeLabel = (record) => (record.status === 'success' ? 'SUCCESS' : 'FAILED');

const historyRows = (missions) =>
  missions
    .map((record) => {
      const mission = MISSION_BY_ID[record.missionId];
      const destination = DESTINATION_BY_ID[record.destinationId];
      const success = record.status === 'success';
      return `
        <div class="history-row ${success ? 'is-success' : 'is-failure'}">
          <span class="history-row__status">${icon(success ? 'check' : 'x', 14)}</span>
          <div class="history-row__main">
            <strong>${mission?.title ?? record.missionTitle ?? 'Mission record'}</strong>
            <span>${mission?.code ?? 'OX'} · ${record.craftName ?? 'Spacecraft'} · ${destination?.name ?? 'Unknown target'}</span>
          </div>
          <div class="history-row__meta">
            <span class="history-outcome">${missionOutcomeLabel(record)}</span>
            <span>${record.chance != null ? `${record.chance}% readiness` : '—'}</span>
            <time>${formatDateTime(record.timestamp)}</time>
          </div>
        </div>
      `;
    })
    .join('');

const historyEmpty = () => `
  <div class="dashboard-empty">
    <span class="dashboard-empty__icon">${icon('mission', 22)}</span>
    <div>
      <strong>No missions flown yet.</strong>
      <p>Plan a simulated flight in Mission Control and its outcome will appear here.</p>
    </div>
    <a class="button button--primary button--sm" href="#/mission-control">Plan a mission ${icon('arrowRight', 14)}</a>
  </div>
`;

const quizRows = (history) =>
  history
    .slice(0, 5)
    .map((attempt) => {
      const meta = difficultyMeta[attempt.difficulty];
      return `
        <div class="quiz-history-row">
          <span class="quiz-history-row__badge" style="--quiz-accent:${meta?.accent ?? '#5fe7ff'}">${meta?.label ?? attempt.difficulty}</span>
          <span class="quiz-history-row__score">${attempt.score} / ${attempt.total}</span>
          <span class="quiz-history-row__percent">${attempt.percent}%</span>
          <time>${formatDateTime(attempt.timestamp)}</time>
        </div>
      `;
    })
    .join('');

const quizEmpty = () => `
  <div class="dashboard-empty">
    <span class="dashboard-empty__icon">${icon('quiz', 22)}</span>
    <div>
      <strong>No knowledge checks completed.</strong>
      <p>Run a Flight Academy round to add a score to your record.</p>
    </div>
    <a class="button button--primary button--sm" href="#/quiz">Start a quiz ${icon('arrowRight', 14)}</a>
  </div>
`;

export async function mount(root, ctx) {
  let charts = [];
  let filter = 'all';
  let selectedSnapshot = null;

  const destroyCharts = () => {
    charts.forEach((chart) => chart.destroy());
    charts = [];
  };

  const renderHistory = (snapshot) => {
    const body = root.querySelector('[data-history-body]');
    const count = root.querySelector('[data-history-count]');
    if (!body) return;
    const missions = snapshot.missions;
    const filtered = filter === 'all' ? missions : missions.filter((record) => (filter === 'success' ? record.status === 'success' : record.status !== 'success'));
    if (count) count.textContent = `${String(filtered.length).padStart(2, '0')} RECORDS`;
    if (filtered.length) {
      body.innerHTML = `<div class="history-list">${historyRows(filtered)}</div>`;
    } else if (missions.length) {
      body.innerHTML = `
        <div class="dashboard-empty">
          <span class="dashboard-empty__icon">${icon(filter === 'success' ? 'alert' : 'check', 22)}</span>
          <div>
            <strong>No ${filter === 'success' ? 'successful' : 'failed'} flights yet.</strong>
            <p>${filter === 'success' ? 'Every recorded flight has so far ended in failure. Adjust a flight profile and try again.' : 'No failed attempts have been recorded. Your flight record is clean.'}</p>
          </div>
          <button class="button button--ghost button--sm" type="button" data-show-all>Show all records</button>
        </div>
      `;
      body.querySelector('[data-show-all]')?.addEventListener('click', () => {
        filter = 'all';
        renderHistory(selectedSnapshot);
      });
    } else {
      body.innerHTML = historyEmpty();
    }
    root.querySelectorAll('[data-filter]').forEach((button) => {
      const active = button.dataset.filter === filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  };

  const buildCharts = (snapshot, stats) => {
    const outcomeCanvas = root.querySelector('#chart-outcomes');
    if (outcomeCanvas && snapshot.missions.length) {
      charts.push(
        new Chart(outcomeCanvas, {
          type: 'doughnut',
          data: {
            labels: ['Successful', 'Failed'],
            datasets: [
              {
                data: [stats.successful, stats.failed],
                backgroundColor: ['#64f2d0', '#ff8792'],
                borderColor: 'rgba(7, 13, 24, 0.9)',
                borderWidth: 3,
                hoverOffset: 8,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: '#aab8d2',
                  usePointStyle: true,
                  pointStyle: 'circle',
                  boxWidth: 7,
                  padding: 18,
                  font: { family: 'JetBrains Mono, monospace', size: 10 },
                },
              },
              tooltip: {
                backgroundColor: 'rgba(8, 15, 28, 0.96)',
                borderColor: 'rgba(120, 180, 255, 0.22)',
                borderWidth: 1,
                titleColor: '#eef4ff',
                bodyColor: '#a9b9d4',
                padding: 12,
                callbacks: {
                  label: (item) => ` ${item.label}: ${item.parsed} flight${item.parsed === 1 ? '' : 's'}`,
                },
              },
            },
          },
        }),
      );
    }

    const quizCanvas = root.querySelector('#chart-quiz');
    if (quizCanvas && snapshot.quiz.history.length) {
      const attempts = snapshot.quiz.history.slice(0, 12).reverse();
      const context = quizCanvas.getContext('2d');
      const gradient = context.createLinearGradient(0, 0, 0, 240);
      gradient.addColorStop(0, 'rgba(95, 231, 255, 0.26)');
      gradient.addColorStop(1, 'rgba(95, 231, 255, 0)');
      charts.push(
        new Chart(quizCanvas, {
          type: 'line',
          data: {
            labels: attempts.map((attempt, index) => `R${index + 1}`),
            datasets: [
              {
                label: 'Score',
                data: attempts.map((attempt) => attempt.percent),
                borderColor: '#5fe7ff',
                backgroundColor: gradient,
                fill: true,
                tension: 0.34,
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: attempts.map((attempt) => difficultyMeta[attempt.difficulty]?.accent ?? '#5fe7ff'),
                pointBorderColor: '#08101f',
                pointBorderWidth: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(8, 15, 28, 0.96)',
                borderColor: 'rgba(120, 180, 255, 0.22)',
                borderWidth: 1,
                titleColor: '#eef4ff',
                bodyColor: '#a9b9d4',
                padding: 12,
                callbacks: {
                  title: (items) => {
                    const attempt = attempts[items[0]?.dataIndex ?? 0];
                    return attempt ? `${difficultyMeta[attempt.difficulty]?.label ?? attempt.difficulty} round` : 'Round';
                  },
                  label: (item) => {
                    const attempt = attempts[item.dataIndex];
                    return attempt ? `${attempt.score}/${attempt.total} correct · ${attempt.percent}%` : '';
                  },
                },
              },
            },
            scales: {
              x: {
                grid: { color: 'rgba(130, 160, 210, 0.07)' },
                ticks: { color: '#7887a3', font: { family: 'JetBrains Mono, monospace', size: 9 } },
                border: { color: 'rgba(130, 160, 210, 0.12)' },
              },
              y: {
                min: 0,
                max: 100,
                grid: { color: 'rgba(130, 160, 210, 0.07)' },
                ticks: {
                  color: '#7887a3',
                  stepSize: 25,
                  font: { family: 'JetBrains Mono, monospace', size: 9 },
                  callback: (value) => `${value}%`,
                },
                border: { color: 'rgba(130, 160, 210, 0.12)' },
              },
            },
          },
        }),
      );
    }
  };

  const bindFilters = () => {
    root.querySelectorAll('[data-filter]').forEach((button) => {
      button.addEventListener('click', () => {
        filter = button.dataset.filter;
        renderHistory(selectedSnapshot);
      });
    });
  };

  const bindReset = () => {
    root.querySelector('[data-reset-progress]')?.addEventListener('click', async () => {
      const confirmed = await ctx.confirm({
        eyebrow: 'RESET FLIGHT RECORD',
        title: 'Erase all local progress?',
        message:
          'Mission history, discovered planets, launch records and quiz scores will be permanently cleared from this browser. This cannot be undone.',
        confirmLabel: 'Erase progress',
        cancelLabel: 'Keep my record',
        danger: true,
      });
      if (!confirmed) return;
      store.resetProgress();
      filter = 'all';
      render();
      ctx.toast('Local flight record erased. A new mission archive has been initialized.', { type: 'info', title: 'Progress reset' });
    });
  };

  const render = () => {
    destroyCharts();
    const snapshot = store.getState();
    selectedSnapshot = snapshot;
    const stats = deriveStats(snapshot);
    const launches = snapshot.launches;
    const quizAttempts = snapshot.quiz.history;
    const updated = formatDateTime(snapshot.updatedAt);
    const bestAttempt = snapshot.quiz.bestPercent;

    root.innerHTML = `
      <div class="page-shell dashboard-page">
        <header class="page-topbar">
          <div class="breadcrumb">
            <a href="#/">ORBIT X</a><span>/</span><span>PERSONAL FLIGHT RECORD</span>
            <span class="archive-tag">${icon('archive', 12)} LOCAL ARCHIVE</span>
          </div>
          <div class="dashboard-topstats">
            <span>UPDATED <b>${updated}</b></span>
            <button class="text-link text-link--danger" type="button" data-reset-progress>${icon('trash', 13)} Reset progress</button>
          </div>
        </header>

        <main class="dashboard-main">
          <section class="dashboard-hero">
            <div>
              <p class="eyebrow">MISSION ARCHIVE / MISSION CONTROL</p>
              <h1>Mission Dashboard</h1>
              <p class="page-lede">Every value on this page is read from this browser's local flight record. Fly missions, explore worlds and complete knowledge checks to change it.</p>
              <div class="button-row">
                <a class="button button--primary" href="#/mission-control">${icon('mission', 16)} Plan a mission</a>
                <a class="button button--ghost" href="#/solar-system">Explore the solar system ${icon('arrowRight', 15)}</a>
              </div>
            </div>
            <div class="dashboard-dial-wrap">
              <div class="progress-dial dashboard-dial" style="--progress:${stats.programProgress}">
                <div class="progress-dial__inner">
                  <strong>${stats.programProgress}<small>%</small></strong>
                  <span>PROGRAM</span>
                </div>
              </div>
              <div class="dashboard-dial-copy">
                <span>PROGRAM PROGRESS</span>
                <strong>${stats.objectivesComplete} / 5 missions</strong>
                <p>${stats.planetsDiscovered} of 8 worlds · ${stats.quizAttempts ? '1 of 1 quiz completed' : 'quiz pending'}</p>
              </div>
            </div>
          </section>

          <section class="dashboard-stats" aria-label="Program statistics">
            <article class="stat-card">
              <span class="stat-card__icon">${icon('mission', 18)}</span>
              <span class="stat-card__label">MISSIONS FLOWN</span>
              <strong>${String(stats.totalMissions).padStart(2, '0')}</strong>
              <span class="stat-card__sub">${stats.successful} successful · ${stats.failed} failed</span>
            </article>
            <article class="stat-card">
              <span class="stat-card__icon">${icon('check', 18)}</span>
              <span class="stat-card__label">SUCCESS RATE</span>
              <strong>${stats.totalMissions ? `${stats.attemptRate}%` : '—'}</strong>
              <span class="stat-card__sub">${stats.totalMissions ? `${stats.successful} of ${stats.totalMissions} flights` : 'No flights logged yet'}</span>
            </article>
            <article class="stat-card">
              <span class="stat-card__icon">${icon('planets', 18)}</span>
              <span class="stat-card__label">WORLDS DISCOVERED</span>
              <strong>${String(stats.planetsDiscovered).padStart(2, '0')}<small>/08</small></strong>
              <span class="stat-card__sub">${stats.planetsDiscovered ? `${Math.round((stats.planetsDiscovered / 8) * 100)}% of the planetary archive` : 'Visit a planet file to begin'}</span>
            </article>
            <article class="stat-card">
              <span class="stat-card__icon">${icon('quiz', 18)}</span>
              <span class="stat-card__label">KNOWLEDGE BEST</span>
              <strong>${snapshot.quiz.attempts ? `${bestAttempt}%` : '—'}</strong>
              <span class="stat-card__sub">${stats.quizAttempts} round${stats.quizAttempts === 1 ? '' : 's'} completed</span>
            </article>
          </section>

          <section class="dashboard-charts" aria-label="Performance charts">
            <article class="dashboard-panel chart-card">
              <div class="panel-head">
                <span class="eyebrow">MISSION OUTCOMES</span>
                <span class="panel-head__count">${stats.totalMissions} TOTAL</span>
              </div>
              ${
                snapshot.missions.length
                  ? `<div class="chart-donut-wrap">
                       <canvas id="chart-outcomes" role="img" aria-label="Doughnut chart of successful and failed mission outcomes"></canvas>
                       <div class="chart-center"><strong>${stats.successful}</strong><span>SUCCESSFUL</span></div>
                     </div>
                     <p class="chart-caption">Outcome split across ${snapshot.missions.length} simulated flight${snapshot.missions.length === 1 ? '' : 's'}.</p>`
                  : `<div class="chart-empty"><span>${icon('signal', 22)}</span><p>Charts appear after your first simulated flight.</p><a class="text-link" href="#/mission-control">Plan a mission ${icon('arrowRight', 13)}</a></div>`
              }
            </article>

            <article class="dashboard-panel chart-card">
              <div class="panel-head">
                <span class="eyebrow">QUIZ PERFORMANCE</span>
                <span class="panel-head__count">${quizAttempts.length ? `LAST ${Math.min(12, quizAttempts.length)}` : 'NO DATA'}</span>
              </div>
              ${
                quizAttempts.length
                  ? `<div class="chart-line-wrap"><canvas id="chart-quiz" role="img" aria-label="Line chart of recent quiz scores"></canvas></div>
                     <p class="chart-caption">Score percentage per completed round across all difficulty levels.</p>`
                  : `<div class="chart-empty"><span>${icon('quiz', 22)}</span><p>No knowledge checks recorded yet.</p><a class="text-link" href="#/quiz">Start a flight academy round ${icon('arrowRight', 13)}</a></div>`
              }
            </article>
          </section>

          <section class="dashboard-lower">
            <article class="dashboard-panel history-panel">
              <div class="panel-head">
                <div>
                  <span class="eyebrow">FLIGHT HISTORY</span>
                  <h2>Mission records</h2>
                </div>
                <span class="panel-head__count" data-history-count>${String(snapshot.missions.length).padStart(2, '0')} RECORDS</span>
              </div>
              <div class="history-filters" role="group" aria-label="Filter mission history">
                <button type="button" data-filter="all" class="filter-button is-active" aria-pressed="true">All <b>${snapshot.missions.length}</b></button>
                <button type="button" data-filter="success" class="filter-button" aria-pressed="false">Successful <b>${stats.successful}</b></button>
                <button type="button" data-filter="failure" class="filter-button" aria-pressed="false">Failed <b>${stats.failed}</b></button>
              </div>
              <div data-history-body></div>
            </article>

            <div class="dashboard-side">
              <article class="dashboard-panel">
                <div class="panel-head">
                  <span class="eyebrow">PLANETARY ARCHIVE</span>
                  <span class="panel-head__count">${stats.planetsDiscovered}/08</span>
                </div>
                <div class="archive-grid">
                  ${PLANETS.map((planet) => {
                    const found = snapshot.planets.includes(planet.id);
                    return `
                      <a class="archive-tile ${found ? 'is-found' : ''}" href="#/planet/${planet.id}" style="--planet-accent:${planet.accent}">
                        <span class="archive-tile__symbol">${planet.symbol}</span>
                        <span class="archive-tile__name">${planet.name}</span>
                        <span class="archive-tile__state">${found ? `${icon('check', 10)} LOGGED` : `${icon('lock', 10)} UNSEEN`}</span>
                      </a>
                    `;
                  }).join('')}
                </div>
              </article>

              <article class="dashboard-panel">
                <div class="panel-head">
                  <span class="eyebrow">LAUNCH RECORD</span>
                  <span class="panel-head__count">${launches.total} TOTAL</span>
                </div>
                <div class="launch-record">
                  <div><span>SURFACE LAUNCHES</span><strong>${String(launches.total).padStart(2, '0')}</strong></div>
                  <div><span>SUCCESSFUL</span><strong>${String(launches.successful).padStart(2, '0')}</strong></div>
                  <div><span>LAST APOGEE</span><strong>${launches.last ? `${launches.last.apogeeKm} km` : '—'}</strong></div>
                  <div><span>LAST ATTEMPT</span><strong>${launches.last ? formatDateTime(launches.last.timestamp) : '—'}</strong></div>
                </div>
                <a class="text-link" href="#/launch">Open launch complex ${icon('arrowRight', 13)}</a>
              </article>

              <article class="dashboard-panel">
                <div class="panel-head">
                  <span class="eyebrow">RECENT QUIZ ATTEMPTS</span>
                  <span class="panel-head__count">${quizAttempts.length ? `LAST ${Math.min(5, quizAttempts.length)}` : 'NONE'}</span>
                </div>
                ${quizAttempts.length ? `<div class="quiz-history">${quizRows(quizAttempts)}</div>` : quizEmpty()}
                <a class="text-link" href="#/quiz">Open flight academy ${icon('arrowRight', 13)}</a>
              </article>
            </div>
          </section>
        </main>

        ${pageFooter()}
      </div>
    `;

    buildCharts(snapshot, stats);
    renderHistory(snapshot);
    bindFilters();
    bindReset();
  };

  render();

  return () => {
    destroyCharts();
  };
}
