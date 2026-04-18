import React from 'react';

export default function NotePreview({ title, markdown, color = '#FFF9A6' }: { title: string, markdown: string, color?: string }) {
  return (
    <div 
      className="relative p-6 min-h-[180px] flex flex-col transition-all duration-300 group-hover:brightness-[1.02]" 
      style={{ 
        backgroundColor: color,
        backgroundImage: 'linear-gradient(to bottom right, rgba(255,255,255,0.2), transparent)'
      }}
    >
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
      
      <h3 className="font-heading text-lg font-semibold text-zinc-900/80 mb-3 leading-tight tracking-tight border-b border-black/5 pb-2">
        {title}
      </h3>
      <div className="font-sans text-sm text-zinc-800/90 line-clamp-6 leading-relaxed whitespace-pre-wrap">
        {markdown}
      </div>
    </div>
  );
}
