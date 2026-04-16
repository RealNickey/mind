import { cohere } from '@ai-sdk/cohere';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: cohere('command-r'),
      messages,
      system: "You are a helpful AI assistant that answers questions about the user's saved content.",
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
