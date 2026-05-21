import React from 'react';
import { getDisplayDomain } from '@/app/lib/url-utils';
import PreviewImage from './PreviewImage';

export default function LinkPreview({ url, title, description, favicon, ogImage }: { url: string, title?: string, description?: string, favicon?: string, ogImage?: string }) {
  const hostname = getDisplayDomain(url, url) ?? url;
  const displayTitle = title && title !== url ? title : null;
  
  return (
    <div className="flex flex-col group/link overflow-hidden bg-white dark:bg-zinc-900">
      {/* OG Image — shown when available */}
      {ogImage && (
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <PreviewImage
            src={ogImage}
            alt={displayTitle ?? hostname}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/link:opacity-100 transition-opacity duration-500" />
        </div>
      )}

      {/* Text content */}
      <div className={`flex flex-col gap-2 p-4 ${!ogImage ? 'py-5' : 'pt-3'}`}>
        {/* Domain + favicon */}
        <div className="flex items-center gap-1.5">
          {favicon ? (
            <PreviewImage src={favicon} alt="" width={14} height={14} className="w-3.5 h-3.5 rounded-sm flex-shrink-0" />
          ) : (
            <div className="w-3.5 h-3.5 rounded-sm bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-400">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </div>
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 truncate">{hostname}</span>
        </div>
        
        {displayTitle && (
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm leading-snug line-clamp-2 group-hover/link:text-[#795900] dark:group-hover/link:text-[#ffc94b] transition-colors duration-200">
            {displayTitle}
          </h3>
        )}
        
        {description && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
        
        {!displayTitle && !description && (
          <span className="text-xs font-mono text-[#795900] dark:text-[#ffc94b] break-all line-clamp-2 opacity-70">{url}</span>
        )}
      </div>
    </div>
  );
}
