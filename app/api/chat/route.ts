import { cohere } from '@ai-sdk/cohere';
import { convertToModelMessages, safeValidateUIMessages, streamText, type ModelMessage } from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildGroundedChatPrompt, toChatMessageSources } from './grounding';
import { parseJsonBody } from '@/app/api/_validation';

const chatRequestSchema = z.object({
  messages: z.unknown(),
  collectionId: z.string().optional().nullable(),
});

function getLatestUserMessageText(messages: ModelMessage[]): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message.role !== 'user') {
      continue;
    }

    if (typeof message.content === 'string') {
      const text = message.content.trim();
      if (text.length > 0) {
        return text;
      }
      continue;
    }

    const text = message.content
      .filter((part) => part.type === 'text')
      .map((part) => part.text.trim())
      .filter((part) => part.length > 0)
      .join('\n')
      .trim();

    if (text.length > 0) {
      return text;
    }
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const parsedBody = await parseJsonBody(req, chatRequestSchema, {
      invalidBodyMessage: 'Invalid request payload',
    });
    if (!parsedBody.success) {
      return parsedBody.response;
    }

    const validatedMessages = await safeValidateUIMessages({
      messages: parsedBody.data.messages,
    });

    if (!validatedMessages.success) {
      return NextResponse.json(
        { error: 'Invalid chat messages', details: validatedMessages.error.message },
        { status: 400 },
      );
    }

    const modelMessages = await convertToModelMessages(validatedMessages.data);
    const latestUserMessage = getLatestUserMessageText(modelMessages);

    if (!latestUserMessage) {
      return NextResponse.json({ error: 'A user message is required' }, { status: 400 });
    }

    const { collectionId } = parsedBody.data;
    const { contextItems, systemPrompt } = await buildGroundedChatPrompt(latestUserMessage, collectionId);
    const sources = toChatMessageSources(contextItems);

    const result = streamText({
      model: cohere('command-r'),
      messages: modelMessages,
      system: systemPrompt,
    });

    return result.toUIMessageStreamResponse({
      messageMetadata: sources.length > 0 ? () => ({ sources }) : undefined,
    });
  } catch (error: unknown) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
