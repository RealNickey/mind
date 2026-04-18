'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Sparkles, X } from 'lucide-react';
import type { ItemCardItem } from './ItemCard';
import { ItemInsightsPanel } from './ItemInsightsPanel';
import { ReadingModeTTS } from './ReadingModeTTS';

type LinkHealthStatus = 'alive' | 'broken' | 'unknown';

interface LinkHealthSnapshot {
  status: LinkHealthStatus;
  statusCode: number | null;
  checkedAt: string;
  error: string | null;
}

interface ItemQuickAIPanelProps {
  item: ItemCardItem | null;
  isOpen: boolean;
  onClose: () => void;
}

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

function asLinkHealthStatus(value: unknown): LinkHealthStatus | null {
  if (value === 'alive' || value === 'broken' || value === 'unknown') {
    return value;
  }

  return null;
}

export function ItemQuickAIPanel({ item, isOpen, onClose }: ItemQuickAIPanelProps) {
  const textForReading = useMemo(() => {
    if (!item) {
      return '';
    }

    return [item.content, item.description]
      .filter((entry): entry is string => Boolean(entry && entry.trim()))
      .join('\n\n')
      .trim();
  }, [item]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) {
    return null;
  }

  const sourceUrl = item.metadata?.sourceUrl ?? item.sourceUrl ?? null;
  const metadataCustom = asObject(item.metadata?.customData);
  const rawLinkHealth = asObject(metadataCustom?.linkHealth);
  const statusCandidate = asLinkHealthStatus(rawLinkHealth?.status);

  const initialLinkHealth: LinkHealthSnapshot | null = rawLinkHealth && statusCandidate
    ? {
        status: statusCandidate,
        statusCode: asNumber(rawLinkHealth.statusCode),
        checkedAt: asString(rawLinkHealth.checkedAt) ?? new Date().toISOString(),
        error: asString(rawLinkHealth.error),
      }
    : null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-zinc-950/20 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`ai-insights-title-${item.id}`}
        className="relative z-10 m-4 h-[calc(100vh-2rem)] w-full max-w-md overflow-hidden rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl shadow-2xl border border-white/20 dark:border-zinc-800/20 ring-1 ring-black/5 dark:ring-white/5 flex flex-col"
      >
        <header className="p-6 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2
                id={`ai-insights-title-${item.id}`}
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500"
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI Insights
              </h2>
              <h3 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 font-heading tracking-tight leading-tight">
                {item.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors bg-zinc-100/50 dark:bg-zinc-800/50"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm">
              {item.type}
            </span>
            <Link
              href={`/items/${item.id}`}
              className="rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-all hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 shadow-sm"
            >
              Full Item
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          {textForReading ? (
            <section className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Reading Mode</h4>
              <div className="p-4 rounded-xl bg-white/40 dark:bg-zinc-800/40 border border-white/20 dark:border-zinc-700/20 ring-1 ring-black/5 dark:ring-white/5">
                <ReadingModeTTS text={textForReading} title={item.title} />
              </div>
            </section>
          ) : (
            <section className="p-6 rounded-xl bg-zinc-100/50 dark:bg-zinc-800/50 text-xs font-medium text-zinc-400 text-center border border-dashed border-zinc-200 dark:border-zinc-800">
              No readable content available.
            </section>
          )}

          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Insights & Health</h4>
            <ItemInsightsPanel
              itemId={item.id}
              sourceUrl={sourceUrl}
              initialLinkHealth={initialLinkHealth}
            />
          </div>
        </div>
      </motion.aside>
    </div>
  );
}
