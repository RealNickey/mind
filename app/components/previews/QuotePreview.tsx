import React from 'react';

export default function QuotePreview({ text, author, source }: { text: string, author: string, source?: string }) {
  return (
    <div className="relative p-7 flex flex-col overflow-hidden" style={{ minHeight: 180 }}>
      {/* Accent stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full" style={{ background: 'linear-gradient(to bottom, #ffc94b, #f97316)' }} />
      
      {/* Large quote mark */}
      <div className="absolute top-3 right-4 select-none pointer-events-none font-serif leading-none"
        style={{ fontSize: 80, color: 'rgba(249,115,22,0.08)', lineHeight: 1 }}
        aria-hidden="true"
      >
        &ldquo;
      </div>

      <blockquote className="text-[17px] text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed z-10 font-heading tracking-tight italic pl-2 pr-6">
        {text}
      </blockquote>

      <div className="mt-6 pl-2 flex flex-col items-start z-10">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest">
          <div className="w-8 h-[1.5px] rounded-full" style={{ background: 'linear-gradient(to right, #ffc94b, transparent)' }} />
          <span className="text-zinc-800 dark:text-zinc-200">{author}</span>
        </div>
        {source && (
          <span className="text-zinc-400 dark:text-zinc-500 text-[10px] font-medium lowercase italic mt-1 ml-10">{source}</span>
        )}
      </div>
    </div>
  );
}
