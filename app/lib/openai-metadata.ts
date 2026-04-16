import { OpenAI } from 'openai';

// Assuming you have an OpenAI interface available configured via GROQ or OPENAI
// Using OpenAI library as a wrapper which is compatible with many standard LLM APIs (like Groq)
export async function enrichMetadataWithLLM(
  title: string | null,
  description: string | null,
  url: string | null
): Promise<{ title?: string; summary?: string; tags?: string[] } | null> {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('No LLM API key configured for metadata enrichment.');
    return null;
  }

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : undefined,
    });

    const promptText = `
You are helping categorize bookmarks/content.
Given the following information about a piece of content:
URL: ${url || 'Unknown'}
Title: ${title || 'Unknown'}
Description/Snippet: ${description || 'Unknown'}

Please output a JSON object with enriched metadata containing:
1. "title": a clean, concise title.
2. "summary": a one-sentence engaging summary.
3. "tags": an array of 2-5 relevant tags.

Return ONLY the raw JSON object.
`;

    const response = await client.chat.completions.create({
      model: process.env.GROQ_API_KEY ? 'llama3-8b-8192' : 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: promptText }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      title: parsed.title,
      summary: parsed.summary,
      tags: parsed.tags,
    };
  } catch (error) {
    console.error('Error during LLM metadata enrichment:', error);
    return null;
  }
}
