import { NextResponse } from 'next/server';
import { embed } from 'ai';
import { cohere } from '@ai-sdk/cohere';
import { EmbeddingResponse, APIErrorResponse } from '@/app/lib/types';
import { z } from 'zod';
import { parseJsonBody } from '@/app/api/_validation';

const embeddingRequestSchema = z.object({
  text: z.string().trim().min(1, 'Valid text is required').max(12000, 'Text is too long'),
});

export async function POST(req: Request) {
  try {
    const parsedBody = await parseJsonBody(req, embeddingRequestSchema, {
      invalidBodyMessage: 'Valid text is required',
      includeValidationDetails: false,
    });
    if (!parsedBody.success) {
      return parsedBody.response;
    }

    const { text } = parsedBody.data;

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
