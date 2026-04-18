import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import type { Json, Tables } from '@/app/lib/database.types';
import { z } from 'zod';

const saveCanvasSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string().trim().min(1),
      x: z.number(),
      y: z.number(),
    })
  ),
});

type ItemMetadataSummary = Pick<Tables<'ItemMetadata'>, 'id' | 'itemId' | 'customData'>;

function isJsonObject(value: Json | null): value is Record<string, Json | undefined> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = saveCanvasSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { nodes } = parsed.data;

    // Save canvas positions in item metadata
    const { data: existingMetadata, error: fetchErr } = await db
      .from('ItemMetadata')
      .select('id, itemId, customData')
      .in('itemId', nodes.map((node) => node.id));

    if (fetchErr) throw fetchErr;

    const metadataByItemId = new Map(
      (existingMetadata as ItemMetadataSummary[] | null | undefined)?.map((metadata) => [
        metadata.itemId,
        metadata,
      ]) ?? []
    );

    const metadataToUpsert = nodes.map((node) => {
      const existing = metadataByItemId.get(node.id);
      const currentCustomData = existing?.customData ?? null;
      const existingCustomData = isJsonObject(currentCustomData) ? currentCustomData : {};

      return {
        ...(existing ? { id: existing.id } : { id: crypto.randomUUID() }),
        itemId: node.id,
        customData: {
          ...existingCustomData,
          canvasPosition: { x: node.x, y: node.y },
        },
      };
    });

    if (metadataToUpsert.length > 0) {
      const { error: upsertErr } = await db
        .from('ItemMetadata')
        .upsert(metadataToUpsert, { onConflict: 'itemId' });
        
      if (upsertErr) throw upsertErr;
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Canvas save error:', error);
    return NextResponse.json({ error: 'Failed to save canvas layout' }, { status: 500 });
  }
}
