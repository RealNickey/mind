"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import ItemPreview from "./previews/ItemPreview";
import { ImageAnalysis } from "./ImageAnalysis";
import PlaceMap from "./PlaceMap";
import { MusicModalUI } from "./MusicModalUI";
import type { ItemCardItem } from "./ItemCard";
import { getDisplayDomain, getYouTubeEmbedUrl } from "@/app/lib/url-utils";
import { getMusicProvider } from "@/app/lib/music";

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function getRelativeTimeString(dateVal: string | Date): string {
  try {
    const date = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
    const years = Math.floor(days / 365);
    return `${years} year${years > 1 ? "s" : ""} ago`;
  } catch (e) {
    return "some time ago";
  }
}

function looksLikeUrl(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  return /^https?:\/\//i.test(value.trim());
}

function formatShortDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(parsed);
}

interface ItemViewDialogProps {
  item: ItemCardItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (item: ItemCardItem) => void;
}

export default function ItemViewDialog({ item, isOpen, onClose, onDelete }: ItemViewDialogProps) {
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [isTagging, setIsTagging] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (item) {
      setDescription(item.description || "");
      setContent(item.content || "");
      setTags(item.tags || []);
    }
  }, [item]);

  const tldrRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (tldrRef.current) {
      tldrRef.current.style.height = "auto";
      tldrRef.current.style.height = `${tldrRef.current.scrollHeight}px`;
    }
  }, [description]);

  if (!item) return null;

  const sourceUrl = item.metadata?.sourceUrl ?? item.sourceUrl;
  const metadataCustom = asObject(item.metadata?.customData);
  const location = asObject(metadataCustom?.location);

  const latitude = asNumber(
    metadataCustom?.latitude ?? metadataCustom?.lat ?? location?.latitude ?? location?.lat
  );
  const longitude = asNumber(
    metadataCustom?.longitude ?? metadataCustom?.lng ?? metadataCustom?.lon ?? location?.longitude ?? location?.lng ?? location?.lon
  );
  const mapName = asString(metadataCustom?.placeName ?? location?.name) ?? item.title;

  const textForReading = [content, description]
    .filter((entry): entry is string => Boolean(entry && entry.trim()))
    .join('\n\n')
    .trim();

  const imageAnalysisUrl = asString(item.metadata?.imageUrl) ?? null;
  const normalizedType = item.type.toLowerCase();
  const isMusic = normalizedType === 'music';
  const isYouTube = normalizedType === 'youtube';
  const metadata = item.metadata ?? null;
  const customData = asObject(metadata?.customData);
  const artist = asString(customData?.artist) ?? metadata?.author ?? 'Unknown artist';
  const album = asString(customData?.album) ?? null;
  const cover = asString(customData?.imageUrl) ?? asString(customData?.image) ?? metadata?.imageUrl ?? '';
  const musicProvider = getMusicProvider(sourceUrl);
  const dominantColors = (item.metadata?.dominantColors as string[]) ?? (customData?.colors as string[]) ?? [];
  const sourceDomain = getDisplayDomain(sourceUrl, 'YouTube') ?? 'YouTube';
  const youtubeEmbedUrl = isYouTube
    ? getYouTubeEmbedUrl(sourceUrl, { autoplay: true, mute: true })
    : null;
  const youtubeChannel = (asString(customData?.channel) ?? metadata?.author ?? sourceDomain).trim() || 'YouTube';
  const youtubeChannelInitial = youtubeChannel.charAt(0).toUpperCase();
  const youtubeViewsCount = asNumber(customData?.views);
  const youtubeViews = asString(customData?.views)
    ?? (typeof youtubeViewsCount === 'number' ? youtubeViewsCount.toLocaleString('en-US') : null);
  const youtubeDuration = asString(customData?.duration);
  const youtubeDate = formatShortDate(asString(customData?.date) ?? asString(metadata?.publishedDate));
  const youtubeSummary = item.title?.trim()
    ? `${item.title.trim()} — ${youtubeChannel}`
    : `${youtubeChannel} video`;

  const handleSaveDescription = async (newVal: string) => {
    if (newVal === item.description) return;
    try {
      await fetch(`/api/items/${item.id}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: newVal })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveContent = async (newVal: string) => {
    if (newVal === item.content) return;
    try {
      await fetch(`/api/items/${item.id}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newVal })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAutoTag = async () => {
    setIsTagging(true);
    try {
      const res = await fetch('/api/items/tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.tags) {
          setTags(data.tags);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTagging(false);
    }
  };



  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8" style={{ overscrollBehavior: 'contain' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-md dark:bg-black/70"
            onClick={onClose}
          />
          
          <motion.div
            layoutId={`item-${item.id}`}
            className="relative flex w-full max-w-6xl flex-col md:flex-row overflow-hidden rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 shadow-2xl h-[90vh] md:h-[680px]"
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            {/* Global close button (Top Right) */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 md:right-[396px] z-50 p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all duration-150 active:scale-[0.95]"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Left Column: theater mode media view */}
            <div className="flex-1 relative bg-zinc-50 dark:bg-zinc-900/30 flex items-center justify-center p-8 overflow-hidden min-h-[300px] md:min-h-0 min-w-0">
              <div className={`w-full h-full flex items-center justify-center overflow-hidden rounded-2xl ${item.type.toLowerCase() === 'link' || item.type.toLowerCase() === 'pdf' ? '' : 'max-h-[500px] [&_img]:max-h-[500px] [&_img]:w-auto [&_img]:object-contain'}`}>
                {normalizedType === 'link' && sourceUrl ? (
                  <iframe
                    src={sourceUrl}
                    className="w-full h-full bg-white border-0"
                    sandbox="allow-same-origin allow-scripts"
                    title={item.title}
                  />
                ) : normalizedType === 'pdf' && sourceUrl ? (
                  <iframe
                    src={sourceUrl}
                    className="w-full h-full bg-white border-0"
                    title={item.title}
                  />
                ) : isYouTube && youtubeEmbedUrl ? (
                  <div className="w-full max-w-[980px] flex flex-col gap-4">
                    <div
                      className="relative w-full overflow-hidden rounded-2xl border border-white/30 dark:border-white/10 bg-black shadow-[0_28px_70px_-45px_rgba(0,0,0,0.75)]"
                      style={{ aspectRatio: '16/9' }}
                    >
                      <iframe
                        src={youtubeEmbedUrl}
                        className="absolute inset-0 h-full w-full"
                        title={item.title || 'YouTube video'}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="strict-origin-when-cross-origin"
                      />
                      <div className="absolute inset-0 pointer-events-none ring-1 ring-white/10" />
                      {youtubeDuration && (
                        <div className="absolute bottom-3 right-3 bg-black/80 text-white text-[10px] px-2 py-1 rounded-full font-mono font-semibold shadow">
                          {youtubeDuration}
                        </div>
                      )}
                    </div>
                    <div className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-zinc-900/70 p-4 shadow-sm backdrop-blur-md">
                      <p className="text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                        {looksLikeUrl(description) ? youtubeSummary : (description || youtubeSummary)}
                      </p>
                    </div>
                  </div>
                ) : isMusic ? (
                  <MusicModalUI
                    title={item.title}
                    artist={artist}
                    album={album ?? undefined}
                    cover={cover}
                    sourceUrl={sourceUrl ?? undefined}
                    description={item.description ?? item.content ?? undefined}
                  />
                ) : normalizedType === 'article' && item.content ? (
                  <div className="w-full h-full bg-[#fdfdfc] dark:bg-zinc-900 overflow-y-auto p-12 custom-scrollbar">
                    <article className="prose prose-zinc dark:prose-invert prose-lg mx-auto max-w-2xl font-serif">
                      <h1 className="font-heading mb-8">{item.title}</h1>
                      <div dangerouslySetInnerHTML={{ __html: item.content }} />
                    </article>
                  </div>
                ) : (
                  <ItemPreview item={item} />
                )}
              </div>

              {/* Floating metadata badges / color dots */}
              <div className="absolute top-6 left-6 z-10">
                <span className="bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-md border border-white/10 dark:border-black/10">
                  {item.type}
                </span>
              </div>

              {dominantColors && dominantColors.length > 0 && (
                <div className="absolute bottom-6 left-6 z-10 flex items-center gap-1 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl px-2.5 py-1.5 rounded-full border border-black/5 dark:border-white/10 shadow-lg">
                  {dominantColors.slice(0, 5).map((color) => (
                    <div key={color} className="w-4 h-4 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: color }} />
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: detailed metadata editor */}
            <div className="w-full md:w-[380px] bg-zinc-100/50 dark:bg-[#131419] border-t md:border-t-0 md:border-l border-zinc-200/50 dark:border-zinc-800/50 flex flex-col h-full overflow-hidden">
              
              {/* Header Info */}
              <div className="p-6 pb-4 flex flex-col gap-1 border-b border-foreground/[0.04] bg-white/30 dark:bg-zinc-950/20">
                <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-snug line-clamp-2 pr-8">
                  {item.title || "Untitled"}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  about {getRelativeTimeString(item.createdAt)}
                </p>
              </div>

              {/* Scrollable details */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                <>
                  {isMusic && (
                    <div className="space-y-2 rounded-2xl border border-zinc-200/70 bg-white/65 p-4 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/45">
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Playback Source</div>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{musicProvider.label}</p>
                          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            {album ? `${artist} • ${album}` : artist}
                          </p>
                        </div>
                        {sourceUrl && (
                          <Link
                            href={sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          >
                            Open source
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  {!isYouTube && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">TLDR</div>
                      <textarea
                        ref={tldrRef}
                        className="w-full min-h-[90px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 p-4 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700 placeholder-zinc-400 dark:placeholder-zinc-600 resize-none overflow-hidden font-sans"
                        placeholder="Add a summary..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={() => handleSaveDescription(description)}
                      />
                    </div>
                  )}

                    {/* MIND TAGS */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        <span>MIND TAGS</span>
                        <span className="cursor-help text-zinc-300 dark:text-zinc-600" title="AI generated or manual tags">?</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <button 
                          onClick={handleAutoTag}
                          disabled={isTagging}
                          className="bg-[#ff5c35] hover:bg-[#e04f2c] text-white text-[10px] font-extrabold px-3.5 py-1.5 rounded-full transition-colors active:scale-[0.97] disabled:opacity-50"
                        >
                          {isTagging ? "Generating..." : "+ Add tag"}
                        </button>
                        {tags.map((tag) => (
                          <span key={tag.id} className="bg-zinc-200/60 dark:bg-zinc-800/80 text-[10px] font-semibold px-3 py-1.5 rounded-full text-zinc-700 dark:text-zinc-300 border border-zinc-300/30 dark:border-zinc-700/30">
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* MIND NOTES */}
                    <div className="space-y-2 flex flex-col">
                      <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        <span>MIND NOTES</span>
                        <span className="cursor-help text-zinc-300 dark:text-zinc-600" title="Your personal thoughts on this item">?</span>
                      </div>
                      <textarea
                        className="w-full min-h-[140px] max-h-[220px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 p-4 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700 placeholder-zinc-400 dark:placeholder-zinc-600 resize-none font-sans flex-1"
                        placeholder="Type here to add a note..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onBlur={() => handleSaveContent(content)}
                      />
                    </div>

                    {/* Map context */}
                    {typeof latitude === 'number' && typeof longitude === 'number' && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">PLACE CONTEXT</div>
                        <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 shadow-sm">
                          <PlaceMap latitude={latitude} longitude={longitude} name={mapName} />
                        </div>
                      </div>
                    )}

                    {/* Image analysis context */}
                    {imageAnalysisUrl && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">IMAGE ANALYSIS</div>
                        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
                          <ImageAnalysis imageUrl={imageAnalysisUrl} />
                        </div>
                      </div>
                    )}
                </>
              </div>

              {/* Footer controls */}
              <div className="p-4 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-950/40 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {sourceUrl && (
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-full hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-100 transition-colors active:scale-[0.95]"
                      title="Open source link"
                    >
                      <ExternalLink className="h-4.5 w-4.5" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Link href={`/items/${item.id}/edit`}>
                    <button
                      className="p-2 rounded-full hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors active:scale-[0.95]"
                      title="Edit Item details"
                    >
                      <Pencil className="h-4.5 w-4.5" />
                    </button>
                  </Link>
                  {onDelete && (
                    <button 
                      onClick={() => onDelete(item)}
                      className="p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 hover:text-rose-600 transition-colors active:scale-[0.95]"
                      title="Delete thought"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
