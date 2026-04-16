"use client";

import React, { useEffect, useState } from 'react';
import { KnowledgeGraph } from '@/app/components/KnowledgeGraph';

export default function GraphPage() {
  const [data, setData] = useState<any>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGraphData() {
      try {
        const res = await fetch('/api/items/list');
        if (res.ok) {
          const items = await res.json();
          const nodes = items.map((item: any) => ({
            id: item.id,
            title: item.title,
            type: item.type
          }));
          
          const edges: any[] = [];
          items.forEach((item: any) => {
            if (item.sourceLinks) {
              item.sourceLinks.forEach((link: any) => {
                edges.push({
                  sourceItemId: link.sourceItemId || link.from || item.id,
                  targetItemId: link.targetItemId || link.to,
                  description: link.description || ''
                });
              });
            }
          });

          setData({ nodes, edges });
        }
      } catch (err) {
        console.error('Failed to load graph data', err);
      } finally {
        setLoading(false);
      }
    }
    loadGraphData();
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading knowledge graph...</div>;
  }

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="p-4 border-b bg-background/80 backdrop-blur-sm z-10">
        <h1 className="text-2xl font-playfair">Knowledge Graph</h1>
        <p className="text-sm text-muted-foreground">Visualize connections between your items</p>
      </div>
      <div className="flex-1 relative bg-dot-pattern">
        <KnowledgeGraph items={data.nodes} links={data.edges} />
      </div>
    </div>
  );
}
