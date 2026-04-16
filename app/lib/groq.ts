/**
 * Groq API integration for fallback embeddings and text generation
 */

// If Groq embeddings endpoint is used, it often defaults to nomic-embed-text-v1_5
// which produces 768 dimensions. We truncate to 384 to match Prisma vector(384).
export async function generateGroqEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set');
  }

  // Ensure this uses the correct endpoint structure for Groq if supported.
  // Groq provides an OpenAI-compatible API.
  const res = await fetch('https://api.groq.com/openai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: text,
      // Fallback model currently supported/proposed by Groq
      model: 'nomic-embed-text-v1_5'
    })
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Groq API Error: ${res.status} ${res.statusText} - ${errorBody}`);
  }

  const data = await res.json();
  const embedding: number[] = data.data[0].embedding;

  // Truncate to 384 dimensions because our pgvector schema expects 384.
  // Nomic models support Matryoshka learning allowing valid truncation.
  return embedding.length > 384 ? embedding.slice(0, 384) : embedding;
}
