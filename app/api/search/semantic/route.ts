import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { embed } from 'ai';
import { cohere } from '@ai-sdk/cohere';
import { hydrateItems } from '@/app/lib/item-hydration';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, limit = 10 } = body;
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Valid query is required' }, { status: 400 });
    }

    const source = 'cohere';

    // Generate embedding using Cohere English v3.0 model
    const { embedding } = await embed({
      model: cohere.embedding('embed-english-v3.0'),
      value: query,
    });

    // Convert vector array to string representation for pgvector parameter casting
    const vectorString = `[${embedding.join(',')}]`;

    // Perform vector similarity search using raw SQL pgvector '<=>' (cosine distance operator)
    // By doing '1 - distance' we get the cosine similarity
    const { data: matchData, error: rpcErr } = await db.rpc('match_items', {
      query_embedding: vectorString,
      match_threshold: 0,
      match_count: safeLimit
    });

    if (rpcErr) throw rpcErr;

    const ids = (matchData || []).map((row: any) => row.id);
    let results: any[] = [];

    if (ids.length > 0) {
      const { data: items, error: itemsErr } = await db
        .from('Item')
        .select('*')
        .in('id', ids);

      if (itemsErr) throw itemsErr;

      const hydrated = await hydrateItems(items ?? []);
      const hydratedById = new Map(hydrated.map((item) => [item.id, item]));

      results = (matchData || []).map((match: any) => ({
        ...(hydratedById.get(match.id) ?? null),
        semanticScore: typeof match.similarity === 'number' ? match.similarity : null,
      })).filter((entry: any) => Boolean(entry?.id));
    }

    return NextResponse.json({ 
      results,
      meta: {
        source,
        limit: safeLimit,
        query
      }
    });

  } catch (error: any) {
    console.error('Semantic search API error:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to perform semantic search' }, { status: 500 });
  }
}
