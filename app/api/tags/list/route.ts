import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function GET() {
  try {
    const { data: tags, error } = await db.from('Tag').select('*').order('count', { ascending: false });

    if (error) throw error;

    return NextResponse.json(tags);
  } catch (error: any) {
    console.error('List tags error:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}
