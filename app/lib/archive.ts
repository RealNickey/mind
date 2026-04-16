import { createHash } from 'node:crypto';
import { convert as htmlToText } from 'html-to-text';
import { normalizeSourceUrl } from './url-utils';

const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_PREVIEW_LENGTH = 80_000;
const MAX_TEXT_PREVIEW_LENGTH = 6_000;
const MAX_EXCERPT_LENGTH = 420;

export interface ArchiveSnapshot {
  capturedAt: string;
  sourceUrl: string;
  finalUrl: string;
  statusCode: number;
  contentType: string | null;
  title: string | null;
  excerpt: string | null;
  textPreview: string;
  htmlPreview: string;
  contentHash: string;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!match || !match[1]) {
    return null;
  }

  const cleaned = match[1].replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned : null;
}

export async function captureArchiveSnapshot(url: string): Promise<ArchiveSnapshot | null> {
  const normalized = normalizeSourceUrl(url);
  if (!normalized) {
    return null;
  }

  const response = await fetch(normalized, {
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      'user-agent': 'mind-archive-snapshot/1.0',
    },
  });

  const contentType = response.headers.get('content-type');
  if (!response.ok || !contentType?.toLowerCase().includes('text/html')) {
    return null;
  }

  const html = await response.text();
  const htmlPreview = html.slice(0, MAX_HTML_PREVIEW_LENGTH);
  const text = htmlToText(html, {
    wordwrap: null,
    preserveNewlines: true,
    uppercaseHeadings: false,
    selectors: [
      { selector: 'img', format: 'skip' },
      { selector: 'script', format: 'skip' },
      { selector: 'style', format: 'skip' },
    ],
  })
    .replace(/\s+/g, ' ')
    .trim();

  const textPreview = text.slice(0, MAX_TEXT_PREVIEW_LENGTH);
  const excerpt = textPreview.length > 0 ? textPreview.slice(0, MAX_EXCERPT_LENGTH) : null;

  return {
    capturedAt: new Date().toISOString(),
    sourceUrl: normalized,
    finalUrl: response.url || normalized,
    statusCode: response.status,
    contentType,
    title: extractTitle(html),
    excerpt,
    textPreview,
    htmlPreview,
    contentHash: createHash('sha256').update(html).digest('hex'),
  };
}