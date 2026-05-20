"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import MasonryGrid from "./MasonryGrid";
import type { ItemCardItem } from "./ItemCard";
import { Search, LayoutTemplate, Loader2, Bot, Brain } from "lucide-react";
import InfiniteCanvas from "./InfiniteCanvas";
import { AIChat } from "./AIChat";
import { ItemQuickAIPanel } from "./ItemQuickAIPanel";
import ItemViewDialog from "./ItemViewDialog";
import ThemeToggle from "./ThemeToggle";
import { createItem, deleteItem, listItems, type CreateItemPayload } from "@/app/lib/api-client/items";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type Item = ItemCardItem;
type ItemPages = InfiniteData<Item[], number>;

interface GridLayoutProps {
  initialItems: Item[];
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 24;

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
    queryKey: ['items', debouncedSearch],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0, signal }) => {
      return listItems({
        limit: pageSize,
        offset: Number(pageParam),
        q: debouncedSearch || undefined,
        signal,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) return undefined;
      return allPages.reduce((acc, page) => acc + page.length, 0);
    },
    initialData: () => {
      if (!debouncedSearch) {
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
      queryClient.setQueryData<ItemPages>(['items', debouncedSearch], (old) => {
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
    if (viewMode !== "grid") return;
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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, viewMode]);

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
      queryClient.setQueryData<ItemPages>(['items', debouncedSearch], (old) => {
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
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Top Header / floating capsule */}
      <div className="sticky top-6 z-40 mx-auto w-[calc(100%-2rem)] max-w-5xl">
        <div className="glass-panel px-6 py-3 flex items-center justify-between gap-4 rounded-full shadow-lg border border-white/20 dark:border-white/5 bg-white/30 dark:bg-zinc-900/30 backdrop-blur-xl">
          
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0 select-none cursor-pointer" onClick={() => router.push("/")}>
            <div className="p-1.5 rounded-full bg-primary/10 text-primary dark:text-primary-foreground border border-primary/20">
              <Brain size={15} />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground font-heading">mind</span>
          </div>

          {/* Search bar inside header */}
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors duration-150" size={13} />
            <input
              type="text"
              placeholder="Search your mind..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 rounded-full border border-foreground/5 bg-foreground/[0.02] focus:bg-background/80 focus:border-primary/30 focus:ring-1 focus:ring-primary/20 focus:outline-none text-xs font-medium placeholder:text-muted-foreground transition-all duration-200"
              aria-label="Search items"
            />
            {(isLoading || isFetchingNextPage) && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" size={12} />
            )}
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={`p-2 rounded-full transition-all duration-150 active-sink ${
                    showAssistant
                      ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  }`}
                  onClick={() => setShowAssistant((prev) => !prev)}
                  aria-label="Toggle AI assistant"
                >
                  <Bot size={15} aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent>AI Assistant</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className={`p-2 rounded-full transition-all duration-150 active-sink ${
                    viewMode === 'canvas' 
                      ? 'bg-primary text-primary-foreground shadow-sm font-semibold' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                  }`}
                  onClick={() => setViewMode(viewMode === 'grid' ? 'canvas' : 'grid')}
                  aria-label="Toggle canvas view"
                >
                  <LayoutTemplate size={15} aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Canvas View</TooltipContent>
            </Tooltip>

            <div className="h-4 w-px bg-foreground/10 mx-1" />

            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className={viewMode === 'canvas' ? "flex-1 overflow-hidden" : "flex-1 p-8 pt-16 max-w-7xl mx-auto w-full"} role="region" aria-label={viewMode === 'canvas' ? "Canvas Area" : "Items Grid"}>
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
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50/50 px-4 py-3 text-sm text-red-700 backdrop-blur-md dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">
                {displayError}
              </div>
            )}

            {isLoading && items.length === 0 && (
              <div className="flex h-64 items-center justify-center">
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
                isPasting={addPastedItemMutation.isPending}
              />
            )}

            {hasNextPage && items.length > 0 && (
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
              <div className="flex flex-col items-center justify-center h-84 text-zinc-500">
                <div className="w-16 h-16 mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800/40 flex items-center justify-center border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm">
                  <Search size={24} className="text-zinc-400" aria-hidden="true" />
                </div>
                <p className="font-semibold text-lg text-foreground font-heading">No items found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your search query or paste content to add new notes.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {showAssistant && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
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
        onDelete={(item) => {
          if (confirm("Are you sure you want to delete this item?")) {
            deleteMutation.mutate(item.id);
            setExpandedItem(null);
          }
        }}
      />
    </div>
  );
}
