import linkCheck from 'link-check';
import { normalizeSourceUrl } from './url-utils';

export type LinkHealthStatus = 'alive' | 'broken' | 'unknown';

export interface LinkHealthResult {
  status: LinkHealthStatus;
  statusCode: number | null;
  checkedAt: string;
  checkedUrl: string;
  error: string | null;
}

function executeLinkCheck(url: string): Promise<import('link-check').LinkCheckResult> {
  return new Promise((resolve, reject) => {
    linkCheck(
      url,
      {
        timeout: '10s',
        retryOn429: true,
        retryCount: 1,
        fallbackRetryDelay: '10s',
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

export async function checkLinkHealth(url: string): Promise<LinkHealthResult> {
  const checkedAt = new Date().toISOString();
  const normalized = normalizeSourceUrl(url) ?? url;

  try {
    const result = await executeLinkCheck(normalized);
    return {
      status: result.status === 'alive' ? 'alive' : 'broken',
      statusCode: Number.isFinite(result.statusCode) ? result.statusCode : null,
      checkedAt,
      checkedUrl: result.link || normalized,
      error: result.err ? String(result.err) : null,
    };
  } catch (error) {
    return {
      status: 'unknown',
      statusCode: null,
      checkedAt,
      checkedUrl: normalized,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}