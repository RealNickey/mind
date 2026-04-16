import { db } from './db';
import { pipeline } from '@xenova/transformers';

const MODEL_VERSION = 'Xenova/all-MiniLM-L6-v2';

class Predictor {
  static task = 'feature-extraction';
  static model = MODEL_VERSION;
  static instance: any = null;

  static async getInstance(progress_callback?: Function) {
    if (this.instance === null) {
      this.instance = await pipeline(this.task as any, this.model, { progress_callback });
    }
    return this.instance;
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const extractor = await Predictor.getInstance();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

export async function storeEmbedding(itemId: string, vector: number[]) {
  const vectorStr = `[${vector.join(',')}]`;
  const { error } = await db.from('Embedding').insert({
    id: crypto.randomUUID(),
    itemId,
    vector: vectorStr,
    modelVersion: 'Xenova/all-MiniLM-L6-v2'
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
  return (matchData || []).map((row: any) => ({
    itemId: row.id,
    similarity: row.similarity
  }));
}
