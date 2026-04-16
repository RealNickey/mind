"use client";

import { useMemo } from "react";
import Masonry from "react-masonry-css";
import ItemCard from "./ItemCard";

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

interface MasonryGridProps {
  items: Item[];
  onExpand?: (item: Item) => void;
  onEdit?: (item: Item) => void;
  onDelete?: (item: Item) => void;
  onCanvas?: (item: Item) => void;
}

export default function MasonryGrid({ items, onExpand, onEdit, onDelete, onCanvas }: MasonryGridProps) {
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
      {items.map((item) => (
        <div key={item.id} className="mb-4">
          <ItemCard
            item={item}
            onExpand={onExpand}
            onEdit={onEdit}
            onDelete={onDelete}
            onCanvas={onCanvas}
          />
        </div>
      ))}
    </Masonry>
  );
}
