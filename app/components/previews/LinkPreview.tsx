import React from 'react';
import PreviewImage from './PreviewImage';

export default function LinkPreview({ url, title, description, favicon }: { url: string, title?: string, description?: string, favicon?: string }) {
  let hostname = '';
  try {
    hostname = new URL(url).hostname.replace('www.', '');
  } catch {
    hostname = url;
  }
  
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col gap-2 cursor-pointer group">
      <div className="flex items-center gap-2">
        {favicon ? (
          <PreviewImage src={favicon} alt="" width={16} height={16} className="w-4 h-4 rounded-sm" />
        ) : (
          <div className="w-4 h-4 bg-gray-200 rounded-sm flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="gray" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          </div>
        )}
        <span className="text-xs text-gray-500 font-medium truncate uppercase tracking-widest">{hostname}</span>
      </div>
      
      {title && <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-2">{title}</h3>}
      {description && <p className="text-xs text-gray-600 line-clamp-2">{description}</p>}
      
      {!title && !description && (
        <span className="text-sm font-mono text-blue-500 break-all line-clamp-2">{url}</span>
      )}
    </div>
  );
}
