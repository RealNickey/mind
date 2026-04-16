import { db } from './db';
import { generateLocalEmbedding } from './embeddings';
import { generateGroqEmbedding } from './groq';
import {
  DUPLICATE_THRESHOLD,
  scoreDuplicatePair,
  type DuplicateComparableItem,
  type DuplicatePair,
} from './duplicate-clustering';
import { normalizeSourceUrl } from './url-utils';
import type { Database } from './database.types';

type ItemRow = Database['public']['Tables']['Item']['Row'];
type EmbeddingRow = Database['public']['Tables']['Embedding']['Row'];
type ComparableItemRow = Pick<
  ItemRow,
  'id' | 'title' | 'type' | 'description' | 'content' | 'sourceUrl'
>;

const ITEM_SELECT_FIELDS = 'id, title, type, description, content, sourceUrl';

const SEMANTIC_RPC_THRESHOLD = 0.24;
const SEMANTIC_ACCEPTANCE_FLOOR = 0.5;
const SEMANTIC_MIN_MATCH_COUNT = 24;
const SEMANTIC_MAX_MATCH_COUNT = 80;

const SEMANTIC_VECTOR_WEIGHT = 0.82;
const SEMANTIC_TITLE_WEIGHT = 0.1;
const SEMANTIC_TYPE_BONUS = 0.08;
const SEMANTIC_DUPLICATE_PENALTY = 0.24;
const SEMANTIC_NEAR_DUPLICATE_PENALTY = 0.08;

const URL_DUPLICATE_CANDIDATE_LIMIT = 30;
const SAME_TYPE_DUPLICATE_MIN = 40;
const RECENT_DUPLICATE_FALLBACK_LIMIT = 30;

const AUTO_LINK_MIN_SIMILARITY = 0.86;
const AUTO_LINK_MAX_LINKS = 3;
const AUTO_LINK_BLOCK_NEAR_DUPLICATE_CONFIDENCE = 0.84;

interface MatchRow {
  id: string;
  similarity: number;
}

export interface SemanticSuggestion {
  itemId: string;
  title: string;
  type: string;
  similarity: number;
  rankScore: number;
  relationship: 'related' | DuplicatePair['kind'];
  duplicateConfidence: number | null;
  reasons: string[];
}

export interface MergeSuggestion {
  itemId: string;
  title: string;
  type: string;
  confidence: number;
  reasons: string[];
  kind: DuplicatePair['kind'];
  explanation: string;
}

export interface SemanticSuggestionsResult {
  itemId: string;
  embeddingSource: 'local' | 'groq';
  embeddingReused: boolean;
  semanticSuggestions: SemanticSuggestion[];
  mergeSuggestions: MergeSuggestion[];
  meta: {
    semanticRpcThreshold: number;
    semanticAcceptanceFloor: number;
    semanticCandidateCount: number;
    duplicateCandidateScanLimit: number;
    autoLinkMinSimilarity: number;
    autoLinkDuplicateBlockConfidence: number;
  };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
}

function buildEmbeddingText(item: ComparableItemRow): string {
  return [item.title, item.description, item.content, item.sourceUrl]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join('\n')
    .slice(0, 4_000);
}

async function generateEmbeddingWithFallback(
  text: string
): Promise<{ source: 'local' | 'groq'; embedding: number[]; modelVersion: string }> {
  try {
    return {
      source: 'local',
      embedding: await generateLocalEmbedding(text),
      modelVersion: 'Xenova/all-MiniLM-L6-v2',
    };
  } catch {
    return {
      source: 'groq',
      embedding: await generateGroqEmbedding(text),
      modelVersion: 'groq/nomic-embed-text-v1_5@384',
    };
  }
}

function parseVectorString(raw: string | null | undefined): number[] | null {
  if (typeof raw !== 'string') {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
    return null;
  }

  const entries = trimmed
    .slice(1, -1)
    .split(',')
    .map((entry) => Number(entry.trim()));

  if (entries.length === 0 || entries.some((entry) => !Number.isFinite(entry))) {
    return null;
  }

  return entries;
}

