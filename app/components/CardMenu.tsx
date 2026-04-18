"use client";

import { useEffect, useRef } from "react";
import { Copy, Edit2, LayoutTemplate, Trash2, FolderSync, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface Item {
  id: string;
  title: string;
}

interface CardMenuProps {
  item: Item;
  onClose: () => void;
  onInspectAI?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function CardMenu({ item, onClose, onInspectAI, onEdit, onDelete }: CardMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="absolute right-0 top-10 z-50 w-52 rounded-2xl border border-white/20 dark:border-zinc-800/20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl p-1.5 text-[10px] font-bold uppercase tracking-widest shadow-2xl ring-1 ring-black/5 dark:ring-white/5"
      style={{ transformOrigin: "top right" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col gap-0.5">
        <MenuButton
          onClick={() => {
            navigator.clipboard.writeText(item.title);
            onClose();
          }}
          icon={<Copy size={14} />}
          label="Copy link"
        />
        <MenuButton
          onClick={() => {
            onEdit?.();
            onClose();
          }}
          icon={<Edit2 size={14} />}
          label="Edit Item"
        />
        <MenuButton
          onClick={() => onClose()}
          icon={<FolderSync size={14} />}
          label="Add to Collection"
        />
        <MenuButton
          onClick={() => onClose()}
          icon={<LayoutTemplate size={14} />}
          label="View in Canvas"
        />
        <MenuButton
          onClick={() => {
            onInspectAI?.();
            onClose();
          }}
          icon={<Sparkles size={14} />}
          label="AI Insights"
          className="text-amber-600 dark:text-amber-400"
        />
        <div className="my-1 h-px bg-zinc-200/50 dark:bg-zinc-800/50 mx-2" />
        <MenuButton
          onClick={() => {
            onDelete?.();
            onClose();
          }}
          icon={<Trash2 size={14} />}
          label="Delete"
          className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
        />
      </div>
    </motion.div>
  );
}

function MenuButton({ 
  onClick, 
  icon, 
  label, 
  className = "" 
}: { 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-zinc-500 hover:bg-zinc-100/50 dark:text-zinc-400 dark:hover:bg-zinc-800/50 transition-all active:scale-[0.97] ${className}`}
    >
      <span className="shrink-0">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

