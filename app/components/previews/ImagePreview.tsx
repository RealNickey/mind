import React from 'react';

export default function ImagePreview({ url, alt, dimensions, colors }: { url: string, alt?: string, dimensions?: { w: number, h: number }, colors?: string[] }) {
  return (
    <div className="group relative rounded-xl overflow-hidden shadow-sm bg-gray-100 flex flex-col cursor-zoom-in">
      <img src={url} alt={alt || 'Image preview'} className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-in-out" />
      
      {colors && colors.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 p-1.5 bg-white/40 backdrop-blur-md rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
          {colors.slice(0, 5).map(color => (
            <div key={color} className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: color }} />
          ))}
        </div>
      )}
      
      {dimensions && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-mono rounded bg-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity">
          {dimensions.w} × {dimensions.h}
        </div>
      )}
    </div>
  );
}
