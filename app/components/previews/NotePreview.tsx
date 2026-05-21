import React from 'react';

export default function NotePreview({ title, markdown, color = '#FFF9A6' }: { title: string, markdown: string, color?: string }) {
  return (
    <div
      className="relative p-6 min-h-[180px] flex flex-col transition-all duration-300"
      style={{
        backgroundColor: color,
        backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%, rgba(0,0,0,0.03) 100%)',
      }}
    >
      {/* Paper texture */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}
      />
      
      {/* Top-left fold corner */}
      <div className="absolute top-0 right-0 w-0 h-0 pointer-events-none"
        style={{
          borderStyle: 'solid',
          borderWidth: '0 20px 20px 0',
          borderColor: `transparent rgba(0,0,0,0.06) transparent transparent`,
        }}
      />
      
      <h3 className="font-heading text-base font-semibold leading-snug tracking-tight mb-3 pb-2"
        style={{ color: 'rgba(0,0,0,0.75)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
      >
        {title}
      </h3>
      
      <div className="font-sans text-sm leading-relaxed whitespace-pre-wrap line-clamp-6"
        style={{ color: 'rgba(0,0,0,0.7)' }}
      >
        {markdown}
      </div>

      {/* Bottom scribble accent */}
      <div className="absolute bottom-3 right-3 opacity-30 pointer-events-none" aria-hidden>
        <svg width="28" height="12" viewBox="0 0 28 12" fill="none">
          <path d="M2 9 Q6 3 10 7 Q14 11 18 5 Q22 1 26 6" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        </svg>
      </div>
    </div>
  );
}
