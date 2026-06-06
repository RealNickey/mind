import { db } from './db';
import { generateEmbedding } from './vectors';
import type { Database, Tables } from './database.types';
import { serializeVector } from './vector-codec';

type MatchItemRow = Database['public']['Functions']['match_items']['Returns'][number];
type RagItem = Pick<Tables<'Item'>, 'id' | 'title' | 'description' | 'content' | 'type'>;

export type SimilarItemResult = RagItem & {
  similarity: number;
};

export async function searchSimilarItems(query: string, limit = 5, collectionId?: string | null): Promise<SimilarItemResult[]> {
  try {
    const vector = await generateEmbedding(query);
    
    const vectorStr = serializeVector(vector);
    
    const { data: matchData, error: rpcErr } = await db.rpc('match_items', {
      query_embedding: vectorStr,
      match_threshold: 0,
      match_count: limit
    });
    if (rpcErr) throw rpcErr;

    let ids = (matchData ?? []).map((row: MatchItemRow) => row.id);
    if (!ids.length) return [];

    if (collectionId) {
      const { data: collectionLinks, error: linksError } = await db
        .from('_CollectionToItem')
        .select('B')
        .eq('A', collectionId);
      if (linksError) throw linksError;
      const collectionItemIds = new Set((collectionLinks ?? []).map((row) => row.B));
      ids = ids.filter(id => collectionItemIds.has(id));
      if (!ids.length) return [];
    } else {
      // By default, only search items in the Main Space.
      // Exclude items that belong to any custom Space (Space: or Session:).
      const { data: spaces, error: spacesError } = await db
        .from('Collection')
        .select('id')
        .or('name.like.Space:%,name.like.Session:%');
      if (spacesError) throw spacesError;
      
      const spaceIds = (spaces ?? []).map((s) => s.id);
      if (spaceIds.length > 0) {
        const { data: linkedItems, error: linkedError } = await db
          .from('_CollectionToItem')
          .select('B')
          .in('A', spaceIds);
        if (linkedError) throw linkedError;

        const excludedIds = new Set((linkedItems ?? []).map((row) => row.B));
        ids = ids.filter(id => !excludedIds.has(id));
        if (!ids.length) return [];
      }
    }

    const { data: items, error: itemsErr } = await db
      .from('Item')
      .select('id, title, description, content, type')
      .in('id', ids);
    if (itemsErr) throw itemsErr;

    const itemsById = new Map((items ?? []).map((item) => [item.id, item]));

    const results = (matchData ?? [])
      .map((match: MatchItemRow) => {
        const item = itemsById.get(match.id);
        if (!item) {
          return null;
        }

        return {
          ...item,
          similarity: match.similarity,
        };
      })
      .filter((entry): entry is SimilarItemResult => Boolean(entry));
    
    return results;
  } catch (error) {
    console.error('RAG semantic search error:', error);
    return [];
  }
}
