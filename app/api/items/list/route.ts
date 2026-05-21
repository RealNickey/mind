import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { hydrateItems } from '@/app/lib/item-hydration';
import { z } from 'zod';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(0).default(DEFAULT_LIMIT).transform((val) => Math.min(val || DEFAULT_LIMIT, MAX_LIMIT)),
  offset: z.coerce.number().int().min(0).default(0),
  collectionId: z.string().optional().nullable(),
  q: z.string().optional().nullable(),
});

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function intersection(a: string[], b: string[]): string[] {
  const bSet = new Set(b);
  return a.filter((value) => bSet.has(value));
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parseResult = listQuerySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { limit, offset, collectionId, q: textQuery } = parseResult.data;

    let filteredItemIds: string[] | null = null;

    if (collectionId) {
      const { data: collectionLinks, error: collectionLinksError } = await db
        .from('_CollectionToItem')
        .select('B')
        .eq('A', collectionId);

      if (collectionLinksError) throw collectionLinksError;

      const collectionItemIds = unique((collectionLinks ?? []).map((row) => row.B));

      if (collectionItemIds.length === 0) {
        return NextResponse.json([]);
      }

      filteredItemIds = filteredItemIds
        ? intersection(filteredItemIds, collectionItemIds)
        : collectionItemIds;

      if (filteredItemIds.length === 0) {
        return NextResponse.json([]);
      }
    }

    let query = db.from('Item').select('*');

    if (textQuery && textQuery.trim()) {
      const safeQuery = textQuery.replace(/[,%()']/g, ' ').trim();
      if (safeQuery) {
        query = query.or(
          `title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%,content.ilike.%${safeQuery}%`
        );
      }
    }

    if (filteredItemIds) {
      query = query.in('id', filteredItemIds);
    }

    const { data: items, error } = await query
      .order('updatedAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const hydratedItems = await hydrateItems(items ?? []);
    return NextResponse.json(hydratedItems);
  } catch (error) {
    console.error('Item list error:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}
