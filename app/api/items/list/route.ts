import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { hydrateItems } from '@/app/lib/item-hydration';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function intersection(a: string[], b: string[]): string[] {
  const bSet = new Set(b);
  return a.filter((value) => bSet.has(value));
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const requestedLimit = parsePositiveInt(searchParams.get('limit'), DEFAULT_LIMIT);
    const limit = Math.min(requestedLimit || DEFAULT_LIMIT, MAX_LIMIT);
    const offset = parsePositiveInt(searchParams.get('offset'), 0);

    const type = searchParams.get('type');
    const tag = searchParams.get('tag');
    const collectionId = searchParams.get('collectionId');
    const textQuery = searchParams.get('q');

    let filteredItemIds: string[] | null = null;

    if (tag) {
      const { data: matchingTags, error: tagError } = await db
        .from('Tag')
        .select('id')
        .or(`id.eq.${tag},name.eq.${tag}`);

      if (tagError) throw tagError;

      const tagIds = (matchingTags ?? []).map((row) => row.id);
      if (tagIds.length === 0) {
        return NextResponse.json([]);
      }

      const { data: tagLinks, error: tagLinksError } = await db
        .from('_ItemToTag')
        .select('A')
        .in('B', tagIds);

      if (tagLinksError) throw tagLinksError;

      filteredItemIds = unique((tagLinks ?? []).map((row) => row.A));
      if (filteredItemIds.length === 0) {
        return NextResponse.json([]);
      }
    }

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

    if (type) {
      query = query.eq('type', type);
    }

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
