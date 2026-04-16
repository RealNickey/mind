import { NextResponse } from 'next/server';
import { generateLocalEmbedding } from '@/app/lib/embeddings';
import { generateGroqEmbedding } from '@/app/lib/groq';
import { EmbeddingRequest, EmbeddingResponse, APIErrorResponse } from '@/app/lib/types';

export async function POST(req: Request) {
  try {
    const body: EmbeddingRequest = await req.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json<APIErrorResponse>({ error: 'Valid text is required' }, { status: 400 });
    }

    let embedding: number[];
    let source: 'local' | 'groq' = 'local';

    try {
      // Try local transformers.js first (all-MiniLM-L6-v2, 384 dims)
      embedding = await generateLocalEmbedding(text);
    } catch (localError: unknown) {
      console.warn('Local embedding failed, falling back to Groq API:', localError instanceof Error ? localError.message : String(localError));
      
      // Fallback to Groq API (Matryoshka truncation to 384 dims)
      try {
        embedding = await generateGroqEmbedding(text);
        source = 'groq';
      } catch (groqError: unknown) {
        console.error('Groq embedding fallback also failed:', groqError instanceof Error ? groqError.message : String(groqError));
        throw new Error('All embedding providers failed');
      }
    }

    return NextResponse.json<EmbeddingResponse>({ embedding, source, dimensions: embedding.length });
  } catch (error: unknown) {
    console.error('Embedding generation API error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json<APIErrorResponse>({ error: error instanceof Error ? error.message : 'Failed to generate embeddings' }, { status: 500 });
  }
}
