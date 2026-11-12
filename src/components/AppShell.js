import { brandMark, icon } from './icons.js';

const NAV_GROUPS = [
  {
    label: 'Explore',
    items: [
      { id: 'home', href: '#/', label: 'Home', icon: 'home' },
      { id: 'solar-system', href: '#/solar-system', label: 'Solar System', icon: 'solar' },
      { id: 'planets', href: '#/planets', label: 'Planet Explorer', icon: 'planets' },
    ],
  },
  {
    label: 'Operate',
    items: [
      { id: 'mission-control', href: '#/mission-control', label: 'Mission Control', icon: 'mission' },
      { id: 'simulator', href: '#/simulator', label: 'Spacecraft', icon: 'simulator' },
      { id: 'launch', href: '#/launch', label: 'Launch Sequence', icon: 'rocket' },
    ],
  },
  {
    label: 'Learn',
    items: [
      { id: 'quiz', href: '#/quiz', label: 'Knowledge Check', icon: 'quiz' },
      { id: 'dashboard', href: '#/dashboard', label: 'Mission Dashboard', icon: 'dashboard' },
      { id: 'about', href: '#/about', label: 'About & Sources', icon: 'about' },
    ],
  },
];

const renderNavGroup = (group) => `
  <div class="nav-group">
    <p class="nav-group__label">${group.label}</p>
    ${group.items
      .map(
        (item) => `
        <a class="nav-link" href="${item.href}" data-nav="${item.id}">
          <span class="nav-link__icon">${icon(item.icon, 18)}</span>
          <span class="nav-link__label">${item.label}</span>
          <span class="nav-link__signal" aria-hidden="true"></span>
        </a>
      `,
      )
      .join('')}
  </div>
`;

export const mountAppShell = (app) => {
  app.innerHTML = `
    <button class="skip-link" type="button" id="skip-link">Skip to main content</button>
    <div class="app-shell">
      <aside class="sidebar" id="sidebar" aria-label="Primary navigation">
        <div class="sidebar__orb" aria-hidden="true"></div>
        <div class="sidebar__inner">
          <a class="brand" href="#/" aria-label="ORBIT X home">
            <span class="brand__glyph">${brandMark(38)}</span>
            <span class="brand__type">
              <span class="brand__name">ORBIT <b>X</b></span>
              <span class="brand__sub">DEEP SPACE NETWORK</span>
            </span>
          </a>

          <nav class="primary-nav">
            ${NAV_GROUPS.map(renderNavGroup).join('')}
          </nav>

          <div class="sidebar__footer">
            <a class="about-link" href="#/about" data-nav="about">
              ${icon('info', 15)}
              <span>About &amp; Sources</span>
            </a>
            <div class="system-status">
              <span class="status-dot" aria-hidden="true"></span>
              <div>
                <span class="system-status__label">SIMULATION ONLINE</span>
                <time class="system-status__clock" id="utc-clock">--:--:-- UTC</time>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <header class="mobile-bar">
        <a class="mobile-brand" href="#/" aria-label="ORBIT X home">
          ${brandMark(28)}
          <span>ORBIT <b>X</b></span>
        </a>
        <div class="mobile-bar__status">
          <span class="status-dot" aria-hidden="true"></span>
          <span>SIM ACTIVE</span>
        </div>
        <button class="menu-button" id="menu-button" type="button" aria-label="Open navigation" aria-controls="sidebar" aria-expanded="false">
          ${icon('menu', 22)}
        </button>
      </header>

      <button class="nav-scrim" id="nav-scrim" type="button" aria-label="Close navigation" tabindex="-1"></button>

      <main class="app-view" id="app-view">
        <div class="route-loader" id="route-loader" role="status" aria-live="polite">
          <div class="route-loader__orbit" aria-hidden="true"><span></span></div>
          <p class="eyebrow">ESTABLISHING UPLINK</p>
          <p class="route-loader__label">Synchronizing orbital data</p>
        </div>
        <div class="page-root" id="page-root"></div>
      </main>
    </div>
    <div class="toast-region" id="toast-region" aria-live="polite"></div>
    <div class="modal-root" id="modal-root"></div>
    <div class="ambient-grid" aria-hidden="true"></div>
  `;

  const sidebar = document.getElementById('sidebar');
  const menuButton = document.getElementById('menu-button');
  const scrim = document.getElementById('nav-scrim');
  const clock = document.getElementById('utc-clock');
  let clockTimer;

  const setMenu = (open) => {
    document.body.classList.toggle('nav-open', open);
    menuButton?.setAttribute('aria-expanded', String(open));
    menuButton?.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    if (menuButton) menuButton.innerHTML = icon(open ? 'close' : 'menu', 22);
  };

  menuButton?.addEventListener('click', () => setMenu(!document.body.classList.contains('nav-open')));
  scrim?.addEventListener('click', () => setMenu(false));
  sidebar?.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('nav-open')) setMenu(false);
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) setMenu(false);
  });

  const updateClock = () => {
    if (!clock) return;
    const now = new Date();
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    clock.textContent = `${hours}:${minutes}:${seconds} UTC`;
  };
  updateClock();
  clearInterval(clockTimer);
  clockTimer = setInterval(updateClock, 1000);

  document.getElementById('skip-link')?.addEventListener('click', () => {
    const page = document.getElementById('page-root');
    page?.setAttribute('tabindex', '-1');
    page?.focus();
    page?.scrollIntoView({ block: 'start' });
  });

  return {
    setActive(activeId) {
      document.querySelectorAll('[data-nav]').forEach((link) => {
        const isActive = link.dataset.nav === activeId;
        link.classList.toggle('is-active', isActive);
        if (isActive) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    },
    closeMenu: () => setMenu(false),
  };
};
