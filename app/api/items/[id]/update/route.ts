import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { getItemByIdWithRelations } from '@/app/lib/item-hydration';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const { title, description, content, type } = body;

    const { data: item, error } = await db
      .from('Item')
      .update({
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(content !== undefined && { content }),
        ...(type && { type }),
      })
      .eq('id', resolvedParams.id)
      .select('id')
      .single();

    if (error) throw error;

    const hydratedItem = await getItemByIdWithRelations(item.id);
    if (!hydratedItem) {
      return NextResponse.json({ error: 'Item not found after update' }, { status: 404 });
    }

    return NextResponse.json(hydratedItem);
  } catch (error: any) {
    console.error('Update item error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}
