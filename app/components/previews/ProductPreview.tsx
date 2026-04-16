import React from 'react';

export default function ProductPreview({ title, price, currency = '$', store, imageUrl, rating, reviews }: { title: string, price: string, currency?: string, store: string, imageUrl: string, rating?: number, reviews?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:border-gray-200 hover:shadow-md transition-all">
      <div className="bg-gray-50 relative p-4 flex items-center justify-center">
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm">
          {store}
        </div>
        <img src={imageUrl} alt={title} className="h-40 object-contain drop-shadow-md mix-blend-multiply" />
      </div>
      
      <div className="p-4 flex flex-col gap-2 relative border-t border-gray-50">
        <h3 className="font-semibold text-gray-900 leading-tight line-clamp-2 text-sm">{title}</h3>
        
        {rating && (
          <div className="flex items-center gap-1.5 mt-auto">
            <div className="flex text-yellow-400 text-xs">
              {"★".repeat(Math.round(rating))}{"☆".repeat(5-Math.round(rating))}
            </div>
            {reviews && <span className="text-[10px] text-gray-500">({reviews})</span>}
          </div>
        )}
        
        <div className="flex items-end justify-between mt-1">
          <span className="font-bold text-lg text-gray-900 leading-none">
            {currency}{price}
          </span>
          <button className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-2 py-1.5 rounded hover:bg-indigo-100 transition-colors">
            View Item
          </button>
        </div>
      </div>
    </div>
  );
}
