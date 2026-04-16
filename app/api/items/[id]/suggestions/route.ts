import { NextResponse } from 'next/server';
import { getSemanticAndDuplicateSuggestions } from '@/app/lib/semantic-links';

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);

    const semanticLimit = parsePositiveInt(searchParams.get('semanticLimit'), 8);
    const duplicateLimit = parsePositiveInt(searchParams.get('duplicateLimit'), 8);

    const suggestions = await getSemanticAndDuplicateSuggestions(id, {
      semanticLimit: Math.min(20, semanticLimit),
      duplicateLimit: Math.min(20, duplicateLimit),
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