/// <reference types="chrome" />
import { extractImageData, extractMetadata, extractSelection } from './utils';

const QUICK_NOTE_OVERLAY_ID = 'mymind-quick-note-overlay';
const IMAGE_SAVE_BUTTON_ID = 'mymind-image-save-button';

type QuickNoteOverlay = HTMLDivElement & { __mymindCleanup?: () => void };

function removeQuickNoteOverlay() {
  const overlay = document.getElementById(QUICK_NOTE_OVERLAY_ID) as QuickNoteOverlay | null;
  if (!overlay) {
    return;
  }

  if (overlay.__mymindCleanup) {
    overlay.__mymindCleanup();
    return;
  }

  overlay.remove();
}

function openQuickNoteOverlay(prefillText?: string) {
  const existing = document.getElementById(QUICK_NOTE_OVERLAY_ID);
  if (existing) {
    const textarea = existing.querySelector('textarea') as HTMLTextAreaElement | null;
    textarea?.focus();
    return;
  }

  const selectionText = prefillText || window.getSelection()?.toString().trim() || '';
  const overlay = document.createElement('div') as QuickNoteOverlay;
  overlay.id = QUICK_NOTE_OVERLAY_ID;
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:flex-end;justify-content:center;pointer-events:auto;';

  const backdrop = document.createElement('div');
  backdrop.style.cssText = 'position:absolute;inset:0;background:rgba(15,23,42,0.18);';

  const card = document.createElement('div');
  card.style.cssText =
    'position:relative;z-index:1;width:min(560px,92vw);margin:24px;padding:16px 16px 14px;background:#ffffff;border-radius:16px;box-shadow:0 24px 60px rgba(15,23,42,0.25);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;';

  const title = document.createElement('div');
  title.textContent = 'Quick note';
  title.style.cssText = 'font-size:14px;font-weight:600;color:#0f172a;margin-bottom:10px;';

  const textarea = document.createElement('textarea');
  textarea.placeholder = 'Capture a thought, quote, or highlight...';
  textarea.value = selectionText;
  textarea.style.cssText =
    'width:100%;min-height:110px;resize:vertical;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;font-size:13px;line-height:1.5;color:#0f172a;outline:none;';

  const helper = document.createElement('div');
  helper.textContent = 'Tip: Press Ctrl/Command + Enter to save.';
  helper.style.cssText = 'margin-top:8px;font-size:11px;color:#64748b;';

  const error = document.createElement('div');
  error.style.cssText = 'margin-top:8px;font-size:11px;color:#b91c1c;display:none;';

  const actions = document.createElement('div');
  actions.style.cssText = 'margin-top:12px;display:flex;justify-content:flex-end;gap:8px;';

  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.textContent = 'Cancel';
  cancelButton.style.cssText =
    'border:none;background:#e2e8f0;color:#0f172a;border-radius:10px;padding:8px 12px;font-size:12px;font-weight:600;cursor:pointer;';
  cancelButton.addEventListener('click', removeQuickNoteOverlay);

  const saveButton = document.createElement('button');
  saveButton.type = 'button';
  saveButton.textContent = 'Save to MyMind';
  saveButton.style.cssText =
    'border:none;background:#0f172a;color:#f8fafc;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;';

  const setError = (message: string | null) => {
    if (message) {
      error.textContent = message;
      error.style.display = 'block';
    } else {
      error.textContent = '';
      error.style.display = 'none';
    }
  };

  const handleSave = () => {
    const text = textarea.value.trim();
    if (!text) {
      setError('Please enter a note before saving.');
      return;
    }

    chrome.runtime.sendMessage({
      action: 'save-note',
      payload: {
        text,
        pageUrl: window.location.href,
        pageTitle: document.title || window.location.href,
        selectionText: selectionText || undefined,
      }
    });

    removeQuickNoteOverlay();
  };

  saveButton.addEventListener('click', handleSave);
  textarea.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      handleSave();
    }
  });

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      removeQuickNoteOverlay();
    }
  };

  overlay.__mymindCleanup = () => {
    document.removeEventListener('keydown', handleKeyDown);
    overlay.remove();
  };

  document.addEventListener('keydown', handleKeyDown);
  backdrop.addEventListener('click', removeQuickNoteOverlay);

  actions.appendChild(cancelButton);
  actions.appendChild(saveButton);

  card.appendChild(title);
  card.appendChild(textarea);
  card.appendChild(helper);
  card.appendChild(error);
  card.appendChild(actions);

  overlay.appendChild(backdrop);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  setTimeout(() => textarea.focus(), 0);
}

