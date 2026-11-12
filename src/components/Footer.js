import { icon } from './icons.js';

export const pageFooter = () => `
  <footer class="site-footer">
    <div class="site-footer__brand">
      <span class="brand__name">ORBIT <b>X</b></span>
      <p>An educational space exploration simulation. Planetary facts reference NASA public data; flight telemetry and mission outcomes are simulated.</p>
    </div>
    <div class="site-footer__links">
      <a href="#/about">About &amp; Sources ${icon('external', 13)}</a>
      <a href="#/dashboard">Mission Archive ${icon('arrowRight', 13)}</a>
    </div>
    <div class="site-footer__meta">
      <span>ORBIT X / 2026</span>
      <span>BUILT FOR EXPLORATION</span>
    </div>
  </footer>
`;
