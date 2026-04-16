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
  const breakpointColumnsObj = {
    default: 5,
    1536: 4,
    1280: 3,
    1024: 3,
    768: 2,
    640: 1,
  };

  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="flex w-auto pb-20 -ml-4"
      columnClassName="pl-4 bg-clip-padding"
    >
      <div className="mb-4">
        <div 
          className="group relative flex flex-col justify-center items-center overflow-hidden rounded-xl bg-zinc-50 border-2 border-dashed border-zinc-200 p-8 h-[250px] text-center transition-all hover:bg-zinc-100 hover:border-zinc-300 dark:bg-zinc-900/50 dark:border-zinc-800 dark:hover:bg-zinc-800"
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text");
            if (text && onPaste) onPaste(text);
          }}
        >
          <span className="text-zinc-500 dark:text-zinc-400 font-medium mb-3 text-lg font-playfair">Add a thought...</span>
          <textarea 
            className="w-full h-full absolute inset-0 opacity-0 resize-none cursor-text p-4"
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
          />
          <div className="pointer-events-none bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs px-3 py-1.5 rounded-md mt-2 flex items-center justify-center gap-1.5 font-mono shadow-sm">
            <span className="font-bold border border-current rounded px-1.5 py-0.5 bg-white/50 dark:bg-black/20">Ctrl+V</span>
            <span>to paste instantly</span>
          </div>
          <p className="pointer-events-none text-xs text-zinc-400 dark:text-zinc-500 mt-auto">
            Or just type and hit Enter
          </p>
        </div>
      </div>

      {items.map((item) => (
        <div key={item.id} className="mb-4">
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
