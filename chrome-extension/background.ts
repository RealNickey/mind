const DEFAULT_API_BASE_URL = 'http://localhost:3000';
const MAX_CONTENT_LENGTH = 12_000;
const MAX_DESCRIPTION_LENGTH = 800;
const MAX_TITLE_LENGTH = 160;
const MAX_SELECTION_LENGTH = 4_000;

type PageCaptureData = {
  title: string;
  url: string;
  description: string;
  image: string;
  favicon: string;
  content?: string;
  text?: string;
};

type SelectionCaptureData = {
  text: string;
  html?: string;
  context?: string;
  title: string;
  url: string;
  description: string;
  image: string;
  favicon: string;
};

type ImageCaptureData = {
  src: string;
  alt: string;
  title: string;
  pageUrl: string;
  pageTitle: string;
  favicon: string;
};

type NoteCaptureData = {
  text: string;
  pageUrl?: string;
  pageTitle?: string;
  selectionText?: string;
};

function clampText(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return trimmed.slice(0, maxLength);
}

function formatTitleFromText(text: string, fallback: string): string {
  if (!text.trim()) {
    return fallback;
  }

  const firstLine = text.split(/\r?\n/)[0]?.trim();
  const snippet = firstLine || text.trim();
  return clampText(snippet, MAX_TITLE_LENGTH);
}

function isBlockedMediaUrl(url?: string | null): boolean {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname.includes('googlevideo.com')) {
      return true;
    }

    const path = parsed.pathname.toLowerCase();
    if (path.endsWith('.m3u8') || path.endsWith('.mpd')) {
      return true;
    }

    const mime = parsed.searchParams.get('mime');
    if (mime && mime.toLowerCase().startsWith('video/')) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

function isRestrictedUrl(url?: string | null): boolean {
  if (!url) {
    return true;
  }

  const restrictedPrefixes = ['chrome://', 'edge://', 'about:', 'chrome-extension://', 'view-source:'];
  return restrictedPrefixes.some((prefix) => url.startsWith(prefix));
}

function showNotification(title: string, message: string) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title,
    message,
  });
}

function getAuthState(): Promise<{ token: string | null; apiBaseUrl: string }> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['token', 'apiBaseUrl'], (result) => {
      resolve({
        token: (result.token as string | undefined) ?? null,
        apiBaseUrl: (result.apiBaseUrl as string | undefined) ?? DEFAULT_API_BASE_URL,
      });
    });
  });
}

async function sendMessageToTab<T>(tabId: number, message: Record<string, unknown>): Promise<T | null> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }

      resolve((response as T) ?? null);
    });
  });
}

async function saveItem(payload: Record<string, unknown>, successMessage: string): Promise<void> {
  const { token, apiBaseUrl } = await getAuthState();
  const apiUrl = `${apiBaseUrl.replace(/\/$/, '')}/api/items/create`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      showNotification('Save failed', `MyMind returned ${response.status}.`);
      console.error('MyMind save failed:', errorText);
      return;
    }

    showNotification('Saved to MyMind', successMessage);
  } catch (error) {
    console.error('Failed to save item:', error);
    showNotification('Save failed', 'Network error while saving.');
  }
}

