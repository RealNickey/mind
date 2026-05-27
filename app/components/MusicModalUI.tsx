"use client";

import { ExternalLink, Music2, Pause, Play } from "lucide-react";
import { getMusicEmbedUrl, getMusicProvider } from "@/app/lib/music";

type MusicModalUIProps = {
  title: string;
  artist: string;
  cover: string;
  sourceUrl?: string;
  description?: string;
  album?: string;
};

export function MusicModalUI({
  title,
  artist,
  cover,
  sourceUrl,
  description,
  album,
}: MusicModalUIProps) {
  const provider = getMusicProvider(sourceUrl);
  const embedUrl = getMusicEmbedUrl(sourceUrl);
  const summary = description?.trim() || album || `Saved from ${provider.label}`;

  return (
    <div className="w-full max-w-3xl">
      <div
        className="relative overflow-hidden rounded-[2rem] border border-white/12 p-6 text-white shadow-[0_35px_90px_-50px_rgba(0,0,0,0.85)]"
        style={{ background: provider.background }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%)]" />
        <div className="absolute -right-16 top-10 h-44 w-44 rounded-full border border-white/10 bg-white/6 blur-2xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-5">
            <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-[1.5rem] bg-black/20 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.9)] ring-1 ring-white/15">
              {cover ? (
                <img src={cover} alt={title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-black/25">
                  <Music2 className="h-10 w-10 text-white/70" />
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/88">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: provider.accent }} />
                {provider.label}
              </div>
              <div>
                <h3 className="max-w-xl text-3xl font-semibold leading-tight text-white md:text-4xl">{title}</h3>
                <p className="mt-2 text-base text-white/72 md:text-lg">{artist}</p>
              </div>
              <p className="max-w-xl text-sm leading-relaxed text-white/62">{summary}</p>
            </div>
          </div>

          <div className="lg:ml-auto lg:w-[260px]">
            <div className="rounded-[1.75rem] border border-white/12 bg-black/16 p-4 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-white/58">
                <span>Now Playing</span>
                <span>Saved</span>
              </div>
              <div className="mb-4 flex items-center gap-3">
                {sourceUrl ? (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-lg"
                    aria-label={`Open ${provider.label}`}
                  >
                    <Play className="ml-1 h-5 w-5" />
                  </a>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-lg">
                    <Play className="ml-1 h-5 w-5" />
                  </div>
                )}
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white/84"
                  aria-hidden="true"
                  tabIndex={-1}
                >
                  <Pause className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/14">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: "58%",
                        background: `linear-gradient(90deg, ${provider.accent}, rgba(255,255,255,0.9))`,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-white/52">
                    <span>1:42</span>
                    <span>3:24</span>
                  </div>
                </div>
              </div>

              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-white/84 transition hover:text-white"
                >
                  Open in {provider.label}
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {embedUrl ? (
          <div className="relative mt-6 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/18 p-3 backdrop-blur-md">
            <iframe
              src={embedUrl}
              title={`${title} player`}
              width="100%"
              height={provider.id === "soundcloud" ? 300 : provider.id === "apple-music" ? 450 : 152}
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="w-full rounded-[1rem]"
            />
          </div>
        ) : (
          <div className="relative mt-6 rounded-[1.5rem] border border-dashed border-white/14 bg-black/14 px-5 py-4 text-sm text-white/62">
            {provider.label} does not expose a reliable embeddable player here yet, so this item opens in the source app while still using the in-site music view.
          </div>
        )}
      </div>
    </div>
  );
}

export { MusicModalUI as SpotifyModalUI };
