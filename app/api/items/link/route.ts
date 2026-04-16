import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function POST(req: Request) {
  try {
    const { sourceItemId, targetItemId, description } = await req.json();

    if (!sourceItemId || !targetItemId) {
      return NextResponse.json({ error: 'Missing item IDs' }, { status: 400 });
    }

    const { data: link, error } = await db
      .from('ItemLink')
      .insert({
        sourceItemId,
        targetItemId,
        description
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(link);
  } catch (error) {
    console.error('Link creation error:', error);
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const sourceItemId = url.searchParams.get('sourceItemId');
    const targetItemId = url.searchParams.get('targetItemId');

    if (!sourceItemId || !targetItemId) {
      return NextResponse.json({ error: 'Missing item IDs' }, { status: 400 });
    }

    const { error } = await db
      .from('ItemLink')
      .delete()
      .match({ sourceItemId, targetItemId });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Link deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 });
  }
}
