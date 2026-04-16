import React from 'react';

export default function InstagramPreview({ author, avatar, imageUrl, caption, likes }: { author: string, avatar: string, imageUrl: string, caption?: string, likes?: number }) {
  return (
    <div className="bg-white border text-sm border-gray-200 rounded-lg overflow-hidden flex flex-col font-sans max-w-sm mx-auto shadow-sm">
      {/* Header */}
      <div className="flex items-center p-3 gap-3 bg-white">
        <div className="p-0.5 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
          <img src={avatar} alt={author} className="w-8 h-8 rounded-full border-2 border-white bg-white object-cover" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900 text-[13px] leading-tight flex items-center gap-1">
            {author}
            <svg aria-label="Verified" className="x1lliihq x1n2onr6" fill="rgb(0, 149, 246)" height="12" role="img" viewBox="0 0 40 40" width="12"><title>Verified</title><path d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z" fillRule="evenodd"></path></svg>
          </span>
          <span className="text-[11px] text-gray-500">Instagram</span>
        </div>
        <button className="ml-auto text-gray-600 hover:text-gray-900">
          <svg aria-label="More options" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><circle cx="12" cy="12" r="1.5"></circle><circle cx="6" cy="12" r="1.5"></circle><circle cx="18" cy="12" r="1.5"></circle></svg>
        </button>
      </div>
      
      {/* Image */}
      <div className="w-full bg-gray-100 border-y border-gray-100">
        <img src={imageUrl} alt={caption || 'Instagram Post'} className="w-full h-auto object-cover max-h-[500px]" />
      </div>
      
      {/* Actions */}
      <div className="p-3 pb-1">
        <div className="flex gap-4 mb-3">
          <button className="hover:opacity-50 transition-opacity">
            <svg aria-label="Like" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.14 6.14 0 0 0-4.896 2.673 6.06 6.06 0 0 0-4.903-2.67C3.556 1.904 1 4.881 1 9.122c0 4.228 3.036 6.32 5.617 8.623 2.518 2.251 4.158 3.679 4.675 4.12.355.305.811.45 1.25.45s.895-.145 1.25-.45c.517-.442 2.157-1.87 4.675-4.12 2.581-2.304 5.617-4.396 5.617-8.623 0-4.241-2.556-7.218-5.608-7.218Z"></path></svg>
          </button>
          <button className="hover:opacity-50 transition-opacity">
            <svg aria-label="Comment" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></path></svg>
          </button>
          <button className="hover:opacity-50 transition-opacity">
            <svg aria-label="Share Post" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><line fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" x1="22" x2="9.218" y1="3" y2="10.083"></line><polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></polygon></svg>
          </button>
          <button className="ml-auto hover:opacity-50 transition-opacity">
            <svg aria-label="Save" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><polygon fill="none" points="20 21 12 13.44 4 21 4 3 20 3 20 21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></polygon></svg>
          </button>
        </div>
        
        {likes !== undefined && <p className="font-semibold text-gray-900 mb-1.5 text-[13px]">{likes.toLocaleString()} likes</p>}
        {caption && (
          <div className="text-gray-900 text-[13px] leading-[18px]">
            <span className="font-semibold mr-1.5">{author}</span>
            <span className="break-words">{caption}</span>
          </div>
        )}
        <p className="text-[10px] text-gray-500 uppercase mt-2 mb-1 tracking-wide">3 days ago</p>
      </div>
    </div>
  );
}
