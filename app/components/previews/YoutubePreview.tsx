import React from 'react';
import PreviewImage from './PreviewImage';
import { getDisplayDomain } from '@/app/lib/url-utils';

type YoutubePreviewProps = {
  title: string;
  channel: string;
  thumbnail: string;
  views: string;
  date: string;
  duration?: string;
  sourceUrl?: string;
  description?: string;
};

function maskLinks(text: string): string {
  const urlRegex = /https?:\/\/[^\s]+/gi;
  return text.replace(urlRegex, (match) => {
    const domain = getDisplayDomain(match, 'youtube.com') ?? 'youtube.com';
    return `${domain}/...`;
  });
}

export default function YoutubePreview({
  title,
  channel,
  thumbnail,
  views,
  date,
  duration,
  sourceUrl,
  description,
}: YoutubePreviewProps) {
  const safeChannel = channel?.trim() || 'YouTube';
  const channelInitial = safeChannel.charAt(0).toUpperCase();
  const displayViews = views && views !== 'N/A' ? views : null;
  const displayDate = date?.trim() ? date : null;
  const maskedDescription = description?.trim() ? maskLinks(description.trim()) : null;
  const summaryLine = maskedDescription ?? title;
  const secondaryLine = maskedDescription ? title : null;

  return (
    <div className="group flex flex-col overflow-hidden bg-white/60 dark:bg-zinc-900/60">
      {/* Thumbnail */}
      <div className="relative overflow-hidden bg-zinc-200/70 dark:bg-zinc-800/70" style={{ aspectRatio: '16/9' }}>
        <PreviewImage
          src={thumbnail}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-9 rounded-[10px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200"
            style={{ background: 'rgba(255,0,0,0.92)', border: '1px solid rgba(140,0,0,0.6)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>

        
        {/* Duration */}
        {duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-2 py-1 font-semibold rounded-full font-mono shadow">
            {duration}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5 flex gap-3 items-start bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md">
        <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm uppercase overflow-hidden shadow-sm"
          style={{ background: 'linear-gradient(135deg, #ef4444, #7f1d1d)' }}
        >
          {channelInitial}
        </div>
        <div className="flex flex-col overflow-hidden gap-1 min-w-0 flex-1">
          {summaryLine && (
            <p className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
              {summaryLine}
            </p>
          )}
          {secondaryLine && (
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-1">
              {secondaryLine}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{safeChannel}</span>
            {displayViews && (
              <>
                <span className="text-zinc-400">|</span>
                <span>{displayViews} views</span>
              </>
            )}
            {displayDate && (
              <>
                <span className="text-zinc-400">|</span>
                <span>{displayDate}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