function inferEmbeddingSource(modelVersion: string | null | undefined): 'local' | 'groq' {
  if (typeof modelVersion !== 'string') {
    return 'local';
  }

  return modelVersion.toLowerCase().includes('groq') ? 'groq' : 'local';
}

async function getOrCreateEmbeddingVector(
  item: ComparableItemRow
): Promise<{ source: 'local' | 'groq'; embedding: number[]; reused: boolean }> {
  const { data: embeddingRow, error: embeddingError } = await db
    .from('Embedding')
    .select('vector, modelVersion')
    .eq('itemId', item.id)
    .maybeSingle();

  if (embeddingError) {
    throw embeddingError;
  }

  if (embeddingRow) {
    const parsed = parseVectorString((embeddingRow as Pick<EmbeddingRow, 'vector'>).vector);
    if (parsed && parsed.length > 0) {
      return {
        source: inferEmbeddingSource((embeddingRow as Pick<EmbeddingRow, 'modelVersion'>).modelVersion),
        embedding: parsed,
        reused: true,
      };
    }
  }

  const embeddingText = buildEmbeddingText(item);
  const generated = await generateEmbeddingWithFallback(embeddingText);
  const vector = `[${generated.embedding.join(',')}]`;

  const { error: upsertError } = await db
    .from('Embedding')
    .upsert(
      {
        itemId: item.id,
        vector,
        embedding: vector,
        modelVersion: generated.modelVersion,
      },
      { onConflict: 'itemId' }
    );

  if (upsertError) {
    console.warn('Unable to persist embedding for semantic suggestions:', upsertError);
  }

  return {
    source: generated.source,
    embedding: generated.embedding,
    reused: false,
  };
}

function toComparable(item: ComparableItemRow): DuplicateComparableItem {
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

      return { id, similarity: clamp01(similarity) };
    })
    .filter((entry): entry is MatchRow => Boolean(entry));
}

function rankSemanticMatch(
  match: MatchRow,
  duplicatePair: DuplicatePair | null,
  typeMatch: boolean
): number {
  const duplicatePenalty =
    duplicatePair?.kind === 'duplicate'
      ? SEMANTIC_DUPLICATE_PENALTY
      : duplicatePair?.kind === 'near-duplicate'
        ? SEMANTIC_NEAR_DUPLICATE_PENALTY
        : 0;

  const titleSignal = duplicatePair?.titleSimilarity ?? 0;

  return clamp01(
    (match.similarity * SEMANTIC_VECTOR_WEIGHT) +
      (titleSignal * SEMANTIC_TITLE_WEIGHT) +
      (typeMatch ? SEMANTIC_TYPE_BONUS : 0) -
      duplicatePenalty
  );
}

function buildSemanticReasons(
  match: MatchRow,
  duplicatePair: DuplicatePair | null,
  currentType: string,
  targetType: string
): string[] {
  const reasons = [`vector similarity ${(match.similarity * 100).toFixed(0)}%`];

  if (currentType === targetType) {
    reasons.push(`same type (${targetType})`);
  }

  if (duplicatePair?.titleSimilarity && duplicatePair.titleSimilarity >= 0.82) {
    reasons.push(`title similarity ${(duplicatePair.titleSimilarity * 100).toFixed(0)}%`);
  }

  if (duplicatePair?.contentSimilarity && duplicatePair.contentSimilarity >= 0.7) {
    reasons.push(`content similarity ${(duplicatePair.contentSimilarity * 100).toFixed(0)}%`);
  }

  if (duplicatePair?.urlMatch) {
    reasons.push('same canonical source URL');
  }

  return reasons;
}

