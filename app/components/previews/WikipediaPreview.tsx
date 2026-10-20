import React from 'react';
import PreviewImage from './PreviewImage';

export default function WikipediaPreview({
  title,
  excerpt,
  imageUrl,
  isCard = false,
  imageLoading,
}: {
  title: string;
  excerpt: string;
  imageUrl?: string;
  isCard?: boolean;
  imageLoading?: 'eager' | 'lazy';
}) {
  const cleanTitle = title.replace(/ - Wikipedia$/, '');
  const showImage = Boolean(imageUrl);

  if (!isCard) {
    return (
      <div className="flex flex-col bg-[#f8f9fa] dark:bg-zinc-900 border border-[#a2a9b1]/30 dark:border-zinc-700/50 p-5 rounded-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 opacity-5 pointer-events-none -mr-4 -mt-4">
          <svg viewBox="0 0 100 100" fill="currentColor">
            {/* A rough approximation of the Wikipedia globe motif */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" />
            <path d="M50 5 Q70 20 70 50 Q70 80 50 95 Q30 80 30 50 Q30 20 50 5" fill="none" stroke="currentColor" strokeWidth="4" />
            <path d="M5 50 L95 50" fill="none" stroke="currentColor" strokeWidth="4" />
            <path d="M15 25 L85 25" fill="none" stroke="currentColor" strokeWidth="4" />
            <path d="M15 75 L85 75" fill="none" stroke="currentColor" strokeWidth="4" />
          </svg>
        </div>

        <div className="flex items-start gap-4 mb-3">
          {imageUrl && (
            <div className="w-16 h-16 shrink-0 rounded overflow-hidden bg-white dark:bg-black border border-black/5 dark:border-white/5">
              <PreviewImage src={imageUrl} alt={title} loading={imageLoading} className="object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0 pt-1">
            <div className="text-[10px] uppercase tracking-widest text-[#54595d] dark:text-zinc-400 font-sans mb-1 font-semibold">Wikipedia</div>
            <h3 className="font-heading text-xl font-normal text-black dark:text-white leading-tight truncate border-b border-[#a2a9b1]/40 dark:border-zinc-700 pb-1">
              {cleanTitle}
            </h3>
          </div>
        </div>

        <p className="font-sans text-[13px] leading-relaxed text-[#202122] dark:text-zinc-300 line-clamp-4">
          {excerpt}
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full border border-[#e2d9c8] dark:border-[#3a3328] bg-white dark:bg-[#161514] flex items-center justify-center shadow-[0_8px_16px_-12px_rgba(0,0,0,0.4)]">
            <span className="font-heading text-[18px] text-[#8b6a3a] dark:text-[#f0d9a6]">W</span>
          </div>
        </div>
        <div className="h-8 w-8 rounded-full border border-[#e8dfcf] dark:border-[#2f2a24] bg-white/70 dark:bg-[#141312] flex items-center justify-center text-[#9a9386] dark:text-[#8b8375]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M3.5 12h17" />
            <path d="M12 3.5c3 2.6 3 14.4 0 17" />
            <path d="M12 3.5c-3 2.6-3 14.4 0 17" />
          </svg>
        </div>
      </div>

      <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#7f776c] dark:text-[#9b9284] font-sans">
        ENCYCLOPEDIA
      </div>

      <div className={`flex ${showImage ? 'items-start gap-4' : 'flex-col gap-2'}`}>
        <div className="min-w-0">
          <h3 className="font-heading text-[28px] leading-[1.08] text-[#2d271f] dark:text-[#f5f1e8] line-clamp-2">
            {cleanTitle}
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-[#5b5348] dark:text-[#b9b1a6] line-clamp-3 font-sans">
            {excerpt}
          </p>
        </div>
        {showImage && (
          <div className="relative h-[120px] w-[120px] shrink-0 overflow-hidden rounded-[14px] border border-[#e3d9c9] dark:border-[#2d2822] bg-white dark:bg-[#161514] shadow-[0_16px_30px_-24px_rgba(36,28,18,0.5)]">
            <PreviewImage
              src={imageUrl}
              alt={cleanTitle}
              fill
              sizes="120px"
              loading={imageLoading}
              className="object-cover"
            />
            <div className="absolute inset-0 ring-1 ring-black/5 dark:ring-white/5" />
          </div>
        )}
      </div>
    </div>
  );
}
