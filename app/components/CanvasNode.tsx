"use client";

import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import ItemCard from '@/app/components/ItemCard';
import type { ItemCardItem } from '@/app/components/ItemCard';

interface CanvasNodeProps {
  item: any;
  onChangePosition: (x: number, y: number) => void;
  onMouseUp?: () => void;
  onInspectAI?: (item: ItemCardItem) => void;
}

export default function CanvasNode({ item, onChangePosition, onMouseUp, onInspectAI }: CanvasNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const metadata = item.metadata?.customData || {};
  
  const [pos, setPos] = useState({ 
    x: item.x ?? metadata.canvasPosition?.x ?? 0, 
    y: item.y ?? metadata.canvasPosition?.y ?? 0 
  });

  useEffect(() => {
    if (item.x == null && !metadata.canvasPosition) {
      setPos({ x: Math.random() * 500, y: Math.random() * 500 });
    }
  }, [item.x, metadata.canvasPosition]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      e.stopPropagation();
      const newX = pos.x + e.movementX;
      const newY = pos.y + e.movementY;
      setPos({ x: newX, y: newY });
      onChangePosition(newX, newY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    if (onMouseUp) onMouseUp();
  };

  return (
    <div 
      className="absolute cursor-move shadow-lg rounded-xl transition-shadow hover:shadow-xl"
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {onInspectAI && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onInspectAI(item as ItemCardItem);
          }}
          className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-white/95 text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 hover:text-blue-600 dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-200 dark:hover:bg-zinc-800"
          title={`Open AI insights for ${item.title}`}
          aria-label={`Open AI insights for ${item.title}`}
        >
          <Sparkles className="h-3.5 w-3.5" />
        </button>
      )}
      <div className="pointer-events-none">
        <ItemCard item={item} />
      </div>
    </div>
  );
}
