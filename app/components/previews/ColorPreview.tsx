import React from 'react';

export default function ColorPreview({ hex, name, rgb }: { hex: string, name?: string, rgb?: string }) {
  return (
    <div 
      className="rounded-xl overflow-hidden shadow-md h-64 flex flex-col group border border-zinc-200/50 dark:border-zinc-800/50"
    >
      <div className="flex-1 w-full" style={{ backgroundColor: hex }} />
      
      <div className="bg-white dark:bg-zinc-950 p-4 flex flex-col w-full border-t border-zinc-100 dark:border-zinc-900">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            {name && <h3 className="font-heading font-medium text-zinc-900 dark:text-zinc-100 text-lg leading-tight mb-1 capitalize tracking-tight">{name}</h3>}
            <span className="font-mono text-zinc-700 dark:text-zinc-300 font-bold tracking-wider">{hex.toUpperCase()}</span>
            {rgb && <span className="text-[10px] text-zinc-400 font-mono mt-0.5">{rgb}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
