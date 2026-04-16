import linkCheck from 'link-check';
import { normalizeSourceUrl } from './url-utils';

export type LinkHealthStatus = 'alive' | 'broken' | 'unknown';

const DEFAULT_TIMEOUT_MS = 10_000;
const MIN_TIMEOUT_MS = 2_000;
const MAX_TIMEOUT_MS = 30_000;
const DEFAULT_RETRY_COUNT = 1;
const MAX_RETRY_COUNT = 4;
const DEFAULT_RETRY_DELAY_MS = 600;
const MAX_RETRY_DELAY_MS = 5_000;

const RETRYABLE_STATUS_CODES = new Set<number>([
  408,
  425,
  429,
  500,
  502,
  503,
  504,
  520,
  521,
  522,
  523,
  524,
]);

export interface LinkHealthCheckOptions {
  timeoutMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
}

export interface LinkHealthResult {
  status: LinkHealthStatus;
  statusCode: number | null;
  checkedAt: string;
  checkedUrl: string;
  error: string | null;
  attempts: number;
  durationMs: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function parsePositiveNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function timeoutToLinkCheckFormat(timeoutMs: number): string {
  return `${Math.max(1, Math.ceil(timeoutMs / 1000))}s`;
}

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function executeLinkCheck(
  url: string,
  timeoutMs: number
): Promise<import('link-check').LinkCheckResult> {
  return new Promise((resolve, reject) => {
    linkCheck(
      url,
      {
        timeout: timeoutToLinkCheckFormat(timeoutMs),
        retryOn429: false,
        retryCount: 0,
        fallbackRetryDelay: '1s',
        user_agent: 'mind-link-health/1.0',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );
  });
}

function shouldRetry(status: LinkHealthStatus, statusCode: number | null): boolean {
  if (status === 'unknown') {
    return true;
  }

  if (statusCode === null) {
    return false;
  }

  return RETRYABLE_STATUS_CODES.has(statusCode);
}

function mapResult(
  rawResult: import('link-check').LinkCheckResult,
  normalizedUrl: string,
  attempt: number,
  startedAt: number
): LinkHealthResult {
  const statusCode =
    typeof rawResult.statusCode === 'number' && Number.isFinite(rawResult.statusCode) && rawResult.statusCode > 0
      ? rawResult.statusCode
      : null;
  const status: LinkHealthStatus =
    rawResult.status === 'alive' ? 'alive' : statusCode === null ? 'unknown' : 'broken';

  return {
    status,
    statusCode,
    checkedAt: new Date().toISOString(),
    checkedUrl: rawResult.link || normalizedUrl,
    error: rawResult.err ? String(rawResult.err) : null,
    attempts: attempt,
    durationMs: Date.now() - startedAt,
  };
}

function mapError(
  error: unknown,
  normalizedUrl: string,
  attempt: number,
  startedAt: number
): LinkHealthResult {
  return {
    status: 'unknown',
    statusCode: null,
    checkedAt: new Date().toISOString(),
    checkedUrl: normalizedUrl,
    error: error instanceof Error ? error.message : String(error),
    attempts: attempt,
    durationMs: Date.now() - startedAt,
  };
}

export async function checkLinkHealth(
  url: string,
  options?: LinkHealthCheckOptions
): Promise<LinkHealthResult> {
  const normalized = normalizeSourceUrl(url) ?? url;
  const timeoutMs = clamp(
    Math.round(parsePositiveNumber(options?.timeoutMs) ?? DEFAULT_TIMEOUT_MS),
    MIN_TIMEOUT_MS,
    MAX_TIMEOUT_MS
  );
  const retryCount = clamp(
    Math.round(parsePositiveNumber(options?.retryCount) ?? DEFAULT_RETRY_COUNT),
    0,
    MAX_RETRY_COUNT
  );
  const retryDelayMs = clamp(
    Math.round(parsePositiveNumber(options?.retryDelayMs) ?? DEFAULT_RETRY_DELAY_MS),
    100,
    MAX_RETRY_DELAY_MS
  );

  const startedAt = Date.now();
  const maxAttempts = retryCount + 1;
  let latestResult: LinkHealthResult | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await executeLinkCheck(normalized, timeoutMs);
      latestResult = mapResult(result, normalized, attempt, startedAt);
    } catch (error) {
      latestResult = mapError(error, normalized, attempt, startedAt);
    }

    const isLastAttempt = attempt >= maxAttempts;
    if (!latestResult || isLastAttempt || !shouldRetry(latestResult.status, latestResult.statusCode)) {
      return (
        latestResult ?? {
          status: 'unknown',
          statusCode: null,
          checkedAt: new Date().toISOString(),
          checkedUrl: normalized,
          error: 'Unknown link-health failure',
          attempts: attempt,
          durationMs: Date.now() - startedAt,
        }
      );
    }

    const backoffDelayMs = Math.min(30_000, retryDelayMs * Math.pow(2, attempt - 1));
    await wait(backoffDelayMs);
  }

  return {
    status: 'unknown',
    statusCode: null,
    checkedAt: new Date().toISOString(),
    checkedUrl: normalized,
    error: 'Link health check exhausted retries',
    attempts: maxAttempts,
    durationMs: Date.now() - startedAt,
  };
}