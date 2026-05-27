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

function safeParseUrl(rawUrl: string | null | undefined): URL | null {
  if (!rawUrl) {
    return null;
  }

  try {
    return new URL(rawUrl);
  } catch {
    try {
      return new URL(`https://${rawUrl}`);
    } catch {
      return null;
    }
  }
}

function extractYouTubeId(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const match = value.match(/[a-zA-Z0-9_-]{11}/);
  return match ? match[0] : null;
}

function parseYouTubeStartSeconds(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  const match = trimmed.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i);
  if (!match) {
    return null;
  }

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);

  const total = hours * 3600 + minutes * 60 + seconds;
  return total > 0 ? total : null;
}

export function getYouTubeVideoId(url: string | null | undefined): string | null {
  const parsed = safeParseUrl(url);
  if (!parsed) {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();
  const pathSegments = parsed.pathname.split('/').filter(Boolean);

  if (hostname === 'youtu.be' || hostname.endsWith('.youtu.be')) {
    return extractYouTubeId(pathSegments[0]);
  }

  if (hostname.endsWith('youtube.com') || hostname.endsWith('youtube-nocookie.com')) {
    if (parsed.pathname.startsWith('/watch')) {
      return extractYouTubeId(parsed.searchParams.get('v'));
    }

    const [first, second] = pathSegments;
    if (first === 'embed' || first === 'shorts' || first === 'live' || first === 'v') {
      return extractYouTubeId(second);
    }
  }

  return extractYouTubeId(parsed.searchParams.get('v'));
}

type YouTubeEmbedOptions = {
  autoplay?: boolean;
  mute?: boolean;
  controls?: boolean;
  start?: number | null;
  playlistId?: string | null;
};

export function getYouTubeEmbedUrl(
  url: string | null | undefined,
  options: YouTubeEmbedOptions = {},
): string | null {
  const parsed = safeParseUrl(url);
  if (!parsed) {
    return null;
  }

  const videoId = getYouTubeVideoId(url);
  const hashParams = parsed.hash ? new URLSearchParams(parsed.hash.slice(1)) : null;
  const listId = options.playlistId ?? parsed.searchParams.get('list');
  const startFromUrl =
    parseYouTubeStartSeconds(parsed.searchParams.get('start')) ??
    parseYouTubeStartSeconds(parsed.searchParams.get('t')) ??
    parseYouTubeStartSeconds(hashParams?.get('t'));
  const start = typeof options.start === 'number' ? options.start : startFromUrl;

  const autoplay = options.autoplay ? '1' : '0';
  const shouldMute = options.mute ?? options.autoplay ?? false;

  const params = new URLSearchParams();
  params.set('autoplay', autoplay);
  params.set('mute', shouldMute ? '1' : '0');
  params.set('playsinline', '1');
  params.set('rel', '0');
  params.set('modestbranding', '1');
  params.set('controls', options.controls === false ? '0' : '1');

  if (typeof start === 'number' && start > 0) {
    params.set('start', String(start));
  }

  if (listId) {
    params.set('list', listId);
  }

  const base = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}`
    : listId
      ? 'https://www.youtube-nocookie.com/embed/videoseries'
      : null;

  if (!base) {
    return null;
  }

  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
