import { NextRequest, NextResponse } from 'next/server';
import { extractColors } from '@/app/lib/image-processing';
import { z } from 'zod';
import { parseJsonBody } from '@/app/api/_validation';

const extractColorsSchema = z.object({
  imageUrl: z.string().trim().url('A valid image URL is required'),
});

export async function POST(req: NextRequest) {
  try {
    const parsedBody = await parseJsonBody(req, extractColorsSchema);
    if (!parsedBody.success) {
      return parsedBody.response;
    }

    const { imageUrl } = parsedBody.data;

    const colors = await extractColors(imageUrl);

    return NextResponse.json({ colors }, { status: 200 });
  } catch (error: unknown) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: 'Failed to extract colors' }, { status: 500 });
  }
}
