import React from 'react';
import PreviewImage from './PreviewImage';

export default function ArticlePreview({ title, excerpt, domain, thumbnail, readingTime }: { title: string, excerpt: string, domain: string, thumbnail?: string, readingTime?: string }) {
  return (
    <div className="flex flex-col group/preview">
      {thumbnail && (
        <div className="relative overflow-hidden bg-zinc-100 dark:bg-zinc-800" style={{ aspectRatio: '16/10' }}>
          <PreviewImage
            src={thumbnail}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity duration-500" />
          {/* Reading time badge */}
          {readingTime && (
            <div className="absolute bottom-2 right-2 text-[10px] font-bold text-white bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10">
              {readingTime}
            </div>
          )}
        </div>
      )}

      <div className="p-5 flex flex-col gap-2.5 relative">
        {/* Domain */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
            style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.1)' }}
          >
            {domain}
          </span>
          {readingTime && !thumbnail && (
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{readingTime}</span>
          )}
        </div>
        
        <h3 className="text-[17px] font-semibold text-zinc-900 dark:text-zinc-100 leading-snug font-heading tracking-tight line-clamp-3 group-hover/preview:text-[#3b82f6] dark:group-hover/preview:text-[#60a5fa] transition-colors duration-200">
          {title}
        </h3>
        
        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
          {excerpt}
        </p>
      </div>
    </div>
  );
}
