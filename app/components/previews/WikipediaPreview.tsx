import React from 'react';
import PreviewImage from './PreviewImage';

export default function WikipediaPreview({ title, excerpt, imageUrl }: { title: string, excerpt: string, imageUrl?: string }) {
  return (
    <div className="flex flex-col bg-[#f8f9fa] dark:bg-zinc-900 border border-[#a2a9b1]/30 dark:border-zinc-700/50 p-5 rounded-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 opacity-5 pointer-events-none -mr-4 -mt-4">
        <svg viewBox="0 0 100 100" fill="currentColor">
          {/* A rough approximation of the Wikipedia globe motif */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8"/>
          <path d="M50 5 Q70 20 70 50 Q70 80 50 95 Q30 80 30 50 Q30 20 50 5" fill="none" stroke="currentColor" strokeWidth="4"/>
          <path d="M5 50 L95 50" fill="none" stroke="currentColor" strokeWidth="4"/>
          <path d="M15 25 L85 25" fill="none" stroke="currentColor" strokeWidth="4"/>
          <path d="M15 75 L85 75" fill="none" stroke="currentColor" strokeWidth="4"/>
        </svg>
      </div>

      <div className="flex items-start gap-4 mb-3">
        {imageUrl && (
          <div className="w-16 h-16 shrink-0 rounded overflow-hidden bg-white dark:bg-black border border-black/5 dark:border-white/5">
            <PreviewImage src={imageUrl} alt={title} className="object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0 pt-1">
          <div className="text-[10px] uppercase tracking-widest text-[#54595d] dark:text-zinc-400 font-sans mb-1 font-semibold">Wikipedia</div>
          <h3 className="font-heading text-xl font-normal text-black dark:text-white leading-tight truncate border-b border-[#a2a9b1]/40 dark:border-zinc-700 pb-1">
            {title.replace(/ - Wikipedia$/, '')}
          </h3>
        </div>
      </div>

      <p className="font-sans text-[13px] leading-relaxed text-[#202122] dark:text-zinc-300 line-clamp-4">
        {excerpt}
      </p>
    </div>
  );
}
