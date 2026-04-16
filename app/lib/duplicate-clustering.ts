import { DiceCoefficient, JaroWinklerDistance } from 'natural';
import { normalizeSourceUrl } from './url-utils';

const TITLE_WEIGHT = 0.55;
const CONTENT_WEIGHT = 0.45;

const DUPLICATE_THRESHOLD = 0.9;
const NEAR_DUPLICATE_THRESHOLD = 0.78;

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
  urlMatch: boolean;
  kind: 'duplicate' | 'near-duplicate';
  reasons: string[];
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
  pairsEvaluated: number;
  truncated: boolean;
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

export function scoreDuplicatePair(
  source: DuplicateComparableItem,
  target: DuplicateComparableItem
): DuplicatePair | null {
  if (source.id === target.id) {
    return null;
  }

  const sourceUrl = normalizeSourceUrl(source.sourceUrl);
  const targetUrl = normalizeSourceUrl(target.sourceUrl);
  const urlMatch = Boolean(sourceUrl && targetUrl && sourceUrl === targetUrl);

  const titleSimilarity = safeJaroWinkler(
    normalizeText(source.title),
    normalizeText(target.title)
  );

  const sourceContent = normalizeText(source.content || source.description || '');
  const targetContent = normalizeText(target.content || target.description || '');
  const contentSimilarity = safeDice(sourceContent, targetContent);

  const blendedScore = (titleSimilarity * TITLE_WEIGHT) + (contentSimilarity * CONTENT_WEIGHT);
  const confidence = urlMatch ? 1 : blendedScore;

  const isDuplicate = urlMatch || confidence >= DUPLICATE_THRESHOLD;
  const isNearDuplicate = !isDuplicate && confidence >= NEAR_DUPLICATE_THRESHOLD;

  if (!isDuplicate && !isNearDuplicate) {
    return null;
  }

  const reasons: string[] = [];
  if (urlMatch) {
    reasons.push('same normalized source URL');
  }
  if (titleSimilarity >= 0.88) {
    reasons.push(`title similarity ${(titleSimilarity * 100).toFixed(0)}%`);
  }
  if (contentSimilarity >= 0.75) {
    reasons.push(`content similarity ${(contentSimilarity * 100).toFixed(0)}%`);
  }

  return {
    sourceId: source.id,
    targetId: target.id,
    confidence,
    titleSimilarity,
    contentSimilarity,
    urlMatch,
    kind: isDuplicate ? 'duplicate' : 'near-duplicate',
    reasons,
  };
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
  const scoredPairs: DuplicatePair[] = [];
  const unionFind = new UnionFind(items.map((item) => item.id));

  let pairsEvaluated = 0;
  let truncated = false;

  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      pairsEvaluated += 1;

      if (pairsEvaluated > maxPairs) {
        truncated = true;
        break;
      }

      const pair = scoreDuplicatePair(items[i], items[j]);
      if (!pair) {
        continue;
      }

      scoredPairs.push(pair);
      unionFind.union(pair.sourceId, pair.targetId);
    }

    if (truncated) {
      break;
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
    pairsEvaluated,
    truncated,
  };
}