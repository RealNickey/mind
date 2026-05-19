"use client";

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
}

export default function MasonryGrid({ items, onExpand, onEdit, onDelete, onCanvas, onInspectAI, onPaste }: MasonryGridProps) {
  const [isClient, setIsClient] = (require('react')).useState(false);
  (require('react')).useEffect(() => {
    setIsClient(true);
  }, []);

  const breakpointColumnsObj = {
    default: 5,
    1536: 4,
    1280: 3,
    1024: 3,
    768: 2,
    640: 1,
  };

  if (!isClient) {
    return <div className="flex w-auto pb-24 -ml-6" />;
  }

  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="flex w-auto pb-24 -ml-6"
      columnClassName="pl-6 bg-clip-padding"
    >
      <div className="mb-6">
        <div 
          className="group relative flex flex-col justify-center items-center overflow-hidden rounded-xl bg-white/40 dark:bg-zinc-900/40 border border-dashed border-zinc-200/80 dark:border-zinc-700/60 p-8 h-[220px] text-center transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-white/60 dark:hover:bg-zinc-800/60 backdrop-blur-sm shadow-sm ring-1 ring-black/5 dark:ring-white/5 active:scale-[0.99] active:shadow-sm"
          role="textbox"
          aria-label="Paste or type to add a new item"
          tabIndex={0}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text");
            if (text && onPaste) onPaste(text);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              const target = e.target as HTMLDivElement;
              if (target.innerText.trim() && onPaste) {
                onPaste(target.innerText.trim());
                target.innerText = '';
              }
            }
          }}
        >
          <div className="pointer-events-none flex flex-col items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-zinc-100/80 dark:bg-zinc-800/80 flex items-center justify-center transition-transform duration-150 group-hover:scale-110">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 group-hover:text-zinc-500 transition-colors duration-150" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span className="text-zinc-500 dark:text-zinc-400 font-semibold text-sm font-heading">Add a thought…</span>
            <div className="flex items-center gap-1.5 bg-zinc-100/70 dark:bg-zinc-800/70 text-zinc-500 dark:text-zinc-400 text-[10px] px-2.5 py-1 rounded-md font-mono shadow-sm border border-zinc-200/50 dark:border-zinc-700/50">
              <kbd className="font-bold border border-current rounded px-1 py-0.5 bg-white/50 dark:bg-black/20 text-[9px]">Ctrl+V</kbd>
              <span>paste instantly</span>
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">or type and press Enter</p>
          </div>
          <textarea 
            className="w-full h-full absolute inset-0 opacity-0 resize-none cursor-text p-6"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const target = e.target as HTMLTextAreaElement;
                if (target.value.trim() && onPaste) {
                  onPaste(target.value.trim());
                  target.value = '';
                }
              }
            }}
            onBlur={(e) => {
              if (e.target.value.trim() && onPaste) {
                onPaste(e.target.value.trim());
                e.target.value = '';
              }
            }}
            aria-label="Type note content here"
          />
        </div>
      </div>

      {items.map((item) => (
        <div key={item.id} className="mb-6">
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
    </Masonry>
  );
}
