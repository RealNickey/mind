import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
    }

    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'JSON must be an array of items' }, { status: 400 });
    }

    const results = [];
    for (const item of data) {
      const { data: createdItem, error } = await db
        .from('Item')
        .insert({
          title: item.title || 'Untitled',
          description: item.description,
          content: item.content,
          type: item.type || 'note',
        })
        .select()
        .single();
        
      if (error) {
        console.error('Failed to import item', item, error);
        continue;
      }
      results.push(createdItem);
    }

    return NextResponse.json({ success: true, count: results.length, items: results });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
