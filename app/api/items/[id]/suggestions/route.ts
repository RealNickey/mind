import { NextResponse } from 'next/server';
import { getSemanticAndDuplicateSuggestions } from '@/app/lib/semantic-links';
import { z } from 'zod';

const suggestionsQuerySchema = z.object({
  semanticLimit: z.coerce.number().int().min(1).default(8).transform(val => Math.min(20, val)),
  duplicateLimit: z.coerce.number().int().min(1).default(8).transform(val => Math.min(20, val)),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);

    const parseResult = suggestionsQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { semanticLimit, duplicateLimit } = parseResult.data;

    const suggestions = await getSemanticAndDuplicateSuggestions(id, {
      semanticLimit,
      duplicateLimit,
    });

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Suggestion generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate semantic and duplicate suggestions' },
      { status: 500 }
    );
  }
}