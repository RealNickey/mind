import React from 'react';
import PreviewImage from './PreviewImage';

export default function YoutubePreview({ title, channel, thumbnail, views, date, duration }: { title: string, channel: string, thumbnail: string, views: string, date: string, duration?: string }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex flex-col">
      <div className="relative aspect-video w-full bg-gray-200">
        <PreviewImage
          src={thumbnail}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
        />
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-8 bg-red-600 rounded-lg flex items-center justify-center border border-red-700 opacity-90 group-hover:scale-105 transition-transform shadow-lg">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        
        {duration && (
          <div className="absolute bottom-1 right-1 bg-black/90 text-white text-[10px] px-1 font-semibold rounded font-mono">
            {duration}
          </div>
        )}
      </div>
      
      <div className="p-3 flex gap-3">
        {/* Mock Avatar */}
        <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-500 font-bold text-xs uppercase overflow-hidden">
          {channel.charAt(0)}
        </div>
        <div className="flex flex-col overflow-hidden">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight pr-2">{title}</h3>
          <p className="text-xs text-gray-500 mt-1">{channel}</p>
          <div className="flex text-[11px] text-gray-500 gap-1.5 items-center mt-0.5">
            <span>{views} views</span>
            <span>•</span>
            <span>{date}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
