import React from 'react';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export default function TodoPreview({ title, items, total, completed }: { title: string, items: TodoItem[], total: number, completed: number }) {
  const percentage = Math.round((completed / Math.max(total, 1)) * 100);
  
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
          {title}
        </h3>
        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {completed}/{total}
        </span>
      </div>
      
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
        <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
      </div>
      
      <ul className="space-y-2">
        {items.slice(0, 5).map(item => (
          <li key={item.id} className={`flex items-start gap-2 text-sm ${item.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
            <span className="mt-0.5">
              {item.completed ? (
                <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ) : (
                <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth="2" /></svg>
              )}
            </span>
            <span className="line-clamp-2">{item.text}</span>
          </li>
        ))}
      </ul>
      
      {total > 5 && (
        <p className="mt-3 text-xs text-center text-gray-400 font-medium">
          + {total - 5} more items
        </p>
      )}
    </div>
  );
}
