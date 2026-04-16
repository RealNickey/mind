export const TAGGING_SYSTEM_PROMPT = `You are an expert content taxonomy engine. Your job is to analyze the provided content and generate a highly relevant, concise list of tags.
The tags should capture the core entities, topics, concepts, and genres of the content.
Return the result strictly as a JSON object with a single property "tags" which is an array of strings.
Do not include any explanation or markdown formatting outside the JSON object.

Example output:
{
  "tags": ["react", "web development", "javascript", "frontend"]
}
`;

export function getPromptForContentType(type: string, title: string, description?: string | null, content?: string | null): string {
  let context = `Content Type: ${type}\nTitle: ${title}\n`;
  if (description) {
    context += `Description: ${description}\n`;
  }
  if (content) {
    // Truncate content to avoid token limits (approx 1500 chars)
    const truncatedContent = content.slice(0, 1500); 
    context += `Content snippet: ${truncatedContent}\n`;
  }
  
  return `Analyze the following content and generate 3 to 7 highly relevant tags.\n\n${context}`;
}
