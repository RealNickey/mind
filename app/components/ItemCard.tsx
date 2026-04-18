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
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="group relative flex flex-col overflow-hidden rounded-2xl bg-white/60 shadow-sm backdrop-blur-xl transition-all hover:shadow-xl dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/50"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => onExpand?.(item)}
        >
          <div className="pointer-events-none w-full object-cover">
            <ItemPreview item={item} />
          </div>

          <div className="flex flex-col flex-1 border-t border-zinc-200/50 bg-white/40 p-4 backdrop-blur-md dark:border-zinc-800/50 dark:bg-black/20">
            <div className="mb-3 flex items-center justify-between text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              <span className="uppercase tracking-wider rounded-md bg-zinc-100/50 dark:bg-zinc-800/50 px-2 py-1">{item.type}</span>
              <span>{formattedDate}</span>
            </div>

            {item.tags && item.tags.length > 0 && (
              <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full bg-zinc-100/80 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 backdrop-blur-sm dark:bg-zinc-800/80 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/50 transition-colors hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80"
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-3 right-3 flex gap-1.5 items-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-1 rounded-full shadow-sm border border-zinc-200/50 dark:border-zinc-800/50"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); onInspectAI?.(item); }}
                  className="rounded-full p-1.5 text-zinc-500 hover:bg-blue-50 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-blue-500/20 dark:hover:text-blue-400 transition-colors"
                  title="AI Insights"
                  aria-label={`Open AI insights for ${item.title}`}
                >
                  <Sparkles size={14} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onCanvas?.(item); }}
                  className="rounded-full p-1.5 text-zinc-500 hover:bg-purple-50 hover:text-purple-600 dark:text-zinc-400 dark:hover:bg-purple-500/20 dark:hover:text-purple-400 transition-colors"
                  title="Send to Canvas"
                >
                  <LayoutTemplate size={14} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onExpand?.(item); }}
                  className="rounded-full p-1.5 text-zinc-500 hover:bg-emerald-50 hover:text-emerald-600 dark:text-zinc-400 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-400 transition-colors"
                  title="Expand"
                >
                  <Expand size={14} />
                </button>
                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                    className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors"
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
