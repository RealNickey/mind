"use client";

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
