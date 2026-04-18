/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const files = {
  "app/api/canvas/save/route.ts": `import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function POST(req: Request) {
  try {
    const { nodes } = await req.json();
    
    if (!Array.isArray(nodes)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Save canvas positions in item metadata
    await db.$transaction(
      nodes.map((node: any) =>
        db.itemMetadata.upsert({
          where: { itemId: node.id },
          create: {
            itemId: node.id,
            customData: { canvasPosition: { x: node.x, y: node.y } }
          },
          update: {
            customData: { canvasPosition: { x: node.x, y: node.y } }
          }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Canvas save error:', error);
    return NextResponse.json({ error: 'Failed to save canvas layout' }, { status: 500 });
  }
}
`,

  "app/api/collections/create/route.ts": `import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function POST(req: Request) {
  try {
    const { name, description, isAuto } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const collection = await db.collection.create({
      data: {
        name,
        description,
        isAuto: isAuto || false,
      },
    });

    return NextResponse.json(collection);
  } catch (error: any) {
    console.error('Collection create error:', error);
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
}
`,

  "app/api/collections/list/route.ts": `import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function GET() {
  try {
    const collections = await db.collection.findMany({
      orderBy: { id: 'desc' },
      include: {
        _count: {
          select: { items: true }
        }
      }
    });

    return NextResponse.json(collections);
  } catch (error: any) {
    console.error('Collection list error:', error);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}
`,

  "app/api/items/create/route.ts": `import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, content, type, sourceUrl } = body;

    if (!title || !type) {
      return NextResponse.json({ error: 'Title and type are required' }, { status: 400 });
    }

    const item = await db.item.create({
      data: {
        title,
        description,
        content,
        type,
        metadata: sourceUrl ? {
          create: { sourceUrl }
        } : undefined,
      },
    });

    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Item create error:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
`,

  "app/api/items/delete/route.ts": `import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function POST(req: Request) {
  try {
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Valid IDs array required' }, { status: 400 });
    }

    await db.item.deleteMany({
      where: {
        id: { in: ids }
      }
    });

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error: any) {
    console.error('Items bulk delete error:', error);
    return NextResponse.json({ error: 'Failed to delete items' }, { status: 500 });
  }
}
`,

  "app/api/items/[id]/route.ts": `import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const item = await db.item.findUnique({
      where: { id: resolvedParams.id },
      include: {
        tags: true,
        collections: true,
        metadata: true,
        sourceLinks: { include: { targetItem: true } },
        targetLinks: { include: { sourceItem: true } },
      }
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Get item error:', error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    await db.item.delete({
      where: { id: resolvedParams.id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete item error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
`,

  "app/api/items/[id]/update/route.ts": `import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const { title, description, content, type } = body;

    const item = await db.item.update({
      where: { id: resolvedParams.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(content && { content }),
        ...(type && { type }),
      },
      include: {
        tags: true,
        collections: true,
        metadata: true,
      }
    });

    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Update item error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}
`,

  "app/api/tags/list/route.ts": `import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function GET() {
  try {
    const tags = await db.tag.findMany({
      orderBy: { count: 'desc' }
    });

    return NextResponse.json(tags);
  } catch (error: any) {
    console.error('List tags error:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}
`,

  "app/canvas/page.tsx": `"use client";

import React, { useState, useEffect } from 'react';
import Canvas from '@/app/components/Canvas';
import CanvasToolbar from '@/app/components/CanvasToolbar';

export default function CanvasPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadItems() {
      try {
        const res = await fetch('/api/items/list'); // Assuming this exists or falls back
        if (res.ok) {
          const data = await res.json();
          setItems(data);
        }
      } catch (e) {
        console.error("Failed to load items", e);
      } finally {
        setLoading(false);
      }
    }
    loadItems();
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading canvas...</div>;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      <CanvasToolbar />
      <div className="w-full h-full relative">
        <Canvas initialItems={items} />
      </div>
    </div>
  );
}
`,

  "app/collections/[id]/page.tsx": `"use client";

import React, { useEffect, useState, use } from 'react';
import MasonryGrid from '@/app/components/MasonryGrid';

export default function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [collection, setCollection] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCollection() {
      try {
        const res = await fetch(\`/api/collections/\${resolvedParams.id}\`);
        if (res.ok) {
          const data = await res.json();
          setCollection(data);
        }
      } catch (err) {
        console.error('Error fetching collection', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCollection();
  }, [resolvedParams.id]);

  if (loading) return <div className="p-8">Loading collection...</div>;
  if (!collection) return <div className="p-8">Collection not found.</div>;

  return (
    <div className="p-8">
      <h1 className="text-4xl font-playfair mb-4">{collection.name}</h1>
      {collection.description && <p className="mb-8 text-muted-foreground">{collection.description}</p>}
      
      <div className="mt-8">
        <MasonryGrid items={collection.items || []} />
      </div>
    </div>
  );
}
`,

  "app/components/Canvas.tsx": `"use client";

import React, { useState, useRef } from 'react';
import CanvasNode from '@/app/components/CanvasNode';

interface CanvasProps {
  initialItems: any[];
}

export default function Canvas({ initialItems }: CanvasProps) {
  const [items, setItems] = useState(initialItems);
  const [isPanning, setIsPanning] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const newZoom = Math.min(Math.max(0.1, zoom - e.deltaY * zoomSensitivity), 3);
      setZoom(newZoom);
    } else {
      setPan({ x: pan.x - e.deltaX, y: pan.y - e.deltaY });
    }
  };

  const handleSave = async () => {
    try {
      await fetch('/api/canvas/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: items }),
      });
    } catch (err) {
      console.error('Failed to save canvas state', err);
    }
  };

  const updateNodePosition = (id: string, x: number, y: number) => {
    setItems(items.map(item => item.id === id ? { ...item, x, y } : item));
  };

  return (
    <div 
      className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing bg-dot-pattern"
      ref={canvasRef}
      onWheel={handleWheel}
      onPointerDown={() => setIsPanning(true)}
      onPointerUp={() => { setIsPanning(false); handleSave(); }}
      onPointerLeave={() => setIsPanning(false)}
      onPointerMove={(e) => {
        if (isPanning) {
          setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
        }
      }}
    >
      <div 
        className="absolute origin-top-left transition-transform duration-75 ease-out"
        style={{ transform: \`translate(\${pan.x}px, \${pan.y}px) scale(\${zoom})\` }}
      >
        {items.map(item => (
          <CanvasNode 
            key={item.id} 
            item={item} 
            onChangePosition={(x, y) => updateNodePosition(item.id, x, y)} 
            onMouseUp={handleSave}
          />
        ))}
      </div>
    </div>
  );
}
`,

  "app/components/CanvasNode.tsx": `"use client";

import React, { useState } from 'react';
import ItemCard from '@/app/components/ItemCard';

interface CanvasNodeProps {
  item: any;
  onChangePosition: (x: number, y: number) => void;
  onMouseUp?: () => void;
}

export default function CanvasNode({ item, onChangePosition, onMouseUp }: CanvasNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const metadata = item.metadata?.customData || {};
  const initialPos = metadata.canvasPosition || { x: Math.random() * 500, y: Math.random() * 500 };
  
  const [pos, setPos] = useState({ x: item.x ?? initialPos.x, y: item.y ?? initialPos.y });

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      e.stopPropagation();
      const newX = pos.x + e.movementX;
      const newY = pos.y + e.movementY;
      setPos({ x: newX, y: newY });
      onChangePosition(newX, newY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    if (onMouseUp) onMouseUp();
  };

  return (
    <div 
      className="absolute cursor-move shadow-lg rounded-xl transition-shadow hover:shadow-xl"
      style={{ transform: \`translate(\${pos.x}px, \${pos.y}px)\` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="pointer-events-none">
        <ItemCard item={item} />
      </div>
    </div>
  );
}
`,

  "app/components/CanvasToolbar.tsx": `"use client";

import React from 'react';
import { ZoomIn, ZoomOut, Save, MousePointer2, Hand } from 'lucide-react';

export default function CanvasToolbar() {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-background/80 backdrop-blur-md border rounded-full px-4 py-2 shadow-sm">
      <button className="p-2 hover:bg-muted rounded-full transition-colors" title="Select Tool">
        <MousePointer2 className="w-5 h-5" />
      </button>
      <button className="p-2 hover:bg-muted rounded-full transition-colors" title="Pan Tool">
        <Hand className="w-5 h-5" />
      </button>
      <div className="w-px h-6 bg-border mx-2" />
      <button className="p-2 hover:bg-muted rounded-full transition-colors" title="Zoom In">
        <ZoomIn className="w-5 h-5" />
      </button>
      <button className="p-2 hover:bg-muted rounded-full transition-colors" title="Zoom Out">
        <ZoomOut className="w-5 h-5" />
      </button>
      <div className="w-px h-6 bg-border mx-2" />
      <button className="p-2 hover:bg-muted rounded-full transition-colors text-primary" title="Save Layout">
        <Save className="w-5 h-5" />
      </button>
    </div>
  );
}
`,

  "app/components/ThemeToggle.tsx": `"use client";

import React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-full border bg-background hover:bg-muted transition-colors flex items-center justify-center"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
`,

  "app/graph/page.tsx": `"use client";

import React, { useEffect, useState } from 'react';
import KnowledgeGraph from '@/app/components/KnowledgeGraph';

export default function GraphPage() {
  const [data, setData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGraphData() {
      try {
        const res = await fetch('/api/items/list');
        if (res.ok) {
          const items = await res.json();
          const nodes = items.map((item: any) => ({
            id: item.id,
            label: item.title,
            group: item.type
          }));
          
          const edges: any[] = [];
          items.forEach((item: any) => {
            if (item.sourceLinks) {
              item.sourceLinks.forEach((link: any) => {
                edges.push({
                  from: link.sourceItemId,
                  to: link.targetItemId,
                  label: link.description || ''
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
        <KnowledgeGraph data={data} />
      </div>
    </div>
  );
}
`
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(process.cwd(), filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}
console.log('Done rewriting files.');
