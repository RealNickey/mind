'use client';
import React, { useState } from 'react';
import PreviewImage from './PreviewImage';

export default function MoviePreview({ title, poster, backdrop, rating, year, runtime, genres }: { title: string, poster: string, backdrop?: string, rating: number, year: string, runtime?: number, genres?: string[] }) {
  const [imgError, setImgError] = useState(false);
  
  return (
    <div className="group relative w-full overflow-hidden" style={{ aspectRatio: '2/3', minHeight: 280 }}>
      {/* Poster image */}
      <div className="absolute inset-0 bg-zinc-900">
        {poster && !imgError ? (
          <PreviewImage
            src={poster}
            alt={title}
            fill
            sizes="(max-width: 768px) 50vw, 280px"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-black">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" className="opacity-40">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
              <line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/>
              <line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/>
              <line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/>
              <line x1="17" y1="7" x2="22" y2="7"/>
            </svg>
          </div>
        )}
      </div>

      {/* Subtle film grain overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} 
      />

      {/* Bottom gradient + info */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Rating badge - always visible */}
      {rating > 0 && (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/70 backdrop-blur-md border border-yellow-400/30 text-yellow-400 text-[11px] font-bold px-2 py-1 rounded-full shadow-lg">
          <span style={{ fontSize: 10 }}>★</span>
          <span>{rating.toFixed(1)}</span>
        </div>
      )}

      {/* Year chip */}
      <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md border border-white/10 text-white/70 text-[10px] font-mono px-2 py-1 rounded-full">
        {year}
      </div>

      {/* Info panel on hover */}
      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 ease-out">
        <h3 className="text-white font-bold text-base leading-tight line-clamp-2 drop-shadow-lg mb-1" style={{ fontFamily: 'Georgia, serif' }}>
          {title}
        </h3>
        <div className="flex items-center gap-2 flex-wrap mt-1">
          {runtime && (
            <span className="text-white/60 text-[10px] font-mono">
              {Math.floor(runtime / 60)}h {runtime % 60}m
            </span>
          )}
          {genres && genres.length > 0 && (
            <span className="text-yellow-400/80 text-[10px] font-medium truncate max-w-[140px]">
              {genres.slice(0, 2).join(' · ')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
