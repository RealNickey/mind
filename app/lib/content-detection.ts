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

export function detectContentType(url: string, metadata: any): ContentType {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname.toLowerCase();

    // Specific domain detection
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return 'twitter';
    }
    if (hostname.includes('instagram.com')) {
      return 'instagram';
    }
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube';
    }
    if (hostname.includes('github.com')) {
      return 'github';
    }
    if (hostname.includes('imdb.com')) {
      if (pathname.includes('/title/')) {
        // Simple heuristic; TV shows usually have specific metadata tags, but 'movie' or 'tvshow' can be inferred here or by TMDB later.
        return metadata?.open_graph?.type === 'video.tv_show' ? 'tvshow' : 'movie';
      }
    }
    if (hostname.includes('openlibrary.org') || hostname.includes('goodreads.com')) {
      return 'book';
    }
    if (hostname.includes('spotify.com') || hostname.includes('music.apple.com') || hostname.includes('soundcloud.com')) {
      return 'music';
    }
    if (hostname.includes('maps.google.com') || hostname.includes('openstreetmap.org')) {
      return 'place';
    }
    if (hostname.includes('amazon.com') || hostname.includes('ebay.com') || hostname.includes('etsy.com')) {
      return 'product';
    }
    if (hostname.includes('allrecipes.com') || hostname.includes('foodnetwork.com')) {
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
    if (metadata?.schema_org?.some((schema: any) => schema['@type'] === 'Recipe')) {
      return 'recipe';
    }
    if (metadata?.schema_org?.some((schema: any) => schema['@type'] === 'Product')) {
      return 'product';
    }

    return 'link';
  } catch (error) {
    // If URL parsing fails, might be direct text/note content
    if (url.startsWith('#') || url.includes('rgb') || url.includes('hsl')) return 'color';
    return 'note';
  }
}
