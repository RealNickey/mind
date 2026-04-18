import { db } from './db';
import { embed } from 'ai';
import { cohere } from '@ai-sdk/cohere';
import type { Database } from './database.types';

const MODEL_VERSION = 'cohere/embed-english-v3.0';
type MatchItemRow = Database['public']['Functions']['match_items']['Returns'][number];

export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: cohere.embedding('embed-english-v3.0'),
    value: text,
  });
  return embedding;
}

export async function storeEmbedding(itemId: string, vector: number[]) {
  const vectorStr = `[${vector.join(',')}]`;
  const { error } = await db.from('Embedding').insert({
    id: crypto.randomUUID(),
    itemId,
    vector: vectorStr,
    embedding: vectorStr,
    modelVersion: MODEL_VERSION
  });
  if (error) throw error;
}

export async function searchSimilar(queryVector: number[], threshold = 0.7, limit = 10) {
  const vectorStr = `[${queryVector.join(',')}]`;
  
  const { data: matchData, error: rpcErr } = await db.rpc('match_items', {
    query_embedding: vectorStr,
    match_threshold: threshold,
    match_count: limit
  });
  
  if (rpcErr) throw rpcErr;
  
  // match_items returns id, similarity but id is actually itemId in our schema SQL function
  // Look at setup-db.sql: "itemId" as id
  return (matchData || []).map((row: MatchItemRow) => ({
    itemId: row.id,
    similarity: row.similarity
  }));
}
