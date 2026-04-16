"use client";

import React, { useState, useEffect } from 'react';
import Canvas from '@/app/components/Canvas';
import CanvasToolbar from '@/app/components/CanvasToolbar';

export default function CanvasPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadItems() {
      try {
        const res = await fetch('/api/items/list'); // Assuming this exists or falls back
        if (res.ok) {
          const data = await res.json();
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
        <Canvas initialItems={items} />
      </div>
    </div>
  );
}
