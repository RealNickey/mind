import React from 'react';
import PreviewImage from './PreviewImage';

export default function RecipePreview({ title, ingredients, prepTime, cookTime, servings, imageUrl }: { title: string, ingredients: string[], prepTime: number, cookTime: number, servings: number, imageUrl?: string }) {
  const totalTime = prepTime + cookTime;
  
  return (
    <div className="bg-[#FFF8DC] rounded-xl overflow-hidden shadow-sm border border-[#F5DEB3] flex flex-col font-inter">
      {imageUrl && (
        <div className="relative h-40 w-full overflow-hidden">
          <PreviewImage src={imageUrl} alt={title} fill sizes="(max-width: 768px) 100vw, 40vw" className="w-full h-full object-cover" />
        </div>
      )}
      
      <div className="p-5 flex-1 flex flex-col relative">
        <h3 className="font-playfair text-xl font-bold text-gray-800 leading-tight mb-3">{title}</h3>
        
        <div className="flex gap-4 text-xs font-semibold text-gray-600 mb-4 bg-white/50 p-2 rounded-lg justify-around">
          <div className="flex flex-col items-center">
            <span className="text-orange-500">⏱</span>
            <span>{totalTime}m</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-orange-500">🔥</span>
            <span>{cookTime}m</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-orange-500">🍽</span>
            <span>{servings} pax</span>
          </div>
        </div>
        
        <div className="text-sm text-gray-700">
          <h4 className="font-bold text-gray-900 border-b border-gray-200 pb-1 mb-2">Ingredients</h4>
          <ul className="space-y-1">
            {ingredients.slice(0, 4).map((ing, i) => (
              <li key={i} className="flex gap-2 items-start">
                <span className="text-orange-400 mt-0.5">•</span>
                <span className="line-clamp-1">{ing}</span>
              </li>
            ))}
            {ingredients.length > 4 && (
              <li className="text-gray-400 italic text-xs mt-1">
                + {ingredients.length - 4} more ingredients
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
