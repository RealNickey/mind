"use client";

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import MasonryGrid from '@/app/components/MasonryGrid';
import type { ItemCardItem } from '@/app/components/ItemCard';
import { ItemQuickAIPanel } from '@/app/components/ItemQuickAIPanel';

interface CollectionResponse {
  id: string;
  name: string;
  description: string | null;
  items: ItemCardItem[];
}

export default function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [collection, setCollection] = useState<CollectionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAIItem, setSelectedAIItem] = useState<ItemCardItem | null>(null);

  useEffect(() => {
    async function fetchCollection() {
      try {
        const res = await fetch(`/api/collections/${resolvedParams.id}`);
        if (res.ok) {
          const data = await res.json() as CollectionResponse;
          setCollection(data);
        }
      } catch (err) {
        console.error('Error fetching collection', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCollection();
  }, [resolvedParams.id]);

  const handleExpand = (item: ItemCardItem) => {
    router.push(`/items/${item.id}`);
  };

  const handleCanvas = (item: ItemCardItem) => {
    router.push(`/canvas?focus=${item.id}`);
  };

  if (loading) return <div className="p-8">Loading collection...</div>;
  if (!collection) return <div className="p-8">Collection not found.</div>;

  return (
    <div className="p-8">
      <h1 className="text-4xl font-playfair mb-4">{collection.name}</h1>
      {collection.description && <p className="mb-8 text-muted-foreground">{collection.description}</p>}
      
      <div className="mt-8">
        <MasonryGrid
          items={collection.items || []}
          onExpand={handleExpand}
          onCanvas={handleCanvas}
          onInspectAI={setSelectedAIItem}
        />
      </div>

      <ItemQuickAIPanel
        item={selectedAIItem}
        isOpen={Boolean(selectedAIItem)}
        onClose={() => setSelectedAIItem(null)}
      />
    </div>
  );
}
