"use client";

import { useEffect, useRef } from "react";
import { Copy, Edit2, LayoutTemplate, Trash2, FolderSync } from "lucide-react";

interface Item {
  id: string;
  title: string;
}

interface CardMenuProps {
  item: Item;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function CardMenu({ item, onClose, onEdit, onDelete }: CardMenuProps) {
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
    <div
      ref={menuRef}
      className="absolute right-0 top-8 z-50 w-48 rounded-md border border-zinc-200 bg-white p-1 text-sm shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col">
        <button
          onClick={() => {
            navigator.clipboard.writeText(item.title);
            onClose();
          }}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Copy size={14} /> Copy link
        </button>
        <button
          onClick={() => {
            onEdit?.();
            onClose();
          }}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Edit2 size={14} /> Edit Item
        </button>
        <button
          onClick={() => onClose()}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <FolderSync size={14} /> Add to Collection
        </button>
        <button
          onClick={() => onClose()}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <LayoutTemplate size={14} /> View in Canvas
        </button>
        <div className="my-1 h-px bg-zinc-200 dark:bg-zinc-800" />
        <button
          onClick={() => {
            onDelete?.();
            onClose();
          }}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
}
