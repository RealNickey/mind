import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function GET() {
  try {
    const { data: collections, error } = await db
      .from('Collection')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;

    const collectionIds = (collections ?? []).map((collection) => collection.id);
    const countByCollectionId = new Map<string, number>();

    if (collectionIds.length > 0) {
      const { data: links, error: linksError } = await db
        .from('_CollectionToItem')
        .select('A')
        .in('A', collectionIds);

      if (linksError) throw linksError;

      for (const link of links ?? []) {
        countByCollectionId.set(link.A, (countByCollectionId.get(link.A) ?? 0) + 1);
      }
    }

    const payload = (collections ?? []).map((collection) => ({
      ...collection,
      _count: {
        items: countByCollectionId.get(collection.id) ?? 0,
      },
    }));

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('Collection list error:', error);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}
