import { requestJson } from './http';

export interface CollectionListItem {
  id: string;
  name: string;
  description: string | null;
  isAuto: boolean;
  _count?: {
    items: number;
  };
}

export async function listCollections(signal?: AbortSignal): Promise<CollectionListItem[]> {
  return requestJson<CollectionListItem[]>('/api/collections/list', {
    signal,
    errorMessage: 'Failed to load collections',
  });
}

export async function createCollection(name: string, description?: string): Promise<CollectionListItem> {
  return requestJson<CollectionListItem, { name: string; description?: string }>('/api/collections/create', {
    method: 'POST',
    body: { name, description },
    errorMessage: 'Failed to create collection',
  });
}

export async function deleteCollection(id: string): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(`/api/collections/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    errorMessage: 'Failed to delete collection',
  });
}
