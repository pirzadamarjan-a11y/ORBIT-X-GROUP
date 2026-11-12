export const escapeHTML = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export const qs = (selector, scope = document) => scope.querySelector(selector);
export const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

export const on = (element, event, selectorOrHandler, maybeHandler) => {
  if (!element) return () => {};
  if (typeof selectorOrHandler === 'function') {
    element.addEventListener(event, selectorOrHandler);
    return () => element.removeEventListener(event, selectorOrHandler);
  }
  const handler = (eventObject) => {
    const target = eventObject.target.closest(selectorOrHandler);
    if (target && element.contains(target)) maybeHandler(eventObject, target);
  };
  element.addEventListener(event, handler);
  return () => element.removeEventListener(event, handler);
};

export const createElement = (tag, className, html) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (html !== undefined) element.innerHTML = html;
  return element;
};

export const setPressed = (element, pressed) => {
  if (!element) return;
  element.setAttribute('aria-pressed', String(Boolean(pressed)));
};

export const trapFocus = (container) => {
  const selector =
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
  const handleKeydown = (event) => {
    if (event.key !== 'Tab') return;
    const focusable = [...container.querySelectorAll(selector)].filter(
      (element) => !element.hidden && element.offsetParent !== null,
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  container.addEventListener('keydown', handleKeydown);
  return () => container.removeEventListener('keydown', handleKeydown);
};
