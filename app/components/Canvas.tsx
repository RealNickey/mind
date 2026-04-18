"use client";

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
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
      className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing bg-zinc-50 dark:bg-zinc-950 relative"
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
      {/* Dynamic Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-20 transition-opacity"
        style={{
          backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          color: 'var(--grid-color, #a1a1aa)',
        }}
      />
      
      <motion.div 
        className="absolute origin-top-left will-change-transform"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        {items.map((item, i) => (
          <motion.div
             key={item.id}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <CanvasNode 
              item={item} 
              onChangePosition={(x, y) => updateNodePosition(item.id, x, y)} 
              onMouseUp={handleSave}
              onInspectAI={onInspectAI}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
