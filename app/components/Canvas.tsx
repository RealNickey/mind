"use client";

import React, { useState, useRef } from 'react';
import CanvasNode from '@/app/components/CanvasNode';
import type { ItemCardItem } from '@/app/components/ItemCard';

interface CanvasProps {
  initialItems: ItemCardItem[];
  onInspectAI?: (item: ItemCardItem) => void;
}

export default function Canvas({ initialItems, onInspectAI }: CanvasProps) {
  const [items, setItems] = useState(initialItems);
  const [isPanning, setIsPanning] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const newZoom = Math.min(Math.max(0.1, zoom - e.deltaY * zoomSensitivity), 3);
      setZoom(newZoom);
    } else {
      setPan({ x: pan.x - e.deltaX, y: pan.y - e.deltaY });
    }
  };

  const handleSave = async () => {
    try {
      await fetch('/api/canvas/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: items }),
      });
    } catch (err) {
      console.error('Failed to save canvas state', err);
    }
  };

  const updateNodePosition = (id: string, x: number, y: number) => {
    setItems(items.map(item => item.id === id ? { ...item, x, y } : item));
  };

  return (
    <div 
      className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing bg-dot-pattern"
      ref={canvasRef}
      onWheel={handleWheel}
      onPointerDown={() => setIsPanning(true)}
      onPointerUp={() => { setIsPanning(false); handleSave(); }}
      onPointerLeave={() => setIsPanning(false)}
      onPointerMove={(e) => {
        if (isPanning) {
          setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
        }
      }}
    >
      <div 
        className="absolute origin-top-left transition-transform duration-75 ease-out"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        {items.map(item => (
          <CanvasNode 
            key={item.id} 
            item={item} 
            onChangePosition={(x, y) => updateNodePosition(item.id, x, y)} 
            onMouseUp={handleSave}
            onInspectAI={onInspectAI}
          />
        ))}
      </div>
    </div>
  );
}
