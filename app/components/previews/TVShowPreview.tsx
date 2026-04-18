import React from 'react';
import PreviewImage from './PreviewImage';

export default function TVShowPreview({ name, poster, seasons, rating, year, network }: { name: string, poster: string, seasons: number, rating: number, year: string, network?: string }) {
  return (
    <div className="flex bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <div className="w-1/3 relative">
        <PreviewImage src={poster} alt={name} fill sizes="(max-width: 768px) 33vw, 140px" className="h-full w-full object-cover" />
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
          TV
        </div>
      </div>
      <div className="w-2/3 p-4 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-gray-900 line-clamp-2 md:text-lg">{name}</h3>
          <p className="text-xs text-gray-500 mt-1">{year} {network ? `• ${network}` : ''}</p>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {seasons} {seasons === 1 ? 'Season' : 'Seasons'}
          </div>
          <div className="text-xs font-bold text-yellow-600 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-500"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            {rating.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
}
