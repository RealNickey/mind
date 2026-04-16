import { unfurl } from 'unfurl.js';
import { detectContentType, ContentType } from './content-detection';

export interface ExtractedMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  author: string | null;
  publishedDate: string | null;
  contentType: ContentType;
  sourceUrl: string;
  raw: any; // The raw unfurl data for debugging/advanced usage
}

/**
 * Extracts metadata from a given URL using unfurl.js.
 */
export async function extractUrlMetadata(url: string): Promise<ExtractedMetadata> {
  try {
    const result = await unfurl(url, {
      timeout: 10000,
      follow: 5,
      oembed: true,
    });

    // Extract title
    const title =
      result.open_graph?.title ||
      result.twitter_card?.title ||
      result.title ||
      null;

    // Extract description
    const description =
      result.open_graph?.description ||
      result.twitter_card?.description ||
      result.description ||
      null;

    // Extract hero image
    const image =
      result.open_graph?.images?.[0]?.url ||
      result.twitter_card?.images?.[0]?.url ||
      null;

    // Extract favicon
    const favicon = result.favicon || null;

    // Extract author
    const author =
      (result.open_graph as any)?.article?.author ||
      result.twitter_card?.creator ||
      (result.oEmbed as any)?.author_name ||
      null;

    // Extract published date
    const publishedDate =
      (result.open_graph as any)?.article?.published_time || null;

    // Determine the content type based on URL and extracted metadata
    const contentType = detectContentType(url, result);

    return {
      title,
      description,
      image,
      favicon,
      author,
      publishedDate,
      contentType,
      sourceUrl: url,
      raw: result,
    };
  } catch (error) {
    console.error(`Failed to extract metadata for ${url}:`, error);
    
    // Fallback if unfurl fails but we still have a URL (or string)
    const fallbackContentType = detectContentType(url, null);

    return {
      title: url,
      description: null,
      image: null,
      favicon: null,
      author: null,
      publishedDate: null,
      contentType: fallbackContentType,
      sourceUrl: url,
      raw: null,
    };
  }
}