async function hasExistingLinkBetween(sourceItemId: string, targetItemId: string): Promise<boolean> {
  const { data: existingForward, error: forwardError } = await db
    .from('ItemLink')
    .select('id')
    .eq('sourceItemId', sourceItemId)
    .eq('targetItemId', targetItemId)
    .maybeSingle();

  if (forwardError) {
    throw forwardError;
  }

  if (existingForward?.id) {
    return true;
  }

  const { data: existingReverse, error: reverseError } = await db
    .from('ItemLink')
    .select('id')
    .eq('sourceItemId', targetItemId)
    .eq('targetItemId', sourceItemId)
    .maybeSingle();

  if (reverseError) {
    throw reverseError;
  }

  return Boolean(existingReverse?.id);
}

export async function getSemanticAndDuplicateSuggestions(
  itemId: string,
  options?: { semanticLimit?: number; duplicateLimit?: number; duplicateCandidateScanLimit?: number }
): Promise<SemanticSuggestionsResult> {
  const semanticLimit = Math.min(20, Math.max(1, options?.semanticLimit ?? 8));
  const duplicateLimit = Math.min(20, Math.max(1, options?.duplicateLimit ?? 8));
  const duplicateCandidateScanLimit = Math.min(
    300,
    Math.max(20, options?.duplicateCandidateScanLimit ?? 150)
  );
  const semanticCandidateCount = Math.min(
    SEMANTIC_MAX_MATCH_COUNT,
    Math.max(SEMANTIC_MIN_MATCH_COUNT, semanticLimit * 6)
  );

  const { data: currentItem, error: itemError } = await db
    .from('Item')
    .select(ITEM_SELECT_FIELDS)
    .eq('id', itemId)
    .single();

  if (itemError || !currentItem) {
    throw new Error('Item not found');
  }

  const baseItem = currentItem as ComparableItemRow;
  const baseComparable = toComparable(baseItem);

  let embeddingSource: 'local' | 'groq' = 'local';
  let embeddingReused = false;
  let semanticSuggestions: SemanticSuggestion[] = [];
  const duplicateSignalsById = new Map<string, DuplicatePair>();
  const matchedItemsById = new Map<string, ComparableItemRow>();
  const semanticMatchById = new Map<string, MatchRow>();

  try {
    const embeddingInfo = await getOrCreateEmbeddingVector(baseItem);
    embeddingSource = embeddingInfo.source;
    embeddingReused = embeddingInfo.reused;

    const vector = `[${embeddingInfo.embedding.join(',')}]`;
    const { data: rawMatches, error: rpcError } = await db.rpc('match_items', {
      query_embedding: vector,
      match_threshold: SEMANTIC_RPC_THRESHOLD,
      match_count: semanticCandidateCount,
    });

    if (rpcError) {
      throw rpcError;
    }

    const parsedMatches = parseMatches(rawMatches).filter((row) => row.id !== itemId);
    for (const match of parsedMatches) {
      semanticMatchById.set(match.id, match);
    }

    const matchedIds = [...new Set(parsedMatches.map((row) => row.id))];

    let matchedItems: ComparableItemRow[] = [];
    if (matchedIds.length > 0) {
      const { data, error } = await db
        .from('Item')
        .select(ITEM_SELECT_FIELDS)
        .in('id', matchedIds);

      if (error) {
        throw error;
      }

      matchedItems = (data ?? []) as ComparableItemRow[];
    }

    for (const item of matchedItems) {
      matchedItemsById.set(item.id, item);
    }

    semanticSuggestions = parsedMatches
      .map((row) => {
        const item = matchedItemsById.get(row.id);
        if (!item) {
          return null;
        }

        const duplicatePair = scoreDuplicatePair(baseComparable, toComparable(item));
        if (duplicatePair) {
          duplicateSignalsById.set(item.id, duplicatePair);
        }

        const rankScore = rankSemanticMatch(row, duplicatePair ?? null, item.type === baseItem.type);
        if (row.similarity < SEMANTIC_ACCEPTANCE_FLOOR && rankScore < SEMANTIC_ACCEPTANCE_FLOOR) {
          return null;
        }

        return {
          itemId: item.id,
          title: item.title,
          type: item.type,
          similarity: row.similarity,
          rankScore,
          relationship: duplicatePair?.kind ?? 'related',
          duplicateConfidence: duplicatePair?.confidence ?? null,
          reasons: buildSemanticReasons(row, duplicatePair ?? null, baseItem.type, item.type),
        };
      })
      .filter((entry): entry is SemanticSuggestion => Boolean(entry))
      .sort((a, b) => {
        if (b.rankScore !== a.rankScore) {
          return b.rankScore - a.rankScore;
        }

        return b.similarity - a.similarity;
      })
      .slice(0, semanticLimit);
  } catch (semanticError) {
    console.warn('Semantic vector suggestions unavailable, falling back to duplicate-only suggestions:', semanticError);
  }

  const duplicateCandidateById = new Map<string, ComparableItemRow>();
  const duplicateCandidatePriority = new Map<string, number>();

  const registerDuplicateCandidate = (candidate: ComparableItemRow, priority: number): void => {
    if (candidate.id === itemId) {
      return;
    }

    duplicateCandidateById.set(candidate.id, candidate);
    const previousPriority = duplicateCandidatePriority.get(candidate.id) ?? -1;
    if (priority > previousPriority) {
      duplicateCandidatePriority.set(candidate.id, priority);
    }
  };

  for (const suggestion of semanticSuggestions) {
    const candidate = matchedItemsById.get(suggestion.itemId);
    if (candidate) {
      registerDuplicateCandidate(candidate, 0.6 + (suggestion.rankScore * 0.4));
    }
  }

  for (const [matchedId, match] of semanticMatchById.entries()) {
    const candidate = matchedItemsById.get(matchedId);
    if (candidate) {
      registerDuplicateCandidate(candidate, 0.55 + (match.similarity * 0.35));
    }
  }

  const normalizedSourceUrl = normalizeSourceUrl(baseItem.sourceUrl);
  if (normalizedSourceUrl) {
    const { data: sourceUrlMatches, error: sourceUrlError } = await db
      .from('Item')
      .select(ITEM_SELECT_FIELDS)
      .neq('id', itemId)
      .eq('sourceUrl', normalizedSourceUrl)
      .limit(URL_DUPLICATE_CANDIDATE_LIMIT);

    if (sourceUrlError) {
      throw sourceUrlError;
    }

    for (const candidate of (sourceUrlMatches ?? []) as ComparableItemRow[]) {
      registerDuplicateCandidate(candidate, 1);
    }
  }

  const sameTypeLimit = Math.max(
    SAME_TYPE_DUPLICATE_MIN,
    Math.ceil(duplicateCandidateScanLimit * 0.65)
  );

  const { data: sameTypeCandidates, error: sameTypeError } = await db
    .from('Item')
    .select(ITEM_SELECT_FIELDS)
    .neq('id', itemId)
    .eq('type', baseItem.type)
    .order('updatedAt', { ascending: false })
    .limit(sameTypeLimit);

  if (sameTypeError) {
    throw sameTypeError;
  }

  for (const candidate of (sameTypeCandidates ?? []) as ComparableItemRow[]) {
    registerDuplicateCandidate(candidate, 0.38);
  }

  if (duplicateCandidatePriority.size < Math.min(duplicateCandidateScanLimit, 45)) {
    const { data: fallbackRecentCandidates, error: fallbackError } = await db
      .from('Item')
      .select(ITEM_SELECT_FIELDS)
      .neq('id', itemId)
      .order('updatedAt', { ascending: false })
      .limit(RECENT_DUPLICATE_FALLBACK_LIMIT);

    if (fallbackError) {
      throw fallbackError;
    }

    for (const candidate of (fallbackRecentCandidates ?? []) as ComparableItemRow[]) {
      registerDuplicateCandidate(candidate, 0.22);
    }
  }

  const rankedDuplicateCandidateIds = [...duplicateCandidatePriority.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, duplicateCandidateScanLimit)
    .map(([candidateId]) => candidateId);

  const mergeSuggestions = rankedDuplicateCandidateIds
    .map((candidateId) => {
      const candidate = duplicateCandidateById.get(candidateId);
      if (!candidate) {
        return null;
      }

      const existingSignal = duplicateSignalsById.get(candidateId);
      const pair = existingSignal ?? scoreDuplicatePair(baseComparable, toComparable(candidate));
      if (!pair) {
        return null;
      }

      duplicateSignalsById.set(candidateId, pair);

      return {
        itemId: candidate.id,
        title: candidate.title,
        type: candidate.type,
        confidence: pair.confidence,
        reasons: pair.reasons,
        kind: pair.kind,
        explanation: pair.explanation,
      } satisfies MergeSuggestion;
    })
    .filter((entry): entry is MergeSuggestion => Boolean(entry))
    .sort((a, b) => {
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }

      if (a.kind !== b.kind) {
        return a.kind === 'duplicate' ? -1 : 1;
      }

      return a.itemId.localeCompare(b.itemId);
    })
    .slice(0, duplicateLimit);

  const duplicateBlockedIds = new Set(
    mergeSuggestions
      .filter((suggestion) => suggestion.kind === 'duplicate' && suggestion.confidence >= DUPLICATE_THRESHOLD)
      .map((suggestion) => suggestion.itemId)
  );

  semanticSuggestions = semanticSuggestions
    .filter((suggestion) => !duplicateBlockedIds.has(suggestion.itemId))
    .slice(0, semanticLimit);

  return {
    itemId,
    embeddingSource,
    embeddingReused,
    semanticSuggestions,
    mergeSuggestions,
    meta: {
      semanticRpcThreshold: SEMANTIC_RPC_THRESHOLD,
      semanticAcceptanceFloor: SEMANTIC_ACCEPTANCE_FLOOR,
      semanticCandidateCount,
      duplicateCandidateScanLimit,
      autoLinkMinSimilarity: AUTO_LINK_MIN_SIMILARITY,
      autoLinkDuplicateBlockConfidence: AUTO_LINK_BLOCK_NEAR_DUPLICATE_CONFIDENCE,
    },
  };
}

