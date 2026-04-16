import React from 'react';

export default function NotePreview({ title, markdown, color = '#FFF9A6' }: { title: string, markdown: string, color?: string }) {
  return (
    <div className="relative p-5 shadow-sm rounded-lg border border-black/5 transform rotate-[-1deg] hover:rotate-0 transition-transform origin-top-left" style={{ backgroundColor: color }}>
      <div className="absolute top-0 right-3 w-8 h-3 bg-red-400/20 rotate-12 tranlate-y-[-50%]" />
      
      <h3 className="font-playfair font-bold text-gray-900 border-b border-black/10 pb-2 mb-2">{title}</h3>
      <div className="font-inter text-sm text-gray-800 line-clamp-6 leading-relaxed whitespace-pre-wrap">
        {markdown}
      </div>
    </div>
  );
}
