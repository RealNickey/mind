"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import MasonryGrid from "./MasonryGrid";
import { Filter, Search, Calendar, Tags, LayoutTemplate, Loader2 } from "lucide-react";
import InfiniteCanvas from "./InfiniteCanvas";

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

interface GridLayoutProps {
  initialItems: Item[];
}

export default function GridLayout({ initialItems }: GridLayoutProps) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [viewMode, setViewMode] = useState<"grid" | "canvas">("grid");

  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMoreItems = useCallback(async () => {
    setIsLoadingMore(true);
    // Simulate API call
    setTimeout(() => {
      setItems((prev) => {
        const newItems = Array.from({ length: 12 }).map((_, i) => ({
          id: `auto-gen-${Date.now()}-${i}`,
          title: `Loaded Item ${prev.length + i + 1}`,
          description: "This item was loaded lazily via Intersection Observer.",
          type: ["article", "movie", "book", "image", "tweet"][Math.floor(Math.random() * 5)],
          createdAt: new Date().toISOString(),
          tags: [{ id: `t-${i}`, name: "lazy-loaded" }],
        }));
        
        // Stop after 3 loads for mock purposes
        if (prev.length + newItems.length > 50) {
          setHasMore(false);
        }

        return [...prev, ...newItems];
      });
      setIsLoadingMore(false);
    }, 800);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreItems();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, isLoadingMore, loadMoreItems]);

  const handlePaste = useCallback((text: string) => {
    const newItem = {
      id: `pasted-${Date.now()}`,
      title: text.length > 30 ? text.substring(0, 30) + '...' : text,
      description: text,
      type: text.startsWith("http") ? "link" : "article",
      createdAt: new Date().toISOString(),
      tags: [{ id: "t-paste", name: "pasted" }],
    };
    setItems((prev) => [newItem, ...prev]);
  }, []);

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Don't intercept if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      ) {
        return;
      }

      const text = e.clipboardData?.getData("text/plain");
      if (text) {
        handlePaste(text);
      }
    };
    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [handlePaste]);

  const types = ["all", "article", "movie", "book", "image", "tweet"];

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = activeFilter === "all" || item.type === activeFilter;
      return matchesSearch && matchesType;
    });
  }, [items, searchQuery, activeFilter]);

  const handleExpand = (item: Item) => {
    console.log("Expand", item);
  };

  const handleEdit = (item: Item) => {
    console.log("Edit", item);
  };

  const handleDelete = (item: Item) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const handleCanvas = (item: Item) => {
    console.log("Canvas", item);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Header / Filter Bar */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between gap-4">
        
        <div 
          className="flex items-center gap-2 overflow-x-auto pb-1 max-w-[50%] scrollbar-hide"
          role="tablist"
          aria-label="Filter items by type"
        >
          {types.map((type) => (
            <button
              key={type}
              role="tab"
              aria-selected={activeFilter === type}
              onClick={() => setActiveFilter(type)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                activeFilter === type
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 flex justify-end gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Search in grid..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-zinc-200 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              aria-label="Search items"
            />
          </div>
          <button 
            className="p-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter items"
          >
            <Filter size={18} aria-hidden="true" />
          </button>
          <button 
            className="p-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Tags"
          >
            <Tags size={18} aria-hidden="true" />
          </button>
          <button 
            className="p-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Calendar view"
          >
            <Calendar size={18} aria-hidden="true" />
          </button>
          <button 
            className={`p-2 rounded-full border border-zinc-200 dark:border-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              viewMode === 'canvas' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
            onClick={() => setViewMode(viewMode === 'grid' ? 'canvas' : 'grid')}
            aria-label="Toggle Canvas View"
            title="Toggle Canvas View"
          >
            <LayoutTemplate size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className={viewMode === 'canvas' ? "flex-1 overflow-hidden" : "flex-1 p-6"} role="region" aria-label={viewMode === 'canvas' ? "Canvas Area" : "Items Grid"}>
        {viewMode === 'canvas' ? (
          <InfiniteCanvas items={filteredItems} />
        ) : (
          <>
            <MasonryGrid
              items={filteredItems}
              onExpand={handleExpand}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCanvas={handleCanvas}
              onPaste={handlePaste}
            />
            
            {/* Infinite Scroll Sentinel */}
            {hasMore && filteredItems.length > 0 && searchQuery === "" && activeFilter === "all" && (
              <div 
                ref={observerTarget} 
                className="w-full h-24 mt-4 flex items-center justify-center"
                aria-live="polite"
              >
                {isLoadingMore && (
                  <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" aria-label="Loading more items" />
                )}
              </div>
            )}

            {filteredItems.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                <div className="w-16 h-16 mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Search size={24} className="text-zinc-400" aria-hidden="true" />
                </div>
                <p className="font-medium text-lg">No items found</p>
                <p className="text-sm">Try adjusting your filters or search query.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
