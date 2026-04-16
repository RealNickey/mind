import React from 'react';

export default function QuotePreview({ text, author, source }: { text: string, author: string, source?: string }) {
  return (
    <div className="p-6 bg-gradient-to-br from-[#f8f9fa] to-white rounded-xl shadow-sm border border-gray-100 flex flex-col relative font-playfair">
      <div className="absolute top-2 left-2 text-[#e2e8f0] text-6xl leading-none font-serif opacity-50 select-none">
        "
      </div>
      
      <blockquote className="text-xl md:text-2xl text-gray-800 font-medium leading-relaxed z-10 pt-4 pl-2 italic">
        {text}
      </blockquote>
      
      <div className="mt-6 flex flex-col items-end border-t border-gray-100 pt-4 text-sm font-sans z-10">
        <span className="font-bold text-gray-900">— {author}</span>
        {source && <span className="text-gray-500 text-xs italic mt-0.5">{source}</span>}
      </div>
    </div>
  );
}
