import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { z } from 'zod';
import { parseJsonBody } from '@/app/api/_validation';

const deleteItemsSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1),
});

export async function POST(req: Request) {
  try {
    const parsedBody = await parseJsonBody(req, deleteItemsSchema, {
      invalidBodyMessage: 'Valid IDs array required',
      includeValidationDetails: false,
    });
    if (!parsedBody.success) {
      return parsedBody.response;
    }

    const { ids } = parsedBody.data;

    const { error } = await db
      .from('Item')
      .delete()
      .in('id', ids);

    if (error) throw error;

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error: unknown) {
    console.error('Items bulk delete error:', error);
    return NextResponse.json({ error: 'Failed to delete items' }, { status: 500 });
  }
}
