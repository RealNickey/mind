import React from 'react';
import PreviewImage from './PreviewImage';

export default function ArticlePreview({ title, excerpt, domain, thumbnail, readingTime }: { title: string, excerpt: string, domain: string, thumbnail?: string, readingTime?: string }) {
  return (
    <div className="flex flex-col group/preview">
      {thumbnail && (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          <PreviewImage
            src={thumbnail}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="h-full w-full object-cover transition-transform duration-700 ease-ui group-hover/preview:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity duration-500" />
        </div>
      )}
      <div className="p-5 flex flex-col gap-3 relative">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          <span className="px-1.5 py-0.5 bg-zinc-100/50 dark:bg-zinc-800/50 rounded">{domain}</span>
          {readingTime && (
            <>
              <span className="opacity-50">•</span>
              <span>{readingTime}</span>
            </>
          )}
        </div>
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 leading-tight font-heading tracking-tight">
          {title}
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
          {excerpt}
        </p>
      </div>
    </div>
  );
}
