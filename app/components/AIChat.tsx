'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Send, Bot, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

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

export function AIChat({ activeSessionId }: { activeSessionId?: string }) {
  const { messages, sendMessage: sendChatMessage, status, error } = useChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoading = status === 'submitted' || status === 'streaming';
  const displayMessages = messages.filter((m) => m.role === 'user' || m.role === 'assistant');
  const shouldReduceMotion = useReducedMotion();

  const messageTransition = shouldReduceMotion
    ? { duration: 0.001 }
    : { duration: 0.2, ease: [0.23, 1, 0.32, 1] as const };

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
    await sendChatMessage({ text: userMsg }, { body: { collectionId: activeSessionId || null } });
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
      
      <div className="flex-1 overflow-y-auto p-5 space-y-5 font-sans text-sm scrollbar-hide" ref={scrollRef}>
        {displayMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Bot size={22} className="text-zinc-400" />
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
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={messageTransition}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-3.5 rounded-2xl shadow-sm text-[13px] leading-relaxed ${
              m.role === 'user' 
                ? 'bg-zinc-900 text-zinc-100 rounded-tr-md dark:bg-zinc-100 dark:text-zinc-900' 
                : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200 rounded-tl-md border border-zinc-200/50 dark:border-zinc-700/50 backdrop-blur-sm'
            }`}>
              <div className="leading-relaxed whitespace-pre-wrap">
                {getMessageText(m)}
              </div>
               
              {sources.length > 0 && (
                <div className={`mt-3 pt-2.5 border-t text-[10px] ${
                  m.role === 'user' ? 'border-zinc-700 dark:border-zinc-300' : 'border-zinc-200 dark:border-zinc-700'
                }`}>
                  <span className="font-bold uppercase tracking-widest block mb-1.5 opacity-60">Sources</span>
                  <div className="flex flex-wrap gap-1">
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
          </motion.div>
          );
        })}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="p-3.5 rounded-2xl rounded-tl-md bg-white/60 dark:bg-zinc-800/60 border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm backdrop-blur-sm flex items-center gap-1.5">
              {[0, 0.2, 0.4].map((delay, idx) => (
                <motion.div
                  key={idx}
                  animate={shouldReduceMotion ? {} : { opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                  transition={shouldReduceMotion ? {} : { repeat: Infinity, duration: 1.2, delay, ease: [0.23, 1, 0.32, 1] }}
                  className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500"
                />
              ))}
            </div>
          </motion.div>
        )}
        {error && !isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[75%] p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-tl-md border border-rose-200/50 dark:border-rose-800/50 text-xs font-medium">
              An error occurred while thinking.
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-zinc-100/50 dark:bg-zinc-800/50 border-t border-zinc-200/50 dark:border-zinc-700/50">
        <form onSubmit={handleSubmit} className="flex flex-row gap-2 relative group/input">
          <label htmlFor="ai-chat-input" className="sr-only">Ask your AI assistant a question</label>
          <input
            id="ai-chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your mind…"
            className="flex-1 w-full pl-4 pr-12 py-3 bg-white dark:bg-zinc-900 border-none rounded-xl focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 text-sm shadow-sm transition-shadow"
            disabled={isLoading}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 transition-all duration-150 hover:scale-[1.02] active:scale-[0.97] disabled:opacity-30 disabled:hover:scale-100"
            aria-label="Send message"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}