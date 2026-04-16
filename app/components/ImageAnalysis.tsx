"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ColorData {
  hex: string;
  name?: string;
}

export function ImageAnalysis({ imageUrl }: { imageUrl: string }) {
  const [colors, setColors] = useState<ColorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchColors = async () => {
      try {
        const res = await fetch("/api/items/extract-colors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl }),
        });
        const data = await res.json();
        if (data.colors) setColors(data.colors);
      } catch (e) {
        console.error("Color fetch failed", e);
      } finally {
        setLoading(false);
      }
    };
    if (imageUrl) fetchColors();
  }, [imageUrl]);

  if (loading) return <div className="flex items-center gap-2 text-sm text-zinc-500"><Loader2 className="w-4 h-4 animate-spin" /> Analyzing image...</div>;

  if (colors.length === 0) return null;

  return (
    <div className="mt-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <h3 className="text-sm font-semibold mb-2">Palette</h3>
      <div className="flex flex-wrap gap-2">
        {colors.map((c, i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800">
            <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-700" style={{ backgroundColor: c.hex }} />
            <span className="text-xs uppercase font-mono">{c.hex} {c.name ? `(${c.name})` : ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
