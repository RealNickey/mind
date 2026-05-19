"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import MasonryGrid from "./MasonryGrid";
import type { ItemCardItem } from "./ItemCard";
import { Filter, Search, Tags, LayoutTemplate, Loader2, Sparkles, Bot, Brain } from "lucide-react";
import InfiniteCanvas from "./InfiniteCanvas";
import { AIChat } from "./AIChat";
import { ItemQuickAIPanel } from "./ItemQuickAIPanel";
import ItemViewDialog from "./ItemViewDialog";
import { fetchSemanticSearch } from "@/app/lib/semantic-search";
import { createItem, deleteItem, listItems, type CreateItemPayload } from "@/app/lib/api-client/items";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type Item = ItemCardItem;
type ItemPages = InfiniteData<Item[], number>;

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

export default function GridLayout({ initialItems, pageSize = DEFAULT_PAGE_SIZE }: GridLayoutProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchMode, setSearchMode] = useState<"keyword" | "semantic">("keyword");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);
  const [selectedAIItem, setSelectedAIItem] = useState<Item | null>(null);
  const [expandedItem, setExpandedItem] = useState<Item | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "canvas">("grid");

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error: itemsQueryError,
  } = useInfiniteQuery({
    queryKey: ['items', activeFilter, debouncedSearch, searchMode],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0, signal }) => {
      if (searchMode === "semantic" && debouncedSearch) {
        const payload = await fetchSemanticSearch<Item>({
          query: debouncedSearch,
          limit: pageSize,
          signal,
        });

        return payload.results;
      }

      return listItems({
        limit: pageSize,
        offset: Number(pageParam),
        type: activeFilter !== "all" ? activeFilter : undefined,
        q: debouncedSearch || undefined,
        signal,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      if (searchMode === "semantic" || lastPage.length < pageSize) return undefined;
      return allPages.reduce((acc, page) => acc + page.length, 0);
    },
    initialData: () => {
      if (activeFilter === "all" && !debouncedSearch && searchMode === "keyword") {
        return {
          pages: [initialItems],
          pageParams: [0],
        };
      }
      return undefined;
    },
  });

  const itemsErrorMessage = isError
    ? itemsQueryError instanceof Error
      ? itemsQueryError.message
      : "Failed to load items."
    : null;
  const displayError = error ?? itemsErrorMessage;

  const items = dedupeById(data?.pages.flat() || []);

  const addPastedItemMutation = useMutation({
    mutationFn: async (trimmed: string) => {
      const isUrl = /^https?:\/\//i.test(trimmed);
      const payload: CreateItemPayload = {
        title: isUrl ? trimmed : trimmed.slice(0, 80),
        description: isUrl ? undefined : trimmed.slice(0, 280),
        content: isUrl ? undefined : trimmed,
        type: isUrl ? undefined : 'note',
        sourceUrl: isUrl ? trimmed : undefined,
      };
      return createItem(payload);
    },
    onSuccess: (newItem) => {
      queryClient.setQueryData<ItemPages>(['items', activeFilter, debouncedSearch, searchMode], (old) => {
        if (!old) return old;

        const firstPage = old.pages[0] ?? [];
        const newPages = [[newItem, ...firstPage], ...old.pages.slice(1)];
        return { ...old, pages: newPages };
      });
    },
    onError: () => {
      setError("Failed to save pasted content.");
    }
  });

  useEffect(() => {
    if (viewMode !== "grid" || searchMode === "semantic") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { threshold: 0.6 }
    );
    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, searchMode, viewMode]);

  const handlePaste = useCallback((text: string) => {
    const trimmed = text.trim();
    if (trimmed) addPastedItemMutation.mutate(trimmed);
  }, [addPastedItemMutation]);

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      const text = e.clipboardData?.getData("text/plain");
      if (text) handlePaste(text);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener("paste", handleGlobalPaste);
      return () => window.removeEventListener("paste", handleGlobalPaste);
    }
  }, [handlePaste]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteItem(id);
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData<ItemPages>(['items', activeFilter, debouncedSearch, searchMode], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: Item[]) => page.filter(item => item.id !== id))
        };
      });
    }
  });

  const handleExpand = (item: Item) => setExpandedItem(item);
  const handleEdit = (item: Item) => router.push(`/items/${item.id}/edit`);
  const handleDelete = (item: Item) => {
    deleteMutation.mutate(item.id);
    setSelectedAIItem((prev) => (prev?.id === item.id ? null : prev));
  };

  const handleCanvas = (item: Item) => {
    router.push(`/canvas?focus=${item.id}`);
  };

  const handleInspectAI = (item: Item) => {
    setSelectedAIItem(item);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Header / Filter Bar */}
      <div className="sticky top-4 z-40 mx-auto w-[calc(100%-2rem)] max-w-7xl">
        <div className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-3xl border border-white/20 dark:border-zinc-800/30 px-5 py-3 flex items-center justify-between gap-6 rounded-2xl shadow-2xl shadow-black/5 dark:shadow-white/5 ring-1 ring-black/5 dark:ring-white/5">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="p-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100">
              <Brain size={14} className="text-zinc-100 dark:text-zinc-900" />
            </div>
            <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100 hidden sm:block font-heading">mind</span>
          </div>

          {/* Filter tabs */}
          <div 
            className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1 scrollbar-hide mask-fade-right"
            role="tablist"
            aria-label="Filter items by type"
          >
{FILTER_TYPES.map((type) => (
                <button
                  key={type}
                  role="tab"
                  aria-selected={activeFilter === type}
                  aria-label={`Filter by ${type}`}
                  onClick={() => setActiveFilter(type)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveFilter(type);
                    }
                  }}
                  className={`relative px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 ${
                    activeFilter === type
                      ? "text-white dark:text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  }`}
                >
                  {activeFilter === type && (
                    <motion.span
                      layoutId="filter-pill"
                      className="absolute inset-0 rounded-lg bg-zinc-900 dark:bg-zinc-100"
                      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                      style={{ zIndex: -1, transformOrigin: 'left center' }}
                    />
                  )}
                  <span className="relative z-10">{type}</span>
                </button>
              ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-48 sm:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-700 dark:group-focus-within:text-zinc-200 transition-colors duration-150" size={13} />
              <input
                type="text"
                placeholder={searchMode === "semantic" ? "Semantic search..." : "Search..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-lg border-none bg-zinc-100/70 dark:bg-zinc-800/70 focus:outline-none focus:ring-1 focus:ring-zinc-400/50 text-xs font-medium placeholder:text-zinc-400 transition-shadow duration-150"
                aria-label="Search items"
              />
              {(isLoading || isFetchingNextPage) && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 animate-spin" size={12} />
              )}
            </div>
            
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

            <div className="flex items-center gap-1 bg-zinc-100/50 dark:bg-zinc-800/50 p-1 rounded-lg">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`p-1.5 rounded-md transition-colors duration-150 focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 active:scale-[0.97] transition-transform ${
                      searchMode === "semantic"
                        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    }`}
                    onClick={() => setSearchMode((prev) => (prev === "keyword" ? "semantic" : "keyword"))}
                    aria-label="Toggle semantic search"
                  >
                    <Sparkles size={14} aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Toggle semantic search</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`p-1.5 rounded-md transition-colors duration-150 focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 active:scale-[0.97] transition-transform ${
                      showAssistant
                        ? "bg-emerald-50 text-emerald-600 shadow-sm dark:bg-zinc-700 dark:text-emerald-400"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    }`}
                    onClick={() => setShowAssistant((prev) => !prev)}
                    aria-label="Toggle AI assistant"
                  >
                    <Bot size={14} aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Toggle AI assistant</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className={`p-1.5 rounded-md transition-colors duration-150 focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 active:scale-[0.97] transition-transform ${
                      viewMode === 'canvas' ? 'bg-indigo-50 text-indigo-600 shadow-sm dark:bg-zinc-700 dark:text-indigo-400' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                    }`}
                    onClick={() => setViewMode(viewMode === 'grid' ? 'canvas' : 'grid')}
                    aria-label="Toggle canvas view"
                  >
                    <LayoutTemplate size={14} aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Toggle Canvas View</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors duration-150 focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 active:scale-[0.97] transition-transform"
                    aria-label="Filter items"
                  >
                    <Filter size={14} aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Advanced filters</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors duration-150 focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 active:scale-[0.97] transition-transform"
                    aria-label="View tags"
                  >
                    <Tags size={14} aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Filter by tags</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className={viewMode === 'canvas' ? "flex-1 overflow-hidden" : "flex-1 p-6 pt-12"} role="region" aria-label={viewMode === 'canvas' ? "Canvas Area" : "Items Grid"}>
        {viewMode === 'canvas' ? (
          <InfiniteCanvas
            items={items}
            onExpand={handleExpand}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCanvas={handleCanvas}
            onInspectAI={handleInspectAI}
          />
        ) : (
          <>
            {displayError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                {displayError}
              </div>
            )}

            {isLoading && items.length === 0 && (
              <div className="flex h-56 items-center justify-center">
                <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" aria-label="Loading items" />
              </div>
            )}

            {!isLoading && (
              <MasonryGrid
                items={items}
                onExpand={handleExpand}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCanvas={handleCanvas}
                onInspectAI={handleInspectAI}
                onPaste={handlePaste}
              />
            )}

            {searchMode !== 'semantic' && hasNextPage && items.length > 0 && (
              <div 
                ref={observerTarget} 
                className="w-full h-24 mt-4 flex items-center justify-center"
                aria-live="polite"
              >
                {isFetchingNextPage && (
                  <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" aria-label="Loading more items" />
                )}
              </div>
            )}

            {!isLoading && items.length === 0 && (
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
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-1.5rem)]"
          style={{ 
            overflow: 'hidden',
            overscrollBehavior: 'contain'
          }}
        >
          <AIChat />
        </motion.div>
      )}

      <ItemQuickAIPanel
        item={selectedAIItem}
        isOpen={Boolean(selectedAIItem)}
        onClose={() => setSelectedAIItem(null)}
      />

      <ItemViewDialog
        item={expandedItem}
        isOpen={Boolean(expandedItem)}
        onClose={() => setExpandedItem(null)}
      />
    </div>
  );
}
