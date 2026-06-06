"use client";

import { useState, useEffect } from "react";
import Masonry from "react-masonry-css";
import ItemCard, { type ItemCardItem } from "./ItemCard";

type Item = ItemCardItem;

interface MasonryGridProps {
  items: Item[];
  onExpand?: (item: Item) => void;
  onEdit?: (item: Item) => void;
  onDelete?: (item: Item) => void;
  onCanvas?: (item: Item) => void;
  onInspectAI?: (item: Item) => void;
  onPaste?: (text: string) => void;
  isPasting?: boolean;
  onAddClick?: () => void;
  spaces?: { id: string; name: string }[];
  onMoveToSpace?: (item: Item, spaceId: string | null) => void;
}

export default function MasonryGrid({
  items,
  onExpand,
  onEdit,
  onDelete,
  onCanvas,
  onInspectAI,
  onPaste,
  isPasting,
  onAddClick,
  spaces,
  onMoveToSpace,
}: MasonryGridProps) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const breakpointColumnsObj = {
    default: 4,
    1536: 4,
    1280: 3,
    1024: 2,
    768: 2,
    640: 1,
  };

  if (!isClient) {
    return <div className="flex w-auto pb-24 -ml-5" />;
  }

  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="flex w-auto pb-24 -ml-5"
      columnClassName="pl-5 bg-clip-padding"
    >
      {isPasting && (
        <div className="mb-5">
          <div
            className="flex flex-col overflow-hidden animate-pulse h-[200px]"
            style={{
              borderRadius: '12px',
              backgroundColor: 'rgba(255,255,255,0.4)',
              backdropFilter: 'blur(24px) saturate(180%)',
              border: `1.5px solid rgba(255,255,255,0.3)`,
              boxShadow: '0 4px 24px -8px rgba(0,0,0,0.06)',
            }}
          >
            <div className="flex-1 bg-zinc-200/50 dark:bg-zinc-800/50 w-full h-full" />
            <div className="p-4 space-y-3 bg-white/30 dark:bg-zinc-900/30">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
            </div>
          </div>
        </div>
      )}

      {/* Add new item card */}
      <div className="mb-5">
        <button
          className="add-card-root group relative flex flex-col justify-center items-center overflow-hidden p-7 h-[200px] w-full text-center transition-all duration-200 cursor-pointer border-0 outline-none"
          style={{
            borderRadius: '16px 4px 16px 4px',
            background: 'rgba(255,255,255,0.28)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1.5px dashed rgba(255,201,75,0.35)',
            boxShadow: '0 2px 16px -6px rgba(0,0,0,0.04)',
            transition: 'border-color 200ms ease, background 200ms ease',
          }}
          onClick={onAddClick}
          aria-label="Add a new thought"
        >
          <style>{`
            .add-card-root:hover {
              border-color: rgba(255,201,75,0.7) !important;
              background: rgba(255,255,255,0.38) !important;
            }
            .dark .add-card-root {
              background: rgba(18,18,18,0.4) !important;
              border-color: rgba(255,201,75,0.2) !important;
            }
            .dark .add-card-root:hover {
              border-color: rgba(255,201,75,0.5) !important;
              background: rgba(18,18,18,0.55) !important;
            }
          `}</style>
          <div className="pointer-events-none flex flex-col items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-150 group-hover:scale-110 group-hover:rotate-90"
              style={{
                background: 'rgba(255,201,75,0.12)',
                border: '1.5px solid rgba(255,201,75,0.35)',
                color: '#b87d00',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span className="text-zinc-600 dark:text-zinc-300 font-semibold text-sm font-heading">Add a thought…</span>
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-[10px] px-2.5 py-1 rounded-md font-mono"
              style={{ background: 'rgba(255,201,75,0.08)', border: '1px solid rgba(255,201,75,0.2)' }}
            >
              <kbd className="font-bold border border-current rounded px-1 py-0.5 text-[9px]">Ctrl+V</kbd>
              <span>paste instantly</span>
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">or type and press Enter</p>
          </div>
        </button>
      </div>

      {items.map((item, index) => (
        <div
          key={item.id}
          className="mb-5"
          style={item.type?.toLowerCase() === 'music' ? { overflow: 'visible' } : undefined}
        >
          <ItemCard
            item={item}
            index={index}
            onExpand={onExpand}
            onEdit={onEdit}
            onDelete={onDelete}
            onCanvas={onCanvas}
            onInspectAI={onInspectAI}
            spaces={spaces}
            onMoveToSpace={onMoveToSpace}
          />
        </div>
      ))}
    </Masonry>
  );
}
