"use client";

import React, { useState, useEffect } from 'react';
import Canvas from '@/app/components/Canvas';
import CanvasToolbar from '@/app/components/CanvasToolbar';
import type { ItemCardItem } from '@/app/components/ItemCard';
import { ItemQuickAIPanel } from '@/app/components/ItemQuickAIPanel';

export default function CanvasPage() {
  const [items, setItems] = useState<ItemCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAIItem, setSelectedAIItem] = useState<ItemCardItem | null>(null);

  useEffect(() => {
    async function loadItems() {
      try {
        const res = await fetch('/api/items/list'); // Assuming this exists or falls back
        if (res.ok) {
          const data = await res.json() as ItemCardItem[];
          setItems(data);
        }
      } catch (e) {
        console.error("Failed to load items", e);
      } finally {
        setLoading(false);
      }
    }
    loadItems();
  }, []);

  if (loading) {
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
