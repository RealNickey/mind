import { searchSimilarItems, type SimilarItemResult } from '../../lib/rag';

const MAX_RAG_ITEMS = 5;
const MAX_CONTEXT_CHARS = 6000;
const MAX_ITEM_TEXT_CHARS = 1200;

export type ChatMessageSource = {
  id: string;
  title: string;
  type: string;
};

function truncateText(value: string, maxChars: number): string {
  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, maxChars)}…`;
}

function formatContextItems(items: SimilarItemResult[]): string {
  if (items.length === 0) {
    return 'No relevant saved items were found.';
  }

  let usedChars = 0;
  const sections: string[] = [];

  for (const [index, item] of items.entries()) {
    const summary: string[] = [`Title: ${item.title ?? 'Untitled'}`, `Type: ${item.type ?? 'unknown'}`];

    if (item.description?.trim()) {
      summary.push(`Description: ${truncateText(item.description.trim(), MAX_ITEM_TEXT_CHARS)}`);
    }

    if (item.content?.trim()) {
      summary.push(`Content: ${truncateText(item.content.trim(), MAX_ITEM_TEXT_CHARS)}`);
    }

    const section = `[${index + 1}]\n${summary.join('\n')}`;
    if (usedChars + section.length > MAX_CONTEXT_CHARS) {
      break;
    }

    sections.push(section);
    usedChars += section.length;
  }

  return sections.length > 0 ? sections.join('\n\n') : 'No relevant saved items were found.';
}

export function toChatMessageSources(items: SimilarItemResult[]): ChatMessageSource[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title ?? 'Untitled',
    type: item.type ?? 'unknown',
  }));
}

export async function buildGroundedChatPrompt(query: string, collectionId?: string | null): Promise<{
  contextItems: SimilarItemResult[];
  systemPrompt: string;
}> {
  const contextItems = await searchSimilarItems(query, MAX_RAG_ITEMS, collectionId);
  const contextText = formatContextItems(contextItems);
  const systemPrompt = [
    "You are a helpful AI assistant for the user's saved content.",
    'Answer using only the information in the context items below.',
    "If the context is missing details, say you don't have enough saved information.",
    'Do not hallucinate or invent facts, sources, or details outside the provided context.',
    'When possible, reference relevant context item numbers like [1] or [2].',
    '',
    'Context items:',
    contextText,
  ].join('\n');

  return { contextItems, systemPrompt };
}
