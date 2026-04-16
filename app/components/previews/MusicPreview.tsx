import React from 'react';

export default function MusicPreview({ title, artist, album, cover, year }: { title: string, artist: string, album?: string, cover: string, year?: string }) {
  return (
    <div className="flex bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden shadow-lg border border-white/10 group">
      <div className="w-24 h-24 sm:w-32 sm:h-32 relative shrink-0">
        <img src={cover} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {/* Play overlay button */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-black">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      </div>
      <div className="p-4 flex flex-col justify-center overflow-hidden">
        <h3 className="text-white font-bold leading-tight truncate">{title}</h3>
        <p className="text-gray-300 text-sm truncate mt-1">{artist}</p>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 uppercase tracking-widest font-semibold truncate">
          {album && <span>{album}</span>}
          {album && year && <span>•</span>}
          {year && <span>{year}</span>}
        </div>
      </div>
    </div>
  );
}
