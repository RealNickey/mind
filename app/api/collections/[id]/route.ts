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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;

    // First delete matching links in _CollectionToItem
    await db.from('_CollectionToItem').delete().eq('A', resolvedParams.id);

    // Then delete collection itself
    const { error } = await db
      .from('Collection')
      .delete()
      .eq('id', resolvedParams.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Collection delete error:', error);
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data: collection, error } = await db
      .from('Collection')
      .update({
        name: name.trim(),
        ...(description !== undefined && { description }),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(collection);
  } catch (error) {
    console.error('Collection patch error:', error);
    return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 });
  }
}
