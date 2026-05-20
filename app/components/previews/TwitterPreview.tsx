import React from 'react';
import PreviewImage from './PreviewImage';

export default function TwitterPreview({ author, handle, avatar, content, date, replies, retweets, likes }: { author: string, handle: string, avatar: string, content: string, date: string, replies: number, retweets: number, likes: number }) {
  return (
    <div className="bg-white dark:bg-black rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800/50 shadow-sm transition-all h-full flex flex-col">
      <div className="flex items-center gap-3">
        <PreviewImage src={avatar} alt={author} width={40} height={40} className="w-10 h-10 rounded-full" />
        <div className="flex flex-col">
          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-none">{author}</span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">@{handle}</span>
        </div>
        <svg className="ml-auto text-black dark:text-white" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </div>
      
      <p className="mt-4 text-zinc-900 dark:text-zinc-100 text-[15px] leading-relaxed whitespace-pre-wrap">{content}</p>
      
      <p className="mt-4 text-[13px] text-zinc-500 dark:text-zinc-400 font-medium">{date}</p>
      
      <div className="mt-4 flex gap-6 text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/50 pt-4">
        <div className="flex items-center gap-2 hover:text-blue-500 transition-colors cursor-pointer text-[13px] font-medium">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          {replies}
        </div>
        <div className="flex items-center gap-2 hover:text-green-500 transition-colors cursor-pointer text-[13px] font-medium">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 1l4 4-4 4"></path><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><path d="M7 23l-4-4 4-4"></path><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
          {retweets}
        </div>
        <div className="flex items-center gap-2 hover:text-red-500 transition-colors cursor-pointer text-[13px] font-medium">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          {likes}
        </div>
      </div>
    </div>
  );
}
