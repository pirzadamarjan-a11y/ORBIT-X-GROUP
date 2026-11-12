import { escapeHTML } from '../utils/dom.js';
import { icon } from './icons.js';

let toastRoot;
let modalRoot;

const ensureRoots = () => {
  toastRoot = document.getElementById('toast-region');
  modalRoot = document.getElementById('modal-root');
};

export const showToast = (message, { type = 'info', duration = 3600, title = '' } = {}) => {
  ensureRoots();
  if (!toastRoot) return;
  const icons = { success: 'check', error: 'alert', info: 'info', warning: 'alert' };
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span class="toast__icon">${icon(icons[type] ?? 'info', 16)}</span>
    <div class="toast__copy">
      ${title ? `<strong>${escapeHTML(title)}</strong>` : ''}
      <span>${escapeHTML(message)}</span>
    </div>
    <button class="toast__close" aria-label="Dismiss notification">${icon('close', 14)}</button>
  `;
  const remove = () => {
    toast.classList.add('is-leaving');
    setTimeout(() => toast.remove(), 240);
  };
  toast.querySelector('.toast__close').addEventListener('click', remove);
  toastRoot.append(toast);
  while (toastRoot.children.length > 3) {
    toastRoot.firstElementChild?.remove();
  }
  setTimeout(remove, duration);
};

export const closeModal = () => {
  ensureRoots();
  if (!modalRoot) return;
  const modal = modalRoot.querySelector('.modal-backdrop');
  if (!modal) return;
  modal.classList.add('is-closing');
  const focused = modalRoot.querySelector('[data-modal-title]');
  setTimeout(() => {
    modalRoot.innerHTML = '';
    document.body.classList.remove('modal-open');
    focused?.focus();
  }, 180);
};

export const openModal = ({
  eyebrow = 'ORBIT X',
  title = '',
  body = '',
  actions = [],
  size = 'default',
  dismissible = true,
  className = '',
} = {}) => {
  ensureRoots();
  if (!modalRoot) return () => {};
  const previousFocus = document.activeElement;
  modalRoot.innerHTML = `
    <div class="modal-backdrop" role="presentation">
      <div class="modal modal--${size} ${className}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal__topline">
          <span class="eyebrow">${escapeHTML(eyebrow)}</span>
          ${dismissible ? `<button class="icon-button modal__close" type="button" aria-label="Close dialog">${icon('close', 18)}</button>` : ''}
        </div>
        <h2 id="modal-title" data-modal-title tabindex="-1">${escapeHTML(title)}</h2>
        <div class="modal__body">${body}</div>
        <div class="modal__actions"></div>
      </div>
    </div>
  `;
  document.body.classList.add('modal-open');
  const overlay = modalRoot.querySelector('.modal-backdrop');
  const modal = modalRoot.querySelector('.modal');
  const actionWrap = modalRoot.querySelector('.modal__actions');
  const titleElement = modalRoot.querySelector('[data-modal-title]');

  const close = () => {
    overlay.classList.add('is-closing');
    setTimeout(() => {
      modalRoot.innerHTML = '';
      document.body.classList.remove('modal-open');
      previousFocus?.focus?.();
    }, 180);
  };

  actions.forEach((action) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `button ${action.variant === 'primary' ? 'button--primary' : action.variant === 'danger' ? 'button--danger' : 'button--ghost'}`;
    button.innerHTML = action.icon ? `${icon(action.icon, 16)}<span>${escapeHTML(action.label)}</span>` : escapeHTML(action.label);
    button.addEventListener('click', () => {
      const shouldClose = action.onClick?.();
      if (shouldClose !== false) close();
    });
    actionWrap.append(button);
  });
  if (!actions.length) actionWrap.remove();

  modalRoot.querySelector('.modal__close')?.addEventListener('click', close);
  if (dismissible) {
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close();
    });
  }
  const keyHandler = (event) => {
    if (event.key === 'Escape' && dismissible) close();
  };
  document.addEventListener('keydown', keyHandler, { once: true });
  setTimeout(() => titleElement?.focus(), 60);
  return close;
};

export const confirmDialog = ({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  eyebrow = 'CONFIRM ACTION',
} = {}) =>
  new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    openModal({
      eyebrow,
      title,
      body: `<p class="modal__message">${escapeHTML(message)}</p>`,
      actions: [
        {
          label: cancelLabel,
          variant: 'ghost',
          onClick: () => finish(false),
        },
        {
          label: confirmLabel,
          variant: danger ? 'danger' : 'primary',
          onClick: () => finish(true),
        },
      ],
    });
    const observer = new MutationObserver(() => {
      if (!modalRoot?.querySelector('.modal-backdrop')) {
        finish(false);
        observer.disconnect();
      }
    });
    if (modalRoot) observer.observe(modalRoot, { childList: true });
  });

export const emptyState = ({ iconName = 'orbit', title = 'No data yet', message = '', action = '' } = {}) => `
  <div class="empty-state">
    <div class="empty-state__icon">${icon(iconName, 24)}</div>
    <h4>${escapeHTML(title)}</h4>
    <p>${escapeHTML(message)}</p>
    ${action}
  </div>
`;

export const loadingState = (label = 'Loading orbital data') => `
  <div class="loading-state" role="status">
    <span class="mini-orbit" aria-hidden="true"><i></i></span>
    <span>${escapeHTML(label)}</span>
  </div>
`;

export const sectionHeading = ({ eyebrow = '', title = '', copy = '', action = '' } = {}) => `
  <div class="section-heading">
    <div>
      ${eyebrow ? `<p class="eyebrow">${escapeHTML(eyebrow)}</p>` : ''}
      <h2>${escapeHTML(title)}</h2>
      ${copy ? `<p class="section-heading__copy">${escapeHTML(copy)}</p>` : ''}
    </div>
    ${action ? `<div class="section-heading__action">${action}</div>` : ''}
  </div>
`;
