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
