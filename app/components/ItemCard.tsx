"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Copy, Edit2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
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
  index?: number;
  onExpand?: (item: ItemCardItem) => void;
  onEdit?: (item: ItemCardItem) => void;
  onDelete?: (item: ItemCardItem) => void;
  onCanvas?: (item: ItemCardItem) => void;
  onInspectAI?: (item: ItemCardItem) => void;
}

// Each card type gets a distinct border-radius personality
function getCardShape(type: string): string {
  const t = type.toLowerCase();
  switch (t) {
    case 'note':       return '12px 20px 12px 20px'; // asymmetric, soft
    case 'movie':      return '4px 4px 4px 4px';      // sharp — cinematic frame
    case 'music':      return '8px 8px 8px 8px';      // slight round — sleeve
    case 'book':       return '4px 12px 4px 4px';     // slight right-round — spine feel
    case 'article':    return '16px 4px 16px 4px';    // editorial rhythm
    case 'link':       return '12px 12px 12px 12px';  // clean
    case 'quote':      return '0px 20px 0px 20px';    // dramatic opposing
    case 'image':      return '8px';                  // clean image mount
    case 'github':     return '8px 8px 16px 8px';     // off-beat
    case 'youtube':    return '8px';
    case 'twitter':    return '16px';
    case 'instagram':  return '12px 24px 12px 24px';
    case 'place':      return '16px 8px 16px 8px';
    case 'recipe':     return '20px 8px 20px 8px';
    case 'todo':       return '8px 8px 8px 24px';     // clipped corner feel
    case 'product':    return '12px';
    case 'color':      return '20px';
    case 'video':      return '8px';
    case 'pdf':        return '8px 16px 8px 16px';
    case 'property':   return '12px';
    case 'wikipedia':  return '4px';
    case 'highlight':  return '0px 16px 0px 16px';
    default:           return '12px';
  }
}

// Accent stripe color per type — shown as a subtle left border or top dot
function getTypeAccent(type: string): string {
  const t = type.toLowerCase();
  switch (t) {
    case 'note':       return '#ffc94b'; // golden
    case 'movie':      return '#e84393'; // cinematic pink
    case 'music':      return '#a855f7'; // violet
    case 'book':       return '#10b981'; // emerald
    case 'article':    return '#3b82f6'; // blue
    case 'link':       return '#ffc94b'; // golden
    case 'quote':      return '#f97316'; // orange
    case 'github':     return '#8b949e'; // github grey
    case 'youtube':    return '#ff0000'; // red
    case 'twitter':    return '#1d9bf0'; // twitter blue
    case 'instagram':  return '#e1306c'; // instagram pink
    case 'place':      return '#22c55e'; // green
    case 'recipe':     return '#f59e0b'; // amber
    case 'todo':       return '#8b5cf6'; // purple
    case 'product':    return '#06b6d4'; // cyan
    case 'image':      return '#ec4899'; // pink
    case 'color':      return '#fbbf24'; // amber
    case 'video':      return '#ef4444'; // red
    case 'pdf':        return '#ef4444'; // pdf red
    case 'property':   return '#0284c7'; // blue
    case 'wikipedia':  return '#000000'; // black
    case 'highlight':  return '#fde047'; // yellow
    default:           return '#ffc94b';
  }
}

export default function ItemCard({ item, index = 0, onExpand, onEdit, onDelete, onCanvas, onInspectAI }: ItemCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const parsedDate = new Date(item.createdAt);
  const formattedDate = Number.isNaN(parsedDate.getTime())
    ? "Recently"
    : format(parsedDate, "MMM d, yyyy");

  const shape = getCardShape(item.type);
  const accent = getTypeAccent(item.type);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <motion.div
          layout
          layoutId={`item-${item.id}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          transition={{
            opacity: { duration: 0.25, ease: [0.23, 1, 0.32, 1], delay: Math.min(index * 0.045, 0.35) },
            y: { type: "spring", stiffness: 380, damping: 28, delay: Math.min(index * 0.045, 0.35) },
          }}
          className={`item-card-glass group relative flex flex-col cursor-pointer ${item.type?.toLowerCase() === 'music' ? 'overflow-visible' : 'overflow-hidden'}`}
          style={{
            borderRadius: shape,
            // Base: glass panel styling
            backgroundColor: 'rgba(255,255,255,0.5)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: `1.5px solid rgba(255,255,255,0.3)`,
            boxShadow: '0 4px 24px -8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)',
            transition: 'border-color 220ms cubic-bezier(0.23,1,0.32,1), box-shadow 220ms cubic-bezier(0.23,1,0.32,1), transform 220ms cubic-bezier(0.23,1,0.32,1)',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => onExpand?.(item)}
          // Hover: yellow accent border (tasteful, not jarring)
          data-hovered={isHovered ? 'true' : undefined}
        >
          {/* Content */}
          <div className="pointer-events-none w-full">
            <ItemPreview item={item} isCard />
          </div>
        </motion.div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onExpand?.(item)}>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          <span>Open</span>
        </ContextMenuItem>
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
