import { NextRequest, NextResponse } from 'next/server';
import { extractUrlMetadata } from '@/app/lib/metadata';
import { enrichMetadataWithLLM } from '@/app/lib/openai-metadata';

export async function POST(req: NextRequest) {
  try {
    const { url, skipEnrichment } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
      
    }

    const metadata = await extractUrlMetadata(url);

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

    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return NextResponse.json({ error: 'Failed to extract metadata' }, { status: 500 });
  }
}
