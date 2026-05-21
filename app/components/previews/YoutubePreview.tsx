import React from 'react';
import PreviewImage from './PreviewImage';

export default function YoutubePreview({ title, channel, thumbnail, views, date, duration }: { title: string, channel: string, thumbnail: string, views: string, date: string, duration?: string }) {
  return (
    <div className="group flex flex-col overflow-hidden bg-white dark:bg-zinc-900">
      {/* Thumbnail */}
      <div className="relative bg-zinc-200 dark:bg-zinc-800" style={{ aspectRatio: '16/9' }}>
        <PreviewImage
          src={thumbnail}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-300"
        />
        
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-8 rounded-[6px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200"
            style={{ background: 'rgba(255,0,0,0.9)', border: '1px solid rgba(180,0,0,0.5)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        
        {/* Duration */}
        {duration && (
          <div className="absolute bottom-1.5 right-1.5 bg-black/90 text-white text-[10px] px-1.5 py-0.5 font-semibold rounded font-mono shadow">
            {duration}
          </div>
        )}
        
        {/* Views badge */}
        <div className="absolute top-2 left-2 text-[10px] font-bold text-white/90 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {views} views
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex gap-3">
        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs uppercase overflow-hidden shadow-sm"
          style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
        >
          {channel.charAt(0)}
        </div>
        <div className="flex flex-col overflow-hidden gap-0.5">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">{title}</h3>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{channel}</p>
          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
            <span>{date}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