function buildPagePayload(data: PageCaptureData): Record<string, unknown> {
  const content = data.content || data.text || '';
  const text = data.text || data.content || '';
  const descriptionFallback = data.description?.trim()
    ? data.description
    : (content || text);
  const imageUrl = !isBlockedMediaUrl(data.image) ? data.image : '';

  return {
    title: clampText(data.title || 'Untitled page', MAX_TITLE_LENGTH),
    ...(descriptionFallback
      ? { description: clampText(descriptionFallback, MAX_DESCRIPTION_LENGTH) }
      : {}),
    ...(content ? { content: clampText(content, MAX_CONTENT_LENGTH) } : {}),
    ...(text ? { text: clampText(text, MAX_CONTENT_LENGTH) } : {}),
    ...(data.url ? { sourceUrl: data.url, url: data.url } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(data.favicon ? { favicon: data.favicon } : {}),
  };
}

function buildSelectionPayload(data: SelectionCaptureData): Record<string, unknown> {
  const selectionText = clampText(data.text, MAX_SELECTION_LENGTH);
  const imageUrl = !isBlockedMediaUrl(data.image) ? data.image : '';
  const customData: Record<string, unknown> = {
    selectionText,
    ...(data.html ? { selectionHtml: data.html } : {}),
    ...(data.context ? { selectionContext: data.context } : {}),
    ...(data.title ? { sourceTitle: data.title } : {}),
  };

  const payload: Record<string, unknown> = {
    title: clampText(`Highlight from ${data.title || 'page'}`, MAX_TITLE_LENGTH),
    type: 'note',
    content: selectionText,
    ...(data.url ? { sourceUrl: data.url, url: data.url } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(data.favicon ? { favicon: data.favicon } : {}),
  };

  if (Object.keys(customData).length > 0) {
    payload.customData = customData;
  }

  return payload;
}

function buildSelectionFallbackPayload(text: string, tab: chrome.tabs.Tab): Record<string, unknown> {
  const selectionText = clampText(text, MAX_SELECTION_LENGTH);
  const title = tab.title || 'Highlight';

  return {
    title: clampText(`Highlight from ${title}`, MAX_TITLE_LENGTH),
    type: 'note',
    content: selectionText,
    ...(tab.url ? { sourceUrl: tab.url, url: tab.url } : {}),
    customData: {
      selectionText,
      sourceTitle: title,
    },
  };
}

function buildImagePayload(data: ImageCaptureData): Record<string, unknown> {
  const title = data.alt || data.title || data.pageTitle || 'Saved image';
  const imageUrl = !isBlockedMediaUrl(data.src) ? data.src : '';
  const customData: Record<string, unknown> = {
    imageSourceUrl: data.src,
    ...(data.alt ? { imageAlt: data.alt } : {}),
    ...(data.title ? { imageTitle: data.title } : {}),
    ...(data.pageUrl ? { pageUrl: data.pageUrl } : {}),
    ...(data.pageTitle ? { pageTitle: data.pageTitle } : {}),
  };

  const payload: Record<string, unknown> = {
    title: clampText(title, MAX_TITLE_LENGTH),
    type: 'image',
    ...(data.pageUrl ? { sourceUrl: data.pageUrl, url: data.pageUrl } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(data.alt ? { description: clampText(data.alt, MAX_DESCRIPTION_LENGTH) } : {}),
    ...(data.favicon ? { favicon: data.favicon } : {}),
  };

  if (Object.keys(customData).length > 0) {
    payload.customData = customData;
  }

  return payload;
}

function buildNotePayload(data: NoteCaptureData): Record<string, unknown> {
  const text = clampText(data.text, MAX_CONTENT_LENGTH);
  const selectionText = data.selectionText
    ? clampText(data.selectionText, MAX_SELECTION_LENGTH)
    : undefined;
  const customData: Record<string, unknown> = {
    ...(data.pageTitle ? { sourceTitle: data.pageTitle } : {}),
    ...(selectionText ? { selectionText } : {}),
  };

  const payload: Record<string, unknown> = {
    title: formatTitleFromText(text, 'Quick note'),
    type: 'note',
    content: text,
    ...(data.pageUrl ? { sourceUrl: data.pageUrl, url: data.pageUrl } : {}),
  };

  if (Object.keys(customData).length > 0) {
    payload.customData = customData;
  }

  return payload;
}

async function handleSavePage(tab: chrome.tabs.Tab) {
  if (!tab.id || isRestrictedUrl(tab.url)) {
    showNotification('Unavailable', 'This page cannot be accessed by the clipper.');
    return;
  }

  const response = await sendMessageToTab<{ data?: PageCaptureData }>(tab.id, { action: 'extract' });
  if (response?.data) {
    const payload = buildPagePayload(response.data);
    const title = typeof payload.title === 'string' ? payload.title : (tab.title || 'page');
    await saveItem(payload, `Saved ${title}`);
    return;
  }

  if (tab.url) {
    const fallbackPayload = {
      title: clampText(tab.title || tab.url, MAX_TITLE_LENGTH),
      sourceUrl: tab.url,
      url: tab.url,
    };
    await saveItem(fallbackPayload, `Saved ${tab.title || 'page'}`);
  }
}

async function handleSaveSelection(tab: chrome.tabs.Tab, fallbackText?: string) {
  if (!tab.id || isRestrictedUrl(tab.url)) {
    showNotification('Unavailable', 'This page cannot be accessed by the clipper.');
    return;
  }

  const response = await sendMessageToTab<{ data?: SelectionCaptureData }>(tab.id, {
    action: 'extract-selection',
  });

  if (response?.data?.text) {
    const payload = buildSelectionPayload(response.data);
    await saveItem(payload, 'Saved highlight');
    return;
  }

  if (fallbackText?.trim()) {
    const payload = buildSelectionFallbackPayload(fallbackText, tab);
    await saveItem(payload, 'Saved highlight');
    return;
  }

  showNotification('No selection', 'Select text before saving a highlight.');
}

async function handleSaveImage(data: ImageCaptureData) {
  const payload = buildImagePayload(data);
  await saveItem(payload, 'Saved image');
}

async function handleQuickNote(data: NoteCaptureData) {
  const payload = buildNotePayload(data);
  await saveItem(payload, 'Saved quick note');
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'mymind-save-page',
      title: 'Save page to MyMind',
      contexts: ['page'],
    });
    chrome.contextMenus.create({
      id: 'mymind-save-selection',
      title: 'Save highlight to MyMind',
      contexts: ['selection'],
    });
    chrome.contextMenus.create({
      id: 'mymind-save-image',
      title: 'Save image to MyMind',
      contexts: ['image'],
    });
    chrome.contextMenus.create({
      id: 'mymind-quick-note',
      title: 'Quick note to MyMind',
      contexts: ['page'],
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab) {
    return;
  }

  if (info.menuItemId === 'mymind-save-page') {
    void handleSavePage(tab);
    return;
  }

  if (info.menuItemId === 'mymind-save-selection') {
    void handleSaveSelection(tab, info.selectionText || undefined);
    return;
  }

  if (info.menuItemId === 'mymind-save-image' && info.srcUrl) {
    const payload: ImageCaptureData = {
      src: info.srcUrl,
      alt: '',
      title: tab.title || 'Saved image',
      pageUrl: info.pageUrl || tab.url || info.srcUrl,
      pageTitle: tab.title || 'Saved image',
      favicon: '',
    };
    void handleSaveImage(payload);
    return;
  }

  if (info.menuItemId === 'mymind-quick-note') {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'open-quick-note' }, () => {
        if (chrome.runtime.lastError) {
          showNotification('Unavailable', 'Quick note is not available on this page.');
        }
      });
    }
  }
});

chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab) {
      return;
    }

    if (command === 'save-page') {
      void handleSavePage(tab);
      return;
    }

    if (command === 'save-selection') {
      void handleSaveSelection(tab);
      return;
    }

    if (command === 'quick-note') {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'open-quick-note' }, () => {
          if (chrome.runtime.lastError) {
            showNotification('Unavailable', 'Quick note is not available on this page.');
          }
        });
      }
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.action === 'save-image' && request.payload) {
    void handleSaveImage(request.payload as ImageCaptureData);
    sendResponse({ ok: true });
    return true;
  }

  if (request?.action === 'save-note' && request.payload) {
    void handleQuickNote(request.payload as NoteCaptureData);
    sendResponse({ ok: true });
    return true;
  }

  return false;
});