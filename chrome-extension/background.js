// chrome-extension/background.ts
var DEFAULT_API_BASE_URL = "http://localhost:3000";
var MAX_CONTENT_LENGTH = 12e3;
var MAX_DESCRIPTION_LENGTH = 800;
var MAX_TITLE_LENGTH = 160;
var MAX_SELECTION_LENGTH = 4e3;
function clampText(value, maxLength) {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return trimmed.slice(0, maxLength);
}
function formatTitleFromText(text, fallback) {
  if (!text.trim()) {
    return fallback;
  }
  const firstLine = text.split(/\r?\n/)[0]?.trim();
  const snippet = firstLine || text.trim();
  return clampText(snippet, MAX_TITLE_LENGTH);
}
function isBlockedMediaUrl(url) {
  if (!url) {
    return false;
  }
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname.includes("googlevideo.com")) {
      return true;
    }
    const path = parsed.pathname.toLowerCase();
    if (path.endsWith(".m3u8") || path.endsWith(".mpd")) {
      return true;
    }
    const mime = parsed.searchParams.get("mime");
    if (mime && mime.toLowerCase().startsWith("video/")) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}
function isRestrictedUrl(url) {
  if (!url) {
    return true;
  }
  const restrictedPrefixes = ["chrome://", "edge://", "about:", "chrome-extension://", "view-source:"];
  return restrictedPrefixes.some((prefix) => url.startsWith(prefix));
}
function showNotification(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon48.png",
    title,
    message
  });
}
function getAuthState() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["token", "apiBaseUrl"], (result) => {
      resolve({
        token: result.token ?? null,
        apiBaseUrl: result.apiBaseUrl ?? DEFAULT_API_BASE_URL
      });
    });
  });
}
async function sendMessageToTab(tabId, message) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      resolve(response ?? null);
    });
  });
}
async function saveItem(payload, successMessage) {
  const { token, apiBaseUrl } = await getAuthState();
  const apiUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/items/create`;
  const headers = {
    "Content-Type": "application/json"
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorText = await response.text();
      showNotification("Save failed", `MyMind returned ${response.status}.`);
      console.error("MyMind save failed:", errorText);
      return;
    }
    showNotification("Saved to MyMind", successMessage);
  } catch (error) {
    console.error("Failed to save item:", error);
    showNotification("Save failed", "Network error while saving.");
  }
}
function buildPagePayload(data) {
  const content = data.content || data.text || "";
  const text = data.text || data.content || "";
  const descriptionFallback = data.description?.trim() ? data.description : content || text;
  const imageUrl = !isBlockedMediaUrl(data.image) ? data.image : "";
  return {
    title: clampText(data.title || "Untitled page", MAX_TITLE_LENGTH),
    ...descriptionFallback ? { description: clampText(descriptionFallback, MAX_DESCRIPTION_LENGTH) } : {},
    ...content ? { content: clampText(content, MAX_CONTENT_LENGTH) } : {},
    ...text ? { text: clampText(text, MAX_CONTENT_LENGTH) } : {},
    ...data.url ? { sourceUrl: data.url, url: data.url } : {},
    ...imageUrl ? { imageUrl } : {},
    ...data.favicon ? { favicon: data.favicon } : {}
  };
}
function buildSelectionPayload(data) {
  const selectionText = clampText(data.text, MAX_SELECTION_LENGTH);
  const imageUrl = !isBlockedMediaUrl(data.image) ? data.image : "";
  const customData = {
    selectionText,
    ...data.html ? { selectionHtml: data.html } : {},
    ...data.context ? { selectionContext: data.context } : {},
    ...data.title ? { sourceTitle: data.title } : {}
  };
  const payload = {
    title: clampText(`Highlight from ${data.title || "page"}`, MAX_TITLE_LENGTH),
    type: "note",
    content: selectionText,
    ...data.url ? { sourceUrl: data.url, url: data.url } : {},
    ...imageUrl ? { imageUrl } : {},
    ...data.favicon ? { favicon: data.favicon } : {}
  };
  if (Object.keys(customData).length > 0) {
    payload.customData = customData;
  }
  return payload;
}
function buildSelectionFallbackPayload(text, tab) {
  const selectionText = clampText(text, MAX_SELECTION_LENGTH);
  const title = tab.title || "Highlight";
  return {
    title: clampText(`Highlight from ${title}`, MAX_TITLE_LENGTH),
    type: "note",
    content: selectionText,
    ...tab.url ? { sourceUrl: tab.url, url: tab.url } : {},
    customData: {
      selectionText,
      sourceTitle: title
    }
  };
}
function buildImagePayload(data) {
  const title = data.alt || data.title || data.pageTitle || "Saved image";
  const imageUrl = !isBlockedMediaUrl(data.src) ? data.src : "";
  const customData = {
    imageSourceUrl: data.src,
    ...data.alt ? { imageAlt: data.alt } : {},
    ...data.title ? { imageTitle: data.title } : {},
    ...data.pageUrl ? { pageUrl: data.pageUrl } : {},
    ...data.pageTitle ? { pageTitle: data.pageTitle } : {}
  };
  const payload = {
    title: clampText(title, MAX_TITLE_LENGTH),
    type: "image",
    ...data.pageUrl ? { sourceUrl: data.pageUrl, url: data.pageUrl } : {},
    ...imageUrl ? { imageUrl } : {},
    ...data.alt ? { description: clampText(data.alt, MAX_DESCRIPTION_LENGTH) } : {},
    ...data.favicon ? { favicon: data.favicon } : {}
  };
  if (Object.keys(customData).length > 0) {
    payload.customData = customData;
  }
  return payload;
}
function buildNotePayload(data) {
  const text = clampText(data.text, MAX_CONTENT_LENGTH);
  const selectionText = data.selectionText ? clampText(data.selectionText, MAX_SELECTION_LENGTH) : void 0;
  const customData = {
    ...data.pageTitle ? { sourceTitle: data.pageTitle } : {},
    ...selectionText ? { selectionText } : {}
  };
  const payload = {
    title: formatTitleFromText(text, "Quick note"),
    type: "note",
    content: text,
    ...data.pageUrl ? { sourceUrl: data.pageUrl, url: data.pageUrl } : {}
  };
  if (Object.keys(customData).length > 0) {
    payload.customData = customData;
  }
  return payload;
}
async function handleSavePage(tab) {
  if (!tab.id || isRestrictedUrl(tab.url)) {
    showNotification("Unavailable", "This page cannot be accessed by the clipper.");
    return;
  }
  const response = await sendMessageToTab(tab.id, { action: "extract" });
  if (response?.data) {
    const payload = buildPagePayload(response.data);
    const title = typeof payload.title === "string" ? payload.title : tab.title || "page";
    await saveItem(payload, `Saved ${title}`);
    return;
  }
  if (tab.url) {
    const fallbackPayload = {
      title: clampText(tab.title || tab.url, MAX_TITLE_LENGTH),
      sourceUrl: tab.url,
      url: tab.url
    };
    await saveItem(fallbackPayload, `Saved ${tab.title || "page"}`);
  }
}
async function handleSaveSelection(tab, fallbackText) {
  if (!tab.id || isRestrictedUrl(tab.url)) {
    showNotification("Unavailable", "This page cannot be accessed by the clipper.");
    return;
  }
  const response = await sendMessageToTab(tab.id, {
    action: "extract-selection"
  });
  if (response?.data?.text) {
    const payload = buildSelectionPayload(response.data);
    await saveItem(payload, "Saved highlight");
    return;
  }
  if (fallbackText?.trim()) {
    const payload = buildSelectionFallbackPayload(fallbackText, tab);
    await saveItem(payload, "Saved highlight");
    return;
  }
  showNotification("No selection", "Select text before saving a highlight.");
}
async function handleSaveImage(data) {
  const payload = buildImagePayload(data);
  await saveItem(payload, "Saved image");
}
async function handleQuickNote(data) {
  const payload = buildNotePayload(data);
  await saveItem(payload, "Saved quick note");
}
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "mymind-save-page",
      title: "Save page to MyMind",
      contexts: ["page"]
    });
    chrome.contextMenus.create({
      id: "mymind-save-selection",
      title: "Save highlight to MyMind",
      contexts: ["selection"]
    });
    chrome.contextMenus.create({
      id: "mymind-save-image",
      title: "Save image to MyMind",
      contexts: ["image"]
    });
    chrome.contextMenus.create({
      id: "mymind-quick-note",
      title: "Quick note to MyMind",
      contexts: ["page"]
    });
  });
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab) {
    return;
  }
  if (info.menuItemId === "mymind-save-page") {
    void handleSavePage(tab);
    return;
  }
  if (info.menuItemId === "mymind-save-selection") {
    void handleSaveSelection(tab, info.selectionText || void 0);
    return;
  }
  if (info.menuItemId === "mymind-save-image" && info.srcUrl) {
    const payload = {
      src: info.srcUrl,
      alt: "",
      title: tab.title || "Saved image",
      pageUrl: info.pageUrl || tab.url || info.srcUrl,
      pageTitle: tab.title || "Saved image",
      favicon: ""
    };
    void handleSaveImage(payload);
    return;
  }
  if (info.menuItemId === "mymind-quick-note") {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: "open-quick-note" }, () => {
        if (chrome.runtime.lastError) {
          showNotification("Unavailable", "Quick note is not available on this page.");
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
    if (command === "save-page") {
      void handleSavePage(tab);
      return;
    }
    if (command === "save-selection") {
      void handleSaveSelection(tab);
      return;
    }
    if (command === "quick-note") {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: "open-quick-note" }, () => {
          if (chrome.runtime.lastError) {
            showNotification("Unavailable", "Quick note is not available on this page.");
          }
        });
      }
    }
  });
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.action === "save-image" && request.payload) {
    void handleSaveImage(request.payload);
    sendResponse({ ok: true });
    return true;
  }
  if (request?.action === "save-note" && request.payload) {
    void handleQuickNote(request.payload);
    sendResponse({ ok: true });
    return true;
  }
  return false;
});
//# sourceMappingURL=background.js.map
