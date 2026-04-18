import normalizeUrl from 'normalize-url';
import { parse } from 'tldts';

const TRACKING_QUERY_PARAMS: ReadonlyArray<string | RegExp> = [
  /^utm_\w+/i,
  /^fbclid$/i,
  /^gclid$/i,
  /^igshid$/i,
  /^mc_[a-z_]+$/i,
];

export function normalizeSourceUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return normalizeUrl(withProtocol, {
      stripHash: true,
      stripTextFragment: true,
      stripWWW: false,
      removeTrailingSlash: true,
      removeQueryParameters: TRACKING_QUERY_PARAMS,
      sortQueryParameters: true,
    });
  } catch {
    return null;
  }
}

function parseHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function getHostnameFallback(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  const withoutProtocol = trimmed.replace(/^[a-z][a-z\d+\-.]*:\/\//i, '');
  const [hostLike] = withoutProtocol.split(/[/?#]/);
  const fallback = hostLike?.trim();

  if (!fallback) {
    return trimmed;
  }

  return fallback.replace(/^www\./i, '');
}

export function getHostname(url: string | null | undefined): string | null {
  const normalized = normalizeSourceUrl(url);
  if (!normalized) {
    return null;
  }

  return parseHostname(normalized);
}

export function getDisplayDomain(
  url: string | null | undefined,
  fallback: string | null = null,
): string | null {
  const normalized = normalizeSourceUrl(url);
  if (normalized) {
    const hostname = parseHostname(normalized);
    if (hostname) {
      const parsedDomain = parse(hostname).domain;
      if (parsedDomain) {
        return parsedDomain;
      }

      return hostname.replace(/^www\./i, '');
    }
  }

  return getHostnameFallback(url) ?? fallback;
}
