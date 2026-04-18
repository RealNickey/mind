import { getPromptForContentType, TAGGING_SYSTEM_PROMPT } from './prompts';
import { generateObject } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';

export interface TaggingResult {
  tags: string[];
}

export async function generateTagsForContent(
  type: string, 
  title: string, 
  description?: string | null, 
  content?: string | null
): Promise<string[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set');
  }

  const groq = createGroq({ apiKey });
  const userPrompt = getPromptForContentType(type, title, description, content);

  try {
    const { object } = await generateObject({
      model: groq('llama3-8b-8192'),
      system: TAGGING_SYSTEM_PROMPT,
      prompt: userPrompt,
      schema: z.object({
        tags: z.array(z.string()).describe("A highly relevant, concise list of tags capturing core entities, topics, concepts, and genres.")
      }),
      temperature: 0.1,
    });

    return object.tags?.map(t => t.toLowerCase().trim()).filter(Boolean) || [];
  } catch (error) {
    console.error('Failed to generate/parse Groq tagging response:', error);
    return [];
  }
}
