import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { embed } from 'ai';
import { cohere } from '@ai-sdk/cohere';
import { hydrateItems } from '@/app/lib/item-hydration';
import type { HydratedItem } from '@/app/lib/item-hydration';
import { z } from 'zod';
import { serializeVector } from '@/app/lib/vector-codec';
import { parseJsonBody } from '@/app/api/_validation';

const semanticSearchSchema = z.object({
  query: z.string().trim().min(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

type SemanticResult = HydratedItem & {
  semanticScore: number | null;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Failed to perform semantic search';
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = semanticSearchSchema.safeParse({
      query: searchParams.get('q') ?? searchParams.get('query') ?? '',
      limit: searchParams.get('limit') ?? '10',
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Valid query is required' }, { status: 400 });
    }

    return await handleSearch(parsed.data.query, parsed.data.limit);
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error('Semantic search GET error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const parsedBody = await parseJsonBody(req, semanticSearchSchema, {
      invalidBodyMessage: 'Valid query is required',
      includeValidationDetails: false,
    });
    if (!parsedBody.success) {
      return parsedBody.response;
    }

    return await handleSearch(parsedBody.data.query, parsedBody.data.limit);
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error('Semantic search POST error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleSearch(query: string, safeLimit: number) {
  const source = 'cohere';

  // Generate embedding using Cohere English v3.0 model
  const { embedding } = await embed({
    model: cohere.embedding('embed-english-v3.0'),
    value: query,
  });

  // Convert vector array to string representation for pgvector parameter casting
  const vectorString = serializeVector(embedding);

  // Perform vector similarity search using raw SQL pgvector '<=>' (cosine distance operator)
  // By doing '1 - distance' we get the cosine similarity
  const { data: matchData, error: rpcErr } = await db.rpc('match_items', {
    query_embedding: vectorString,
    match_threshold: 0,
    match_count: safeLimit,
  });

  if (rpcErr) throw rpcErr;

  const ids = (matchData ?? []).map((row) => row.id);
  let results: SemanticResult[] = [];

  if (ids.length > 0) {
    const { data: items, error: itemsErr } = await db
      .from('Item')
      .select('*')
      .in('id', ids);

    if (itemsErr) throw itemsErr;

    const hydrated = await hydrateItems(items ?? []);
    const hydratedById = new Map(hydrated.map((item) => [item.id, item]));

    results = (matchData ?? [])
      .map((match) => {
        const item = hydratedById.get(match.id);
        if (!item) {
          return null;
        }

        return {
          ...item,
          semanticScore: typeof match.similarity === 'number' ? match.similarity : null,
        };
      })
      .filter((entry): entry is SemanticResult => Boolean(entry));
  }

  return NextResponse.json({
    results,
    meta: {
      source,
      limit: safeLimit,
      query,
    },
  });
}

