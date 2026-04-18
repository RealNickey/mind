"use client";

import React, { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import ItemCard from '@/app/components/ItemCard';
import type { ItemCardItem } from '@/app/components/ItemCard';

type CanvasPosition = {
  x?: number;
  y?: number;
};

function readCanvasPosition(customData: unknown): CanvasPosition | null {
  if (!customData || typeof customData !== 'object' || Array.isArray(customData)) {
    return null;
  }

  const position = (customData as { canvasPosition?: unknown }).canvasPosition;
  if (!position || typeof position !== 'object' || Array.isArray(position)) {
    return null;
  }

  return position as CanvasPosition;
}

function seededCanvasPosition(seed: string): { x: number; y: number } {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  const positiveHash = Math.abs(hash);
  return {
    x: positiveHash % 500,
    y: Math.floor(positiveHash / 7) % 500,
  };
}

type CanvasNodeItem = ItemCardItem & {
  x?: number;
  y?: number;
};

interface CanvasNodeProps {
  item: CanvasNodeItem;
  onChangePosition: (x: number, y: number) => void;
  onMouseUp?: () => void;
  onInspectAI?: (item: ItemCardItem) => void;
}

export default function CanvasNode({ item, onChangePosition, onMouseUp, onInspectAI }: CanvasNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const canvasPosition = readCanvasPosition(item.metadata?.customData);

  const initialPos = useMemo(() => {
    if (item.x == null && !canvasPosition) {
      return seededCanvasPosition(item.id);
    }

    return {
      x: item.x ?? canvasPosition?.x ?? 0,
      y: item.y ?? canvasPosition?.y ?? 0,
    };
  }, [item.id, item.x, item.y, canvasPosition]);

  const [pos, setPos] = useState(initialPos);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
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
    e.currentTarget.releasePointerCapture(e.pointerId);
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
            onInspectAI(item);
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
