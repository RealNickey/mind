import React from 'react';
import PreviewImage from './PreviewImage';

export default function MusicPreview({ title, artist, album, cover, year }: { title: string, artist: string, album?: string, cover: string, year?: string }) {
  return (
    <div className="flex bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-xl overflow-hidden shadow-2xl border border-white/10 group relative p-4 pl-6">
      <div className="relative w-28 h-28 sm:w-36 sm:h-36 shrink-0 mt-2">
        {/* Vinyl Record */}
        <div className="absolute inset-0 bg-[#0f0f0f] rounded-full shadow-[0_0_10px_rgba(0,0,0,0.8),inset_0_0_0_1px_rgba(255,255,255,0.1),inset_0_0_20px_rgba(255,255,255,0.05)] translate-x-12 group-hover:translate-x-16 transition-transform duration-700 ease-out flex items-center justify-center before:content-[''] before:absolute before:inset-2 before:rounded-full before:border before:border-white/5 after:content-[''] after:absolute after:inset-4 after:rounded-full after:border after:border-white/5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-900 border border-white/20 flex items-center justify-center z-10">
            <div className="w-1.5 h-1.5 bg-black rounded-full" />
          </div>
          {/* Vinyl grooves */}
          <div className="absolute inset-1 rounded-full border border-white/5" />
          <div className="absolute inset-3 rounded-full border border-white/5" />
          <div className="absolute inset-6 rounded-full border border-white/5" />
          <div className="absolute inset-8 rounded-full border border-white/5" />
        </div>
        
        {/* Album Cover */}
        <div className="absolute inset-0 shadow-[-5px_0_15px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden z-20 border border-white/10 bg-black">
          <PreviewImage
            src={cover}
            alt={title}
            fill
            sizes="(max-width: 768px) 112px, 144px"
            className="w-full h-full object-cover"
          />
          {/* Cover gloss */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-black shadow-lg hover:scale-110 transition-transform cursor-pointer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        </div>
      </div>
      
      <div className="pl-20 py-2 flex flex-col justify-center overflow-hidden z-10 flex-1">
        <h3 className="text-white font-bold text-lg leading-tight truncate drop-shadow-md">{title}</h3>
        <p className="text-gray-300 text-sm truncate mt-1">{artist}</p>
        <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-500 uppercase tracking-widest font-semibold truncate">
          {album && <span className="truncate">{album}</span>}
          {album && year && <span>•</span>}
          {year && <span>{year}</span>}
        </div>
      </div>
    </div>
  );
}
