"use client";

import React, { useState, useEffect } from 'react';
import ItemCard from '@/app/components/ItemCard';

interface CanvasNodeProps {
  item: any;
  onChangePosition: (x: number, y: number) => void;
  onMouseUp?: () => void;
}

export default function CanvasNode({ item, onChangePosition, onMouseUp }: CanvasNodeProps) {
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
      <div className="pointer-events-none">
        <ItemCard item={item} />
      </div>
    </div>
  );
}
