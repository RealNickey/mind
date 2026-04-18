import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import {
  buildDuplicateClusters,
  type DuplicateComparableItem,
} from '@/app/lib/duplicate-clustering';
import { z } from 'zod';

const DEFAULT_LIMIT = 120;
const MAX_LIMIT = 250;

const duplicatesQuerySchema = z.object({
  limit: z.preprocess(
    (value) => {
      if (value === null || value === undefined || value === '') {
        return undefined;
      }

      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : Number.NaN;
    },
    z.number()
      .positive()
      .default(DEFAULT_LIMIT)
      .transform((value) => Math.min(Math.floor(value), MAX_LIMIT))
  ),
});

export async function GET(req: NextRequest) {
  try {
    const parseResult = duplicatesQuerySchema.safeParse({
      limit: req.nextUrl.searchParams.get('limit'),
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { limit } = parseResult.data;

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
