import React from 'react';

export default function ColorPreview({ hex, name, rgb }: { hex: string, name?: string, rgb?: string }) {
  return (
    <div 
      className="rounded-xl overflow-hidden shadow-md h-64 flex flex-col transition-transform hover:-translate-y-1 hover:shadow-xl group"
      style={{ backgroundColor: hex }}
    >
      <div className="flex-1 w-full" />
      
      <div className="bg-white p-4 flex flex-col w-full shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-gray-100">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            {name && <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1 capitalize tracking-tight">{name}</h3>}
            <span className="font-mono text-gray-700 font-semibold tracking-wider">{hex.toUpperCase()}</span>
            {rgb && <span className="text-[10px] text-gray-400 font-mono mt-0.5">{rgb}</span>}
          </div>
          
          <button className="p-2 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors opacity-0 group-hover:opacity-100" title="Copy to clipboard">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
