import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { searchSimilarItems } from '../../../lib/rag';
import { z } from 'zod';

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
    const body = await req.json();
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const { message, history } = parsed.data;

    const contextItems = await searchSimilarItems(message, 5);

    const contextStr = contextItems.map(item => `
      Title: ${item.title}
      Type: ${item.type}
      Description: ${item.description || 'N/A'}
      Content: ${item.content || 'N/A'}
    `).join('\n\n');

    const systemPrompt = `
      You are an AI assistant grounded in the user's personal knowledge base (MyMind).
      Answer their questions thoroughly using ONLY the provided context from their saved items.
      If the answer is not in the context, tell them you don't have enough information saved yet.
      Be friendly, concise, and helpful. Use Markdown for formatting.

      Context Items:
      ${contextStr}
    `;

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
      sources: contextItems.map(i => ({ id: i.id, title: i.title, type: i.type }))
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Chat generation failed' }, { status: 500 });
  }
}
