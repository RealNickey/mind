import { DiceCoefficient, JaroWinklerDistance } from 'natural';
import { normalizeSourceUrl } from './url-utils';

const TITLE_WEIGHT = 0.48;
const CONTENT_WEIGHT = 0.28;
const TOKEN_OVERLAP_WEIGHT = 0.18;
const TYPE_MATCH_BONUS = 0.06;
const TYPE_MISMATCH_PENALTY = 0.04;

export const DUPLICATE_THRESHOLD = 0.9;
export const NEAR_DUPLICATE_THRESHOLD = 0.78;

const MAX_CONTENT_COMPARE_LENGTH = 1_800;
const TITLE_TOKEN_LIMIT = 8;
const TITLE_BUCKET_TOKEN_LIMIT = 4;
const MAX_TOKEN_BUCKET_SIZE = 28;
const MAX_TYPE_BUCKET_SIZE = 18;

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'has',
  'how',
  'in',
  'is',
  'it',
  'its',
  'of',
  'on',
  'or',
  'that',
  'the',
  'to',
  'was',
  'were',
  'what',
  'when',
  'where',
  'which',
  'who',
  'will',
  'with',
  'you',
]);

export interface DuplicateComparableItem {
  id: string;
  title: string;
  type?: string;
  description?: string | null;
  content?: string | null;
  sourceUrl?: string | null;
}

export interface DuplicatePair {
  sourceId: string;
  targetId: string;
  confidence: number;
  titleSimilarity: number;
  contentSimilarity: number;
  tokenOverlap: number;
  urlMatch: boolean;
  typeMatch: boolean;
  duplicateThreshold: number;
  nearDuplicateThreshold: number;
  kind: 'duplicate' | 'near-duplicate';
  reasons: string[];
  explanation: string;
}

export interface DuplicateCluster {
  clusterId: string;
  memberIds: string[];
  memberCount: number;
  strongestConfidence: number;
}

export interface DuplicateClusterResult {
  pairs: DuplicatePair[];
  clusters: DuplicateCluster[];
  candidatePairs: number;
  pairsEvaluated: number;
  truncated: boolean;
}

interface PreparedComparableItem {
  item: DuplicateComparableItem;
  normalizedType: string | null;
  normalizedUrl: string | null;
  normalizedTitle: string;
  normalizedContent: string;
  titleTokens: string[];
  titleTokenSet: Set<string>;
}

interface CandidatePair {
  i: number;
  j: number;
  priority: number;
}

function normalizeText(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return value
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeType(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function tokenizeTitle(normalizedTitle: string): string[] {
  if (!normalizedTitle) {
    return [];
  }

  const tokens = normalizedTitle
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));

  const unique: string[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    if (seen.has(token)) {
      continue;
    }

    seen.add(token);
    unique.push(token);
    if (unique.length >= TITLE_TOKEN_LIMIT) {
      break;
    }
  }

  return unique;
}

function toComparableContent(item: DuplicateComparableItem): string {
  const normalized = normalizeText(item.content || item.description || '');
  if (!normalized) {
    return '';
  }

  return normalized.slice(0, MAX_CONTENT_COMPARE_LENGTH);
}

function prepareComparable(item: DuplicateComparableItem): PreparedComparableItem {
  const normalizedTitle = normalizeText(item.title);
  const titleTokens = tokenizeTitle(normalizedTitle);

  return {
    item,
    normalizedType: normalizeType(item.type),
    normalizedUrl: normalizeSourceUrl(item.sourceUrl),
    normalizedTitle,
    normalizedContent: toComparableContent(item),
    titleTokens,
    titleTokenSet: new Set(titleTokens),
  };
}

function safeJaroWinkler(a: string, b: string): number {
  if (!a || !b) {
    return 0;
  }

  return JaroWinklerDistance(a, b, { ignoreCase: true });
}

