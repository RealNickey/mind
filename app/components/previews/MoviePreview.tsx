import React from 'react';

export default function MoviePreview({ title, poster, backdrop, rating, year, runtime, genres }: { title: string, poster: string, backdrop?: string, rating: number, year: string, runtime?: number, genres?: string[] }) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-gray-900 shadow-md h-72">
      {backdrop && (
        <div className="absolute inset-0 opacity-40 mix-blend-overlay">
          <img src={backdrop} alt="" className="h-full w-full object-cover blur-sm" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      
      <div className="absolute inset-0 p-4 flex flex-col justify-end">
        <div className="flex gap-4 items-end">
          {poster && (
            <img src={poster} alt={title} className="w-24 rounded-lg shadow-lg border border-white/10 group-hover:-translate-y-2 transition-transform duration-300" />
          )}
          <div className="flex flex-col gap-1 text-white">
            <h3 className="text-xl font-bold font-playfair leading-tight drop-shadow-md">{title}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <span className="bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                ★ {rating.toFixed(1)}
              </span>
              <span>{year}</span>
              {runtime && <span>{Math.floor(runtime / 60)}h {runtime % 60}m</span>}
            </div>
            {genres && genres.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">{genres.join(' • ')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
