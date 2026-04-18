import { cohere } from '@ai-sdk/cohere';
import { convertToModelMessages, safeValidateUIMessages, streamText } from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const chatRequestSchema = z.object({
  messages: z.unknown(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const validatedMessages = await safeValidateUIMessages({
      messages: parsed.data.messages,
    });

    if (!validatedMessages.success) {
      return NextResponse.json({ error: 'Invalid chat messages' }, { status: 400 });
    }

    const result = streamText({
      model: cohere('command-r'),
      messages: await convertToModelMessages(validatedMessages.data),
      system: "You are a helpful AI assistant that answers questions about the user's saved content.",
    });

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
