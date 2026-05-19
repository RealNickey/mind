"use client";

import { useState } from "react";

export function SpotifyLogo() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="#1ed760">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

export function SpotifyModalUI({
  title,
  artist,
  cover,
  sourceUrl,
  description
}: {
  title: string;
  artist: string;
  cover: string;
  sourceUrl?: string;
  description?: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const trackIdMatch = sourceUrl?.match(/track\/([a-zA-Z0-9]+)/);
  const trackId = trackIdMatch ? trackIdMatch[1] : null;

  return (
    <div className="flex flex-col items-center py-10 px-6 max-w-sm mx-auto text-center font-sans tracking-tight">
      <div className="relative mb-6">
        <div className="w-32 h-32 rounded-[2rem] overflow-hidden shadow-[0_12px_24px_rgba(0,0,0,0.1)] relative">
          <img src={cover} alt={title} className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="text-zinc-400 font-medium text-lg mb-2">
        {description || "Play music"}
      </div>

      <div className="text-[2.5rem] leading-[1.05] font-bold text-zinc-900 dark:text-white mb-10 max-w-sm">
        <span className="text-zinc-300 dark:text-zinc-600">Playing </span>
        <span className="text-zinc-700 dark:text-zinc-300">{title}</span>
        <br />
        <span className="text-zinc-300 dark:text-zinc-600">by </span>
        <span className="text-zinc-700 dark:text-zinc-300">{artist}</span>
        <span className="text-zinc-300 dark:text-zinc-600"> on</span>
        <br />
        <span className="text-zinc-300 dark:text-zinc-600">Spotify</span>
      </div>

      {trackId && (
        <div className="w-full mb-6">
          <iframe
            src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator`}
            width="100%"
            height="152"
            frameBorder="0"
            allowFullScreen={false}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-xl"
            style={{ borderRadius: '12px' }}
          />
        </div>
      )}

      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-3 bg-[#f3f4f6] hover:bg-[#e5e7eb] dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-full py-4 px-8 text-xl font-semibold transition-colors mt-auto"
        >
          <SpotifyLogo />
          Open Spotify
        </a>
      )}
    </div>
  );
}