import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { z } from 'zod';
import { buildGroundedChatPrompt, toChatMessageSources } from '../grounding';
import { parseJsonBody } from '@/app/api/_validation';

const chatRequestSchema = z.object({
  message: z.string().trim().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().trim().min(1),
      })
    )
    .default([]),
});

export async function POST(req: Request) {
  try {
    const parsedBody = await parseJsonBody(req, chatRequestSchema, {
      invalidBodyMessage: 'Invalid request payload',
    });
    if (!parsedBody.success) {
      return parsedBody.response;
    }

    const { message, history } = parsedBody.data;
    const { contextItems, systemPrompt } = await buildGroundedChatPrompt(message);

    const response = await generateText({
      model: groq('llama3-8b-8192'),
      system: systemPrompt,
      messages: [
        ...history,
        { role: 'user', content: message },
      ],
    });

    return NextResponse.json({
      reply: response.text,
      sources: toChatMessageSources(contextItems),
    });
  } catch (error: unknown) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Chat generation failed' }, { status: 500 });
  }
}
