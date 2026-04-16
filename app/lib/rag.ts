import { db } from './db';
import { generateEmbedding } from './vectors';

export async function searchSimilarItems(query: string, limit = 5) {
  try {
    const vector = await generateEmbedding(query);
    
    const vectorStr = `[${vector.join(',')}]`;
    
    const { data: matchData, error: rpcErr } = await db.rpc('match_items', {
      query_embedding: vectorStr,
      match_threshold: 0,
      match_count: limit
    });
    if (rpcErr) throw rpcErr;

    const ids = (matchData || []).map((row: any) => row.id);
    if (!ids.length) return [];

    const { data: items, error: itemsErr } = await db
      .from('Item')
      .select('id, title, description, content, type')
      .in('id', ids);
    if (itemsErr) throw itemsErr;

    const results = (matchData || []).map((match: any) => ({
      ...match,
      ...(items?.find((i: any) => i.id === match.id) || {})
    }));
    
    return results as any[];
  } catch (error) {
    console.error('RAG semantic search error:', error);
    return [];
  }
}
