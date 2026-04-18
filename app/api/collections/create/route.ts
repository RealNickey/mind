import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { z } from 'zod';
import { parseJsonBody } from '@/app/api/_validation';

const createCollectionSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  isAuto: z.boolean().optional().default(false),
  userId: z.string().trim().optional(),
});

export async function POST(req: Request) {
  try {
    const parsedBody = await parseJsonBody(req, createCollectionSchema);
    if (!parsedBody.success) {
      return parsedBody.response;
    }

    const { name, description, isAuto, userId } = parsedBody.data;

    const { data: collection, error } = await db
      .from('Collection')
      .insert({
        name,
        description,
        isAuto: isAuto || false,
        ...(userId && { userId }),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(collection);
  } catch (error: unknown) {
    console.error('Collection create error:', error);
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
}