function safeDice(a: string, b: string): number {
  if (!a || !b) {
    return 0;
  }

  return DiceCoefficient(a, b);
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

function tokenOverlapRatio(sourceTokens: Set<string>, targetTokens: Set<string>): number {
  if (sourceTokens.size === 0 || targetTokens.size === 0) {
    return 0;
  }

  let shared = 0;
  for (const token of sourceTokens) {
    if (targetTokens.has(token)) {
      shared += 1;
    }
  }

  return shared / Math.min(sourceTokens.size, targetTokens.size);
}

function scorePreparedPair(
  source: PreparedComparableItem,
  target: PreparedComparableItem
): DuplicatePair | null {
  if (source.item.id === target.item.id) {
    return null;
  }

  const urlMatch = Boolean(
    source.normalizedUrl && target.normalizedUrl && source.normalizedUrl === target.normalizedUrl
  );

  const typeMatch = Boolean(
    source.normalizedType && target.normalizedType && source.normalizedType === target.normalizedType
  );

  const titleSimilarity = safeJaroWinkler(source.normalizedTitle, target.normalizedTitle);
  const contentSimilarity = safeDice(source.normalizedContent, target.normalizedContent);
  const tokenOverlap = tokenOverlapRatio(source.titleTokenSet, target.titleTokenSet);

  let blendedScore =
    (titleSimilarity * TITLE_WEIGHT) +
    (contentSimilarity * CONTENT_WEIGHT) +
    (tokenOverlap * TOKEN_OVERLAP_WEIGHT) +
    (typeMatch ? TYPE_MATCH_BONUS : 0);

  if (!typeMatch) {
    blendedScore -= TYPE_MISMATCH_PENALTY;
  }

  const shortTitlePenalty =
    (source.normalizedTitle.length < 14 || target.normalizedTitle.length < 14) && tokenOverlap < 0.34;
  if (shortTitlePenalty) {
    blendedScore -= 0.05;
  }

  if (!source.normalizedContent || !target.normalizedContent) {
    blendedScore -= 0.03;
  }

  const confidence = urlMatch ? 1 : clamp01(blendedScore);
  const sparseText = !source.normalizedContent || !target.normalizedContent;

  const duplicateThreshold = urlMatch ? 1 : sparseText ? 0.93 : DUPLICATE_THRESHOLD;
  const nearDuplicateThresholdBase = sparseText ? 0.82 : NEAR_DUPLICATE_THRESHOLD;
  const nearDuplicateThreshold = typeMatch
    ? nearDuplicateThresholdBase
    : Math.min(0.9, nearDuplicateThresholdBase + 0.04);

  const titleStrongDuplicate = titleSimilarity >= 0.96 && tokenOverlap >= 0.7;
  const isDuplicate = urlMatch || confidence >= duplicateThreshold || (typeMatch && titleStrongDuplicate);
  const isNearDuplicate =
    !isDuplicate &&
    confidence >= nearDuplicateThreshold &&
    (titleSimilarity >= 0.76 || tokenOverlap >= 0.45 || contentSimilarity >= 0.68);

  if (!isDuplicate && !isNearDuplicate) {
    return null;
  }

  const reasons: string[] = [];
  if (urlMatch) {
    reasons.push('same normalized source URL');
  }
  if (titleSimilarity >= 0.84) {
    reasons.push(`title similarity ${(titleSimilarity * 100).toFixed(0)}%`);
  }
  if (tokenOverlap >= 0.45) {
    reasons.push(`title token overlap ${(tokenOverlap * 100).toFixed(0)}%`);
  }
  if (contentSimilarity >= 0.7) {
    reasons.push(`content similarity ${(contentSimilarity * 100).toFixed(0)}%`);
  }
  if (typeMatch && source.item.type) {
    reasons.push(`same type (${source.item.type})`);
  }

  if (reasons.length === 0) {
    reasons.push('high blended title/content similarity');
  }

  return {
    sourceId: source.item.id,
    targetId: target.item.id,
    confidence,
    titleSimilarity,
    contentSimilarity,
    tokenOverlap,
    urlMatch,
    typeMatch,
    duplicateThreshold,
    nearDuplicateThreshold,
    kind: isDuplicate ? 'duplicate' : 'near-duplicate',
    reasons,
    explanation: urlMatch
      ? 'Matched by canonical source URL'
      : isDuplicate
        ? 'Strong agreement across title and content signals'
        : 'Partial similarity suggests likely near-duplicate',
  };
}

export function scoreDuplicatePair(
  source: DuplicateComparableItem,
  target: DuplicateComparableItem
): DuplicatePair | null {
  return scorePreparedPair(prepareComparable(source), prepareComparable(target));
}

function registerCandidatePair(
  candidates: Map<string, CandidatePair>,
  i: number,
  j: number,
  priority: number
): void {
  if (i === j) {
    return;
  }

  const sourceIndex = Math.min(i, j);
  const targetIndex = Math.max(i, j);
  const key = `${sourceIndex}:${targetIndex}`;

  const existing = candidates.get(key);
  if (existing && existing.priority >= priority) {
    return;
  }

  candidates.set(key, {
    i: sourceIndex,
    j: targetIndex,
    priority,
  });
}

function buildCandidatePairs(items: PreparedComparableItem[]): CandidatePair[] {
  const candidates = new Map<string, CandidatePair>();

  const urlBuckets = new Map<string, number[]>();
  const tokenBuckets = new Map<string, number[]>();
  const typeBuckets = new Map<string, number[]>();

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];

    if (item.normalizedUrl) {
      const existing = urlBuckets.get(item.normalizedUrl) ?? [];
      existing.push(index);
      urlBuckets.set(item.normalizedUrl, existing);
    }

    for (const token of item.titleTokens.slice(0, TITLE_BUCKET_TOKEN_LIMIT)) {
      const existing = tokenBuckets.get(token) ?? [];
      existing.push(index);
      tokenBuckets.set(token, existing);
    }

    const titleLead = item.normalizedTitle.slice(0, 1);
    const typeKey = item.normalizedType && titleLead
      ? `${item.normalizedType}:${titleLead}`
      : null;

    if (typeKey) {
      const existing = typeBuckets.get(typeKey) ?? [];
      existing.push(index);
      typeBuckets.set(typeKey, existing);
    }
  }

  for (const indices of urlBuckets.values()) {
    if (indices.length < 2) {
      continue;
    }

    for (let i = 0; i < indices.length; i += 1) {
      for (let j = i + 1; j < indices.length; j += 1) {
        registerCandidatePair(candidates, indices[i], indices[j], 1);
      }
    }
  }

  for (const indices of tokenBuckets.values()) {
    if (indices.length < 2 || indices.length > MAX_TOKEN_BUCKET_SIZE) {
      continue;
    }

    for (let i = 0; i < indices.length; i += 1) {
      for (let j = i + 1; j < indices.length; j += 1) {
        const a = items[indices[i]];
        const b = items[indices[j]];
        const sameType = Boolean(
          a.normalizedType && b.normalizedType && a.normalizedType === b.normalizedType
        );

        registerCandidatePair(candidates, indices[i], indices[j], sameType ? 0.72 : 0.64);
      }
    }
  }

  for (const indices of typeBuckets.values()) {
    if (indices.length < 2 || indices.length > MAX_TYPE_BUCKET_SIZE) {
      continue;
    }

    for (let i = 0; i < indices.length; i += 1) {
      for (let j = i + 1; j < indices.length; j += 1) {
        registerCandidatePair(candidates, indices[i], indices[j], 0.32);
      }
    }
  }

  return [...candidates.values()].sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }

    if (a.i !== b.i) {
      return a.i - b.i;
    }

    return a.j - b.j;
  });
}

