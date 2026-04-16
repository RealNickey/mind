'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface LinkedItem {
  id: string;
  title: string;
}

interface LinkedEdge {
  id: string;
  targetItem?: LinkedItem | null;
  sourceItem?: LinkedItem | null;
}

export function LinkedItemsPanel({ itemId }: { itemId: string }) {
  const [links, setLinks] = useState<{ sourceLinks: LinkedEdge[]; targetLinks: LinkedEdge[] }>({
    sourceLinks: [],
    targetLinks: [],
  });

  useEffect(() => {
    async function fetchLinks() {
      try {
        const res = await fetch(`/api/items/${itemId}`);
        if (!res.ok) {
          return;
        }

        const data = await res.json();
        setLinks({
          sourceLinks: data.sourceLinks || [],
          targetLinks: data.targetLinks || []
        });
      } catch (error) {
        console.error('Failed to load linked items:', error);
      }
    }

    void fetchLinks();
  }, [itemId]);

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
