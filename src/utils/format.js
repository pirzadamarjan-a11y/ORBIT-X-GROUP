export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const lerp = (a, b, t) => a + (b - a) * t;

export const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const formatNumber = (value, options = {}) =>
  new Intl.NumberFormat('en-US', options).format(value ?? 0);

export const formatDate = (iso) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (iso) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

export const formatDuration = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const shuffle = (items) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const countUp = (element, target, { duration = 900, suffix = '', decimals = 0 } = {}) => {
  if (!element) return () => {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    element.textContent = `${target.toFixed(decimals)}${suffix}`;
    return () => {};
  }
  let frame = 0;
  const start = performance.now();
  const tick = (now) => {
    const t = clamp((now - start) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    element.textContent = `${(target * eased).toFixed(decimals)}${suffix}`;
    if (t < 1) {
      frame = requestAnimationFrame(tick);
    }
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
};

export const padNumber = (value, length = 2) => String(value).padStart(length, '0');
