"use client";

import React, { useEffect, useState, useMemo } from "react";
import { KnowledgeGraph } from "@/app/components/KnowledgeGraph";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Database, Network, Search, Layers } from "lucide-react";

type GraphTag = string | { id?: string; name?: string | null };

type GraphNode = {
  id: string;
  title: string;
  type: string;
  url?: string | null;
  tags: GraphTag[];
  val: number;
  color: string;
};

type GraphEdge = {
  source: string;
  target: string;
  description: string;
};

type GraphApiLink = {
  sourceItemId?: string;
  targetItemId?: string;
  from?: string;
  to?: string;
  description?: string;
};

type GraphApiItem = {
  id: string;
  title: string;
  type?: string | null;
  sourceUrl?: string | null;
  tags?: GraphTag[];
  sourceLinks?: GraphApiLink[];
};

export default function GraphPage() {
  const [data, setData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadGraphData() {
      try {
        const res = await fetch("/api/items/list");
        if (res.ok) {
          const items = await res.json() as GraphApiItem[];
          const nodes: GraphNode[] = items.map((item) => ({
            id: item.id,
            title: item.title,
            type: item.type || "note",
            url: item.sourceUrl,
            tags: item.tags || [],
            val: Math.min(Math.max((item.tags?.length || 1) * 1.5, 2), 6),
            color: getTypeColor(item.type || "note")
          }));
          
          const edges: GraphEdge[] = [];
          items.forEach((item) => {
            if (item.sourceLinks) {
              item.sourceLinks.forEach((link) => {
                const source = link.sourceItemId || link.from || item.id;
                const target = link.targetItemId || link.to;

                if (!target) {
                  return;
                }

                edges.push({
                  source,
                  target,
                  description: link.description || ""
                });
              });
            }
          });

          setData({ nodes, edges });
        }
      } catch (err) {
        console.error("Failed to load graph data", err);
      } finally {
        setLoading(false);
      }
    }
    loadGraphData();
  }, []);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      note: "#9333ea",
      article: "#3b82f6",
      book: "#f59e0b",
      video: "#ef4444",
      image: "#10b981",
      tweet: "#0ea5e9",
      link: "#6366f1",
      default: "#8b5cf6"
    };
    return colors[type.toLowerCase()] || colors.default;
  };

  const filteredNodes = useMemo(() => {
    if (!searchQuery) return data.nodes;
    const lowerQuery = searchQuery.toLowerCase();
    return data.nodes.filter((node) => node.title.toLowerCase().includes(lowerQuery) || node.type.toLowerCase().includes(lowerQuery));
  }, [data.nodes, searchQuery]);

  const validNodeIds = new Set(filteredNodes.map((node) => node.id));
  const filteredEdges = data.edges.filter((edge) => validNodeIds.has(edge.source) && validNodeIds.has(edge.target));

  return (
    <div className="w-full h-screen flex flex-col relative bg-zinc-950 overflow-hidden font-sans text-zinc-100">
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute top-0 left-0 right-0 p-6 z-20 pointer-events-none flex justify-between items-start"
      >
        <div className="pointer-events-auto flex items-center gap-3 bg-zinc-900/60 backdrop-blur-xl p-3 px-5 rounded-2xl border border-white/10 shadow-2xl">
          <Network className="w-5 h-5 text-indigo-400" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-100">Neural Graph</h1>
            <p className="text-xs text-zinc-400">Deep spatial connections</p>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 bg-zinc-900/60 backdrop-blur-xl p-2 rounded-xl border border-white/10 shadow-2xl">
          <Search className="w-4 h-4 text-zinc-400 ml-2" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-zinc-100 w-48 placeholder:text-zinc-500"
          />
        </div>
      </motion.div>

      <div className="flex-1 relative z-0">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
              <p className="text-sm text-zinc-400 uppercase tracking-widest font-medium">Initializing Cosmos...</p>
            </div>
          </div>
        ) : (
          <KnowledgeGraph 
            nodes={filteredNodes} 
            links={filteredEdges} 
            onNodeClick={(node) => {
              const selected = filteredNodes.find((candidate) => candidate.id === node.id);
              if (selected) {
                setSelectedNode(selected);
              }
            }} 
          />
        )}
      </div>

      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 w-80 h-full p-6 z-30 pointer-events-none"
          >
            <Card className="h-full pointer-events-auto bg-zinc-900/80 backdrop-blur-3xl border-white/10 shadow-2xl flex flex-col overflow-hidden custom-scrollbar">
              <CardHeader className="border-b border-white/5 pb-4 space-y-4">
                <div className="flex justify-between items-start">
                  <Badge variant="secondary" className="bg-white/10 hover:bg-white/20 text-xs px-2 py-1 rounded-md text-zinc-300 capitalize border-none drop-shadow-sm">
                    {selectedNode.type}
                  </Badge>
                  <button 
                    onClick={() => setSelectedNode(null)}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-md"
                  >
                    ×
                  </button>
                </div>
                <CardTitle className="text-xl font-medium leading-tight text-zinc-100 mt-2">
                  {selectedNode.title || "Untitled Node"}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto py-6 space-y-6 text-sm text-zinc-400">
                <div className="space-y-2">
                  <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-2">
                    <Database className="w-3 h-3" /> Node Metadata
                  </h4>
                  <p><strong>ID:</strong> <span className="font-mono text-xs">{selectedNode.id}</span></p>
                  {selectedNode.url && (
                    <a href={selectedNode.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors mt-2 p-2 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 w-fit">
                      <ExternalLink className="w-3 h-3" /> Visit Source URL
                    </a>
                  )}
                </div>

                {selectedNode.tags && selectedNode.tags.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-2">
                      <Layers className="w-3 h-3" /> Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedNode.tags.map((tag, idx) => {
                        const label = typeof tag === "string" ? tag : tag.name ?? "untagged";
                        return (
                        <span key={idx} className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/50 text-xs">
                          {label}
                        </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className="pt-6 border-t border-white/5 space-y-3">
                  <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Connections</h4>
                  <p className="text-xs leading-relaxed opacity-80">
                    This item has {data.edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length} direct connections within the graph map.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
