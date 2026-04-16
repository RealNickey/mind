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
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close AI insights panel"
        className="absolute inset-0 bg-zinc-950/45 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={`ai-insights-title-${item.id}`}
        className="absolute inset-x-0 bottom-0 flex max-h-[90vh] flex-col overflow-hidden rounded-t-3xl border border-zinc-200 bg-zinc-50 shadow-2xl dark:border-zinc-700 dark:bg-zinc-950 sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[430px] sm:rounded-none sm:border-l sm:border-t-0"
      >
        <header className="border-b border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2
                id={`ai-insights-title-${item.id}`}
                className="inline-flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100"
              >
                <Sparkles className="h-4 w-4 text-blue-500" />
                AI Insights
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{item.title}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-zinc-200 bg-white p-1.5 text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {item.type}
            </span>
            <Link
              href={`/items/${item.id}`}
              className="rounded-full border border-zinc-200 px-2.5 py-1 font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Open full item
            </Link>
          </div>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
          {textForReading ? (
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Reading Mode</h3>
              <ReadingModeTTS text={textForReading} title={item.title} />
            </section>
          ) : (
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              No readable content available for text-to-speech.
            </section>
          )}

          <ItemInsightsPanel
            itemId={item.id}
            sourceUrl={sourceUrl}
            initialLinkHealth={initialLinkHealth}
          />
        </div>
      </aside>
    </div>
  );
}
