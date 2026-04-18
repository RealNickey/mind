'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getItemById, type ItemLinkEdge } from '@/app/lib/api-client/items';
import { ApiClientError } from '@/app/lib/api-client/http';

interface LinkedItemsData {
  sourceLinks: ItemLinkEdge[];
  targetLinks: ItemLinkEdge[];
}

const EMPTY_LINKS: LinkedItemsData = { sourceLinks: [], targetLinks: [] };

export function LinkedItemsPanel({ itemId }: { itemId: string }) {
  const { data } = useQuery<LinkedItemsData, Error, LinkedItemsData>({
    queryKey: ['item-links', itemId],
    enabled: Boolean(itemId),
    staleTime: 60_000,
    retry: false,
    queryFn: async ({ signal }) => {
      try {
        const item = await getItemById(itemId, signal);
        return {
          sourceLinks: item.sourceLinks ?? EMPTY_LINKS.sourceLinks,
          targetLinks: item.targetLinks ?? EMPTY_LINKS.targetLinks,
        };
      } catch (error) {
        if (error instanceof ApiClientError) {
          return EMPTY_LINKS;
        }
        console.error('Failed to load linked items:', error);
        return EMPTY_LINKS;
      }
    },
  });
  const links = data ?? EMPTY_LINKS;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Linked Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2 text-gray-500">Mentions / Links Out</h4>
            {links.sourceLinks.length === 0 ? (
              <p className="text-sm text-gray-400">No outgoing links.</p>
            ) : (
              <ul className="list-disc pl-4 text-sm">
                {links.sourceLinks.map((link) => {
                  if (!link.targetItem?.id) {
                    return null;
                  }

                  return (
                    <li key={link.id}>
                      <Link href={`/items/${link.targetItem.id}`} className="text-[#FFB3D9] hover:underline">
                        {link.targetItem.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2 text-gray-500">Backlinks / Linked From</h4>
            {links.targetLinks.length === 0 ? (
              <p className="text-sm text-gray-400">No incoming links.</p>
            ) : (
              <ul className="list-disc pl-4 text-sm">
                {links.targetLinks.map((link) => {
                  if (!link.sourceItem?.id) {
                    return null;
                  }

                  return (
                    <li key={link.id}>
                      <Link href={`/items/${link.sourceItem.id}`} className="text-[#B3E5D1] hover:underline">
                        {link.sourceItem.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
