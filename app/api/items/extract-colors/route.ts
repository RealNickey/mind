import { NextRequest, NextResponse } from 'next/server';
import { extractColors } from '@/app/lib/image-processing';

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    const colors = await extractColors(imageUrl);

    return NextResponse.json({ colors }, { status: 200 });
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: 'Failed to extract colors' }, { status: 500 });
  }
}
