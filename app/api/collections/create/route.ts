import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function POST(req: Request) {
  try {
    const { name, description, isAuto } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data: collection, error } = await db
      .from('Collection')
      .insert({
        name,
        description,
        isAuto: isAuto || false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(collection);
  } catch (error: any) {
    console.error('Collection create error:', error);
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
}
