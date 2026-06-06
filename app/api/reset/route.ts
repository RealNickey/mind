import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function POST() {
  try {
    // Delete all item mappings, metadata, and embeddings
    await db.from('_CollectionToItem').delete().neq('A', 'placeholder-id');
    await db.from('_ItemToTag').delete().neq('A', 'placeholder-id');
    await db.from('ItemMetadata').delete().neq('itemId', 'placeholder-id');
    await db.from('Embedding').delete().neq('itemId', 'placeholder-id');
    await db.from('ItemLink').delete().neq('sourceItemId', 'placeholder-id');
    
    // Delete items, collections, and tags
    await db.from('Item').delete().neq('id', 'placeholder-id');
    await db.from('Collection').delete().neq('id', 'placeholder-id');
    await db.from('Tag').delete().neq('id', 'placeholder-id');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database reset error:', error);
    return NextResponse.json({ error: 'Failed to reset database' }, { status: 500 });
  }
}
