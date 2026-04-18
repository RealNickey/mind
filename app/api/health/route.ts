import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { serializeVector } from '@/app/lib/vector-codec';

export async function GET() {
  try {
    const probeVector = serializeVector(Array(384).fill(1));

    const { error: functionError } = await db.rpc('match_items', {
      query_embedding: probeVector,
      match_threshold: -1,
      match_count: 1,
    });

    if (functionError) throw functionError;

    const { error: tableError } = await db.from('Item').select('id').limit(1);
    if (tableError) throw tableError;

    return NextResponse.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', database: 'disconnected', error: String(error) },
      { status: 500 }
    );
  }
}
