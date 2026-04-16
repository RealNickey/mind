import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function POST(req: Request) {
  try {
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Valid IDs array required' }, { status: 400 });
    }

    const { error } = await db
      .from('Item')
      .delete()
      .in('id', ids);

    if (error) throw error;

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error: any) {
    console.error('Items bulk delete error:', error);
    return NextResponse.json({ error: 'Failed to delete items' }, { status: 500 });
  }
}
