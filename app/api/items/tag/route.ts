import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { generateTagsForContent } from '@/app/lib/ai-tagging';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
    }

    // Fetch the item
    const { data: item, error: fetchErr } = await db
      .from('Item')
      .select('*, tags:Tag(*)')
      .eq('id', itemId)
      .single();

    if (fetchErr || !item) {
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

    // Extract names of existing tags to avoid reconnecting them unnecessarily
    const existingTagNames = new Set((item.tags || []).map((t: any) => t.name));
    const newTagsToConnect = generatedTags.filter(t => !existingTagNames.has(t));

    if (newTagsToConnect.length === 0) {
      return NextResponse.json({ success: true, tags: item.tags, message: 'Tags already up to date' });
    }

    // Upsert tags to ensure they exist and their global count is tracked/incremented
    const connectedTags = [];
    for (const tagName of newTagsToConnect) {
      let { data: tag, error: selectErr } = await db
        .from('Tag')
        .select('*')
        .eq('name', tagName)
        .single();
        
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
      
      connectedTags.push(tag);
      
      // Connect in relation table _ItemToTag (Assuming Prisma default implicit M2M)
      const A = [itemId, tag.id].sort()[0];
      const B = [itemId, tag.id].sort()[1] === itemId ? itemId : tag.id;
      // Wait, A is typically Item and B is Tag, or ordered by table name.
      // Item (I) vs Tag (T) -> 'Item' comes before 'Tag' alphabetically. 
      // Prisma uses A mapping to the model that comes first alphabetically (Item), B to the other (Tag).
      await db.from('_ItemToTag').insert({ A: itemId, B: tag.id }); // Ignore errors if it already exists
    }

    const { data: finalItem } = await db
      .from('Item')
      .select('*, tags:Tag(*)')
      .eq('id', itemId)
      .single();

    return NextResponse.json({ 
      success: true, 
      tags: finalItem?.tags || item.tags 
    });

  } catch (error) {
    console.error('Error auto-tagging item:', error);
    return NextResponse.json(
      { error: 'Failed to generate tags' }, 
      { status: 500 }
    );
  }
}
