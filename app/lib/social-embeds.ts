export interface SocialEmbedMetadata {
  html: string;
  author_name?: string;
  author_url?: string;
  provider_name?: string;
  thumbnail_url?: string;
  title?: string;
  type?: string;
  width?: number;
  height?: number;
}

export async function fetchOEmbedMetrics(url: string, providerEndpoint: string): Promise<SocialEmbedMetadata | null> {
  try {
    const res = await fetch(`${providerEndpoint}?url=${encodeURIComponent(url)}&format=json`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('oEmbed fetch error:', error);
    return null;
  }
}

export async function getTwitterMetadata(url: string): Promise<SocialEmbedMetadata | null> {
  return fetchOEmbedMetrics(url, 'https://publish.twitter.com/oembed');
}

export async function getInstagramMetadata(url: string): Promise<SocialEmbedMetadata | null> {
  // Note: Instagram requires Facebook App token now for oEmbeds. 
  // It's recommended to use an unauthenticated scrape or a third-party microservice,
  // but this uses the standard approach for completeness.
  return fetchOEmbedMetrics(url, 'https://graph.facebook.com/v10.0/instagram_oembed');
}

export async function getYouTubeMetadata(url: string): Promise<SocialEmbedMetadata | null> {
  return fetchOEmbedMetrics(url, 'https://www.youtube.com/oembed');
}
