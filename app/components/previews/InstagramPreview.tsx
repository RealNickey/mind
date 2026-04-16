import React from 'react';

export default function InstagramPreview({ author, avatar, imageUrl, caption, likes }: { author: string, avatar: string, imageUrl: string, caption?: string, likes?: number }) {
  return (
    <div className="bg-white border text-sm border-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col font-inter">
      <div className="flex items-center p-3 gap-2">
        <div className="p-0.5 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
          <img src={avatar} alt={author} className="w-8 h-8 rounded-full border-2 border-white bg-white" />
        </div>
        <span className="font-semibold text-gray-900">{author}</span>
        <svg className="ml-auto w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
      </div>
      
      <div className="aspect-square bg-gray-100">
        <img src={imageUrl} alt={caption || 'Instagram Post'} className="w-full h-full object-cover" />
      </div>
      
      <div className="p-3">
        <div className="flex gap-4 mb-2">
          <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          <svg className="w-6 h-6 text-gray-800 ml-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </div>
        
        {likes && <p className="font-semibold text-gray-900 mb-1">{likes.toLocaleString()} likes</p>}
        {caption && (
          <p className="text-gray-800 line-clamp-2">
            <span className="font-semibold mr-1">{author}</span>
            {caption}
          </p>
        )}
      </div>
    </div>
  );
}
