"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Copy, Edit2, Expand, LayoutTemplate, MoreHorizontal, Sparkles, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CardMenu from "./CardMenu";
import ItemPreview, { type PreviewItem } from "./previews/ItemPreview";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

export interface ItemCardItem {
  id: string;
  title: PreviewItem['title'];
  description: PreviewItem['description'];
  content?: PreviewItem['content'];
  type: PreviewItem['type'];
  sourceUrl?: string | null;
  customColor?: string | null;
  createdAt: string | Date;
  metadata?: PreviewItem['metadata'];
  tags?: { id: string; name: string }[];
}

interface ItemCardProps {
  item: ItemCardItem;
  onExpand?: (item: ItemCardItem) => void;
  onEdit?: (item: ItemCardItem) => void;
  onDelete?: (item: ItemCardItem) => void;
  onCanvas?: (item: ItemCardItem) => void;
  onInspectAI?: (item: ItemCardItem) => void;
}

export default function ItemCard({ item, onExpand, onEdit, onDelete, onCanvas, onInspectAI }: ItemCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const parsedDate = new Date(item.createdAt);
  const formattedDate = Number.isNaN(parsedDate.getTime())
    ? "Recently"
    : format(parsedDate, "MMM d, yyyy");

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <motion.div
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="group relative flex flex-col overflow-hidden rounded-xl bg-white/40 dark:bg-zinc-900/40 shadow-sm backdrop-blur-xl transition-all hover:shadow-md border border-zinc-200/50 dark:border-zinc-800/50 ring-1 ring-black/5 dark:ring-white/5 cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => onExpand?.(item)}
        >
          <div className="pointer-events-none w-full object-cover">
            <ItemPreview item={item} />
          </div>

          <div className="flex flex-col flex-1 border-t border-zinc-200/40 bg-white/20 p-4 backdrop-blur-md dark:border-zinc-800/40 dark:bg-black/10">
            <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500">
              <span className="rounded px-1.5 py-0.5 bg-zinc-100/50 dark:bg-zinc-800/50">{item.type}</span>
              <span>{formattedDate}</span>
            </div>

            {item.tags && item.tags.length > 0 && (
              <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-md bg-zinc-100/60 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400 border border-zinc-200/30 dark:border-zinc-700/30 transition-colors hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Hover Actions */}
          <AnimatePresence>
            {(isHovered || menuOpen) && (
              <motion.div 
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                className="absolute top-2.5 right-2.5 flex gap-1 items-center bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-1 rounded-lg shadow-lg border border-zinc-200/50 dark:border-zinc-800/50 ring-1 ring-black/5 dark:ring-white/5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); onInspectAI?.(item); }}
                  className="rounded-md p-1.5 text-zinc-500 hover:bg-amber-50 hover:text-amber-600 dark:text-zinc-400 dark:hover:bg-amber-500/10 dark:hover:text-amber-400 transition-colors"
                  title="AI Insights"
                  aria-label={`Open AI insights for ${item.title}`}
                >
                  <Sparkles size={14} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onCanvas?.(item); }}
                  className="rounded-md p-1.5 text-zinc-500 hover:bg-indigo-50 hover:text-indigo-600 dark:text-zinc-400 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-colors"
                  title="Send to Canvas"
                >
                  <LayoutTemplate size={14} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onExpand?.(item); }}
                  className="rounded-md p-1.5 text-zinc-500 hover:bg-emerald-50 hover:text-emerald-600 dark:text-zinc-400 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 transition-colors"
                  title="Expand"
                >
                  <Expand size={14} />
                </button>
                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                    className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {menuOpen && (
                    <CardMenu 
                      item={item} 
                      onClose={() => setMenuOpen(false)}
                      onInspectAI={() => onInspectAI?.(item)}
                      onEdit={() => onEdit?.(item)}
                      onDelete={() => onDelete?.(item)}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onEdit?.(item)}>
          <Edit2 className="mr-2 h-4 w-4" />
          <span>Edit</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => {
          navigator.clipboard.writeText(item.metadata?.sourceUrl || item.sourceUrl || window.location.href);
        }}>
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy Link</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onCanvas?.(item)}>
          <LayoutTemplate className="mr-2 h-4 w-4" />
          <span>Send to Canvas</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onInspectAI?.(item)}>
          <Sparkles className="mr-2 h-4 w-4" />
          <span>AI Insights</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50" onClick={() => onDelete?.(item)}>
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
