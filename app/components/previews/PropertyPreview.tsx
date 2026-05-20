import React from 'react';
import { BedDouble, Bath, Square } from 'lucide-react';
import PreviewImage from './PreviewImage';

export default function PropertyPreview({
  title,
  price,
  imageUrl,
  beds,
  baths,
  sqft
}: {
  title: string,
  price?: string,
  imageUrl?: string,
  beds?: number,
  baths?: number,
  sqft?: number
}) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        {imageUrl ? (
          <PreviewImage src={imageUrl} alt={title} className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400">No Image</div>
        )}
        {price && (
          <div className="absolute bottom-3 left-3 bg-zinc-950/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg font-mono font-bold text-sm shadow-xl">
            {price}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-heading font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug mb-3 flex-1">{title}</h3>

        <div className="flex items-center gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800">
          {typeof beds === 'number' && (
            <div className="flex items-center gap-1.5">
              <BedDouble size={14} />
              <span>{beds}</span>
            </div>
          )}
          {typeof baths === 'number' && (
            <div className="flex items-center gap-1.5">
              <Bath size={14} />
              <span>{baths}</span>
            </div>
          )}
          {typeof sqft === 'number' && (
            <div className="flex items-center gap-1.5">
              <Square size={14} />
              <span>{sqft} sqft</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
