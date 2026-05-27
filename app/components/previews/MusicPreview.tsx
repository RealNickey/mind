'use client';
import React from 'react';
import PreviewImage from './PreviewImage';
import { getMusicProvider } from '@/app/lib/music';

type MusicPreviewProps = {
  title: string;
  artist: string;
  album?: string;
  cover: string;
  year?: string;
  sourceUrl?: string;
  isCard?: boolean;
};

export default function MusicPreview({
  title,
  artist,
  album,
  cover,
  year,
  sourceUrl,
  isCard = false,
}: MusicPreviewProps) {
  const provider = getMusicProvider(sourceUrl);

  return (
    <div className={`music-card-root relative w-full ${isCard ? 'is-card' : ''}`} style={{ aspectRatio: '1/1', overflow: 'visible' }}>
      <div className="music-vinyl absolute inset-0 z-[1] flex items-center justify-center">
        <div
          className="music-vinyl-disc relative h-[88%] w-[88%] rounded-full"
          style={{
            background: 'radial-gradient(circle at 48% 44%, #2a2a2a 0%, #111 55%, #0d0d0d 100%)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.75), inset 0 0 0 1px rgba(255,255,255,0.06)',
          }}
        >
          {[7, 14, 21, 29, 37, 46, 55, 63, 71].map((p) => (
            <div key={p} className="absolute rounded-full" style={{ inset: `${p}%`, border: '1px solid rgba(255,255,255,0.025)' }} />
          ))}
          <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.09) 0%, transparent 38%, rgba(255,255,255,0.025) 70%, transparent 100%)' }} />
          <div
            className="absolute left-1/2 top-1/2 flex h-[29%] w-[29%] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full"
            style={{
              background: `linear-gradient(135deg, ${provider.accent} 0%, #f4d27b 100%)`,
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <div className="rounded-full bg-black/80" style={{ width: '20%', height: '20%' }} />
          </div>
          <div className="absolute left-1/2 top-1/2 h-[25%] w-[25%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full opacity-[0.15] pointer-events-none">
            <PreviewImage src={cover} alt="" fill sizes="80px" className="h-full w-full object-cover blur-[1.5px]" />
          </div>
        </div>
      </div>

      <div className="music-cover absolute inset-0 z-10">
        <div
          className="relative h-full w-full overflow-hidden"
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
            className="h-full w-full object-cover"
          />

          <div
            className="absolute inset-0 pointer-events-none mix-blend-overlay"
            style={{ opacity: 0.13, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 180 180\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.82\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '160px 160px' }}
          />
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.04) 25%, transparent 55%)' }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(325deg, rgba(0,0,0,0.25) 0%, transparent 42%)' }} />
          <div className="absolute inset-0 pointer-events-none rounded-sm" style={{ boxShadow: 'inset 0 0 22px rgba(0,0,0,0.38), inset 0 0 4px rgba(0,0,0,0.25)' }} />
          <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/22 px-3 py-2 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.24em] text-white/70">{provider.label}</p>
                <h3 className="truncate text-sm font-bold leading-tight text-white" style={{ fontFamily: 'Georgia, serif' }}>{title}</h3>
                <p className="mt-0.5 truncate text-xs font-semibold text-[#ffc94b]">{artist}</p>
              </div>
              <div className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/80">
                {year ?? 'Saved'}
              </div>
            </div>
            <p className="mt-2 truncate text-[10px] italic text-white/55">{album ?? `Open in ${provider.label}`}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full" style={{ width: '58%', background: `linear-gradient(90deg, ${provider.accent}, rgba(255,255,255,0.9))` }} />
            </div>
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
