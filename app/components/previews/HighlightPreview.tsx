import React from 'react';
import { Highlighter } from 'lucide-react';

export default function HighlightPreview({ text, sourceTitle, sourceUrl }: { text: string, sourceTitle?: string, sourceUrl?: string }) {
  return (
    <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 relative group">
      <div className="absolute top-4 right-4 text-yellow-400/50 dark:text-yellow-500/30 transition-transform group-hover:scale-110 group-hover:text-yellow-500 dark:group-hover:text-yellow-400">
        <Highlighter size={20} />
      </div>

      <p className="font-heading text-lg leading-relaxed text-zinc-900 dark:text-zinc-100 pr-8 italic">
        &quot;{text}&quot;
      </p>

      {sourceTitle && (
        <div className="mt-4 pt-3 border-t border-yellow-200 dark:border-yellow-900/50 flex items-center justify-between">
          <span className="text-xs font-medium text-yellow-800 dark:text-yellow-200/70 truncate pr-4">
            From: {sourceTitle}
          </span>
          {sourceUrl && (
            <span className="text-[10px] uppercase tracking-wider font-bold text-yellow-600 dark:text-yellow-400/50 shrink-0">
              Source
            </span>
          )}
        </div>
      )}
    </div>
  );
}
