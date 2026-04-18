"use client";

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from "lucide-react";
import { extractImageColors, imageColorsQueryKey, type ImageColorData } from '@/app/lib/client-api';

export function ImageAnalysis({ imageUrl }: { imageUrl: string }) {
  const {
    data: colors = [],
    isLoading,
    isError,
    error,
  } = useQuery<ImageColorData[], Error>({
    queryKey: imageColorsQueryKey(imageUrl),
    queryFn: ({ signal }) => extractImageColors(imageUrl, signal),
    enabled: Boolean(imageUrl),
    staleTime: 5 * 60 * 1000,
  });

  if (!imageUrl) return null;

  if (isLoading) return <div className="flex items-center gap-2 text-sm text-zinc-500"><Loader2 className="w-4 h-4 animate-spin" /> Analyzing image...</div>;

  if (isError) {
    return <div className="text-sm text-red-600 dark:text-red-300">{error.message}</div>;
  }

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
