'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { KnowledgeGraphItem, KnowledgeGraphLink, GraphData, GraphNode } from '@/app/lib/types';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export function KnowledgeGraph({ items, links }: { items: KnowledgeGraphItem[], links: KnowledgeGraphLink[] }) {
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);

  useEffect(() => {
    const nodes = items.map(item => ({
      id: item.id,
      name: item.title,
      val: 2,
      color: item.type === 'note' ? '#E6D7F0' : '#FFB3D9'
    }));

    const graphLinks = links.map(link => ({
      source: link.sourceItemId,
      target: link.targetItemId
    }));

    setData({ nodes, links: graphLinks });
  }, [items, links]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (graphRef.current && node.x !== undefined && node.y !== undefined) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(8, 2000);
    }
  }, []);

  const getLinkColor = useCallback(() => 'rgba(0,0,0,0.2)', []);

  return (
    <div className="w-full h-full min-h-[600px] border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-[#FFF8DC]/20 relative">
      <ForceGraph2D
        ref={graphRef}
        graphData={data}
        nodeLabel="name"
        nodeColor="color"
        linkColor={getLinkColor}
        nodeRelSize={6}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        onNodeClick={handleNodeClick}
      />
    </div>
  );
}