export async function autoCreateSemanticLinks(itemId: string): Promise<number> {
  const suggestions = await getSemanticAndDuplicateSuggestions(itemId, {
    semanticLimit: 6,
    duplicateLimit: 4,
    duplicateCandidateScanLimit: 80,
  });

  const duplicateBlockedIds = new Set(
    suggestions.mergeSuggestions
      .filter(
        (mergeSuggestion) =>
          mergeSuggestion.kind === 'duplicate' ||
          mergeSuggestion.confidence >= AUTO_LINK_BLOCK_NEAR_DUPLICATE_CONFIDENCE
      )
      .map((mergeSuggestion) => mergeSuggestion.itemId)
  );

  const strongSemanticLinks = suggestions.semanticSuggestions
    .filter((suggestion) => suggestion.similarity >= AUTO_LINK_MIN_SIMILARITY)
    .filter((suggestion) => suggestion.relationship === 'related')
    .filter((suggestion) => !duplicateBlockedIds.has(suggestion.itemId))
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, AUTO_LINK_MAX_LINKS);

  let created = 0;
  for (const suggestion of strongSemanticLinks) {
    if (await hasExistingLinkBetween(itemId, suggestion.itemId)) {
      continue;
    }

    const topReason = suggestion.reasons[0] ?? 'high semantic similarity';

    const { error: insertError } = await db.from('ItemLink').insert({
      sourceItemId: itemId,
      targetItemId: suggestion.itemId,
      linkType: 'semantic',
      strength: clamp01(suggestion.similarity),
      description: `Auto-linked by semantic suggestion engine (${topReason})`,
    });

    if (insertError) {
      throw insertError;
    }

    created += 1;
  }

  return created;
}