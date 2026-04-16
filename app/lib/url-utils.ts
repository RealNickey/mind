import normalizeUrl from 'normalize-url';

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

export function getHostname(url: string | null | undefined): string | null {
  const normalized = normalizeSourceUrl(url);
  if (!normalized) {
    return null;
  }

  try {
    return new URL(normalized).hostname;
  } catch {
    return null;
  }
}