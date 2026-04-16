import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function GET() {
  try {
    const { data: collections, error } = await db
      .from('collection')
      .select('*, items(count)')
      .order('id', { ascending: false });

    if (error) throw error;

    return NextResponse.json(collections);
  } catch (error: any) {
    console.error('Collection list error:', error);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}
