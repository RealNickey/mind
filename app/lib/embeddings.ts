import { embed } from 'ai';
import { cohere } from '@ai-sdk/cohere';

export async function generateLocalEmbedding(text: string): Promise<number[]> {
  try {
    const { embedding } = await embed({
      model: cohere.embedding('embed-english-v3.0'),
      value: text,
    });
    return embedding;
  } catch (error) {
    console.error('Failed to generate embedding with Cohere:', error);
    throw error;
  }
}
