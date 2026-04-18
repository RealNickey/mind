'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { useQuery } from '@tanstack/react-query';
import { Search, Sparkles, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchSemanticSearch,
  semanticSearchQueryKey,
  type SemanticSearchResultPreview,
} from '@/app/lib/semantic-search';

type ChatMessageLike = {
  content?: unknown;
  text?: unknown;
  parts?: Array<{
    type?: string;
    text?: string;
  }>;
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

export function Omnibar() {
  const [mode, setMode] = useState<'search' | 'chat'>('search');
  const [inputLocal, setInputLocal] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, status } = useChat();
  const isChatLoading = status === 'submitted' || status === 'streaming';
  const {
    data: semanticResults,
    isFetching: isSearching,
    error: searchError,
    refetch: refetchSearch,
  } = useQuery({
    queryKey: semanticSearchQueryKey({ query: debouncedSearch, limit: 10 }),
    queryFn: ({ signal }) =>
      fetchSemanticSearch<SemanticSearchResultPreview>({
        query: debouncedSearch,
        limit: 10,
        signal,
      }),
    enabled: mode === 'search' && debouncedSearch.length > 0,
    staleTime: 60_000,
  });
  const searchResults = semanticResults?.results ?? [];
  const searchErrorMessage = searchError instanceof Error ? searchError.message : null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      setMode(prev => prev === 'search' ? 'chat' : 'search');
      setDebouncedSearch('');
    }
  };

  useEffect(() => {
    if (mode !== 'search') {
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      setDebouncedSearch(inputLocal.trim());
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [inputLocal, mode]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'chat') {
      if (!inputLocal.trim()) return;
      void sendMessage({ text: inputLocal });
      setInputLocal('');
    } else {
      const trimmedQuery = inputLocal.trim();
      if (!trimmedQuery) {
        setDebouncedSearch('');
        return;
      }

      if (trimmedQuery !== debouncedSearch) {
        setDebouncedSearch(trimmedQuery);
        return;
      }

      void refetchSearch();
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="w-full max-w-2xl mx-auto flex flex-col gap-0 relative bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 overflow-hidden"
    >
      <form onSubmit={onSubmit} className="flex items-center p-3 sm:p-4 border-b border-zinc-200/30 dark:border-zinc-800/30">
        <motion.div 
          layout 
          className={`mr-3 flex items-center justify-center p-2.5 rounded-2xl transition-colors duration-300 ${
            mode === 'search' 
              ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400' 
              : 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
          }`}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {mode === 'search' ? (
              <motion.div
                key="search"
                initial={{ opacity: 0, scale: 0.8, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: 45 }}
                transition={{ duration: 0.2 }}
              >
                <Search size={18} strokeWidth={2.5} />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0, scale: 0.8, rotate: 45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: -45 }}
                transition={{ duration: 0.2 }}
              >
                <Sparkles size={18} strokeWidth={2.5} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        <input
          ref={searchInputRef}
          type="text"
          value={inputLocal}
          onChange={(e) => setInputLocal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mode === 'search' ? 'Search your mind... (Press Tab to AI Chat)' : 'Ask the AI... (Press Tab to Search)'}
          className="flex-1 outline-none border-none bg-transparent text-lg text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-medium"
          autoFocus
        />
        
        <AnimatePresence>
          {mode === 'chat' && inputLocal.trim() && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 10 }}
              type="submit" 
              disabled={isChatLoading || !inputLocal.trim()}
              className="p-2.5 ml-2 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isChatLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </motion.button>
          )}
        </AnimatePresence>
      </form>

      {/* Results / Chat Output Area */}
      <AnimatePresence>
        {mode === 'search' && inputLocal.trim().length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="max-h-[400px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 bg-white/40 dark:bg-black/20"
          >
            {isSearching ? (
               <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 flex flex-col justify-center items-center gap-3">
                  <Loader2 size={20} className="animate-spin text-zinc-400 dark:text-zinc-500" /> 
                  <span className="text-sm font-medium">Scanning memory...</span>
               </div>
             ) : searchErrorMessage ? (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-center text-red-600 dark:text-red-300">
                 <p className="text-sm font-medium">{searchErrorMessage}</p>
               </motion.div>
             ) : searchResults.length > 0 ? (
              <motion.div 
                className="flex flex-col gap-1.5 p-1"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.05 }
                  }
                }}
              >
                {searchResults.map((result, idx) => (
                  <motion.div 
                    key={result.id ?? idx}
                    variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                    className="p-3.5 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-zinc-100/50 dark:border-zinc-800/50 shadow-sm flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{result.title || result.sourceUrl || 'Untitled'}</h4>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">{result.content || result.description}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search size={20} className="opacity-50" />
                </div>
                <p className="text-sm font-medium">No connections found</p>
              </motion.div>
            )}
          </motion.div>
        )}

        {mode === 'chat' && messages.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="max-h-[400px] overflow-y-auto p-5 flex flex-col gap-4 bg-white/40 dark:bg-black/20 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800"
          >
            {messages.map((m, i) => (
               <motion.div 
                 initial={{ opacity: 0, y: 10, scale: 0.95 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 transition={{ delay: i * 0.05 }}
                 key={m.id} 
                 className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
               >
                 <div className={`max-w-[85%] px-4 py-3 text-[15px] leading-relaxed shadow-sm ${
                   m.role === 'user' 
                     ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-2xl rounded-tr-md' 
                     : 'bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 text-zinc-800 dark:text-zinc-200 rounded-2xl rounded-tl-md backdrop-blur-sm'
                 }`}>
                   {getMessageText(m)}
                 </div>
               </motion.div>
            ))}
            {isChatLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                 <div className="bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/50 dark:border-zinc-800/50 p-4 rounded-2xl rounded-tl-md shadow-sm flex items-center gap-3 backdrop-blur-sm">
                   <div className="flex gap-1.5">
                     <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                     <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                     <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                   </div>
                 </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
