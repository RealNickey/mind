import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { hydrateItems } from '@/app/lib/item-hydration';

export async function GET() {
  try {
    const { data: items, error } = await db
      .from('Item')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;

    const hydrated = await hydrateItems(items ?? []);

    return new NextResponse(JSON.stringify(hydrated, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="mymind_export.json"',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
