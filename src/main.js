import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/inter';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './styles/main.css';

import { mountAppShell } from './components/AppShell.js';
import { createRouter } from './router.js';
import { showToast } from './components/ui.js';

const app = document.getElementById('app');
const shell = mountAppShell(app);
const router = createRouter({ shell });

window.addEventListener('unhandledrejection', (event) => {
  console.error('[ORBIT X] Unhandled rejection', event.reason);
});

window.addEventListener('error', (event) => {
  if (!event.error) return;
  console.error('[ORBIT X] Runtime error', event.error);
});

window.addEventListener('beforeunload', () => {
  router.destroy();
});

window.orbitx = {
  go: router.navigate,
  version: '1.0.0',
  notify: showToast,
};
