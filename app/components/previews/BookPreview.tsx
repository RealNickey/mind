import React from 'react';
import PreviewImage from './PreviewImage';

export default function BookPreview({ title, author, cover, rating }: { title: string, author: string, cover: string, identifier?: string, rating?: number }) {
  return (
    <div className="relative isolate p-8 bg-[#e9e1d8] rounded-xl overflow-hidden shadow-inner flex flex-col items-center justify-center min-h-[320px] group perspective-[1000px]">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, #8a7a6b 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
      <div className="absolute inset-0 mix-blend-multiply opacity-10 bg-gradient-to-tr from-[#58412e] to-transparent pointer-events-none" />
      
      {/* 3D Book */}
      <div className="relative z-10 w-32 md:w-44 aspect-[2/3] transform-gpu transition-all duration-700 group-hover:rotate-y-12 group-hover:rotate-x-2 group-hover:-translate-y-2 shadow-[15px_15px_20px_rgba(0,0,0,0.3),_inset_-1px_-1px_1px_rgba(0,0,0,0.2)] bg-white rounded-r-md rounded-l-sm overflow-visible flex-shrink-0 before:content-[''] before:absolute before:-right-3 before:top-2 before:bottom-0 before:w-3 before:bg-[#f0eadd] before:transform-gpu before:origin-left before:rotate-y-90 before:skew-y-[-45deg] before:opacity-0 group-hover:before:opacity-100 before:transition-opacity before:duration-500 after:content-[''] after:absolute after:left-1 after:-bottom-2 after:right-0 after:h-2 after:bg-[#e0d6c8] after:transform-gpu after:origin-top after:-rotate-x-90 after:skew-x-[-45deg] after:opacity-0 group-hover:after:opacity-100 after:transition-opacity after:duration-500">
        
        {/* Book Spine Overlay Effect */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 via-white/10 to-transparent z-20 pointer-events-none rounded-l-sm shadow-[inset_1px_0_1px_rgba(255,255,255,0.3)]" />
        
        {/* Book Cover Gloss */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 z-20 pointer-events-none transition-opacity duration-700" />
        
        {/* Cover Image */}
        <PreviewImage
          src={cover}
          alt={title}
          fill
          sizes="(max-width: 768px) 128px, 176px"
          className="w-full h-full object-cover rounded-r-md rounded-l-sm"
        />
      </div>
      
      <div className="relative z-10 mt-6 text-center w-full px-2">
        <h3 className="font-playfair text-xl md:text-2xl font-bold text-gray-900 line-clamp-2 leading-tight drop-shadow-sm">{title}</h3>
        <p className="text-sm text-gray-600 mt-2 font-medium uppercase tracking-widest">{author}</p>
        
        {rating && (
          <div className="mt-3 flex items-center justify-center gap-1 text-amber-500 text-sm drop-shadow-sm">
            {"★".repeat(Math.round(rating))}{"☆".repeat(5-Math.round(rating))}
          </div>
        )}
      </div>
    </div>
  );
}
