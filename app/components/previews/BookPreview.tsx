import React from 'react';

export default function BookPreview({ title, author, cover, identifier, rating }: { title: string, author: string, cover: string, identifier?: string, rating?: number }) {
  return (
    <div className="relative isolate p-6 bg-gradient-to-br from-[#e1d5c9] to-[#c7b7a3] rounded-xl overflow-hidden shadow-inner flex flex-col items-center justify-center">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
      
      {/* 3D Book Cover Effect */}
      <div className="relative z-10 w-32 md:w-40 aspect-[2/3] transform transition-transform duration-500 hover:rotate-2 hover:scale-105 shadow-[10px_10px_15px_rgba(0,0,0,0.3),-1px_-1px_2px_rgba(255,255,255,0.5)] bg-white rounded-r-md rounded-l-sm overflow-hidden flex-shrink-0">
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/20 to-transparent z-20 pointer-events-none" />
        <img src={cover} alt={title} className="w-full h-full object-cover" />
      </div>
      
      <div className="relative z-10 mt-6 text-center w-full">
        <h3 className="font-playfair text-xl font-bold text-gray-900 line-clamp-2 leading-tight drop-shadow-sm">{title}</h3>
        <p className="text-sm text-gray-700 mt-1 font-medium font-caveat text-xl">{author}</p>
        
        {rating && (
          <div className="mt-2 flex items-center justify-center gap-1 text-yellow-600 text-xs">
            {"★".repeat(Math.round(rating))}{"☆".repeat(5-Math.round(rating))}
          </div>
        )}
      </div>
    </div>
  );
}