class UnionFind {
  private readonly parent = new Map<string, string>();

  constructor(ids: string[]) {
    for (const id of ids) {
      this.parent.set(id, id);
    }
  }

  find(id: string): string {
    const parent = this.parent.get(id);
    if (!parent) {
      this.parent.set(id, id);
      return id;
    }

    if (parent === id) {
      return id;
    }

    const root = this.find(parent);
    this.parent.set(id, root);
    return root;
  }

  union(a: string, b: string): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) {
      this.parent.set(rootB, rootA);
    }
  }
}

export function buildDuplicateClusters(
  items: DuplicateComparableItem[],
  maxPairs = 9_000
): DuplicateClusterResult {
  const preparedItems = items.map((item) => prepareComparable(item));
  const scoredPairs: DuplicatePair[] = [];
  const unionFind = new UnionFind(items.map((item) => item.id));
  const candidatePairs = buildCandidatePairs(preparedItems);
  const evaluatedKeys = new Set<string>();

  let pairsEvaluated = 0;
  let truncated = false;

  const evaluatePair = (sourceIndex: number, targetIndex: number): void => {
    const i = Math.min(sourceIndex, targetIndex);
    const j = Math.max(sourceIndex, targetIndex);
    const key = `${i}:${j}`;

    if (evaluatedKeys.has(key)) {
      return;
    }

    evaluatedKeys.add(key);
    pairsEvaluated += 1;

    const pair = scorePreparedPair(preparedItems[i], preparedItems[j]);
    if (!pair) {
      return;
    }

    scoredPairs.push(pair);
    unionFind.union(pair.sourceId, pair.targetId);
  };

  for (const candidatePair of candidatePairs) {
    if (pairsEvaluated >= maxPairs) {
      truncated = true;
      break;
    }

    evaluatePair(candidatePair.i, candidatePair.j);
  }

  if (!truncated && pairsEvaluated < maxPairs) {
    for (let i = 0; i < preparedItems.length; i += 1) {
      for (let j = i + 1; j < preparedItems.length; j += 1) {
        if (pairsEvaluated >= maxPairs) {
          truncated = true;
          break;
        }

        const key = `${i}:${j}`;
        if (evaluatedKeys.has(key)) {
          continue;
        }

        const source = preparedItems[i];
        const target = preparedItems[j];

        const urlMatch = Boolean(
          source.normalizedUrl &&
          target.normalizedUrl &&
          source.normalizedUrl === target.normalizedUrl
        );

        const typeMatch = Boolean(
          source.normalizedType &&
          target.normalizedType &&
          source.normalizedType === target.normalizedType
        );

        const tokenOverlap = tokenOverlapRatio(source.titleTokenSet, target.titleTokenSet);
        const titleProbe = safeJaroWinkler(source.normalizedTitle, target.normalizedTitle);

        if (!urlMatch && tokenOverlap < 0.34 && titleProbe < (typeMatch ? 0.82 : 0.88)) {
          continue;
        }

        evaluatePair(i, j);
      }

      if (truncated) {
        break;
      }
    }
  }

  const membersByRoot = new Map<string, string[]>();
  for (const item of items) {
    const root = unionFind.find(item.id);
    const existing = membersByRoot.get(root) ?? [];
    existing.push(item.id);
    membersByRoot.set(root, existing);
  }

  const strongestByRoot = new Map<string, number>();
  for (const pair of scoredPairs) {
    const root = unionFind.find(pair.sourceId);
    const previous = strongestByRoot.get(root) ?? 0;
    if (pair.confidence > previous) {
      strongestByRoot.set(root, pair.confidence);
    }
  }

  const clusters: DuplicateCluster[] = [];
  for (const [root, memberIds] of membersByRoot.entries()) {
    if (memberIds.length < 2) {
      continue;
    }

    clusters.push({
      clusterId: root,
      memberIds,
      memberCount: memberIds.length,
      strongestConfidence: strongestByRoot.get(root) ?? 0,
    });
  }

  clusters.sort((a, b) => {
    if (b.memberCount !== a.memberCount) {
      return b.memberCount - a.memberCount;
    }
    return b.strongestConfidence - a.strongestConfidence;
  });

  scoredPairs.sort((a, b) => b.confidence - a.confidence);

  return {
    pairs: scoredPairs,
    clusters,
    candidatePairs: candidatePairs.length,
    pairsEvaluated,
    truncated,
  };
}