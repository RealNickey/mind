"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Copy, Edit2, Expand, MoreHorizontal, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CardMenu from "./CardMenu";
import ItemPreview, { type PreviewItem } from "./previews/ItemPreview";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

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
  index?: number;
  onExpand?: (item: ItemCardItem) => void;
  onEdit?: (item: ItemCardItem) => void;
  onDelete?: (item: ItemCardItem) => void;
  onCanvas?: (item: ItemCardItem) => void;
  onInspectAI?: (item: ItemCardItem) => void;
}

export default function ItemCard({ item, index = 0, onExpand, onEdit, onDelete, onCanvas, onInspectAI }: ItemCardProps) {
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
          layoutId={`item-${item.id}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.025 }}
          whileTap={{ scale: 0.97 }}
          transition={{
            opacity: { duration: 0.25, ease: [0.23, 1, 0.32, 1], delay: Math.min(index * 0.05, 0.4) },
            y: { type: "spring", stiffness: 350, damping: 25 },
            scale: { type: "spring", stiffness: 400, damping: 20 }
          }}
          className="group relative flex flex-col overflow-hidden rounded-2xl glass-panel shadow-sm cursor-pointer border border-white/20 dark:border-white/5"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => onExpand?.(item)}
        >
          <div className="pointer-events-none w-full object-cover">
            <ItemPreview item={item} />
          </div>

          <div className="flex items-center justify-between px-4 py-3 text-[10px] tracking-wide text-muted-foreground bg-foreground/[0.01] backdrop-blur-sm border-t border-foreground/[0.03]">
            <span className="font-semibold lowercase italic opacity-85">{item.type}</span>
            <span className="opacity-60">{formattedDate}</span>
          </div>

          {/* Hover Actions */}
          <AnimatePresence>
            {(isHovered || menuOpen) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.97, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                className="absolute top-2.5 right-2.5 flex gap-1 items-center bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-1 rounded-lg shadow-lg border border-zinc-200/50 dark:border-zinc-800/50 ring-1 ring-black/5 dark:ring-white/5"
                onClick={(e) => e.stopPropagation()}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onExpand?.(item); }}
                      className="rounded-md p-1.5 text-zinc-500 hover:bg-emerald-50 hover:text-emerald-600 dark:text-zinc-400 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 transition-colors active:scale-[0.97] transition-transform"
                      aria-label="Expand item"
                    >
                      <Expand size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Expand</TooltipContent>
                </Tooltip>
                
                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                    className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors active:scale-[0.97] transition-transform"
                    aria-label="More options"
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
          const url = item.metadata?.sourceUrl || item.sourceUrl || (typeof window !== 'undefined' ? window.location.href : '');
          if (url && typeof navigator !== 'undefined') navigator.clipboard.writeText(url);
        }}>
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy Link</span>
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
