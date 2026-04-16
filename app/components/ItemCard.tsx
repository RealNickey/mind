"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Copy, Edit2, Expand, LayoutTemplate, MoreHorizontal, Trash2 } from "lucide-react";
import CardMenu from "./CardMenu";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

interface Item {
  id: string;
  title: string;
  description: string | null;
  type: string;
  createdAt: string | Date;
  metadata?: {
    imageUrl?: string | null;
    sourceUrl?: string | null;
  } | null;
  tags?: { id: string; name: string }[];
}

interface ItemCardProps {
  item: Item;
  onExpand?: (item: Item) => void;
  onEdit?: (item: Item) => void;
  onDelete?: (item: Item) => void;
  onCanvas?: (item: Item) => void;
}

export default function ItemCard({ item, onExpand, onEdit, onDelete, onCanvas }: ItemCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const formattedDate = format(new Date(item.createdAt), "MMM d, yyyy");

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="group relative flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => onExpand?.(item)}
        >
          {item.metadata?.imageUrl && (
            <div className="relative aspect-auto w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.metadata.imageUrl}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          )}

          <div className="flex flex-col p-4 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm">
            <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
              <span className="uppercase tracking-wider font-semibold">{item.type}</span>
              <span>{formattedDate}</span>
            </div>
            
            <h3 className="mb-1 text-lg font-playfair font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2">
              {item.title}
            </h3>
            
            {item.description && (
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 font-inter">
                {item.description}
              </p>
            )}

            {item.tags && item.tags.length > 0 && (
              <div className="mt-auto flex flex-wrap gap-1">
                {item.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Hover Actions */}
          <div 
            className={`absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity duration-200 ${isHovered || menuOpen ? 'opacity-100' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={(e) => { e.stopPropagation(); onCanvas?.(item); }}
              className="rounded-full bg-white/90 p-1.5 text-zinc-700 shadow-sm hover:bg-zinc-100 hover:text-blue-600 dark:bg-zinc-800/90 dark:text-zinc-300 dark:hover:bg-zinc-700 backdrop-blur-sm"
              title="Send to Canvas"
            >
              <LayoutTemplate size={14} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onExpand?.(item); }}
              className="rounded-full bg-white/90 p-1.5 text-zinc-700 shadow-sm hover:bg-zinc-100 hover:text-green-600 dark:bg-zinc-800/90 dark:text-zinc-300 dark:hover:bg-zinc-700 backdrop-blur-sm"
              title="Expand"
            >
              <Expand size={14} />
            </button>
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className="rounded-full bg-white/90 p-1.5 text-zinc-700 shadow-sm hover:bg-zinc-100 dark:bg-zinc-800/90 dark:text-zinc-300 dark:hover:bg-zinc-700 backdrop-blur-sm"
              >
                <MoreHorizontal size={14} />
              </button>
              {menuOpen && (
                <CardMenu 
                  item={item} 
                  onClose={() => setMenuOpen(false)}
                  onEdit={() => onEdit?.(item)}
                  onDelete={() => onDelete?.(item)}
                />
              )}
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onEdit?.(item)}>
          <Edit2 className="mr-2 h-4 w-4" />
          <span>Edit</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => {
          navigator.clipboard.writeText(item.metadata?.sourceUrl || window.location.href);
        }}>
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy Link</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onCanvas?.(item)}>
          <LayoutTemplate className="mr-2 h-4 w-4" />
          <span>Send to Canvas</span>
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
