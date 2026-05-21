'use client';
import React from 'react';
import PreviewImage from './PreviewImage';

export default function MusicPreview({ title, artist, album, cover, year, isCard = false }: { title: string, artist: string, album?: string, cover: string, year?: string, isCard?: boolean }) {
  return (
    <div className={`music-card-root relative w-full ${isCard ? 'is-card' : ''}`} style={{ aspectRatio: '1/1', overflow: 'visible' }}>
      
      {/* === VINYL RECORD — slides out right on hover === */}
      <div className="music-vinyl absolute inset-0 z-[1] flex items-center justify-center">
        <div className="relative w-[88%] h-[88%] rounded-full music-vinyl-disc"
          style={{
            background: 'radial-gradient(circle at 48% 44%, #2a2a2a 0%, #111 55%, #0d0d0d 100%)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.75), inset 0 0 0 1px rgba(255,255,255,0.06)',
          }}
        >
          {/* Grooves */}
          {[7,14,21,29,37,46,55,63,71].map((p) => (
            <div key={p} className="absolute rounded-full" style={{ inset: `${p}%`, border: '1px solid rgba(255,255,255,0.025)' }} />
          ))}
          {/* Sheen */}
          <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.09) 0%, transparent 38%, rgba(255,255,255,0.025) 70%, transparent 100%)' }} />
          {/* Label */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden flex items-center justify-center"
            style={{
              width: '29%', height: '29%',
              background: 'linear-gradient(135deg, #ffd060 0%, #e8a800 50%, #b87d00 100%)',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <div className="rounded-full bg-black/80" style={{ width: '20%', height: '20%' }} />
          </div>
          {/* Cover reflected on record */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden pointer-events-none opacity-[0.15]" style={{ width: '25%', height: '25%' }}>
            <PreviewImage src={cover} alt="" fill sizes="80px" className="w-full h-full object-cover blur-[1.5px]" />
          </div>
        </div>
      </div>

      {/* === ALBUM COVER — slight shift left on hover === */}
      <div className="music-cover absolute inset-0 z-10">
        <div className="relative w-full h-full overflow-hidden"
          style={{
            borderRadius: '4px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)',
          }}
        >
          <PreviewImage
            src={cover}
            alt={album ?? title}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="w-full h-full object-cover"
          />

          {/* === CSS PAPER FINISH & LIGHTING SHADERS === */}
          {/* Grain texture - paper finish */}
          <div className="absolute inset-0 pointer-events-none mix-blend-overlay" 
            style={{ opacity: 0.13, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 180 180\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.82\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '160px 160px' }}
          />
          {/* Top-left directional light */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.04) 25%, transparent 55%)' }} />
          {/* Bottom-right ambient occlusion */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(325deg, rgba(0,0,0,0.25) 0%, transparent 42%)' }} />
          {/* Inner shadow for paper depth */}
          <div className="absolute inset-0 pointer-events-none rounded-sm" style={{ boxShadow: 'inset 0 0 22px rgba(0,0,0,0.38), inset 0 0 4px rgba(0,0,0,0.25)' }} />
          {/* Left spine shadow */}
          <div className="absolute left-0 top-0 bottom-0 pointer-events-none" style={{ width: '7px', background: 'linear-gradient(to right, rgba(0,0,0,0.5), transparent)' }} />
          {/* Top edge highlight */}
          <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{ height: '2px', background: 'linear-gradient(to right, rgba(255,255,255,0.18), rgba(255,255,255,0.06) 70%, transparent)' }} />

          {/* Hover info overlay */}
          <div className="music-info-overlay absolute bottom-0 left-0 right-0 p-4 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 55%, transparent 100%)' }}
          >
            <h3 className="text-white font-bold text-sm leading-tight truncate" style={{ fontFamily: 'Georgia, serif' }}>{title}</h3>
            <p className="text-[#ffc94b] text-xs truncate mt-0.5 font-semibold">{artist}</p>
            {album && <p className="text-white/50 text-[10px] truncate mt-0.5 italic">{album}{year ? ` · ${year}` : ''}</p>}
          </div>
        </div>
      </div>

      <style>{`
        .music-card-root .music-vinyl {
          transition: transform 0.56s cubic-bezier(0.34, 1.42, 0.64, 1);
          transform: translateX(10%);
        }
        .music-card-root.is-card:hover .music-vinyl {
          transform: translateX(58%);
        }
        .music-card-root .music-cover {
          transition: transform 0.56s cubic-bezier(0.34, 1.42, 0.64, 1);
          transform: translateX(0%);
        }
        .music-card-root.is-card:hover .music-cover {
          transform: translateX(-6%);
        }
        .music-card-root .music-info-overlay {
          opacity: 0;
          transform: translateY(6px);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .music-card-root.is-card:hover .music-info-overlay {
          opacity: 1;
          transform: translateY(0);
        }
        .music-vinyl-disc {
          animation: vinylSpin 2s linear infinite paused;
        }
        .music-card-root.is-card:hover .music-vinyl-disc {
          animation-play-state: running;
        }
        @keyframes vinylSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
