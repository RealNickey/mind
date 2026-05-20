"use client";

import React, { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import CanvasNode from '@/app/components/CanvasNode';
import type { ItemCardItem } from '@/app/components/ItemCard';
import { saveCanvasLayout, type CanvasNodePosition } from '@/app/lib/client-api';

type CanvasItem = ItemCardItem & {
  x?: number;
  y?: number;
};

function toCanvasNodes(items: CanvasItem[]): CanvasNodePosition[] {
  return items
    .filter((item): item is CanvasItem & { x: number; y: number } =>
      typeof item.x === 'number' &&
      Number.isFinite(item.x) &&
      typeof item.y === 'number' &&
      Number.isFinite(item.y)
    )
    .map((item) => ({
      id: item.id,
      x: item.x,
      y: item.y,
    }));
}

interface CanvasProps {
  initialItems: ItemCardItem[];
  onInspectAI?: (item: ItemCardItem) => void;
}

export default function Canvas({ initialItems, onInspectAI }: CanvasProps) {
  const [items, setItems] = useState<CanvasItem[]>(initialItems);
  const [isPanning, setIsPanning] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [saveError, setSaveError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const latestNodesRef = useRef<CanvasNodePosition[]>(toCanvasNodes(initialItems));
  const saveInFlightRef = useRef<Promise<unknown> | null>(null);
  const saveQueuedRef = useRef(false);

  const saveCanvasMutation = useMutation<{ success: boolean }, Error, CanvasNodePosition[]>({
    mutationFn: (nodes) => saveCanvasLayout(nodes),
    onSuccess: () => setSaveError(null),
    onError: (error) => setSaveError(error.message),
  });

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

  const commitLatestSave = useCallback(() => {
    const inFlightSave = (async () => {
      do {
        saveQueuedRef.current = false;
        const nodes = latestNodesRef.current;
        if (nodes.length === 0) {
          return;
        }

        await saveCanvasMutation.mutateAsync(nodes);
      } while (saveQueuedRef.current);
    })()
      .catch(() => undefined)
      .finally(() => {
        saveInFlightRef.current = null;
      });

    saveInFlightRef.current = inFlightSave;
  }, [saveCanvasMutation]);

  const handleSave = useCallback(() => {
    if (saveInFlightRef.current) {
      saveQueuedRef.current = true;
      return;
    }

    commitLatestSave();
  }, [commitLatestSave]);

  const updateNodePosition = (id: string, x: number, y: number) => {
    setItems((previousItems) => {
      const nextItems = previousItems.map((item) => (item.id === id ? { ...item, x, y } : item));
      latestNodesRef.current = toCanvasNodes(nextItems);
      return nextItems;
    });
  };

  return (
    <div 
      className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing bg-background relative"
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

      {saveError && (
        <div
          className="absolute bottom-3 right-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-300"
          role="status"
          aria-live="polite"
        >
          {saveError}
        </div>
      )}
    </div>
  );
}
