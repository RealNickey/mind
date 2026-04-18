import React from 'react';
import PreviewImage from './PreviewImage';

export default function VideoPreview({ thumbnail, title, duration }: { url?: string, thumbnail?: string, title?: string, duration?: string }) {
  return (
    <div className="relative rounded-xl overflow-hidden shadow-md group bg-black cursor-pointer">
      <PreviewImage
        src={thumbnail || '/video-placeholder.png'}
        alt={title || 'Video'}
        width={1280}
        height={720}
        sizes="(max-width: 768px) 100vw, 40vw"
        className="w-full h-auto object-cover opacity-80 group-hover:opacity-60 transition-opacity"
      />
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 group-hover:scale-110 transition-transform">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>
      
      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono font-medium">
        {duration || '0:00'}
      </div>
      
      {title && (
        <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent">
          <h3 className="text-white text-sm font-medium line-clamp-1">{title}</h3>
        </div>
      )}
    </div>
  );
}
