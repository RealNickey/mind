'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { listCollections, type CollectionListItem } from '@/app/lib/api-client/collections';

export function Collections() {
  const { data: collections = [], isLoading, isError } = useQuery<CollectionListItem[]>({
    queryKey: ['collections'],
    queryFn: ({ signal }) => listCollections(signal),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return <div className="text-red-500 py-12 text-center">Failed to load collections.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {collections.map((col) => (
        <Link href={`/collections/${col.id}`} key={col.id} className="block group">
          <div className="border border-muted rounded-xl p-6 transition-all hover:border-primary hover:shadow-sm h-full flex flex-col justify-between group-hover:bg-muted/30">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">{col.name}</h3>
                {col.isAuto && (
                  <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">Auto</span>
                )}
              </div>
              {col.description && <p className="text-sm text-muted-foreground">{col.description}</p>}
            </div>
            {col._count && (
              <p className="text-xs text-muted-foreground mt-4">{col._count.items} Items</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
