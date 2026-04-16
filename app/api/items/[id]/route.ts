import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { ItemResponse, APIErrorResponse, DeleteItemResponse } from '@/app/lib/types';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { data, error } = await db
      .from('Item')
      .select(`
        *,
        tags:Tag(*),
        collections:Collection(*),
        metadata:ItemMetadata(*),
        sourceLinks:ItemLink!sourceItemId(
          *,
          targetItem:Item!targetItemId(*)
        ),
        targetLinks:ItemLink!targetItemId(
          *,
          sourceItem:Item!sourceItemId(*)
        )
      `)
      .eq('id', resolvedParams.id)
      .single();

    if (error || !data) {
      console.error('Fetch error:', error);
      return NextResponse.json<APIErrorResponse>({ error: 'Item not found' }, { status: 404 });
    }

    const item: ItemResponse = data;
    return NextResponse.json<ItemResponse>(item);
  } catch (error: unknown) {
    console.error('Get item error:', error);
    return NextResponse.json<APIErrorResponse>({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { error } = await db
      .from('Item')
      .delete()
      .eq('id', resolvedParams.id);
      
    if (error) throw error;

    return NextResponse.json<DeleteItemResponse>({ success: true });
  } catch (error: unknown) {
    console.error('Delete item error:', error);
    return NextResponse.json<APIErrorResponse>({ error: 'Failed to delete item' }, { status: 500 });
  }
}
