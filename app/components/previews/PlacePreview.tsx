import React from 'react';
import PreviewImage from './PreviewImage';

export default function PlacePreview({ name, address, rating, categories, staticMapUrl, mapLink }: { name: string, address: string, rating?: number, categories?: string[], staticMapUrl: string, mapLink?: string }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 group relative">
      <div className="h-32 w-full bg-gray-100 relative">
        <PreviewImage
          src={staticMapUrl}
          alt={`Map showing ${name}`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="w-full h-full object-cover"
        />
        
        {/* Map pin marker */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-md">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#ef4444" stroke="white" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg>
        </div>
      </div>
      
      <div className="p-4 relative">
        {mapLink && (
          <a href={mapLink} target="_blank" rel="noreferrer" className="absolute -top-5 right-4 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-blue-500 hover:text-blue-700 hover:scale-105 transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>
          </a>
        )}
        
        <h3 className="font-bold text-gray-900 text-base leading-tight pr-6">{name}</h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{address}</p>
        
        <div className="flex items-center gap-3 mt-3">
          {rating && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded">
              <span className="text-yellow-500">★</span> {rating.toFixed(1)}
            </div>
          )}
          
          {categories && categories.length > 0 && (
            <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
              {categories[0].replace(/_/g, ' ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
