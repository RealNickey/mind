import { unfurl } from 'unfurl.js';
import { detectContentType, ContentType } from './content-detection';
import { normalizeSourceUrl } from './url-utils';

type UnfurlResult = Awaited<ReturnType<typeof unfurl>>;

type OpenGraphArticle = {
  author?: string;
  published_time?: string;
};

type OEmbedData = {
  author_name?: string;
};

function getOpenGraphArticle(result: UnfurlResult): OpenGraphArticle | null {
  const openGraphData = result.open_graph as unknown;
  if (!openGraphData || typeof openGraphData !== 'object' || Array.isArray(openGraphData)) {
    return null;
  }

  const articleData = (openGraphData as { article?: unknown }).article;
  if (!articleData || typeof articleData !== 'object' || Array.isArray(articleData)) {
    return null;
  }

  return articleData as OpenGraphArticle;
}

function getOEmbedData(result: UnfurlResult): OEmbedData | null {
  const oEmbedData = result.oEmbed as unknown;
  if (!oEmbedData || typeof oEmbedData !== 'object' || Array.isArray(oEmbedData)) {
    return null;
  }

  return oEmbedData as OEmbedData;
}

export interface ExtractedMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  author: string | null;
  publishedDate: string | null;
  contentType: ContentType;
  sourceUrl: string;
  raw: unknown; // The raw unfurl data for debugging/advanced usage
}

/**
 * Extracts metadata from a given URL using unfurl.js.
 */
export async function extractUrlMetadata(url: string): Promise<ExtractedMetadata> {
  const normalizedUrl = normalizeSourceUrl(url) ?? url;

  try {
    const result = await unfurl(normalizedUrl, {
      timeout: 10000,
      follow: 5,
      oembed: true,
    });

    const openGraphArticle = getOpenGraphArticle(result);
    const oEmbedData = getOEmbedData(result);

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
      openGraphArticle?.author ||
      result.twitter_card?.creator ||
      oEmbedData?.author_name ||
      null;

    // Extract published date
    const publishedDate =
      openGraphArticle?.published_time || null;

    // Determine the content type based on URL and extracted metadata
    const contentType = detectContentType(normalizedUrl, result);

    return {
      title,
      description,
      image,
      favicon,
      author,
      publishedDate,
      contentType,
      sourceUrl: normalizedUrl,
      raw: result,
    };
  } catch (error) {
    console.error(`Failed to extract metadata for ${normalizedUrl}:`, error);
    
    // Fallback if unfurl fails but we still have a URL (or string)
    const fallbackContentType = detectContentType(normalizedUrl, null);

    return {
      title: normalizedUrl,
      description: null,
      image: null,
      favicon: null,
      author: null,
      publishedDate: null,
      contentType: fallbackContentType,
      sourceUrl: normalizedUrl,
      raw: null,
    };
  }
}
