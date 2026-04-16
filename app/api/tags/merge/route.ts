import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

function asTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sourceTagId = asTrimmedString(body?.sourceTagId);
    const targetTagId = asTrimmedString(body?.targetTagId);
    const keepSourceTag = Boolean(body?.keepSourceTag);

    if (!sourceTagId || !targetTagId) {
      return NextResponse.json(
        { error: 'sourceTagId and targetTagId are required' },
        { status: 400 }
      );
    }

    if (sourceTagId === targetTagId) {
      return NextResponse.json(
        { error: 'sourceTagId and targetTagId must be different' },
        { status: 400 }
      );
    }

    const { data: sourceTag, error: sourceTagError } = await db
      .from('Tag')
      .select('id, name')
      .eq('id', sourceTagId)
      .maybeSingle();

    if (sourceTagError) throw sourceTagError;
    if (!sourceTag) {
      return NextResponse.json({ error: 'Source tag not found' }, { status: 404 });
    }

    const { data: targetTag, error: targetTagError } = await db
      .from('Tag')
      .select('id, name')
      .eq('id', targetTagId)
      .maybeSingle();

    if (targetTagError) throw targetTagError;
    if (!targetTag) {
      return NextResponse.json({ error: 'Target tag not found' }, { status: 404 });
    }

    const { data: sourceLinks, error: sourceLinksError } = await db
      .from('_ItemToTag')
      .select('A')
      .eq('B', sourceTagId);

    if (sourceLinksError) throw sourceLinksError;

    const sourceItemIds = [...new Set((sourceLinks ?? []).map((link) => link.A))];

    for (const itemId of sourceItemIds) {
      const { error: upsertError } = await db
        .from('_ItemToTag')
        .upsert({ A: itemId, B: targetTagId }, { onConflict: 'A,B' });

      if (upsertError) throw upsertError;
    }

    const { error: deleteLinksError } = await db
      .from('_ItemToTag')
      .delete()
      .eq('B', sourceTagId);

    if (deleteLinksError) throw deleteLinksError;

    const { data: targetLinks, error: targetLinksError } = await db
      .from('_ItemToTag')
      .select('A')
      .eq('B', targetTagId);

    if (targetLinksError) throw targetLinksError;

    const targetCount = targetLinks?.length ?? 0;

    const { error: updateTargetCountError } = await db
      .from('Tag')
      .update({ count: targetCount })
      .eq('id', targetTagId);

    if (updateTargetCountError) throw updateTargetCountError;

    if (keepSourceTag) {
      const { error: resetSourceCountError } = await db
        .from('Tag')
        .update({ count: 0 })
        .eq('id', sourceTagId);

      if (resetSourceCountError) throw resetSourceCountError;
    } else {
      const { error: deleteSourceTagError } = await db
        .from('Tag')
        .delete()
        .eq('id', sourceTagId);

      if (deleteSourceTagError) throw deleteSourceTagError;
    }

    return NextResponse.json({
      success: true,
      sourceTagId,
      targetTagId,
      movedItems: sourceItemIds.length,
      targetCount,
      deletedSourceTag: !keepSourceTag,
    });
  } catch (error) {
    console.error('Tag merge error:', error);
    return NextResponse.json({ error: 'Failed to merge tags' }, { status: 500 });
  }
}
