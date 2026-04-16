import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, content, type, sourceUrl } = body;

    if (!title || !type) {
      return NextResponse.json({ error: 'Title and type are required' }, { status: 400 });
    }

    const { data: item, error } = await db
      .from('Item')
      .insert({
        title,
        description,
        content,
        type,
      })
      .select()
      .single();

    if (error) throw error;

    if (sourceUrl) {
      const { error: metaError } = await db
        .from('ItemMetadata')
        .insert({
          itemId: item.id,
          sourceUrl
        });
      if (metaError) throw metaError;
    }

    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Item create error:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
