export interface SemanticSearchMeta {
  source?: string;
  limit?: number;
  query?: string;
}

export interface SemanticSearchResponse<TItem> {
  results: TItem[];
  meta?: SemanticSearchMeta;
}

export interface SemanticSearchResultPreview {
  id?: string;
  title?: string | null;
  sourceUrl?: string | null;
  description?: string | null;
  content?: string | null;
}

interface SemanticSearchErrorResponse {
  error?: string;
}

interface SemanticSearchPayload<TItem> {
  results?: TItem[];
  meta?: SemanticSearchMeta;
}

interface FetchSemanticSearchParams {
  query: string;
  limit?: number;
  signal?: AbortSignal;
}

const DEFAULT_SEMANTIC_LIMIT = 10;

export function semanticSearchQueryKey({ query, limit = DEFAULT_SEMANTIC_LIMIT }: Pick<FetchSemanticSearchParams, 'query' | 'limit'>) {
  return ['semantic-search', query.trim(), limit] as const;
}

export async function fetchSemanticSearch<TItem>({
  query,
  limit = DEFAULT_SEMANTIC_LIMIT,
  signal,
}: FetchSemanticSearchParams): Promise<SemanticSearchResponse<TItem>> {
  const response = await fetch('/api/search/semantic', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      limit,
    }),
    signal,
  });

  if (!response.ok) {
    let message = 'Failed to load semantic results';

    try {
      const errorPayload = await response.json() as SemanticSearchErrorResponse;
      if (typeof errorPayload.error === 'string' && errorPayload.error.trim()) {
        message = errorPayload.error;
      }
    } catch {
      // Ignore JSON parse failures and fall back to default error message.
    }

    throw new Error(message);
  }

  const payload = await response.json() as SemanticSearchPayload<TItem>;

  return {
    results: Array.isArray(payload.results) ? payload.results : [],
    meta: payload.meta,
  };
}
