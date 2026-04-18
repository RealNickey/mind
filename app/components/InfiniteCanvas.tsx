"use client";

import React, { useRef, useMemo } from "react";
import { useSpring, animated, to } from "@react-spring/web";
import { useGesture } from "@use-gesture/react";
import ItemCard, { type ItemCardItem } from "@/app/components/ItemCard";

const CARD_WIDTH = 320;
const ROW_HEIGHT = 420;
const GAP = 32;

interface InfiniteCanvasProps {
  items: ItemCardItem[];
  onExpand?: (item: ItemCardItem) => void;
  onEdit?: (item: ItemCardItem) => void;
  onDelete?: (item: ItemCardItem) => void;
  onCanvas?: (item: ItemCardItem) => void;
  onInspectAI?: (item: ItemCardItem) => void;
}

export default function InfiniteCanvas({ items, onExpand, onEdit, onDelete, onCanvas, onInspectAI }: InfiniteCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Layout items in a grid
  const { W, H, positionedItems } = useMemo(() => {
    if (!items || items.length === 0) return { W: 1000, H: 1000, positionedItems: [] };
    const cols = Math.ceil(Math.sqrt(items.length));
    const rows = Math.ceil(items.length / cols);
    const W = cols * (CARD_WIDTH + GAP);
    const H = rows * (ROW_HEIGHT + GAP);
    
    const positioned = items.map((item, i) => ({
      ...item,
      origX: (i % cols) * (CARD_WIDTH + GAP) + GAP / 2,
      origY: Math.floor(i / cols) * (ROW_HEIGHT + GAP) + GAP / 2,
    }));
    return { W: Math.max(W, window.innerWidth), H: Math.max(H, window.innerHeight), positionedItems: positioned };
  }, [items]);

  const [{ x, y, zoom }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    zoom: 1,
    config: { tension: 300, friction: 30 }
  }));

  // Setup gesture for panning and zooming
  useGesture({
    onDrag: ({ offset: [dx, dy] }) => {
      api.start({ x: dx, y: dy, immediate: true });
    },
    onWheel: ({ event, delta: [dx, dy], ctrlKey }) => {
      event.preventDefault();
      if (ctrlKey || event.metaKey) {
        // Zooming
        const dz = dy * 0.01;
        const currentZoom = zoom.get();
        const newZoom = Math.max(0.2, Math.min(currentZoom - dz, 4));
        api.start({ zoom: newZoom, immediate: true });
      } else {
        // Panning
        api.start({
          x: x.get() - dx,
          y: y.get() - dy,
          immediate: true
        });
      }
    }
  }, {
    target: containerRef,
    eventOptions: { passive: false },
    drag: { from: () => [x.get(), y.get()] }
  });

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative overflow-hidden bg-zinc-50 dark:bg-[#09090b] cursor-grab active:cursor-grabbing touch-none flex items-center justify-center"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }}
    >
      {/* Noise Texture Layer */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />

      <animated.div 
        className="absolute top-1/2 left-1/2 origin-center"
        style={{
          transform: zoom.to(z => `scale(${z})`),
        }}
      >
        <animated.div
          className="relative"
          style={{
            transform: to([x, y], (xVal, yVal) => {
              // Wrap the panning coordinates
              const wrappedX = ((xVal % W) + W) % W;
              const wrappedY = ((yVal % H) + H) % H;
              return `translate3d(${wrappedX - W/2}px, ${wrappedY - H/2}px, 0)`;
            })
          }}
        >
          {/* Create a 3x3 grid of the repeating canvas block for the infinite effect */}
          {[-1, 0, 1].map((rx) => (
            [-1, 0, 1].map((ry) => (
              <div 
                key={`block-${rx}-${ry}`}
                className="absolute"
                style={{
                  width: W,
                  height: H,
                  transform: `translate3d(${rx * W}px, ${ry * H}px, 0)`
                }}
              >
                {positionedItems.map(item => (
                  <div 
                    key={`${rx}-${ry}-${item.id}`} 
                    className="absolute rounded-xl pointer-events-auto transition-transform duration-300 hover:z-50"
                    style={{
                      width: CARD_WIDTH,
                      transform: `translate3d(${item.origX}px, ${item.origY}px, 0)`
                    }}
                    onPointerDown={(e) => e.stopPropagation()} 
                  >
                    <ItemCard
                      item={item}
                      onExpand={onExpand}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onCanvas={onCanvas}
                      onInspectAI={onInspectAI}
                    />
                  </div>
                ))}
              </div>
            ))
          ))}
        </animated.div>
      </animated.div>
    </div>
  );
}
