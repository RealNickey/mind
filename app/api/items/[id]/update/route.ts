import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { getItemByIdWithRelations } from '@/app/lib/item-hydration';
import { z } from 'zod';
import { parseJsonBody } from '@/app/api/_validation';

const updateItemSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  type: z.string().trim().min(1).optional(),
  collectionId: z.string().nullable().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const parsedBody = await parseJsonBody(req, updateItemSchema);
    if (!parsedBody.success) {
      return parsedBody.response;
    }

    const { title, description, content, type, collectionId } = parsedBody.data;

    const hasItemUpdates = title !== undefined || description !== undefined || content !== undefined || type !== undefined;

    if (hasItemUpdates) {
      const { error } = await db
        .from('Item')
        .update({
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(content !== undefined && { content }),
          ...(type && { type }),
        })
        .eq('id', resolvedParams.id);

      if (error) throw error;
    }

    if (collectionId !== undefined) {
      // Get all custom space/session collections
      const { data: spaces, error: spacesError } = await db
        .from('Collection')
        .select('id')
        .or('name.like.Space:%,name.like.Session:%');

      if (spacesError) throw spacesError;

      const spaceIds = (spaces ?? []).map((s) => s.id);

      if (spaceIds.length > 0) {
        // Delete existing linkages to any spaces
        const { error: deleteError } = await db
          .from('_CollectionToItem')
          .delete()
          .eq('B', resolvedParams.id)
          .in('A', spaceIds);

        if (deleteError) throw deleteError;
      }

      // If collectionId is non-null, link it to the new space
      if (collectionId !== null) {
        const { error: linkError } = await db
          .from('_CollectionToItem')
          .upsert({ A: collectionId, B: resolvedParams.id }, { onConflict: 'A,B' });

        if (linkError) throw linkError;
      }
    }

    const hydratedItem = await getItemByIdWithRelations(resolvedParams.id);
    if (!hydratedItem) {
      return NextResponse.json({ error: 'Item not found after update' }, { status: 404 });
    }

    return NextResponse.json(hydratedItem);
  } catch (error: unknown) {
    console.error('Update item error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}
