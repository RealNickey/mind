"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Canvas from '@/app/components/Canvas';
import CanvasToolbar from '@/app/components/CanvasToolbar';
import type { ItemCardItem } from '@/app/components/ItemCard';
import { ItemQuickAIPanel } from '@/app/components/ItemQuickAIPanel';

export default function CanvasPage() {
  const [selectedAIItem, setSelectedAIItem] = useState<ItemCardItem | null>(null);

  const { data: items = [], isLoading } = useQuery<ItemCardItem[]>({
    queryKey: ['canvas-items'],
    queryFn: async () => {
      const res = await fetch('/api/items/list');
      if (!res.ok) throw new Error('Failed to load items');
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading canvas...</div>;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      <CanvasToolbar />
      <div className="w-full h-full relative">
        <Canvas initialItems={items} onInspectAI={setSelectedAIItem} />
      </div>

      <ItemQuickAIPanel
        item={selectedAIItem}
        isOpen={Boolean(selectedAIItem)}
        onClose={() => setSelectedAIItem(null)}
      />
    </div>
  );
}
