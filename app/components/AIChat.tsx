'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface MessageSource {
  id: string;
  title: string;
  type: string;
}

type ChatMessageLike = {
  content?: unknown;
  text?: unknown;
  parts?: Array<{
    type?: string;
    text?: string;
  }>;
  metadata?: unknown;
  sources?: unknown;
};

function getMessageText(message: ChatMessageLike): string {
  if (typeof message.content === 'string') {
    return message.content;
  }

  if (typeof message.text === 'string') {
    return message.text;
  }

  if (Array.isArray(message.parts)) {
    const textParts = message.parts
      .filter((part) => part.type === 'text' && typeof part.text === 'string')
      .map((part) => part.text as string);

    if (textParts.length > 0) {
      return textParts.join('\n');
    }
  }

  return '';
}

function isMessageSource(source: unknown): source is MessageSource {
  if (!source || typeof source !== 'object') return false;

  const candidate = source as Partial<MessageSource>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.type === 'string'
  );
}

function getMessageSources(message: ChatMessageLike): MessageSource[] {
  if (Array.isArray(message.sources)) {
    return message.sources.filter(isMessageSource);
  }

  if (message.metadata && typeof message.metadata === 'object') {
    const metadata = message.metadata as { sources?: unknown };
    if (Array.isArray(metadata.sources)) {
      return metadata.sources.filter(isMessageSource);
    }
  }

  return [];
}

export function AIChat() {
  const { messages, sendMessage: sendChatMessage, status, error } = useChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoading = status === 'submitted' || status === 'streaming';
  const displayMessages = messages.filter((m) => m.role === 'user' || m.role === 'assistant');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages, isLoading, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    await sendChatMessage({ text: userMsg });
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl rounded-2xl overflow-hidden shadow-2xl border border-white/20 dark:border-zinc-800/20 ring-1 ring-black/5 dark:ring-white/5">
      <div className="bg-zinc-100/50 dark:bg-zinc-800/50 p-4 font-heading font-semibold border-b border-zinc-200/50 dark:border-zinc-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100">
            <Sparkles size={16} className="text-zinc-100 dark:text-zinc-900" />
          </div>
          <span className="text-zinc-900 dark:text-zinc-100 tracking-tight">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            {isLoading ? 'Thinking' : 'Ready'}
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 font-sans text-sm scrollbar-hide" ref={scrollRef}>
        {displayMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Bot size={24} className="text-zinc-400" />
            </div>
            <div className="space-y-1">
              <p className="text-zinc-900 dark:text-zinc-100 font-semibold">How can I help you?</p>
              <p className="text-zinc-500 text-xs max-w-[200px]">Ask me anything about your saved items and insights.</p>
            </div>
          </div>
        )}
        
        {displayMessages.map((m) => {
          const sources = getMessageSources(m);

          return (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
              m.role === 'user' 
                ? 'bg-zinc-900 text-zinc-100 rounded-tr-none dark:bg-zinc-100 dark:text-zinc-900' 
                : 'bg-white/50 dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200/50 dark:border-zinc-700/50'
            }`}>
              <div className="leading-relaxed whitespace-pre-wrap">
                {getMessageText(m)}
              </div>
               
              {sources.length > 0 && (
                <div className={`mt-4 pt-3 border-t text-[10px] ${
                  m.role === 'user' ? 'border-zinc-700 dark:border-zinc-300' : 'border-zinc-200 dark:border-zinc-700'
                }`}>
                  <span className="font-bold uppercase tracking-widest block mb-2 opacity-60">Sources</span>
                  <div className="flex flex-wrap gap-1.5">
                     {sources.map((s, idx) => (
                       <span key={idx} className={`px-2 py-0.5 rounded-md ${
                         m.role === 'user' 
                          ? 'bg-zinc-800 text-zinc-400 dark:bg-zinc-200 dark:text-zinc-500' 
                          : 'bg-zinc-200/50 text-zinc-500 dark:bg-zinc-700/50 dark:text-zinc-400'
                       }`}>
                         {s.title}
                       </span>
                     ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-start">
              <div className="max-w-[75%] p-4 rounded-2xl bg-white/50 dark:bg-zinc-800/50 text-zinc-500 rounded-tl-none border border-zinc-200/50 dark:border-zinc-700/50 flex items-center gap-3">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs font-medium tracking-tight">Thinking...</span>
              </div>
          </div>
        )}
        {error && !isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[75%] p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-tl-none border border-rose-200/50 dark:border-rose-800/50 text-xs font-medium">
              An error occurred while thinking.
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-zinc-100/50 dark:bg-zinc-800/50 border-t border-zinc-200/50 dark:border-zinc-700/50">
        <form onSubmit={handleSubmit} className="flex flex-row gap-2 relative group/input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your mind..."
            className="flex-1 w-full pl-4 pr-12 py-3 bg-white dark:bg-zinc-900 border-none rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-sm shadow-sm transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
