import { create } from 'zustand';

interface CanvasNodeItem {
  id: string;
  title?: string;
  [key: string]: unknown;
}

interface CanvasNodeDef {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  item: CanvasNodeItem;
}

interface CanvasState {
  nodes: Record<string, CanvasNodeDef>;
  zoom: number;
  pan: { x: number; y: number };
  selectedNodeIds: string[];
  isDraggingCanvas: boolean;
  setNodes: (nodes: CanvasNodeDef[]) => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setSelectedNodes: (ids: string[]) => void;
  setIsDraggingCanvas: (isDragging: boolean) => void;
  saveCanvasBackend: () => Promise<void>;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: {},
  zoom: 1,
  pan: { x: 0, y: 0 },
  selectedNodeIds: [],
  isDraggingCanvas: false,
  setNodes: (nodesArray) => {
    const newNodes: Record<string, CanvasNodeDef> = {};
    nodesArray.forEach(node => {
      newNodes[node.id] = node;
    });
    set({ nodes: newNodes });
  },
  updateNodePosition: (id, x, y) => set((state) => ({
    nodes: {
      ...state.nodes,
      [id]: { ...state.nodes[id], x, y }
    }
  })),
  setZoom: (zoom) => set({ zoom }),
  setPan: (pan) => set({ pan }),
  setSelectedNodes: (ids) => set({ selectedNodeIds: ids }),
  setIsDraggingCanvas: (isDragging) => set({ isDraggingCanvas: isDragging }),
  saveCanvasBackend: async () => {
    const { nodes } = get();
    const nodesToSave = Object.values(nodes).map((node) => ({ id: node.id, x: node.x, y: node.y }));
    try {
      await fetch('/api/canvas/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: nodesToSave })
      });
    } catch (e) {
      console.error('Failed to save canvas state', e);
    }
  }
}));
