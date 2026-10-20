import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { default as NextImage } from 'next/image';

export default function ColorPreview({ color, name, isCard = true }: { color: string, name?: string, isCard?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(color);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If not in a card (open mode), take full space and show copy button
  if (!isCard) {
    return (
      <div 
        className="group relative rounded-2xl overflow-hidden shadow-md border border-zinc-200/50 dark:border-zinc-800/50 cursor-pointer w-full h-full min-h-[300px]"
        onClick={handleCopy}
        title="Click to copy"
        style={{ backgroundColor: color }}
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 backdrop-blur-sm">
          <div className="bg-white/95 dark:bg-zinc-900/95 text-zinc-900 dark:text-zinc-100 p-4 rounded-full shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3">
            {copied ? (
              <>
                <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <span className="font-heading font-medium pr-2 text-lg">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-6 h-6" />
                <span className="font-heading font-medium pr-2 text-lg">Copy {color}</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Card view: no copy button (clicking expands), split view
  return (
    <div className="group relative rounded-xl overflow-hidden shadow-md aspect-square flex flex-col border border-zinc-200/50 dark:border-zinc-800/50">
      <div className="flex-1 w-full relative" style={{ backgroundColor: color }} />
      
      <div className="bg-white dark:bg-zinc-950 p-4 flex flex-col w-full border-t border-zinc-100 dark:border-zinc-900">
        <div className="flex justify-between items-end">
          <div className="flex flex-col truncate w-full">
            {name && name !== color && <h3 className="font-heading font-medium text-zinc-900 dark:text-zinc-100 text-base leading-tight mb-1 truncate">{name}</h3>}
            <span className="font-mono text-zinc-700 dark:text-zinc-300 font-bold tracking-wider text-sm truncate">{color}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
