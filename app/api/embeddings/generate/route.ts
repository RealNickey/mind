import { NextResponse } from 'next/server';
import { embed } from 'ai';
import { cohere } from '@ai-sdk/cohere';
import { EmbeddingRequest, EmbeddingResponse, APIErrorResponse } from '@/app/lib/types';

export async function POST(req: Request) {
  try {
    const body: EmbeddingRequest = await req.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json<APIErrorResponse>({ error: 'Valid text is required' }, { status: 400 });
    }

    // Generate embedding using Cohere English v3.0 model (1024 dims)
    const { embedding } = await embed({
      model: cohere.embedding('embed-english-v3.0'),
      value: text,
    });

    return NextResponse.json<EmbeddingResponse>({ embedding, source: 'cohere', dimensions: embedding.length });
  } catch (error: unknown) {
    console.error('Embedding generation API error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json<APIErrorResponse>({ error: error instanceof Error ? error.message : 'Failed to generate embeddings' }, { status: 500 });
  }
}
