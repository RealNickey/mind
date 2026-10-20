import React from 'react';
import PreviewImage from './PreviewImage';

export default function ArticlePreview({
  title,
  excerpt,
  domain,
  thumbnail,
  readingTime,
  isCard = false,
}: {
  title: string;
  excerpt: string;
  domain: string;
  thumbnail?: string;
  readingTime?: string;
  isCard?: boolean;
}) {
  if (isCard) {
    return (
      <div className="flex min-h-[220px] flex-col gap-4 p-5">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
          <span>{domain}</span>
          {readingTime && (
            <span className="tracking-normal text-[10px] normal-case text-zinc-400 dark:text-zinc-500">
              {readingTime}
            </span>
          )}
        </div>

        <div className={`flex flex-1 ${thumbnail ? 'items-start gap-4' : 'flex-col justify-start gap-3'}`}>
          <div className="min-w-0 flex-1">
            <h3 className="text-[24px] font-bold text-zinc-950 dark:text-zinc-50 leading-[1.08] line-clamp-2">
              {title}
            </h3>
            <p className="mt-3 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300 line-clamp-5">
              {excerpt}
            </p>
          </div>

          {thumbnail && (
            <div className="relative h-[124px] w-[124px] shrink-0 overflow-hidden rounded-[14px] border border-black/5 dark:border-white/10 bg-zinc-100 dark:bg-zinc-800 shadow-[0_16px_30px_-24px_rgba(0,0,0,0.35)]">
              <PreviewImage
                src={thumbnail}
                alt={title}
                fill
                sizes="124px"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

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
