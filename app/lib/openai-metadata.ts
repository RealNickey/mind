import { generateObject } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

export async function enrichMetadataWithLLM(
  title: string | null,
  description: string | null,
  url: string | null
): Promise<{ title?: string; summary?: string; tags?: string[] } | null> {
  const groqApiKey = process.env.GROQ_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!groqApiKey && !openaiApiKey) {
    console.warn('No LLM API key configured for metadata enrichment.');
    return null;
  }

  const model = groqApiKey
    ? createGroq({ apiKey: groqApiKey })('llama3-8b-8192')
    : createOpenAI({ apiKey: openaiApiKey! })('gpt-3.5-turbo');

  try {
    const promptText = `
You are helping categorize bookmarks/content.
Given the following information about a piece of content:
URL: ${url || 'Unknown'}
Title: ${title || 'Unknown'}
Description/Snippet: ${description || 'Unknown'}
`;

    const { object } = await generateObject({
      model,
      system: 'You are an assistant. Please output a JSON object with enriched metadata containing a clean concise title, a one-sentence engaging summary, and an array of 2-5 relevant tags.',
      prompt: promptText,
      schema: z.object({
        title: z.string().describe("A clean, concise title."),
        summary: z.string().describe("A one-sentence engaging summary."),
        tags: z.array(z.string()).describe("An array of 2-5 relevant tags.")
      }),
      temperature: 0.1,
    });

    return {
      title: object.title,
      summary: object.summary,
      tags: object.tags,
    };
  } catch (error) {
    console.error('Error during LLM metadata enrichment:', error);
    return null;
  }
}
