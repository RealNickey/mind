import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { generateTagsForContent } from '@/app/lib/ai-tagging';
import { getItemByIdWithRelations } from '@/app/lib/item-hydration';
import { z } from 'zod';

const autoTagSchema = z.object({
  itemId: z.string().trim().min(1, 'itemId is required'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = autoTagSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'itemId is required', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { itemId } = parsed.data;

    const item = await getItemByIdWithRelations(itemId);

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Generate tags using Groq JSON mode
    const generatedTags = await generateTagsForContent(
      item.type,
      item.title,
      item.description,
      item.content
    );

    if (!generatedTags || generatedTags.length === 0) {
      return NextResponse.json({ message: 'No tags generated', tags: item.tags });
    }

    const existingTagNames = new Set((item.tags || []).map((tag) => tag.name.toLowerCase()));
    const dedupedGeneratedTags = [...new Set(generatedTags
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean))];

    const newTagsToConnect = dedupedGeneratedTags
      .filter((tag) => !existingTagNames.has(tag));

    if (newTagsToConnect.length === 0) {
      return NextResponse.json({ success: true, tags: item.tags, message: 'Tags already up to date' });
    }

    for (const tagName of newTagsToConnect) {
      const { data: existingTag, error: selectErr } = await db
        .from('Tag')
        .select('*')
        .eq('name', tagName)
        .maybeSingle();

      if (selectErr) throw selectErr;

      let tag = existingTag;
      if (!tag) {
        const { data: newTag, error: insertErr } = await db
          .from('Tag')
          .insert({ name: tagName, count: 1 })
          .select()
          .single();
        if (insertErr) throw insertErr;
        tag = newTag;
      } else {
        const { data: updatedTag, error: updateErr } = await db
          .from('Tag')
          .update({ count: tag.count + 1 })
          .eq('id', tag.id)
          .select()
          .single();
        if (updateErr) throw updateErr;
        tag = updatedTag;
      }

      const { error: connectError } = await db
        .from('_ItemToTag')
        .upsert({ A: itemId, B: tag.id }, { onConflict: 'A,B' });

      if (connectError) throw connectError;
    }

    const finalItem = await getItemByIdWithRelations(itemId);

    return NextResponse.json({ 
      success: true, 
      tags: finalItem?.tags || item.tags 
    });

  } catch (error: unknown) {
    console.error('Error auto-tagging item:', error);
    return NextResponse.json(
      { error: 'Failed to generate tags' }, 
      { status: 500 }
    );
  }
}
