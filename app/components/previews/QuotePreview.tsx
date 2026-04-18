import React from 'react';

export default function QuotePreview({ text, author, source }: { text: string, author: string, source?: string }) {
  return (
    <div className="p-8 flex flex-col relative group/quote">
      <div className="absolute top-4 left-4 text-zinc-200 dark:text-zinc-800 text-6xl leading-none font-serif opacity-50 select-none group-hover/quote:text-indigo-200/50 transition-colors duration-500">
        &ldquo;
      </div>
      
      <blockquote className="text-xl text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed z-10 pt-4 font-heading tracking-tight italic">
        {text}
      </blockquote>
      
      <div className="mt-8 flex flex-col items-start border-t border-zinc-100 dark:border-zinc-800/50 pt-4 text-[11px] font-bold uppercase tracking-wider z-10">
        <span className="text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <span className="w-4 h-px bg-zinc-300 dark:bg-zinc-700" />
          {author}
        </span>
        {source && <span className="text-zinc-400 dark:text-zinc-500 font-medium lowercase italic mt-1 ml-6">{source}</span>}
      </div>
    </div>
  );
}
