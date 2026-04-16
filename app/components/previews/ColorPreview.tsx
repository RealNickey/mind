import React from 'react';

export default function ColorPreview({ hex, name, rgb }: { hex: string, name?: string, rgb?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-col items-center">
      <div className="w-full aspect-video rounded-lg shadow-inner flex items-end p-2 transition-transform hover:scale-[1.03]" style={{ backgroundColor: hex }}>
        {name && (
          <div className="bg-white/30 backdrop-blur-md px-2 py-1 rounded text-xs font-bold font-mono shadow-sm">
            {name}
          </div>
        )}
      </div>
      
      <div className="mt-3 w-full flex justify-between items-center px-1">
        <div className="flex flex-col">
          <span className="font-mono text-gray-900 font-bold uppercase">{hex}</span>
          {rgb && <span className="text-[10px] text-gray-500 font-mono">{rgb}</span>}
        </div>
        
        <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-900" title="Copy to clipboard">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </button>
      </div>
    </div>
  );
}
