import { createHash } from 'node:crypto';
import { convert as htmlToText } from 'html-to-text';
import * as cheerio from 'cheerio';
import { normalizeSourceUrl } from './url-utils';

const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_PREVIEW_LENGTH = 80_000;
const MAX_TEXT_PREVIEW_LENGTH = 6_000;
const MAX_EXCERPT_LENGTH = 420;

export type ArchiveSnapshotOutcome =
  | 'captured'
  | 'non_html'
  | 'http_error'
  | 'network_error'
  | 'invalid_url';

export interface ArchiveSnapshot {
  capturedAt: string;
  sourceUrl: string;
  finalUrl: string | null;
  statusCode: number | null;
  contentType: string | null;
  outcome: ArchiveSnapshotOutcome;
  title: string | null;
  excerpt: string | null;
  textPreview: string;
  htmlPreview: string;
  contentHash: string | null;
  fetchDurationMs: number;
  error: string | null;
}

function extractTitle(html: string): string | null {
  try {
    const $ = cheerio.load(html);
    const title = $('title').text();
    if (!title) return null;
    const cleaned = title.replace(/\s+/g, ' ').trim();
    return cleaned.length > 0 ? cleaned : null;
  } catch (e) {
    return null;
  }
}

function toExcerpt(text: string): string | null {
  if (!text) {
    return null;
  }

  return text.slice(0, MAX_EXCERPT_LENGTH);
}

function createSnapshot(params: {
  capturedAt: string;
  sourceUrl: string;
  finalUrl?: string | null;
  statusCode?: number | null;
  contentType?: string | null;
  outcome: ArchiveSnapshotOutcome;
  title?: string | null;
  excerpt?: string | null;
  textPreview?: string;
  htmlPreview?: string;
  contentHash?: string | null;
  fetchDurationMs: number;
  error?: string | null;
}): ArchiveSnapshot {
  return {
    capturedAt: params.capturedAt,
    sourceUrl: params.sourceUrl,
    finalUrl: params.finalUrl ?? null,
    statusCode: params.statusCode ?? null,
    contentType: params.contentType ?? null,
    outcome: params.outcome,
    title: params.title ?? null,
    excerpt: params.excerpt ?? null,
    textPreview: params.textPreview ?? '',
    htmlPreview: params.htmlPreview ?? '',
    contentHash: params.contentHash ?? null,
    fetchDurationMs: params.fetchDurationMs,
    error: params.error ?? null,
  };
}

export async function captureArchiveSnapshot(url: string): Promise<ArchiveSnapshot> {
  const capturedAt = new Date().toISOString();
  const startedAt = Date.now();
  const normalized = normalizeSourceUrl(url);

  if (!normalized) {
    return createSnapshot({
      capturedAt,
      sourceUrl: typeof url === 'string' ? url.trim() : '',
      outcome: 'invalid_url',
      fetchDurationMs: Date.now() - startedAt,
      error: 'Invalid URL',
    });
  }

  try {
    const response = await fetch(normalized, {
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'user-agent': 'mind-archive-snapshot/1.0',
      },
    });

    const contentType = response.headers.get('content-type');
    const lowerContentType = contentType?.toLowerCase() ?? '';
    const finalUrl = response.url || normalized;
    const fetchDurationMs = Date.now() - startedAt;

    if (!response.ok) {
      return createSnapshot({
        capturedAt,
        sourceUrl: normalized,
        finalUrl,
        statusCode: response.status,
        contentType,
        outcome: 'http_error',
        fetchDurationMs,
        error: `HTTP ${response.status}`,
      });
    }

    const isHtml =
      lowerContentType.includes('text/html') || lowerContentType.includes('application/xhtml+xml');

    if (!isHtml) {
      if (lowerContentType.startsWith('text/')) {
        const textBody = await response.text();
        const normalizedText = textBody.replace(/\s+/g, ' ').trim();
        const textPreview = normalizedText.slice(0, MAX_TEXT_PREVIEW_LENGTH);

        return createSnapshot({
          capturedAt,
          sourceUrl: normalized,
          finalUrl,
          statusCode: response.status,
          contentType,
          outcome: 'non_html',
          textPreview,
          excerpt: toExcerpt(textPreview),
          contentHash: createHash('sha256').update(textBody).digest('hex'),
          fetchDurationMs,
          error: 'Content type is not HTML',
        });
      }

      return createSnapshot({
        capturedAt,
        sourceUrl: normalized,
        finalUrl,
        statusCode: response.status,
        contentType,
        outcome: 'non_html',
        fetchDurationMs,
        error: 'Content type is not HTML',
      });
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

    return createSnapshot({
      capturedAt,
      sourceUrl: normalized,
      finalUrl,
      statusCode: response.status,
      contentType,
      outcome: 'captured',
      title: extractTitle(html),
      excerpt: toExcerpt(textPreview),
      textPreview,
      htmlPreview,
      contentHash: createHash('sha256').update(html).digest('hex'),
      fetchDurationMs,
    });
  } catch (error) {
    return createSnapshot({
      capturedAt,
      sourceUrl: normalized,
      outcome: 'network_error',
      fetchDurationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}