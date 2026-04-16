'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Search, Bot, Send, Loader2 } from 'lucide-react';

export function Omnibar() {
  const [mode, setMode] = useState<'search' | 'chat'>('search');
  const [inputLocal, setInputLocal] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // @ts-ignore
  const { messages, append, isLoading: isChatLoading } = useChat();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      setMode(prev => prev === 'search' ? 'chat' : 'search');
      setSearchResults([]);
    }
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search/semantic?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (mode === 'search') {
      const delayDebounceFn = setTimeout(() => {
        performSearch(inputLocal);
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [inputLocal, mode]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'chat') {
      if (!inputLocal.trim()) return;
      append({ role: 'user', content: inputLocal });
      setInputLocal('');
    } else {
      performSearch(inputLocal);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-2 relative bg-white shadow-lg rounded-2xl border border-gray-200 overflow-hidden">
      <form onSubmit={onSubmit} className="flex items-center p-3 border-b border-gray-100">
        <div className="mr-3 flex items-center justify-center p-2 rounded-full bg-gray-50 text-gray-500">
          {mode === 'search' ? <Search size={20} /> : <Bot size={20} />}
        </div>
        
        <input
          ref={searchInputRef}
          type="text"
          value={inputLocal}
          onChange={(e) => setInputLocal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mode === 'search' ? 'Search your mind... (Press Tab to Chat)' : 'Ask the AI... (Press Tab to Search)'}
          className="flex-1 outline-none border-none text-gray-700 bg-transparent text-lg placeholder:text-gray-400"
          autoFocus
        />
        
        {mode === 'chat' && (
          <button 
            type="submit" 
            disabled={isChatLoading || !inputLocal.trim()}
            className="p-2 ml-2 rounded-full bg-[#111] text-white disabled:opacity-50"
          >
            {isChatLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        )}
      </form>

      {/* Results / Chat Output Area */}
      {mode === 'search' && inputLocal.trim() && (
        <div className="max-h-96 overflow-y-auto p-2 bg-gray-50">
          {isSearching ? (
             <div className="p-4 text-center text-gray-500 flex justify-center items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Searching...
             </div>
          ) : searchResults.length > 0 ? (
            <div className="flex flex-col gap-2">
              {searchResults.map((result, idx) => (
                <div key={idx} className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm flex items-start gap-3 hover:bg-gray-50 cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 truncate">{result.title || result.url || 'Untitled'}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{result.content || result.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">No results found</div>
          )}
        </div>
      )}

      {mode === 'chat' && messages.length > 0 && (
        <div className="max-h-96 overflow-y-auto p-4 flex flex-col gap-4 bg-gray-50">
          {messages.map((m) => (
             <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[80%] p-3 rounded-2xl ${
                 m.role === 'user' 
                   ? 'bg-[#111] text-white rounded-tr-sm' 
                   : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
               }`}>
                 {/* @ts-ignore */}
                 {m.content || m.text}
               </div>
             </div>
          ))}
          {isChatLoading && (
            <div className="flex justify-start">
               <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                 <Loader2 size={16} className="animate-spin text-gray-400" />
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
