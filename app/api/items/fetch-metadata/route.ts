import { NextRequest, NextResponse } from 'next/server';
import { extractUrlMetadata } from '@/app/lib/metadata';
import { enrichMetadataWithLLM } from '@/app/lib/openai-metadata';
import { normalizeSourceUrl } from '@/app/lib/url-utils';
import { checkLinkHealth } from '@/app/lib/link-health';
import { captureArchiveSnapshot } from '@/app/lib/archive';

export async function POST(req: NextRequest) {
  try {
    const { url, skipEnrichment } = await req.json();

    const normalizedUrl = normalizeSourceUrl(url);
    if (!normalizedUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const metadata = await extractUrlMetadata(normalizedUrl);
    const [linkHealth, archiveSnapshot] = await Promise.all([
      checkLinkHealth(normalizedUrl).catch((error) => {
        console.warn('Link health check failed:', error);
        return null;
      }),
      captureArchiveSnapshot(normalizedUrl).catch((error) => {
        console.warn('Archive snapshot capture failed:', error);
        return null;
      }),
    ]);

    // If requested or if metadata is weak, optionally use LLM to enrich content
    if (!skipEnrichment && metadata && metadata.contentType !== 'note' && metadata.contentType !== 'color') {
      try {
        const enriched = await enrichMetadataWithLLM(metadata.title, metadata.description, metadata.sourceUrl);
        if (enriched) {
          metadata.title = enriched.title || metadata.title;
          metadata.description = enriched.summary || metadata.description;
          // Could also parse and map more fields if necessary
        }
      } catch (e) {
        console.warn('LLM enrichment failed or is unavailable:', e);
      }
    }

    return NextResponse.json({
      ...metadata,
      linkHealth,
      archiveSnapshot,
    });
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return NextResponse.json({ error: 'Failed to extract metadata' }, { status: 500 });
  }
}
