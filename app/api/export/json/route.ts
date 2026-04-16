import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET() {
  try {
    const { data: items, error } = await db
      .from('Item')
      .select(`
        *,
        metadata:ItemMetadata(*),
        tags:Tag(*),
        collections:Collection(*),
        sourceLinks:ItemLink!sourceItemId(*),
        targetLinks:ItemLink!targetItemId(*)
      `);

    if (error) throw error;

    return new NextResponse(JSON.stringify(items, null, 2), {
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
