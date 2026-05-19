"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Pencil } from "lucide-react";
import Link from "next/link";
import ItemPreview from "./previews/ItemPreview";
import { ReadingModeTTS } from "./ReadingModeTTS";
import { ImageAnalysis } from "./ImageAnalysis";
import PlaceMap from "./PlaceMap";
import { SpotifyModalUI } from "./SpotifyModalUI";
import type { ItemCardItem } from "./ItemCard";

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

interface ItemViewDialogProps {
  item: ItemCardItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ItemViewDialog({ item, isOpen, onClose }: ItemViewDialogProps) {
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

  const textForReading = [item.content, item.description]
    .filter((entry): entry is string => Boolean(entry && entry.trim()))
    .join('\n\n')
    .trim();

  const imageAnalysisUrl = asString(item.metadata?.imageUrl) ?? null;

  const isMusic = item.type.toLowerCase() === 'music';
  const metadata = item.metadata ?? null;
  const customData = asObject(metadata?.customData);
  const artist = asString(customData?.artist) ?? metadata?.author ?? 'Unknown artist';
  const cover = asString(customData?.imageUrl) ?? asString(customData?.image) ?? metadata?.imageUrl ?? '';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12" style={{ overscrollBehavior: 'contain' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/60"
            onClick={onClose}
          />
          
          <motion.div
            layoutId={`item-${item.id}`}
            className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-zinc-50 shadow-2xl dark:bg-zinc-950 sm:flex-row h-full max-h-[90vh]"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          >
            <div className="flex w-full flex-col overflow-y-auto">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white/80 px-6 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
                <div className="flex items-center gap-4">
                  <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 flex-1 truncate max-w-md">
                    {item.title || "Item Details"}
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  {sourceUrl && (
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                      title="Open Source"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  )}
                  <Link
                    href={`/items/${item.id}/edit`}
                    className="inline-flex items-center justify-center rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    title="Edit Item"
                  >
                    <Pencil className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={onClose}
                    className="inline-flex items-center justify-center rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    title="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {isMusic ? (
                  <div className="flex items-center justify-center p-12">
                    <SpotifyModalUI 
                      title={item.title} 
                      artist={artist} 
                      cover={cover} 
                      sourceUrl={sourceUrl ?? undefined} 
                      description={item.description ?? item.content ?? undefined} 
                    />
                  </div>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <section className="space-y-6">
                      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <ItemPreview item={item} />
                      </div>

                      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Notes and Content</h2>
                          {textForReading && <ReadingModeTTS text={textForReading} title={item.title} />}
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                          {item.content || item.description || 'No additional notes saved yet.'}
                        </p>
                      </div>

                      {imageAnalysisUrl && (
                        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                          <h2 className="mb-3 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Image Analysis</h2>
                          <ImageAnalysis imageUrl={imageAnalysisUrl} />
                        </div>
                      )}

                      {typeof latitude === 'number' && typeof longitude === 'number' && (
                        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                          <h2 className="mb-3 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Place Context</h2>
                          <PlaceMap latitude={latitude} longitude={longitude} name={mapName} />
                        </div>
                      )}
                    </section>

                    <aside className="space-y-6">
                      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Item Details</h3>
                        <dl className="space-y-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <dt className="text-zinc-500">Type</dt>
                            <dd className="font-medium text-zinc-900 dark:text-zinc-100 capitalize">{item.type}</dd>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <dt className="text-zinc-500">Created</dt>
                            <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                              {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(item.createdAt))}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      {(item.tags?.length ?? 0) > 0 && (
                        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Tags</h3>
                          <div className="flex flex-wrap gap-2">
                            {item.tags?.map((tag) => (
                              <span
                                key={tag.id}
                                className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                              >
                                #{tag.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </aside>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}