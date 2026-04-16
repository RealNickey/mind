import React from 'react';

export default function ArticlePreview({ title, excerpt, domain, thumbnail, readingTime }: { title: string, excerpt: string, domain: string, thumbnail?: string, readingTime?: string }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white/80 backdrop-blur-md shadow-sm transition-all hover:shadow-md">
      {thumbnail && (
        <div className="h-48 w-full overflow-hidden">
          <img src={thumbnail} alt={title} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
        </div>
      )}
      <div className="p-4 flex flex-col gap-2 relative">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <span className="uppercase tracking-wider">{domain}</span>
          {readingTime && (
            <>
              <span>•</span>
              <span>{readingTime}</span>
            </>
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-900 leading-tight font-playfair">{title}</h3>
        <p className="text-sm text-gray-600 line-clamp-3">{excerpt}</p>
      </div>
    </div>
  );
}
