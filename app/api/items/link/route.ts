import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { z } from 'zod';
import { parseJsonBody } from '@/app/api/_validation';

const linkBodySchema = z.object({
  sourceItemId: z.string().trim().min(1, 'sourceItemId is required'),
  targetItemId: z.string().trim().min(1, 'targetItemId is required'),
  description: z.string().trim().min(1).max(500).optional(),
}).refine((value) => value.sourceItemId !== value.targetItemId, {
  message: 'sourceItemId and targetItemId must be different',
  path: ['targetItemId'],
});

const deleteLinkQuerySchema = z.object({
  sourceItemId: z.string().trim().min(1, 'sourceItemId is required'),
  targetItemId: z.string().trim().min(1, 'targetItemId is required'),
}).refine((value) => value.sourceItemId !== value.targetItemId, {
  message: 'sourceItemId and targetItemId must be different',
  path: ['targetItemId'],
});

export async function POST(req: Request) {
  try {
    const parsedBody = await parseJsonBody(req, linkBodySchema);
    if (!parsedBody.success) {
      return parsedBody.response;
    }

    const { sourceItemId, targetItemId, description } = parsedBody.data;

    const payload = {
      sourceItemId,
      targetItemId,
      ...(description ? { description } : {}),
    };

    const { data: link, error } = await db
      .from('ItemLink')
      .upsert(payload, { onConflict: 'sourceItemId,targetItemId' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(link);
  } catch (error: unknown) {
    console.error('Link creation error:', error);
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = deleteLinkQuerySchema.safeParse({
      sourceItemId: url.searchParams.get('sourceItemId'),
      targetItemId: url.searchParams.get('targetItemId'),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { sourceItemId, targetItemId } = parsed.data;

    const { error } = await db
      .from('ItemLink')
      .delete()
      .match({ sourceItemId, targetItemId });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Link deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 });
  }
}
