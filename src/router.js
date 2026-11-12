import { showToast, confirmDialog, openModal, closeModal } from './components/ui.js';

const ROUTES = [
  {
    pattern: /^\/$/,
    navId: 'home',
    title: 'Explore the Universe',
    load: () => import('./pages/HomePage.js'),
  },
  {
    pattern: /^\/solar-system$/,
    navId: 'solar-system',
    title: 'Solar System',
    load: () => import('./pages/SolarSystemPage.js'),
  },
  {
    pattern: /^\/planets$/,
    navId: 'planets',
    title: 'Planet Explorer',
    load: () => import('./pages/PlanetExplorerPage.js'),
  },
  {
    pattern: /^\/planet\/([a-z-]+)$/,
    navId: 'planets',
    title: 'Planet Explorer',
    load: () => import('./pages/PlanetExplorerPage.js'),
    keys: ['planetId'],
  },
  {
    pattern: /^\/mission-control$/,
    navId: 'mission-control',
    title: 'Mission Control',
    load: () => import('./pages/MissionControlPage.js'),
  },
  {
    pattern: /^\/simulator$/,
    navId: 'simulator',
    title: 'Spacecraft Simulator',
    load: () => import('./pages/SimulatorPage.js'),
  },
  {
    pattern: /^\/launch$/,
    navId: 'launch',
    title: 'Launch Sequence',
    load: () => import('./pages/LaunchPage.js'),
  },
  {
    pattern: /^\/quiz$/,
    navId: 'quiz',
    title: 'Knowledge Check',
    load: () => import('./pages/QuizPage.js'),
  },
  {
    pattern: /^\/dashboard$/,
    navId: 'dashboard',
    title: 'Mission Dashboard',
    load: () => import('./pages/DashboardPage.js'),
  },
  {
    pattern: /^\/about$/,
    navId: 'about',
    title: 'About & Sources',
    load: () => import('./pages/AboutPage.js'),
  },
];

const normalizePath = () => {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const clean = raw.split('?')[0];
  if (clean.length > 1 && clean.endsWith('/')) return clean.slice(0, -1);
  return clean;
};

const resolveRoute = (path) => {
  for (const route of ROUTES) {
    const match = path.match(route.pattern);
    if (match) {
      const params = {};
      route.keys?.forEach((key, index) => {
        params[key] = decodeURIComponent(match[index + 1]);
      });
      return { ...route, params, path };
    }
  }
  return null;
};

export const createRouter = ({ shell }) => {
  const pageRoot = document.getElementById('page-root');
  const appView = document.getElementById('app-view');
  const loader = document.getElementById('route-loader');
  let cleanup = null;
  let activeToken = 0;
  let lastPath = null;

  const navigate = (path, { replace = false } = {}) => {
    const target = path.startsWith('/') ? path : `/${path}`;
    const hash = `#${target}`;
    if (window.location.hash === hash) {
      render(true);
      return;
    }
    if (replace) {
      window.history.replaceState(null, '', hash);
      render();
    } else {
      window.location.hash = hash;
    }
  };

  const renderError = (error) => {
    pageRoot.innerHTML = `
      <section class="error-page">
        <div class="error-page__code">SIGNAL LOST</div>
        <p class="eyebrow">UPLINK ERROR / 503</p>
        <h1>We lost contact with this module.</h1>
        <p>The requested interface could not be initialized. Your saved progress remains intact.</p>
        <div class="button-row">
          <button class="button button--primary" type="button" data-retry>Retry connection</button>
          <a class="button button--ghost" href="#/">Return to mission start</a>
        </div>
      </section>
    `;
    pageRoot.querySelector('[data-retry]')?.addEventListener('click', () => render(true));
    console.error('[ORBIT X] Route failed to render.', error);
  };

  const render = async (force = false) => {
    const path = normalizePath();
    if (path === lastPath && !force) return;
    lastPath = path;
    const token = ++activeToken;
    closeModal();
    shell.closeMenu();
    const route = resolveRoute(path);

    if (!route) {
      cleanup?.();
      cleanup = null;
      shell.setActive('');
      document.title = 'Signal Lost — ORBIT X';
      if (loader) loader.hidden = true;
      pageRoot.innerHTML = `
        <section class="error-page">
          <div class="error-page__code">404</div>
          <p class="eyebrow">UNKNOWN COORDINATES</p>
          <h1>This sector has not been charted.</h1>
          <p>The requested route does not exist in the ORBIT X navigation network.</p>
          <div class="button-row"><a class="button button--primary" href="#/">Return to home</a></div>
        </section>
      `;
      appView.scrollTop = 0;
      return;
    }

    shell.setActive(route.navId);
    document.title = `${route.title} — ORBIT X`;
    if (loader) loader.hidden = false;
    pageRoot.classList.add('is-swapping');

    let pageModule;
    try {
      pageModule = await route.load();
    } catch (error) {
      if (token !== activeToken) return;
      cleanup?.();
      cleanup = null;
      if (loader) loader.hidden = true;
      pageRoot.classList.remove('is-swapping');
      renderError(error);
      return;
    }

    if (token !== activeToken) return;

    cleanup?.();
    cleanup = null;
    pageRoot.innerHTML = '';
    pageRoot.classList.remove('is-swapping');

    const context = {
      navigate,
      route: route.path,
      params: route.params,
      toast: showToast,
      confirm: confirmDialog,
      openModal,
      closeModal,
    };

    try {
      const result = await pageModule.mount(pageRoot, context);
      cleanup = typeof result === 'function' ? result : null;
      pageRoot.classList.add('page-enter');
      requestAnimationFrame(() => {
        appView.scrollTop = 0;
        pageRoot.classList.add('page-enter--active');
      });
      setTimeout(() => pageRoot.classList.remove('page-enter', 'page-enter--active'), 700);
    } catch (error) {
      cleanup?.();
      cleanup = null;
      pageRoot.innerHTML = '';
      renderError(error);
    } finally {
      if (token === activeToken && loader) loader.hidden = true;
    }
  };

  window.addEventListener('hashchange', render);
  if (!window.location.hash) {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/`);
  }
  render();

  return {
    navigate,
    render,
    destroy() {
      window.removeEventListener('hashchange', render);
      cleanup?.();
      cleanup = null;
    },
  };
};
