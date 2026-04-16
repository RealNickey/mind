import { db } from './db';
import { generateLocalEmbedding } from './embeddings';
import { generateGroqEmbedding } from './groq';
import {
  scoreDuplicatePair,
  type DuplicateComparableItem,
  type DuplicatePair,
} from './duplicate-clustering';
import type { Database } from './database.types';

type ItemRow = Database['public']['Tables']['Item']['Row'];

interface MatchRow {
  id: string;
  similarity: number;
}

export interface SemanticSuggestion {
  itemId: string;
  title: string;
  type: string;
  similarity: number;
}

export interface MergeSuggestion {
  itemId: string;
  title: string;
  type: string;
  confidence: number;
  reasons: string[];
  kind: DuplicatePair['kind'];
}

export interface SemanticSuggestionsResult {
  itemId: string;
  embeddingSource: 'local' | 'groq';
  semanticSuggestions: SemanticSuggestion[];
  mergeSuggestions: MergeSuggestion[];
}

function buildEmbeddingText(item: ItemRow): string {
  return [item.title, item.description, item.content, item.sourceUrl]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join('\n')
    .slice(0, 4_000);
}

async function generateEmbeddingWithFallback(
  text: string
): Promise<{ source: 'local' | 'groq'; embedding: number[] }> {
  try {
    return {
      source: 'local',
      embedding: await generateLocalEmbedding(text),
    };
  } catch {
    return {
      source: 'groq',
      embedding: await generateGroqEmbedding(text),
    };
  }
}

function toComparable(item: ItemRow): DuplicateComparableItem {
  return {
    id: item.id,
    title: item.title,
    type: item.type,
    description: item.description,
    content: item.content,
    sourceUrl: item.sourceUrl,
  };
}

function parseMatches(rows: unknown): MatchRow[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .map((row) => {
      if (!row || typeof row !== 'object') {
        return null;
      }

      const record = row as Record<string, unknown>;
      const id = typeof record.id === 'string' ? record.id : null;
      const similarityValue = record.similarity;
      const similarity =
        typeof similarityValue === 'number'
          ? similarityValue
          : typeof similarityValue === 'string'
            ? Number(similarityValue)
            : Number.NaN;

      if (!id || !Number.isFinite(similarity)) {
        return null;
      }

      return { id, similarity };
    })
    .filter((entry): entry is MatchRow => Boolean(entry));
}

export async function getSemanticAndDuplicateSuggestions(
  itemId: string,
  options?: { semanticLimit?: number; duplicateLimit?: number; duplicateCandidateScanLimit?: number }
): Promise<SemanticSuggestionsResult> {
  const semanticLimit = Math.max(1, options?.semanticLimit ?? 8);
  const duplicateLimit = Math.max(1, options?.duplicateLimit ?? 8);
  const duplicateCandidateScanLimit = Math.min(
    300,
    Math.max(20, options?.duplicateCandidateScanLimit ?? 150)
  );

  const { data: currentItem, error: itemError } = await db
    .from('Item')
    .select('*')
    .eq('id', itemId)
    .single();

  if (itemError || !currentItem) {
    throw new Error('Item not found');
  }

  let embeddingSource: 'local' | 'groq' = 'local';
  let semanticSuggestions: SemanticSuggestion[] = [];

  try {
    const embeddingText = buildEmbeddingText(currentItem);
    const { source, embedding } = await generateEmbeddingWithFallback(embeddingText);
    embeddingSource = source;

    const vector = `[${embedding.join(',')}]`;
    const { data: rawMatches, error: rpcError } = await db.rpc('match_items', {
      query_embedding: vector,
      match_threshold: 0.2,
      match_count: Math.max(semanticLimit * 4, 24),
    });

    if (rpcError) {
      throw rpcError;
    }

    const parsedMatches = parseMatches(rawMatches).filter((row) => row.id !== itemId);
    const matchedIds = [...new Set(parsedMatches.map((row) => row.id))];

    let matchedItems: ItemRow[] = [];
    if (matchedIds.length > 0) {
      const { data, error } = await db
        .from('Item')
        .select('*')
        .in('id', matchedIds);

      if (error) {
        throw error;
      }

      matchedItems = data ?? [];
    }

    const matchedById = new Map(matchedItems.map((item) => [item.id, item]));
    semanticSuggestions = parsedMatches
      .map((row) => {
        const item = matchedById.get(row.id);
        if (!item) {
          return null;
        }

        return {
          itemId: item.id,
          title: item.title,
          type: item.type,
          similarity: row.similarity,
        };
      })
      .filter((entry): entry is SemanticSuggestion => Boolean(entry))
      .slice(0, semanticLimit);
  } catch (semanticError) {
    console.warn('Semantic vector suggestions unavailable, falling back to duplicate-only suggestions:', semanticError);
  }

  const { data: duplicateCandidates, error: duplicateError } = await db
    .from('Item')
    .select('*')
    .neq('id', itemId)
    .order('updatedAt', { ascending: false })
    .limit(duplicateCandidateScanLimit);

  if (duplicateError) {
    throw duplicateError;
  }

  const baseComparable = toComparable(currentItem);
  const mergeSuggestions = (duplicateCandidates ?? [])
    .map((candidate) => {
      const pair = scoreDuplicatePair(baseComparable, toComparable(candidate));
      if (!pair) {
        return null;
      }

      return {
        itemId: candidate.id,
        title: candidate.title,
        type: candidate.type,
        confidence: pair.confidence,
        reasons: pair.reasons,
        kind: pair.kind,
      } satisfies MergeSuggestion;
    })
    .filter((entry): entry is MergeSuggestion => Boolean(entry))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, duplicateLimit);

  return {
    itemId,
    embeddingSource,
    semanticSuggestions,
    mergeSuggestions,
  };
}

export async function autoCreateSemanticLinks(itemId: string): Promise<number> {
  const suggestions = await getSemanticAndDuplicateSuggestions(itemId, {
    semanticLimit: 6,
    duplicateLimit: 4,
    duplicateCandidateScanLimit: 80,
  });

  const strongSemanticLinks = suggestions.semanticSuggestions
    .filter((suggestion) => suggestion.similarity >= 0.84)
    .slice(0, 3);

  let created = 0;
  for (const suggestion of strongSemanticLinks) {
    const { data: existing, error: existingError } = await db
      .from('ItemLink')
      .select('id')
      .eq('sourceItemId', itemId)
      .eq('targetItemId', suggestion.itemId)
      .eq('linkType', 'semantic')
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing?.id) {
      continue;
    }

    const { error: insertError } = await db.from('ItemLink').insert({
      sourceItemId: itemId,
      targetItemId: suggestion.itemId,
      linkType: 'semantic',
      strength: suggestion.similarity,
      description: 'Auto-linked by semantic suggestion engine',
    });

    if (insertError) {
      throw insertError;
    }

    created += 1;
  }

  return created;
}