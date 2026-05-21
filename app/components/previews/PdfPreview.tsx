import React from 'react';
import { FileText } from 'lucide-react';

export default function PdfPreview({ title, pages, fileSize }: { title: string, pages?: number, fileSize?: string }) {
  return (
    <div className="relative w-full aspect-[3/4] bg-white flex flex-col items-center justify-center border border-zinc-200/50 shadow-sm overflow-hidden p-6 text-center">
      <div className="absolute top-0 right-0 w-12 h-12 bg-zinc-100 border-l border-b border-zinc-200/50" style={{ clipPath: 'polygon(100% 0, 0 0, 0 100%)' }} />
      <div className="absolute top-0 right-0 w-12 h-12 bg-white" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} />

      <div className="p-4 rounded-xl bg-red-50 text-red-500 mb-4 ring-1 ring-red-100">
        <FileText size={32} strokeWidth={1.5} />
      </div>

      <h3 className="font-heading font-medium text-zinc-900 leading-snug line-clamp-3 mb-2">{title}</h3>

      {(pages || fileSize) && (
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          {pages && <span>{pages} pages</span>}
          {pages && fileSize && <span className="w-1 h-1 rounded-full bg-zinc-300" />}
          {fileSize && <span>{fileSize}</span>}
        </div>
      )}
    </div>
  );
}
