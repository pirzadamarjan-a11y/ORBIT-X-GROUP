const PATHS = {
  home: '<path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/>',
  solar:
    '<circle cx="12" cy="12" r="2.6"/><ellipse cx="12" cy="12" rx="9.5" ry="4.4" transform="rotate(-25 12 12)"/><circle cx="20" cy="7.8" r="1.1" fill="currentColor" stroke="none"/>',
  planets:
    '<circle cx="8" cy="9" r="3.2"/><path d="M6 14.5a5.5 5.5 0 1 0 7-7"/><circle cx="17.5" cy="17" r="1.6"/><path d="M18.8 13.8c1.6 0 2.8.8 2.8 1.8s-1.2 1.8-2.8 1.8"/>',
  mission:
    '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><path d="M12 3.5V2M12 22v-1.5M3.5 12H2M22 12h-1.5"/><circle cx="12" cy="12" r="0.8" fill="currentColor"/>',
  simulator:
    '<path d="M4 16.5 8 7h8l4 9.5"/><path d="M7 16.5h10"/><path d="M12 7V3"/><circle cx="12" cy="19.5" r="1.5"/><path d="m5 12 3-1M19 12l-3-1"/>',
  rocket:
    '<path d="M12 2.5c3.2 2.5 5 6.4 5 10.4l-5 4.1-5-4.1c0-4 1.8-7.9 5-10.4Z"/><circle cx="12" cy="9.2" r="1.8"/><path d="m7 13-2.5 5 4-1.2M17 13l2.5 5-4-1.2M12 17v4.5"/>',
  quiz:
    '<circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.5 2.5 0 1 1 3.9 2.2c-.9.6-1.5 1.1-1.5 2.3"/><circle cx="12" cy="17" r=".7" fill="currentColor"/>',
  dashboard:
    '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="4" rx="1.5"/><rect x="13.5" y="10.5" width="7" height="10" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/>',
  about:
    '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.6" r=".8" fill="currentColor"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="m5 5 14 14M19 5 5 19"/>',
  arrowRight: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  arrowLeft: '<path d="M20 12H5M11 6l-6 6 6 6"/>',
  chevronLeft: '<path d="m15 5-7 7 7 7"/>',
  chevronRight: '<path d="m9 5 7 7-7 7"/>',
  chevronDown: '<path d="m5 9 7 7 7-7"/>',
  play: '<path d="m8 5 11 7-11 7V5Z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor" stroke="none"/>',
  reset: '<path d="M4 9a8 8 0 1 1 .5 6.5"/><path d="M4 4v5h5"/>',
  sound:
    '<path d="M5 9.5v5h3.2L13 19V5L8.2 9.5H5Z"/><path d="M16 9a4.2 4.2 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
  mute: '<path d="M5 9.5v5h3.2L13 19V5L8.2 9.5H5Z"/><path d="m16.5 9 5 6M21.5 9l-5 6"/>',
  check: '<path d="m4.5 12.5 5 5 10-11"/>',
  x: '<path d="m6 6 12 12M18 6 6 18"/>',
  alert: '<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5"/><circle cx="12" cy="17.2" r=".7" fill="currentColor"/>',
  clock: '<circle cx="12" cy="12" r="8.7"/><path d="M12 7v5.4l3.5 2"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  fuel: '<path d="M6 21V4h7v17M6 8h7M9.5 4V2.5M3.5 21h12"/><path d="M13 10h2.5l3 3v5.5a1.5 1.5 0 0 1-1.5 1.5"/>',
  bolt: '<path d="M13 2 5 14h6l-1 8 9-13h-6V2Z"/>',
  orbit:
    '<circle cx="12" cy="12" r="2.2"/><ellipse cx="12" cy="12" rx="9" ry="4.2" transform="rotate(-32 12 12)"/><circle cx="19.5" cy="6.7" r="1.2" fill="currentColor" stroke="none"/>',
  telescope:
    '<path d="m3 14 13-7 2.5 5L6 19l-3-5Z"/><path d="m9 12.5 3.5 2M8 18l-2 3M13 9l1.5-3"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5H5V6h5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 10.5V17M12 7.2v.2"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  spark: '<path d="M12 2.5c.7 5.6 3.5 8.4 9.5 9.5-6 1.1-8.8 3.9-9.5 9.5-.7-5.6-3.5-8.4-9.5-9.5 6-1.1 8.8-3.9 9.5-9.5Z"/>',
  trash: '<path d="M4 7h16M9 3.5h6L16 7H8l1-3.5ZM6.5 7l1 13.5h9L18 7"/><path d="M10 11v5M14 11v5"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><path d="M3.5 12h17M12 3c2.8 2.4 4 5.4 4 9s-1.2 6.6-4 9c-2.8-2.4-4-5.4-4-9s1.2-6.6 4-9Z"/>',
  flame: '<path d="M12 22c4.2 0 6.5-2.7 6.5-6.2 0-4.7-4.2-6.3-3.2-11.8-3 .8-5 3.5-5 6.1 0 1.2.3 2.2.3 3.1 0 1.2-.9 2.1-2.1 2.1-1 0-1.7-.6-2-1.4C5.8 15.2 5.5 16.7 5.5 17c0 3 2.5 5 6.5 5Z"/>',
  signal: '<path d="M5 19v-4M9.5 19V9M14 19V5M18.5 19v-7"/>',
  archive: '<rect x="3.5" y="4.5" width="17" height="5" rx="1.2"/><path d="M5 9.5V20h14V9.5M9.5 13h5"/>',
  plus: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/>',
  minus: '<circle cx="12" cy="12" r="8.5"/><path d="M8 12h8"/>',
};

export const icon = (name, size = 18, className = '') => {
  const path = PATHS[name] ?? PATHS.orbit;
  return `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
};

export const brandMark = (size = 34) => `
  <svg class="brand-mark" width="${size}" height="${size}" viewBox="0 0 44 44" fill="none" aria-hidden="true">
    <circle cx="22" cy="22" r="7" stroke="currentColor" stroke-width="1.4" opacity=".95"/>
    <ellipse cx="22" cy="22" rx="18" ry="7.2" transform="rotate(-28 22 22)" stroke="currentColor" stroke-width="1.15" opacity=".62"/>
    <ellipse cx="22" cy="22" rx="13.5" ry="18" transform="rotate(62 22 22)" stroke="currentColor" stroke-width=".75" opacity=".22"/>
    <circle cx="36.5" cy="14.2" r="2" fill="#dff9ff"/>
  </svg>
`;
