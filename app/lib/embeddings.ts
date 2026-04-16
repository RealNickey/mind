import { pipeline, env } from '@xenova/transformers';

// Configure transformers.js to skip local cache checking strictly in Next.js
env.allowLocalModels = false;

// Singleton to keep the model loaded in memory
class PipelineSingleton {
  static task = 'feature-extraction';
  static model = 'Xenova/all-MiniLM-L6-v2';
  static instance: any = null;

  static async getInstance(progress_callback?: any) {
    if (this.instance === null) {
      // @ts-ignore - pipeline types can be complex
      this.instance = await pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

export async function generateLocalEmbedding(text: string): Promise<number[]> {
  const extractor = await PipelineSingleton.getInstance();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}
