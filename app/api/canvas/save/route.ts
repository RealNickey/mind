import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function POST(req: Request) {
  try {
    const { nodes } = await req.json();
    
    if (!Array.isArray(nodes)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Save canvas positions in item metadata
    const { data: existingMetadata, error: fetchErr } = await db
      .from('ItemMetadata')
      .select('id, itemId, customData')
      .in('itemId', nodes.map((node: any) => node.id));

    if (fetchErr) throw fetchErr;

    const metadataToUpsert = nodes.map((node: any) => {
      const existing = existingMetadata?.find((m: any) => m.itemId === node.id);
      return {
        ...(existing ? { id: existing.id } : { id: crypto.randomUUID() }),
        itemId: node.id,
        customData: {
          ...((existing?.customData as Record<string, any>) || {}),
          canvasPosition: { x: node.x, y: node.y }
        }
      };
    });

    if (metadataToUpsert.length > 0) {
      const { error: upsertErr } = await db
        .from('ItemMetadata')
        .upsert(metadataToUpsert, { onConflict: 'itemId' });
        
      if (upsertErr) throw upsertErr;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Canvas save error:', error);
    return NextResponse.json({ error: 'Failed to save canvas layout' }, { status: 500 });
  }
}
