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
    const pathname = parsedUrl.pathname.toLowerCase();
    const tld = parse(url);
    const domain = tld.domain || '';

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
    if (domain === 'spotify.com' || domain === 'apple.com' || domain === 'soundcloud.com') {
      return 'music';
    }
    if (domain === 'google.com' || domain === 'openstreetmap.org') {
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
