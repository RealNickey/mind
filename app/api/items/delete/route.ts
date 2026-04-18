import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { z } from 'zod';

const deleteItemsSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = deleteItemsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Valid IDs array required' }, { status: 400 });
    }

    const { ids } = parsed.data;

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
