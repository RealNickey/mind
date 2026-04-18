import { NextRequest, NextResponse } from 'next/server';
import { extractColors } from '@/app/lib/image-processing';
import { z } from 'zod';

const extractColorsSchema = z.object({
  imageUrl: z.string().trim().url('A valid image URL is required'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = extractColorsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Image URL is required', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { imageUrl } = parsed.data;

    const colors = await extractColors(imageUrl);

    return NextResponse.json({ colors }, { status: 200 });
  } catch (error: unknown) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: 'Failed to extract colors' }, { status: 500 });
  }
}
