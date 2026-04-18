'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { AlertTriangle, GitMerge, RefreshCw, Sparkles } from 'lucide-react';
import {
  getItemSuggestions,
  refreshItemLinkHealth,
  type ItemSuggestionsResponse,
  type LinkHealthSnapshot,
  type LinkHealthStatus,
} from '@/app/lib/api-client/items';

interface ItemInsightsPanelProps {
  itemId: string;
  sourceUrl?: string | null;
  initialLinkHealth?: LinkHealthSnapshot | null;
}

function formatCheckedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

function getStatusStyles(status: LinkHealthStatus): string {
  if (status === 'alive') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-900/20 dark:text-emerald-300';
  }

  if (status === 'broken') {
    return 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-300';
  }

  return 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300';
}

export function ItemInsightsPanel({ itemId, sourceUrl, initialLinkHealth = null }: ItemInsightsPanelProps) {
  const [linkHealth, setLinkHealth] = useState<LinkHealthSnapshot | null>(initialLinkHealth);

  const { data: suggestions, isLoading: isLoadingSuggestions, error: rawError } = useQuery<ItemSuggestionsResponse>({
    queryKey: ['suggestions', itemId],
    queryFn: async ({ signal }) => {
      return getItemSuggestions(itemId, { signal, cache: 'no-store' });
    },
    enabled: Boolean(itemId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const suggestionsError = rawError instanceof Error ? rawError.message : null;

  const refreshLinkHealthMutation = useMutation<LinkHealthSnapshot | null, Error>({
    mutationFn: async () => {
      if (!sourceUrl) {
        return null;
      }

      const payload = await refreshItemLinkHealth({ itemId, limit: 1 });
      const latest = Array.isArray(payload.results) ? payload.results[0] : null;
      if (!latest) {
        return null;
      }

      return {
        status: latest.status,
        statusCode: latest.statusCode,
        checkedAt: latest.checkedAt,
        error: latest.error,
      };
    },
    onSuccess: (latest) => {
      if (!latest) {
        return;
      }

      setLinkHealth(latest);
    },
    onError: (error) => {
      setLinkHealth((previous) => {
        const fallbackCheckedAt = new Date().toISOString();
        if (!previous) {
          return {
            status: 'unknown',
            statusCode: null,
            checkedAt: fallbackCheckedAt,
            error: error.message,
          };
        }

        return {
          ...previous,
          checkedAt: fallbackCheckedAt,
          error: error.message,
        };
      });
    },
  });

  const isRefreshingHealth = refreshLinkHealthMutation.isPending;

  const refreshLinkHealth = () => {
    if (!sourceUrl) {
      return;
    }

    refreshLinkHealthMutation.mutate();
  };

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Link Health</h3>
          {sourceUrl && (
            <button
              type="button"
              onClick={refreshLinkHealth}
              disabled={isRefreshingHealth}
              className="inline-flex items-center gap-2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-all hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshingHealth ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-white/40 dark:bg-zinc-800/40 border border-white/20 dark:border-zinc-700/20 ring-1 ring-black/5 dark:ring-white/5">
          {!sourceUrl && (
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">No source URL available.</p>
          )}

          {sourceUrl && !linkHealth && (
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">No health checks yet.</p>
          )}

          {sourceUrl && linkHealth && (
            <div className="space-y-3">
              <span className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-widest border shadow-sm ${getStatusStyles(linkHealth.status)}`}>
                {linkHealth.status}
                {typeof linkHealth.statusCode === 'number' ? ` (${linkHealth.statusCode})` : ''}
              </span>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Checked: <span className="text-zinc-900 dark:text-zinc-100">{formatCheckedAt(linkHealth.checkedAt)}</span>
              </p>
              {linkHealth.error && (
                <p className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md">
                  <AlertTriangle className="h-3 w-3" />
                  {linkHealth.error}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
          Semantic Suggestions
        </h3>

        {isLoadingSuggestions && (
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
            <Loader2 size={12} className="animate-spin" />
            <span>Finding connections...</span>
          </div>
        )}

        {suggestionsError && !isLoadingSuggestions && (
          <p className="text-xs font-medium text-rose-500">{suggestionsError}</p>
        )}

        {!isLoadingSuggestions && !suggestionsError && (suggestions?.semanticSuggestions.length ?? 0) === 0 && (
          <p className="text-xs font-medium text-zinc-400">No suggestions available.</p>
        )}

        {(suggestions?.semanticSuggestions.length ?? 0) > 0 && (
          <ul className="space-y-3">
            {suggestions?.semanticSuggestions.map((suggestion) => (
              <li key={suggestion.itemId} className="group/item relative p-4 rounded-xl bg-white/40 dark:bg-zinc-800/40 border border-white/10 dark:border-zinc-700/10 hover:border-zinc-200 dark:hover:border-zinc-600 transition-all shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/items/${suggestion.itemId}`} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-indigo-500 transition-colors leading-tight">
                    {suggestion.title}
                  </Link>
                  <span className="shrink-0 rounded-md bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                    {(suggestion.similarity * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  <span className="px-1 bg-zinc-100 dark:bg-zinc-800 rounded">{suggestion.type}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
          Merge Candidates
        </h3>

        {!isLoadingSuggestions && (suggestions?.mergeSuggestions.length ?? 0) === 0 && (
          <p className="text-xs font-medium text-zinc-400">No candidates detected.</p>
        )}

        {(suggestions?.mergeSuggestions.length ?? 0) > 0 && (
          <ul className="space-y-3">
            {suggestions?.mergeSuggestions.map((suggestion) => (
              <li key={suggestion.itemId} className="p-4 rounded-xl bg-white/40 dark:bg-zinc-800/40 border border-white/10 dark:border-zinc-700/10 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/items/${suggestion.itemId}`} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-amber-500 transition-colors leading-tight">
                    {suggestion.title}
                  </Link>
                  <span className="shrink-0 rounded-md bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
                    {(suggestion.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  <span className="px-1 bg-zinc-100 dark:bg-zinc-800 rounded">{suggestion.type}</span>
                  <span className="opacity-50">•</span>
                  <span>{suggestion.kind}</span>
                </div>
                {suggestion.reasons.length > 0 && (
                  <p className="mt-2 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 italic">
                    {suggestion.reasons.join(', ')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
