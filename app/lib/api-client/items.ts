import type { DeleteItemResponse } from '@/app/lib/types';
import { requestJson } from './http';

export interface ItemTag {
  id: string;
  name: string;
}

export interface ItemCollection {
  id: string;
  name: string;
}

export interface ItemMetadata {
  sourceUrl?: string | null;
  imageUrl?: string | null;
  favicon?: string | null;
  customData?: unknown;
  [key: string]: unknown;
}

export interface ItemSummary {
  id: string;
  title: string;
}

export interface ItemLinkEdge {
  id: string;
  sourceItemId: string;
  targetItemId: string;
  sourceItem?: ItemSummary | null;
  targetItem?: ItemSummary | null;
}

export interface ItemApiModel {
  id: string;
  title: string;
  description: string | null | undefined;
  content?: string | null;
  type: string;
  sourceUrl?: string | null;
  customColor?: string | null;
  createdAt: string;
  updatedAt: string;
  metadata?: ItemMetadata | null;
  tags?: ItemTag[];
  collections?: ItemCollection[];
  sourceLinks?: ItemLinkEdge[];
  targetLinks?: ItemLinkEdge[];
  x?: number;
  y?: number;
}

export interface ListItemsParams {
  limit: number;
  offset: number;
  collectionId?: string;
  q?: string;
  signal?: AbortSignal;
}

export interface CreateItemPayload {
  title?: string;
  description?: string;
  content?: string;
  text?: string;
  type?: string;
  sourceUrl?: string;
  url?: string;
  imageUrl?: string;
  image?: string;
  favicon?: string;
  customData?: Record<string, unknown> | null;
  tags?: string[];
  collectionId?: string;
  userId?: string;
}

export type LinkHealthStatus = 'alive' | 'broken' | 'unknown';

export interface LinkHealthSnapshot {
  status: LinkHealthStatus;
  statusCode: number | null;
  checkedAt: string;
  error: string | null;
}

export interface RefreshLinkHealthResponse {
  results?: LinkHealthSnapshot[];
  [key: string]: unknown;
}

export interface RefreshLinkHealthPayload {
  itemId?: string | null;
  limit?: number;
  scanLimit?: number;
  concurrency?: number;
  force?: boolean;
  captureSnapshots?: boolean;
  snapshotMaxAgeMs?: number;
}

export interface SemanticSuggestion {
  itemId: string;
  title: string;
  type: string;
  similarity: number;
}

export interface MergeSuggestion {
  itemId: string;
  title: string;
  type: string;
  confidence: number;
  reasons: string[];
  kind: 'duplicate' | 'near-duplicate';
}

export interface ItemSuggestionsResponse {
  itemId?: string;
  embeddingSource: 'local' | 'groq';
  embeddingReused?: boolean;
  semanticSuggestions: SemanticSuggestion[];
  mergeSuggestions: MergeSuggestion[];
  meta?: Record<string, unknown>;
}

function buildListItemsQuery(params: Omit<ListItemsParams, 'signal'>): string {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });

  if (params.collectionId) {
    query.set('collectionId', params.collectionId);
  }
  if (params.q) {
    query.set('q', params.q);
  }

  return query.toString();
}

export async function listItems({ signal, ...params }: ListItemsParams): Promise<ItemApiModel[]> {
  return requestJson<ItemApiModel[]>(`/api/items/list?${buildListItemsQuery(params)}`, {
    signal,
    errorMessage: 'Failed to load items',
  });
}

export async function createItem(payload: CreateItemPayload): Promise<ItemApiModel> {
  return requestJson<ItemApiModel, CreateItemPayload>('/api/items/create', {
    method: 'POST',
    body: payload,
    errorMessage: 'Failed to save pasted content',
  });
}

export async function deleteItem(itemId: string): Promise<DeleteItemResponse> {
  return requestJson<DeleteItemResponse>(`/api/items/${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
    errorMessage: 'Failed to delete item',
  });
}

export async function getItemById(itemId: string, signal?: AbortSignal): Promise<ItemApiModel> {
  return requestJson<ItemApiModel>(`/api/items/${encodeURIComponent(itemId)}`, {
    signal,
    errorMessage: 'Failed to fetch item',
  });
}

export async function getItemSuggestions(
  itemId: string,
  { signal, cache }: { signal?: AbortSignal; cache?: RequestCache } = {}
): Promise<ItemSuggestionsResponse> {
  return requestJson<ItemSuggestionsResponse>(`/api/items/${encodeURIComponent(itemId)}/suggestions`, {
    signal,
    cache,
    errorMessage: 'Failed to load insights',
  });
}

export async function refreshItemLinkHealth(
  payload: RefreshLinkHealthPayload
): Promise<RefreshLinkHealthResponse> {
  return requestJson<RefreshLinkHealthResponse, RefreshLinkHealthPayload>('/api/items/link-health', {
    method: 'POST',
    body: payload,
    errorMessage: 'Failed to refresh link status',
  });
}
