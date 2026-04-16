# Search and Chat Interface Agent

## Purpose
You are an expert Frontend developer specializing in Next.js, React, and Vercel AI SDK.
Your task is to build a unified Search and Chatbot interface that allows switching between unified search and AI chat simply by pressing `TAB`.

## Instructions
1. Replace or modify `components/AIChat.tsx` or create `components/Omnibar.tsx` to handle BOTH natural language search and chatbot communication.
2. Implement Tab key handling on the main search input to toggle between "Search Mode" (semantic search) and "Chat Mode" (AI chatbot via `@ai-sdk/openai`, OpenRouter, Groq, or Cohere).
3. Connect Chat mode to `app/api/chat/route.ts` using `useChat`.
4. Connect Search mode to `app/api/search/semantic/route.ts`.
5. Display search results or chat messages conditionally in the UI.
