'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, GitMerge, RefreshCw, Sparkles } from 'lucide-react';

type LinkHealthStatus = 'alive' | 'broken' | 'unknown';

interface LinkHealthSnapshot {
  status: LinkHealthStatus;
  statusCode: number | null;
  checkedAt: string;
  error: string | null;
}

interface SemanticSuggestion {
  itemId: string;
  title: string;
  type: string;
  similarity: number;
}

interface MergeSuggestion {
  itemId: string;
  title: string;
  type: string;
  confidence: number;
  reasons: string[];
  kind: 'duplicate' | 'near-duplicate';
}

interface SuggestionsPayload {
  embeddingSource: 'local' | 'groq';
  semanticSuggestions: SemanticSuggestion[];
  mergeSuggestions: MergeSuggestion[];
}

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
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionsPayload | null>(null);

  const [linkHealth, setLinkHealth] = useState<LinkHealthSnapshot | null>(initialLinkHealth);
  const [isRefreshingHealth, setIsRefreshingHealth] = useState(false);

  useEffect(() => {
    let active = true;

    const loadSuggestions = async () => {
      setIsLoadingSuggestions(true);
      setSuggestionsError(null);

      try {
        const response = await fetch(`/api/items/${itemId}/suggestions`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load insights');
        }

        const payload = await response.json() as SuggestionsPayload;
        if (active) {
          setSuggestions(payload);
        }
      } catch (error) {
        if (active) {
          setSuggestionsError(error instanceof Error ? error.message : 'Failed to load insights');
        }
      } finally {
        if (active) {
          setIsLoadingSuggestions(false);
        }
      }
    };

    void loadSuggestions();

    return () => {
      active = false;
    };
  }, [itemId]);

  const refreshLinkHealth = async () => {
    if (!sourceUrl) {
      return;
    }

    setIsRefreshingHealth(true);

    try {
      const response = await fetch('/api/items/link-health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId, limit: 1 }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh link status');
      }

      const payload = await response.json() as {
        results?: Array<{
          status: LinkHealthStatus;
          statusCode: number | null;
          checkedAt: string;
          error: string | null;
        }>;
      };

      const latest = Array.isArray(payload.results) ? payload.results[0] : null;
      if (!latest) {
        return;
      }

      setLinkHealth({
        status: latest.status,
        statusCode: latest.statusCode,
        checkedAt: latest.checkedAt,
        error: latest.error,
      });
    } catch (error) {
      setLinkHealth((previous) => {
        const fallbackCheckedAt = new Date().toISOString();
        if (!previous) {
          return {
            status: 'unknown',
            statusCode: null,
            checkedAt: fallbackCheckedAt,
            error: error instanceof Error ? error.message : 'Unable to refresh link health',
          };
        }

        return {
          ...previous,
          checkedAt: fallbackCheckedAt,
          error: error instanceof Error ? error.message : 'Unable to refresh link health',
        };
      });
    } finally {
      setIsRefreshingHealth(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Link Health</h3>
          {sourceUrl && (
            <button
              type="button"
              onClick={() => void refreshLinkHealth()}
              disabled={isRefreshingHealth}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingHealth ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        </div>

        {!sourceUrl && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No source URL available for health checks.</p>
        )}

        {sourceUrl && !linkHealth && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No historical link checks yet.</p>
        )}

        {sourceUrl && linkHealth && (
          <div className="space-y-2 text-sm">
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyles(linkHealth.status)}`}>
              {linkHealth.status.toUpperCase()}
              {typeof linkHealth.statusCode === 'number' ? ` (${linkHealth.statusCode})` : ''}
            </span>
            <p className="text-zinc-600 dark:text-zinc-300">Checked: {formatCheckedAt(linkHealth.checkedAt)}</p>
            {linkHealth.error && (
              <p className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-300">
                <AlertTriangle className="h-3.5 w-3.5" />
                {linkHealth.error}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          <Sparkles className="h-4 w-4 text-blue-500" />
          Semantic Suggestions
        </h3>

        {isLoadingSuggestions && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Finding semantically related items...</p>
        )}

        {suggestionsError && !isLoadingSuggestions && (
          <p className="text-sm text-red-600 dark:text-red-300">{suggestionsError}</p>
        )}

        {!isLoadingSuggestions && !suggestionsError && (suggestions?.semanticSuggestions.length ?? 0) === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No semantic suggestions available yet.</p>
        )}

        {(suggestions?.semanticSuggestions.length ?? 0) > 0 && (
          <ul className="space-y-2 text-sm">
            {suggestions?.semanticSuggestions.map((suggestion) => (
              <li key={suggestion.itemId} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/items/${suggestion.itemId}`} className="font-medium text-zinc-900 hover:underline dark:text-zinc-100">
                    {suggestion.title}
                  </Link>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {(suggestion.similarity * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">{suggestion.type}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          <GitMerge className="h-4 w-4 text-amber-500" />
          Merge Suggestions
        </h3>

        {!isLoadingSuggestions && (suggestions?.mergeSuggestions.length ?? 0) === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No merge candidates detected from URL/title/content similarity.
          </p>
        )}

        {(suggestions?.mergeSuggestions.length ?? 0) > 0 && (
          <ul className="space-y-2 text-sm">
            {suggestions?.mergeSuggestions.map((suggestion) => (
              <li key={suggestion.itemId} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/items/${suggestion.itemId}`} className="font-medium text-zinc-900 hover:underline dark:text-zinc-100">
                    {suggestion.title}
                  </Link>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    {(suggestion.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
                  {suggestion.kind === 'duplicate' ? 'Duplicate' : 'Near duplicate'} • {suggestion.type}
                </p>
                {suggestion.reasons.length > 0 && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{suggestion.reasons.join(', ')}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}