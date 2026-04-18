import React from 'react';
import PreviewImage from './PreviewImage';

export default function TwitterPreview({ author, handle, avatar, content, date, replies, retweets, likes }: { author: string, handle: string, avatar: string, content: string, date: string, replies: number, retweets: number, likes: number }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <PreviewImage src={avatar} alt={author} width={40} height={40} className="w-10 h-10 rounded-full" />
        <div className="flex flex-col">
          <span className="font-bold text-sm text-gray-900 leading-none">{author}</span>
          <span className="text-sm text-gray-500">@{handle}</span>
        </div>
        <svg className="ml-auto text-[#1DA1F2]" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
      </div>
      
      <p className="mt-3 text-gray-800 text-sm whitespace-pre-wrap">{content}</p>
      
      <p className="mt-2 text-xs text-gray-500">{date}</p>
      
      <div className="mt-3 flex gap-6 text-gray-500 border-t border-gray-50 pt-3">
        <div className="flex items-center gap-1.5 hover:text-blue-500 transition-colors cursor-pointer text-xs">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          {replies}
        </div>
        <div className="flex items-center gap-1.5 hover:text-green-500 transition-colors cursor-pointer text-xs">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 1l4 4-4 4"></path><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><path d="M7 23l-4-4 4-4"></path><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
          {retweets}
        </div>
        <div className="flex items-center gap-1.5 hover:text-red-500 transition-colors cursor-pointer text-xs">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          {likes}
        </div>
      </div>
    </div>
  );
}
