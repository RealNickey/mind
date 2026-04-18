'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface MessageSource {
  id: string;
  title: string;
  type: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: MessageSource[];
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: messages }),
      });

      if (!res.ok) throw new Error('Failed to fetch response');
      const data = await res.json() as {
        reply?: string;
        sources?: MessageSource[];
      };
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply ?? 'I could not generate a response.',
        sources: data.sources ?? []
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'An error occurred while thinking.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] w-full max-w-md bg-white border border-[#E6D7F0] rounded-xl overflow-hidden shadow-lg">
      <div className="bg-[#FFF8DC] p-4 font-playfair font-semibold border-b border-[#E6D7F0] flex items-center gap-2">
        <Bot size={20} className="text-[#FFB3D9]" />
        MyMind AI
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-inter text-sm" ref={scrollRef}>
        {messages.length === 0 && (
          <p className="text-gray-400 text-center mt-10">Ask me anything about your items!</p>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-[#E6D7F0] flex items-center justify-center shrink-0">
                <Bot size={16} className="text-gray-600" />
              </div>
            )}
            
            <div className={`max-w-[75%] p-3 rounded-xl ${
              m.role === 'user' 
                ? 'bg-[#B3E5D1] text-gray-800 rounded-tr-none' 
                : 'bg-gray-100 text-gray-800 rounded-tl-none'
            }`}>
              {m.content}
              
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-300 text-xs">
                  <span className="font-semibold block mb-1">Sources:</span>
                  <ul className="list-disc pl-4">
                     {m.sources.map((s, idx) => (
                       <li key={idx} className="truncate">
                         {s.title}
                       </li>
                     ))}
                  </ul>
                </div>
              )}
            </div>
            
            {m.role === 'user' && (
               <div className="w-8 h-8 rounded-full bg-[#FFDAB9] flex items-center justify-center shrink-0">
                 <User size={16} className="text-gray-600" />
               </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
             <div className="w-8 h-8 rounded-full bg-[#E6D7F0] flex items-center justify-center shrink-0">
                <Bot size={16} className="text-gray-600" />
              </div>
              <div className="max-w-[75%] p-3 rounded-xl bg-gray-100 text-gray-800 rounded-tl-none flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-gray-500" /> Thinking...
              </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <form onSubmit={sendMessage} className="flex flex-row gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search your mind..."
            className="flex-1 w-full pl-4 pr-10 py-2 border border-[#E6D7F0] rounded-full focus:outline-none focus:ring-2 focus:ring-[#FFB3D9] text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1.5 bottom-1.5 p-1 rounded-full bg-[#FFB3D9] text-white hover:bg-[#ff9bc9] transition-colors disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
