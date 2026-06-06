"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import MasonryGrid from "./MasonryGrid";
import type { ItemCardItem } from "./ItemCard";
import { Search, LayoutTemplate, Loader2, Bot, Brain, Layers, Settings, Check, Plus, Trash2, Edit2, X, Sliders, Keyboard, Trash } from "lucide-react";
import InfiniteCanvas from "./InfiniteCanvas";
import { AIChat } from "./AIChat";
import { ItemQuickAIPanel } from "./ItemQuickAIPanel";
import ItemViewDialog from "./ItemViewDialog";
import AddThoughtDialog from "./AddThoughtDialog";
import ThemeToggle from "./ThemeToggle";
import { createItem, deleteItem, listItems, type CreateItemPayload } from "@/app/lib/api-client/items";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { listCollections, createCollection, deleteCollection, type CollectionListItem } from "@/app/lib/api-client/collections";
import { useTheme } from "next-themes";

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
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Sessions and Settings States
  const [activeSession, setActiveSession] = useState<CollectionListItem | null>(null);
  const [showSessionsDropdown, setShowSessionsDropdown] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"general" | "sessions" | "shortcuts" | "danger">("general");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedSession = localStorage.getItem("mind_active_session");
      if (savedSession) {
        try {
          setActiveSession(JSON.parse(savedSession));
        } catch (e) {
          console.error("Failed to parse active session from localStorage", e);
        }
      }
    }
  }, []);

  const changeSession = (session: CollectionListItem | null) => {
    setActiveSession(session);
    if (typeof window !== 'undefined') {
      if (session) {
        localStorage.setItem("mind_active_session", JSON.stringify(session));
      } else {
        localStorage.removeItem("mind_active_session");
      }
    }
    setShowSessionsDropdown(false);
  };

  const { data: collections = [], refetch: refetchCollections } = useQuery<CollectionListItem[]>({
    queryKey: ['collections'],
    queryFn: ({ signal }) => listCollections(signal),
  });

  const sessionCollections = collections.filter(c => c.name.startsWith("Session:"));

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
    queryKey: ['items', debouncedSearch, activeSession?.id],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0, signal }) => {
      return listItems({
        limit: pageSize,
        offset: Number(pageParam),
        collectionId: activeSession?.id || undefined,
        q: debouncedSearch || undefined,
        signal,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) return undefined;
      return allPages.reduce((acc, page) => acc + page.length, 0);
    },
    initialData: () => {
      if (!debouncedSearch && !activeSession) {
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
        collectionId: activeSession?.id || undefined,
      };
  const addItemMutation = useMutation({
    mutationFn: async (payload: CreateItemPayload) => {
      return createItem(payload);
    },
    onSuccess: (newItem) => {
      queryClient.setQueryData<ItemPages>(['items', debouncedSearch, activeSession?.id], (old) => {
        if (!old) return old;

        const firstPage = old.pages[0] ?? [];
        const newPages = [[newItem, ...firstPage], ...old.pages.slice(1)];
        return { ...old, pages: newPages };
      });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
    onError: () => {
      setError("Failed to save content.");
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
    if (trimmed) {
      const isUrl = /^https?:\/\//i.test(trimmed);
      addItemMutation.mutate({
        title: isUrl ? trimmed : trimmed.slice(0, 80),
        description: isUrl ? undefined : trimmed.slice(0, 280),
        content: isUrl ? undefined : trimmed,
        type: isUrl ? undefined : 'note',
        sourceUrl: isUrl ? trimmed : undefined,
      });
    }
  }, [addItemMutation]);

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
      queryClient.setQueryData<ItemPages>(['items', debouncedSearch, activeSession?.id], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: Item[]) => page.filter(item => item.id !== id))
        };
      });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    }
  });

  // Sessions and Settings Mutations
  const createSessionMutation = useMutation({
    mutationFn: async (name: string) => {
      return createCollection("Session:" + name);
    },
    onSuccess: (newCol) => {
      refetchCollections();
      changeSession(newCol);
      setNewSessionName("");
    },
    onError: () => {
      setError("Failed to create session.");
    }
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteCollection(id);
    },
    onSuccess: (_, id) => {
      refetchCollections();
      if (activeSession?.id === id) {
        changeSession(null);
      }
    },
    onError: () => {
      setError("Failed to delete session.");
    }
  });

  const resetAllMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/reset", { method: "POST" });
      if (!res.ok) throw new Error("Reset failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      changeSession(null);
      setShowSettingsModal(false);
      window.location.reload();
    },
    onError: () => {
      setError("Failed to reset database.");
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
              placeholder={activeSession ? `Search ${activeSession.name.replace(/^Session:/, "")}...` : "Search your mind..."}
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
          <div className="flex items-center gap-1.5 relative shrink-0">
            {/* Sessions Selector */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={`p-2 rounded-full transition-all duration-150 active-sink ${
                    activeSession
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  }`}
                  onClick={() => {
                    setShowSessionsDropdown((prev) => !prev);
                    setShowSettingsModal(false);
                  }}
                  aria-label="Toggle sessions menu"
                >
                  <Layers size={15} aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {activeSession ? `Session: ${activeSession.name.replace(/^Session:/, "")}` : "Main Mind"}
              </TooltipContent>
            </Tooltip>

            {/* Sessions Dropdown Menu */}
            <AnimatePresence>
              {showSessionsDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-2xl z-50 ring-1 ring-black/5 dark:ring-white/5 font-sans"
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Sessions</span>
                    <button
                      onClick={() => setShowSessionsDropdown(false)}
                      className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>

                  <div className="space-y-1 max-h-56 overflow-y-auto scrollbar-thin py-0.5">
                    {/* Default Main Mind */}
                    <button
                      onClick={() => changeSession(null)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-colors ${
                        activeSession === null
                          ? "bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-sm"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium"
                      }`}
                    >
                      <span>Main Mind</span>
                      {activeSession === null && <Check size={13} />}
                    </button>

                    {/* Custom Sessions */}
                    {sessionCollections.map((col) => {
                      const cleanName = col.name.replace(/^Session:/, "");
                      return (
                        <div
                          key={col.id}
                          className="group/session flex items-center justify-between w-full rounded-xl text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors relative"
                        >
                          <button
                            onClick={() => changeSession(col)}
                            className={`flex-1 text-left px-3 py-2.5 rounded-xl text-xs transition-colors truncate pr-8 ${
                              activeSession?.id === col.id
                                ? "text-amber-600 dark:text-amber-400 font-bold"
                                : "text-zinc-700 dark:text-zinc-300 font-medium"
                            }`}
                          >
                            <span>{cleanName}</span>
                          </button>
                          
                          {activeSession?.id === col.id && (
                            <Check size={13} className="absolute right-9 text-amber-500 pointer-events-none" />
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Are you sure you want to delete session "${cleanName}"?`)) {
                                deleteSessionMutation.mutate(col.id);
                              }
                            }}
                            className="opacity-0 group-hover/session:opacity-100 p-1.5 mr-1.5 rounded-lg hover:bg-rose-500/15 hover:text-rose-500 text-zinc-400 transition-all active:scale-95"
                            title="Delete session"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}

                    {sessionCollections.length === 0 && (
                      <div className="text-xs text-center text-zinc-400 dark:text-zinc-500 py-4 italic">
                        No custom sessions yet.
                      </div>
                    )}
                  </div>

                  {/* Create New Session input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newSessionName.trim()) {
                        createSessionMutation.mutate(newSessionName.trim());
                      }
                    }}
                    className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex gap-1.5"
                  >
                    <input
                      type="text"
                      placeholder="Create new session..."
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs text-foreground placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!newSessionName.trim() || createSessionMutation.isPending}
                      className="px-3 rounded-xl bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 flex items-center justify-center font-medium text-xs"
                    >
                      {createSessionMutation.isPending ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Plus size={13} />
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Settings Trigger */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={`p-2 rounded-full transition-all duration-150 active-sink ${
                    showSettingsModal
                      ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  }`}
                  onClick={() => {
                    setShowSettingsModal(true);
                    setShowSessionsDropdown(false);
                  }}
                  aria-label="Open settings"
                >
                  <Settings size={15} aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>

            {/* Divider */}
            <div className="h-4 w-px bg-foreground/10 mx-0.5" />

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

            <div className="h-4 w-px bg-foreground/10 mx-0.5" />

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
                isPasting={addItemMutation.isPending}
                onAddClick={() => setIsAddOpen(true)}
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
          <AIChat activeSessionId={activeSession?.id} />
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

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettingsModal(false)}
              className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md"
            />

            {/* Dialog Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 26 }}
              className="relative w-full max-w-2xl h-[480px] rounded-3xl glass-panel shadow-2xl border border-white/20 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-3xl overflow-hidden flex"
            >
              {/* Sidebar Tabs */}
              <div className="w-48 bg-zinc-50/50 dark:bg-zinc-900/30 border-r border-zinc-100 dark:border-zinc-800/60 p-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="p-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                      <Brain size={14} />
                    </div>
                    <span className="font-heading font-bold text-sm tracking-tight">mind Settings</span>
                  </div>

                  <div className="space-y-1.5">
                    <button
                      onClick={() => setSettingsTab("general")}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-2 ${
                        settingsTab === "general"
                          ? "bg-foreground/5 font-semibold text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-foreground/2"
                      }`}
                    >
                      <Sliders size={13} />
                      <span>Appearance</span>
                    </button>
                    <button
                      onClick={() => setSettingsTab("sessions")}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-2 ${
                        settingsTab === "sessions"
                          ? "bg-foreground/5 font-semibold text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-foreground/2"
                      }`}
                    >
                      <Layers size={13} />
                      <span>Session Manager</span>
                    </button>
                    <button
                      onClick={() => setSettingsTab("shortcuts")}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-2 ${
                        settingsTab === "shortcuts"
                          ? "bg-foreground/5 font-semibold text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-foreground/2"
                      }`}
                    >
                      <Keyboard size={13} />
                      <span>Shortcuts</span>
                    </button>
                    <button
                      onClick={() => setSettingsTab("danger")}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-2 ${
                        settingsTab === "danger"
                          ? "bg-rose-500/10 text-rose-500 font-semibold"
                          : "text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5"
                      }`}
                    >
                      <Trash size={13} />
                      <span>Danger Zone</span>
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-zinc-400 font-mono">
                  v1.2.0
                </div>
              </div>

              {/* Content Panel */}
              <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto scrollbar-hide">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold capitalize font-heading text-foreground">
                      {settingsTab === "general" && "Appearance & Theme"}
                      {settingsTab === "sessions" && "Session Dashboard"}
                      {settingsTab === "shortcuts" && "Keyboard Cheatsheet"}
                      {settingsTab === "danger" && "System Administration"}
                    </h3>
                    <button
                      onClick={() => setShowSettingsModal(false)}
                      className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-foreground/5 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {settingsTab === "general" && (
                      <motion.div
                        key="general"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-5"
                      >
                        {/* Theme option */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-zinc-500">Color Mode</label>
                          <div className="grid grid-cols-3 gap-2">
                            {["light", "dark", "system"].map((m) => (
                              <button
                                key={m}
                                onClick={() => setTheme(m)}
                                className={`px-4 py-3 rounded-xl border text-xs font-medium capitalize transition-all ${
                                  theme === m
                                    ? "bg-primary/10 border-primary text-primary font-semibold"
                                    : "border-foreground/5 hover:bg-foreground/2 text-muted-foreground"
                                }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Visual Blur Indicator */}
                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-foreground/5">
                          <h4 className="text-xs font-semibold text-foreground mb-1">Glassmorphic Blur</h4>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            The interface is styled with premium glassmorphism. Blur levels adapt dynamically to background content and screen responsiveness.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {settingsTab === "sessions" && (
                      <motion.div
                        key="sessions"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-4"
                      >
                        <div className="border border-foreground/5 rounded-2xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-64 overflow-y-auto scrollbar-thin">
                          {sessionCollections.map((col) => {
                            const cleanName = col.name.replace(/^Session:/, "");
                            return (
                              <div key={col.id} className="flex items-center justify-between p-3 bg-zinc-50/20 dark:bg-zinc-900/10">
                                <div>
                                  <div className="text-xs font-semibold text-foreground">{cleanName}</div>
                                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">ID: {col.id.slice(0, 8)}...</div>
                                </div>
                                <button
                                  onClick={() => {
                                    if (confirm(`Delete session "${cleanName}" and unlink all its thoughts?`)) {
                                      deleteSessionMutation.mutate(col.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                                  title="Delete Session"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            );
                          })}

                          {sessionCollections.length === 0 && (
                            <div className="p-6 text-center text-xs text-zinc-400 italic">
                              No custom sessions created yet. Create one from the session menu in the top bar!
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {settingsTab === "shortcuts" && (
                      <motion.div
                        key="shortcuts"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="grid grid-cols-2 gap-3"
                      >
                        {[
                          { key: "Ctrl + V", desc: "Paste instantly anywhere to add a thought" },
                          { key: "Enter", desc: "Press enter in search or thought input to save/submit" },
                          { key: "Esc", desc: "Close detail modals and menus instantly" },
                          { key: "Ctrl + click", desc: "Zoom or scale the visual canvas view" },
                        ].map((sh, idx) => (
                          <div key={idx} className="p-3 bg-zinc-50/60 dark:bg-zinc-900/20 border border-foreground/20 rounded-xl">
                            <kbd className="px-1.5 py-0.5 rounded border border-current text-[10px] font-bold font-mono text-primary bg-primary/5">{sh.key}</kbd>
                            <p className="text-[11px] text-muted-foreground mt-2">{sh.desc}</p>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {settingsTab === "danger" && (
                      <motion.div
                        key="danger"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-4"
                      >
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-700 dark:text-red-300 space-y-2">
                          <p className="font-semibold">Warning: This action is permanent!</p>
                          <p className="text-[11px] opacity-90 leading-relaxed">
                            Resetting the database will delete ALL items, tags, sessions, metadata, and canvas items. This action cannot be undone.
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            if (confirm("CRITICAL WARNING: Are you absolutely sure you want to RESET the entire database? All thoughts, bookmarks, media, and sessions will be deleted forever.")) {
                              resetAllMutation.mutate();
                            }
                          }}
                          disabled={resetAllMutation.isPending}
                          className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {resetAllMutation.isPending ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Resetting...</span>
                            </>
                          ) : (
                            <span>Reset Entire Database</span>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AddThoughtDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={async (payload) => {
          await addItemMutation.mutateAsync(payload);
        }}
      />
    </div>
  );
}
