"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import MasonryGrid from "./MasonryGrid";
import type { ItemCardItem } from "./ItemCard";
import { Filter, Search, Calendar, Tags, LayoutTemplate, Loader2, Sparkles, Bot } from "lucide-react";
import InfiniteCanvas from "./InfiniteCanvas";
import { AIChat } from "./AIChat";

type Item = ItemCardItem;

interface GridLayoutProps {
  initialItems: Item[];
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 24;

const FILTER_TYPES = [
  "all",
  "article",
  "movie",
  "tvshow",
  "book",
  "image",
  "video",
  "recipe",
  "note",
  "link",
  "product",
  "twitter",
  "instagram",
  "youtube",
  "color",
  "music",
  "github",
  "quote",
  "todo",
  "place",
] as const;

function dedupeById(items: Item[]): Item[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

function matchesCurrentQuery(item: Item, activeFilter: string, query: string): boolean {
  if (activeFilter !== "all" && item.type !== activeFilter) {
    return false;
  }

  if (!query) {
    return true;
  }

  const needle = query.toLowerCase();
  return (
    item.title.toLowerCase().includes(needle) ||
    (item.description ?? "").toLowerCase().includes(needle) ||
    (item.content ?? "").toLowerCase().includes(needle)
  );
}

export default function GridLayout({ initialItems, pageSize = DEFAULT_PAGE_SIZE }: GridLayoutProps) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchMode, setSearchMode] = useState<"keyword" | "semantic">("keyword");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialItems.length >= pageSize);
  const [error, setError] = useState<string | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);

  const [viewMode, setViewMode] = useState<"grid" | "canvas">("grid");

  const observerTarget = useRef<HTMLDivElement>(null);

  const buildListUrl = useCallback(
    (offset: number) => {
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(offset),
      });

      if (activeFilter !== "all") {
        params.set("type", activeFilter);
      }

      if (debouncedSearch) {
        params.set("q", debouncedSearch);
      }

      return `/api/items/list?${params.toString()}`;
    },
    [activeFilter, debouncedSearch, pageSize]
  );

  const loadInitialItems = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      if (searchMode === "semantic" && debouncedSearch) {
        const semanticResponse = await fetch("/api/search/semantic", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: debouncedSearch,
            limit: pageSize,
          }),
          cache: "no-store",
        });

        if (!semanticResponse.ok) {
          throw new Error("Failed to load semantic results");
        }

        const payload = await semanticResponse.json() as { results?: Item[] };
        const semanticItems = Array.isArray(payload.results) ? payload.results : [];

        setItems(dedupeById(semanticItems));
        setHasMore(false);
        return;
      }

      const res = await fetch(buildListUrl(0), { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to load items");
      }

      const data = (await res.json()) as Item[];
      setItems(data);
      setHasMore(data.length === pageSize);
    } catch (err) {
      console.error(err);
      setError("Failed to load items. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  }, [buildListUrl, debouncedSearch, pageSize, searchMode]);

  const loadMoreItems = useCallback(async () => {
    if (searchMode === "semantic" || isLoadingMore || isRefreshing || !hasMore) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    try {
      const res = await fetch(buildListUrl(items.length), { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to load more items");
      }

      const data = (await res.json()) as Item[];
      setItems((prev) => dedupeById([...prev, ...data]));
      setHasMore(data.length === pageSize);
    } catch (err) {
      console.error(err);
      setError("Failed to load more items.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [buildListUrl, hasMore, isLoadingMore, isRefreshing, items.length, pageSize, searchMode]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    void loadInitialItems();
  }, [loadInitialItems]);

  useEffect(() => {
    if (viewMode !== "grid" || searchMode === "semantic") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          void loadMoreItems();
        }
      },
      { threshold: 0.6 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, loadMoreItems, searchMode, viewMode]);

  const handlePaste = useCallback((text: string) => {
    const persistPastedContent = async () => {
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }

      const isUrl = /^https?:\/\//i.test(trimmed);

      try {
        setError(null);

        const res = await fetch('/api/items/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: isUrl ? trimmed : trimmed.slice(0, 80),
            description: isUrl ? undefined : trimmed.slice(0, 280),
            content: isUrl ? undefined : trimmed,
            type: isUrl ? undefined : 'note',
            sourceUrl: isUrl ? trimmed : undefined,
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to save pasted content');
        }

        const createdItem = (await res.json()) as Item;
        if (matchesCurrentQuery(createdItem, activeFilter, debouncedSearch)) {
          setItems((prev) => dedupeById([createdItem, ...prev]));
        } else {
          await loadInitialItems();
        }
      } catch (err) {
        console.error(err);
        setError('Failed to save pasted content.');
      }
    };

    void persistPastedContent();
  }, [activeFilter, debouncedSearch, loadInitialItems]);

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

  const handleExpand = (item: Item) => {
    router.push(`/items/${item.id}`);
  };

  const handleEdit = (item: Item) => {
    router.push(`/items/${item.id}/edit`);
  };

  const handleDelete = async (item: Item) => {
    try {
      setError(null);
      const res = await fetch(`/api/items/${item.id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete item');
      }

      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      console.error(err);
      setError('Failed to delete item.');
    }
  };

  const handleCanvas = (item: Item) => {
    router.push(`/canvas?focus=${item.id}`);
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
          {FILTER_TYPES.map((type) => (
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
              placeholder={searchMode === "semantic" ? "Semantic search in your mind..." : "Search in grid..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-zinc-200 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              aria-label="Search items"
            />
            {isRefreshing && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 animate-spin" size={14} />
            )}
          </div>
          <button
            className={`px-3 py-2 rounded-full border text-xs font-semibold uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              searchMode === "semantic"
                ? "border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-500/50 dark:bg-blue-900/30 dark:text-blue-200"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
            onClick={() => setSearchMode((prev) => (prev === "keyword" ? "semantic" : "keyword"))}
            aria-label="Toggle semantic search"
            title="Toggle semantic search"
          >
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={14} aria-hidden="true" />
              {searchMode === "semantic" ? "Semantic" : "Keyword"}
            </span>
          </button>
          <button
            className={`p-2 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              showAssistant
                ? "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-600/60 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
            onClick={() => setShowAssistant((prev) => !prev)}
            aria-label="Toggle AI assistant"
            title="Toggle AI assistant"
          >
            <Bot size={18} aria-hidden="true" />
          </button>
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
          <InfiniteCanvas items={items} />
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}

            {isRefreshing && items.length === 0 && (
              <div className="flex h-56 items-center justify-center">
                <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" aria-label="Loading items" />
              </div>
            )}

            {!isRefreshing && (
              <MasonryGrid
                items={items}
                onExpand={handleExpand}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCanvas={handleCanvas}
                onPaste={handlePaste}
              />
            )}

            {searchMode !== 'semantic' && hasMore && items.length > 0 && (
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

            {!isRefreshing && items.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                <div className="w-16 h-16 mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Search size={24} className="text-zinc-400" aria-hidden="true" />
                </div>
                <p className="font-medium text-lg">No items found</p>
                <p className="text-sm">
                  {searchMode === 'semantic'
                    ? 'Try a broader semantic query or switch back to keyword search.'
                    : 'Try adjusting your filters or search query.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {showAssistant && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-1.5rem)]">
          <AIChat />
        </div>
      )}
    </div>
  );
}
