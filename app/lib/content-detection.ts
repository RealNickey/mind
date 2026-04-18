import { parse } from 'tldts';

export type ContentType =
  | 'article'
  | 'movie'
  | 'tvshow'
  | 'book'
  | 'image'
  | 'video'
  | 'recipe'
  | 'note'
  | 'link'
  | 'product'
  | 'twitter'
  | 'instagram'
  | 'youtube'
  | 'color'
  | 'music'
  | 'github'
  | 'quote'
  | 'todo'
  | 'place'
  | 'unknown';

type SchemaOrgNode = {
  '@type'?: string | string[];
};

type DetectionMetadata = {
  open_graph?: {
    type?: string;
  };
  schema_org?: SchemaOrgNode[];
} | null;

const APPLE_MUSIC_PATH_HINTS = ['/album/', '/song/', '/playlist/', '/artist/', '/music-video/'];

function isHostOrSubdomain(hostname: string, target: string): boolean {
  return hostname === target || hostname.endsWith(`.${target}`);
}

function isAppleMusicUrl(hostname: string, pathname: string): boolean {
  if (isHostOrSubdomain(hostname, 'music.apple.com')) {
    return true;
  }

  return (
    isHostOrSubdomain(hostname, 'itunes.apple.com') &&
    APPLE_MUSIC_PATH_HINTS.some((segment) => pathname.includes(segment))
  );
}

function isGoogleMapsUrl(hostname: string, pathname: string, domainWithoutSuffix: string): boolean {
  if (domainWithoutSuffix !== 'google') {
    return false;
  }

  const isMapsSubdomain =
    hostname === 'maps.google.com' ||
    hostname.startsWith('maps.google.') ||
    hostname.includes('.maps.google.');
  const isMapsPath = pathname === '/maps' || pathname.startsWith('/maps/');

  return isMapsSubdomain || isMapsPath;
}

function hasSchemaType(node: SchemaOrgNode, expectedType: string): boolean {
  const schemaType = node['@type'];
  if (typeof schemaType === 'string') {
    return schemaType === expectedType;
  }

  if (Array.isArray(schemaType)) {
    return schemaType.includes(expectedType);
  }

  return false;
}

export function detectContentType(url: string, metadata: DetectionMetadata): ContentType {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname.toLowerCase();
    const tld = parse(hostname);
    const domain = tld.domain || '';
    const domainWithoutSuffix = tld.domainWithoutSuffix || '';

    // Specific domain detection
    if (domain === 'twitter.com' || domain === 'x.com') {
      return 'twitter';
    }
    if (domain === 'instagram.com') {
      return 'instagram';
    }
    if (domain === 'youtube.com' || domain === 'youtu.be') {
      return 'youtube';
    }
    if (domain === 'github.com') {
      return 'github';
    }
    if (domain === 'imdb.com') {
      if (pathname.includes('/title/')) {
        // Simple heuristic; TV shows usually have specific metadata tags, but 'movie' or 'tvshow' can be inferred here or by TMDB later.
        return metadata?.open_graph?.type === 'video.tv_show' ? 'tvshow' : 'movie';
      }
    }
    if (domain === 'openlibrary.org' || domain === 'goodreads.com') {
      return 'book';
    }
    if (domain === 'spotify.com' || domain === 'soundcloud.com' || isAppleMusicUrl(hostname, pathname)) {
      return 'music';
    }
    if (domain === 'openstreetmap.org' || isGoogleMapsUrl(hostname, pathname, domainWithoutSuffix)) {
      return 'place';
    }
    if (domain === 'amazon.com' || domain === 'ebay.com' || domain === 'etsy.com') {
      return 'product';
    }
    if (domain === 'allrecipes.com' || domain === 'foodnetwork.com') {
      return 'recipe';
    }

    // OpenGraph type detection
    const ogType = metadata?.open_graph?.type || '';
    if (ogType.includes('article')) return 'article';
    if (ogType.includes('video') || ogType.includes('movie')) return 'video';
    if (ogType.includes('music') || ogType.includes('song')) return 'music';
    if (ogType.includes('book')) return 'book';
    if (ogType.includes('product')) return 'product';
    if (ogType.includes('recipe')) return 'recipe';

    // File extension detection from URL
    if (pathname.match(/\.(jpeg|jpg|gif|png|webp|svg)$/)) {
      return 'image';
    }
    if (pathname.match(/\.(mp4|webm|ogg|mov)$/)) {
      return 'video';
    }
    if (pathname.match(/\.(hex|rgb|hsl)$/) || pathname.includes('color')) {
      return 'color';
    }

    // Fallbacks based on metadata patterns
    if (metadata?.schema_org?.some((schema) => hasSchemaType(schema, 'Recipe'))) {
      return 'recipe';
    }
    if (metadata?.schema_org?.some((schema) => hasSchemaType(schema, 'Product'))) {
      return 'product';
    }

    return 'link';
  } catch {
    // If URL parsing fails, might be direct text/note content
    if (url.startsWith('#') || url.includes('rgb') || url.includes('hsl')) return 'color';
    return 'note';
  }
}
