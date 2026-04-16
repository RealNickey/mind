import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function GET() {
  try {
    // Perform a simple query to ensure DB is connected
    const { error } = await (db as any).rpc('match_items', { query_embedding: '[0]', match_threshold: 0, match_count: 1 }); // Or just a dummy select
    // Actually you can just select from a table limit 1
    const { error: error2 } = await db.from('Item').select('id').limit(1);
    if (error2) throw error2;
    return NextResponse.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', database: 'disconnected', error: String(error) },
      { status: 500 }
    );
  }
}