function setupImageHoverSave() {
  if (document.getElementById(IMAGE_SAVE_BUTTON_ID)) {
    return;
  }

  const button = document.createElement('button');
  button.id = IMAGE_SAVE_BUTTON_ID;
  button.type = 'button';
  button.textContent = 'Save';
  button.style.cssText =
    'position:absolute;z-index:2147483646;display:none;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:rgba(15,23,42,0.92);color:#f8fafc;border:none;font-size:11px;font-weight:600;cursor:pointer;box-shadow:0 8px 24px rgba(15,23,42,0.25);';
  document.body.appendChild(button);

  let activeImage: HTMLImageElement | null = null;
  let hideTimeout: number | null = null;

  const updatePosition = () => {
    if (!activeImage) {
      return;
    }

    const rect = activeImage.getBoundingClientRect();
    const left = Math.max(rect.left + window.scrollX + 8, 8);
    const top = Math.max(rect.top + window.scrollY + 8, 8);
    button.style.left = `${left}px`;
    button.style.top = `${top}px`;
  };

  const showButton = (image: HTMLImageElement) => {
    if (hideTimeout) {
      window.clearTimeout(hideTimeout);
      hideTimeout = null;
    }

    activeImage = image;
    updatePosition();
    button.style.display = 'flex';
  };

  const hideButton = () => {
    button.style.display = 'none';
    activeImage = null;
  };

  const scheduleHide = () => {
    if (hideTimeout) {
      window.clearTimeout(hideTimeout);
    }

    hideTimeout = window.setTimeout(() => {
      hideButton();
    }, 200);
  };

  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!activeImage) {
      return;
    }

    const payload = extractImageData(activeImage);
    if (!payload) {
      return;
    }

    chrome.runtime.sendMessage({ action: 'save-image', payload });
    hideButton();
  });

  button.addEventListener('mouseenter', () => {
    if (hideTimeout) {
      window.clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  });

  button.addEventListener('mouseleave', scheduleHide);

  document.addEventListener('mouseover', (event) => {
    const target = event.target as Element | null;
    if (!target || target.closest(`#${IMAGE_SAVE_BUTTON_ID}`)) {
      return;
    }

    const image = target instanceof HTMLImageElement ? target : target.closest('img');
    if (!image) {
      return;
    }

    if (image.naturalWidth < 48 || image.naturalHeight < 48) {
      return;
    }

    showButton(image);
  });

  document.addEventListener('mouseout', (event) => {
    if (!activeImage) {
      return;
    }

    const related = event.relatedTarget as Node | null;
    if (related && (related === button || button.contains(related))) {
      return;
    }

    const target = event.target as Element | null;
    if (target && (target === activeImage || target.closest('img') === activeImage)) {
      scheduleHide();
    }
  });

  window.addEventListener('scroll', () => {
    if (activeImage) {
      updatePosition();
    }
  }, true);

  window.addEventListener('resize', () => {
    if (activeImage) {
      updatePosition();
    }
  });
}

chrome.runtime.onMessage.addListener((
  request: { action?: string; [key: string]: unknown },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
) => {
  if (request?.action === 'extract') {
    const data = extractMetadata();
    sendResponse({ data });
    return true;
  }

  if (request?.action === 'extract-selection') {
    const data = extractSelection();
    sendResponse({ data });
    return true;
  }

  if (request?.action === 'open-quick-note') {
    const prefillText = typeof request.prefillText === 'string' ? request.prefillText : undefined;
    openQuickNoteOverlay(prefillText);
    sendResponse({ ok: true });
    return true;
  }

  if (request?.action === 'ping') {
    sendResponse({ ok: true });
    return true;
  }

  return false;
});

setupImageHoverSave();