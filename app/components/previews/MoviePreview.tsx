import React from 'react';

export default function MoviePreview({ title, poster, backdrop, rating, year, runtime, genres }: { title: string, poster: string, backdrop?: string, rating: number, year: string, runtime?: number, genres?: string[] }) {
  return (
    <div className="group relative overflow-hidden bg-[#111] shadow-2xl h-80 flex flex-col justify-between py-2 border-y-4 border-black">
      {/* Top film holes */}
      <div className="w-full h-4 flex justify-between px-2 gap-2 opacity-80 z-20">
        {[...Array(12)].map((_, i) => (
          <div key={`top-${i}`} className="w-3 h-4 bg-white/10 rounded-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]" />
        ))}
      </div>
      
      <div className="relative flex-1 mx-4 my-2 overflow-hidden rounded-md shadow-[0_0_20px_rgba(0,0,0,0.8)] bg-black border border-white/5">
        {backdrop && (
          <div className="absolute inset-0 opacity-50 mix-blend-overlay">
            <img src={backdrop} alt="" className="h-full w-full object-cover blur-[2px] scale-105 group-hover:scale-110 transition-transform duration-1000" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        
        <div className="absolute inset-0 p-4 flex flex-col justify-end">
          <div className="flex gap-4 items-end">
            {poster && (
              <div className="relative w-24 rounded-md shadow-[0_10px_20px_rgba(0,0,0,0.8)] border border-white/20 group-hover:-translate-y-2 transition-transform duration-500 overflow-hidden shrink-0">
                <img src={poster} alt={title} className="w-full h-auto object-cover" />
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
              </div>
            )}
            <div className="flex flex-col gap-1.5 text-white pb-1">
              <h3 className="text-xl font-bold font-playfair leading-tight drop-shadow-md tracking-wide">{title}</h3>
              <div className="flex items-center gap-2 text-[11px] font-mono text-gray-300 uppercase tracking-wider backdrop-blur-sm bg-black/30 w-fit px-2 py-1 rounded border border-white/10">
                <span className="text-yellow-400 font-bold flex items-center gap-1 drop-shadow">
                  ★ {rating.toFixed(1)}
                </span>
                <span className="opacity-50">•</span>
                <span>{year}</span>
                {runtime && (
                  <>
                    <span className="opacity-50">•</span>
                    <span>{Math.floor(runtime / 60)}H {runtime % 60}M</span>
                  </>
                )}
              </div>
              {genres && genres.length > 0 && (
                <p className="text-xs text-gray-400 mt-1 line-clamp-1 italic">{genres.join(' • ')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom film holes */}
      <div className="w-full h-4 flex justify-between px-2 gap-2 opacity-80 z-20">
        {[...Array(12)].map((_, i) => (
          <div key={`bottom-${i}`} className="w-3 h-4 bg-white/10 rounded-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]" />
        ))}
      </div>
    </div>
  );
}
