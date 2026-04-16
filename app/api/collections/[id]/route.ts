import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { hydrateItems, type HydratedItem } from '@/app/lib/item-hydration';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;

    const { data: collection, error: collectionError } = await db
      .from('Collection')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (collectionError || !collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const { data: links, error: linksError } = await db
      .from('_CollectionToItem')
      .select('B')
      .eq('A', resolvedParams.id);

    if (linksError) throw linksError;

    const itemIds = (links ?? []).map((row) => row.B);

    let hydratedItems: HydratedItem[] = [];
    if (itemIds.length > 0) {
      const { data: items, error: itemsError } = await db
        .from('Item')
        .select('*')
        .in('id', itemIds)
        .order('updatedAt', { ascending: false });

      if (itemsError) throw itemsError;

      hydratedItems = await hydrateItems(items ?? []);
    }

    return NextResponse.json({
      ...collection,
      items: hydratedItems,
      _count: {
        items: hydratedItems.length,
      },
    });
  } catch (error) {
    console.error('Collection fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 });
  }
}
