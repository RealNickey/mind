import React from 'react';
import PreviewImage from './PreviewImage';

export default function MusicPreview({ title, artist, album, cover, year }: { title: string, artist: string, album?: string, cover: string, year?: string }) {
  return (
    <div className="relative aspect-square w-full overflow-visible group perspective-[1000px] p-2">
      {/* Vinyl Record */}
      <div className="absolute top-[5%] right-[-15%] bottom-[5%] aspect-square h-[90%] bg-[#111] rounded-full shadow-2xl transition-transform duration-500 ease-out group-hover:translate-x-[20%] translate-x-[5%] flex items-center justify-center border border-white/10 z-0">
        {/* Grooves */}
        <div className="absolute inset-[2%] rounded-full border border-white/5" />
        <div className="absolute inset-[5%] rounded-full border border-white/5" />
        <div className="absolute inset-[15%] rounded-full border border-white/5" />
        <div className="absolute inset-[25%] rounded-full border border-white/5" />
        <div className="absolute inset-[35%] rounded-full border border-white/5" />
        {/* Label */}
        <div className="w-[30%] h-[30%] rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center">
            <div className="w-[10%] h-[10%] bg-[#111] rounded-full border border-black/20" />
        </div>
      </div>

      {/* Album Cover */}
      <div className="absolute inset-2 bg-zinc-900 rounded shadow-[0_8px_30px_rgb(0,0,0,0.4)] overflow-hidden z-10 border border-white/10">
        <PreviewImage
          src={cover}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 300px"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-white/5 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] z-20">
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-black shadow-lg hover:scale-110 transition-transform cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
          <h3 className="text-white font-bold text-sm leading-tight truncate">{title}</h3>
          <p className="text-gray-300 text-xs truncate mt-0.5">{artist}</p>
        </div>
      </div>
    </div>
  );
}
