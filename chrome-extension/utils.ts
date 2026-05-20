import { Readability } from '@mozilla/readability';

const DEFAULT_API_BASE_URL = 'http://localhost:3000';
const MAX_DESCRIPTION_LENGTH = 800;
const MAX_CONTENT_LENGTH = 12_000;
const MAX_TEXT_LENGTH = 12_000;
const MAX_SELECTION_LENGTH = 4_000;
const MAX_SELECTION_CONTEXT_LENGTH = 800;
const MAX_SELECTION_HTML_LENGTH = 4_000;

export interface ExtractedData {
  title: string;
  url: string;
  description: string;
  image: string;
  favicon: string;
  content?: string;
  text?: string;
}

export interface SelectionData {
  text: string;
  html?: string;
  context?: string;
  title: string;
  url: string;
  description: string;
  image: string;
  favicon: string;
}

export interface ImageData {
  src: string;
  alt: string;
  title: string;
  pageUrl: string;
  pageTitle: string;
  favicon: string;
}

interface ReadabilityParseResult {
  title?: string | null;
  excerpt?: string | null;
  content?: string | null;
  textContent?: string | null;
}

function clampText(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return trimmed.slice(0, maxLength);
}

function resolveUrl(value: string | null): string {
  if (!value) {
    return '';
  }

  try {
    return new URL(value, window.location.href).toString();
  } catch {
    return value;
  }
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

function extractFromArticle(article: ReadabilityParseResult | null): string {
  if (article?.textContent) {
    return article.textContent;
  }

  if (article?.content) {
    const container = document.createElement('div');
    container.innerHTML = article.content;
    return container.textContent || '';
  }

  return document.body?.innerText || '';
}

function extractFavicon(): string {
  const iconSelectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]',
    'link[rel="apple-touch-icon-precomposed"]',
    'link[rel~="icon"]',
  ];

  for (const selector of iconSelectors) {
    const href = document.querySelector(selector)?.getAttribute('href');
    if (href) {
      return resolveUrl(href);
    }
  }

  return '';
}

export function extractMetadata(): ExtractedData {
  let article: ReadabilityParseResult | null = null;
  try {
    const documentClone = document.cloneNode(true) as Document;
    const reader = new Readability(documentClone);
    article = reader.parse();
  } catch (e) {
    console.error('Readability extraction failed', e);
  }

  const title =
    document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
    article?.title ||
    document.title ||
    '';

  const description =
    document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
    document.querySelector('meta[name="description"]')?.getAttribute('content') ||
    article?.excerpt ||
    '';

  const image =
    document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
    document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
    document.querySelector('meta[name="twitter:image:src"]')?.getAttribute('content') ||
    '';

  const url =
    document.querySelector('link[rel="canonical"]')?.getAttribute('href') ||
    document.querySelector('meta[property="og:url"]')?.getAttribute('content') ||
    window.location.href;

  const rawText = normalizeWhitespace(extractFromArticle(article));
  const text = rawText ? clampText(rawText, MAX_TEXT_LENGTH) : '';
  const content = text ? clampText(text, MAX_CONTENT_LENGTH) : '';

  return {
    title: clampText(title, 240),
    url: resolveUrl(url),
    description: clampText(description, MAX_DESCRIPTION_LENGTH),
    image: resolveUrl(image),
    favicon: extractFavicon(),
    content,
    text,
  };
}

export function extractSelection(): SelectionData | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const selectedText = selection.toString().trim();
  if (!selectedText) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const selectionContainer = document.createElement('div');
  selectionContainer.appendChild(range.cloneContents());

  const html = selectionContainer.innerHTML
    ? clampText(selectionContainer.innerHTML, MAX_SELECTION_HTML_LENGTH)
    : undefined;

  let context: string | undefined;
  const contextNode = range.commonAncestorContainer;
  const contextElement = contextNode.nodeType === Node.ELEMENT_NODE
    ? (contextNode as Element)
    : contextNode.parentElement;
  if (contextElement?.textContent) {
    context = clampText(normalizeWhitespace(contextElement.textContent), MAX_SELECTION_CONTEXT_LENGTH);
  }

  const pageMetadata = extractMetadata();
  return {
    text: clampText(selectedText, MAX_SELECTION_LENGTH),
    html,
    context,
    title: pageMetadata.title,
    url: pageMetadata.url,
    description: pageMetadata.description,
    image: pageMetadata.image,
    favicon: pageMetadata.favicon,
  };
}

export function extractImageData(image: HTMLImageElement): ImageData | null {
  const src = image.currentSrc || image.src || '';
  if (!src) {
    return null;
  }

  return {
    src: resolveUrl(src),
    alt: (image.getAttribute('alt') || '').trim(),
    title: (image.getAttribute('title') || '').trim(),
    pageUrl: window.location.href,
    pageTitle: document.title || window.location.href,
    favicon: extractFavicon(),
  };
}

export async function sendToApp(
  data: Record<string, unknown>,
  token?: string | null,
  apiBaseUrl: string = DEFAULT_API_BASE_URL
): Promise<Response> {
  const apiUrl = `${apiBaseUrl.replace(/\/$/, '')}/api/items/create`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
}