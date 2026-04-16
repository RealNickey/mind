import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { generateLocalEmbedding } from '@/app/lib/embeddings';
import { generateGroqEmbedding } from '@/app/lib/groq';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, limit = 10 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Valid query is required' }, { status: 400 });
    }

    let embedding: number[];
    let source = 'local';

    try {
      // Prioritize local embedding model
      embedding = await generateLocalEmbedding(query);
    } catch (localError: any) {
      console.warn('Local embedding failed during semantic search, falling back to Groq:', localError.message);
      
      try {
        embedding = await generateGroqEmbedding(query);
        source = 'groq';
      } catch (groqError: any) {
        console.error('Groq semantic search fallback failed:', groqError.message);
        throw new Error('All embedding providers failed');
      }
    }

    // Convert vector array to string representation for pgvector parameter casting
    const vectorString = `[${embedding.join(',')}]`;

    // Perform vector similarity search using raw SQL pgvector '<=>' (cosine distance operator)
    // By doing '1 - distance' we get the cosine similarity
    const { data: matchData, error: rpcErr } = await db.rpc('match_items', {
      query_embedding: vectorString,
      match_threshold: 0,
      match_count: Number(limit)
    });

    if (rpcErr) throw rpcErr;

    const ids = (matchData || []).map((row: any) => row.id);
    let results: any[] = [];

    if (ids.length > 0) {
      const { data: items, error: itemsErr } = await db
        .from('Item')
        .select('id, title, description, type')
        .in('id', ids);

      if (itemsErr) throw itemsErr;

      results = (matchData || []).map((match: any) => ({
        ...match,
        ...(items?.find((i: any) => i.id === match.id) || {})
      }));
    }

    return NextResponse.json({ 
      results,
      meta: {
        source,
        limit,
        query
      }
    });

  } catch (error: any) {
    console.error('Semantic search API error:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to perform semantic search' }, { status: 500 });
  }
}
