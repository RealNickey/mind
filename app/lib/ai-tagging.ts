import { getPromptForContentType, TAGGING_SYSTEM_PROMPT } from './prompts';

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

  const userPrompt = getPromptForContentType(type, title, description, content);

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192', // Fast, suitable model for quick JSON tagging tasks
      messages: [
        { role: 'system', content: TAGGING_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1, // Low temperature for deterministic output
    })
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Groq API Error: ${res.status} ${res.statusText} - ${errorBody}`);
  }

  const data = await res.json();
  const contentResponse = data.choices[0]?.message?.content;
  
  if (!contentResponse) {
    return [];
  }

  try {
    const parsed = JSON.parse(contentResponse) as TaggingResult;
    // Normalize output: lowercase and trimmed tags
    return parsed.tags?.map(t => t.toLowerCase().trim()).filter(Boolean) || [];
  } catch (error) {
    console.error('Failed to parse Groq tagging response:', error);
    return [];
  }
}
