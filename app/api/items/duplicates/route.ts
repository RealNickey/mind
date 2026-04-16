import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import {
  buildDuplicateClusters,
  type DuplicateComparableItem,
} from '@/app/lib/duplicate-clustering';

const DEFAULT_LIMIT = 120;
const MAX_LIMIT = 250;

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

export async function GET(req: NextRequest) {
  try {
    const requestedLimit = parsePositiveInt(req.nextUrl.searchParams.get('limit'), DEFAULT_LIMIT);
    const limit = Math.min(requestedLimit, MAX_LIMIT);

    const { data: rows, error } = await db
      .from('Item')
      .select('id, title, type, description, content, sourceUrl')
      .order('updatedAt', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    const items = (rows ?? []) as DuplicateComparableItem[];
    const clustering = buildDuplicateClusters(items);

    const detailsById = new Map(items.map((item) => [item.id, item]));
    const clusters = clustering.clusters.map((cluster) => ({
      ...cluster,
      members: cluster.memberIds
        .map((memberId) => detailsById.get(memberId))
        .filter((member): member is DuplicateComparableItem => Boolean(member)),
    }));

    return NextResponse.json({
      scannedItems: items.length,
      pairsEvaluated: clustering.pairsEvaluated,
      truncated: clustering.truncated,
      topPairs: clustering.pairs.slice(0, 40),
      clusters,
    });
  } catch (error) {
    console.error('Duplicate clustering failed:', error);
    return NextResponse.json({ error: 'Failed to cluster duplicate items' }, { status: 500 });
  }
}