import React from 'react';

export default function GithubPreview({ repo, description, stars, forks, language, languageColor, updated }: { repo: string, description: string, stars: number, forks: number, language: string, languageColor: string, updated?: string }) {
  return (
    <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-5 shadow-sm hover:border-[#8b949e] transition-colors font-sans text-white group cursor-pointer block">
      <div className="flex items-center gap-2 mb-2">
        <svg fill="#8b949e" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fillRule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.22l1.45-1.087a.25.25 0 01.3 0l1.45 1.087a.25.25 0 00.4-.22v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"></path></svg>
        <span className="text-[#58a6ff] font-semibold text-sm group-hover:underline">{repo}</span>
        <span className="px-2 py-0.5 rounded-full border border-[#30363d] text-[10px] text-[#8b949e] font-medium ml-auto">Public</span>
      </div>
      
      <p className="text-xs text-[#8b949e] mb-4 line-clamp-2 leading-relaxed">
        {description}
      </p>
      
      <div className="flex items-center gap-4 text-xs text-[#8b949e]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: languageColor || '#c6538c' }}></span>
          <span>{language}</span>
        </div>
        
        <div className="flex items-center gap-1 hover:text-[#58a6ff] transition-colors">
          <svg fill="currentColor" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fillRule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"></path></svg>
          <span>{stars.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center gap-1 hover:text-[#58a6ff] transition-colors">
          <svg fill="currentColor" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fillRule="evenodd" d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"></path></svg>
          <span>{forks.toLocaleString()}</span>
        </div>
        
        {updated && <div className="ml-auto">Updated {updated}</div>}
      </div>
    </div>
  );
}
