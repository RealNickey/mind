'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownLeft, Link2 } from 'lucide-react';
import { getItemById, type ItemLinkEdge } from '@/app/lib/api-client/items';
import { ApiClientError } from '@/app/lib/api-client/http';

interface LinkedItemsData {
  sourceLinks: ItemLinkEdge[];
  targetLinks: ItemLinkEdge[];
}

const EMPTY_LINKS: LinkedItemsData = { sourceLinks: [], targetLinks: [] };

function LinkItem({ href, title, variant }: { href: string; title: string; variant: 'out' | 'in' }) {
  return (
    <Link 
      href={href} 
      className="group flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors duration-150"
    >
      <div className={`shrink-0 p-1.5 rounded-lg ${
        variant === 'out' 
          ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400' 
          : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
      }`}>
        {variant === 'out' 
          ? <ArrowUpRight size={11} /> 
          : <ArrowDownLeft size={11} />
        }
      </div>
      <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors duration-150 line-clamp-1 leading-tight">
        {title}
      </span>
    </Link>
  );
}

export function LinkedItemsPanel({ itemId }: { itemId: string }) {
  const { data } = useQuery<LinkedItemsData, Error, LinkedItemsData>({
    queryKey: ['item-links', itemId],
    enabled: Boolean(itemId),
    staleTime: 60_000,
    retry: false,
    queryFn: async ({ signal }) => {
      try {
        const item = await getItemById(itemId, signal);
        return {
          sourceLinks: item.sourceLinks ?? EMPTY_LINKS.sourceLinks,
          targetLinks: item.targetLinks ?? EMPTY_LINKS.targetLinks,
        };
      } catch (error) {
        if (error instanceof ApiClientError) {
          return EMPTY_LINKS;
        }
        console.error('Failed to load linked items:', error);
        return EMPTY_LINKS;
      }
    },
  });
  const links = data ?? EMPTY_LINKS;

  const hasLinks = links.sourceLinks.length > 0 || links.targetLinks.length > 0;

  return (
    <div className="rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-800/20 backdrop-blur-sm ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center gap-2">
        <Link2 size={14} className="text-zinc-400" />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Linked Items</h3>
      </div>
      
      <div className="p-2">
        {!hasLinks && (
          <p className="px-3 py-4 text-xs font-medium text-zinc-400 text-center">No linked items yet.</p>
        )}

        {links.sourceLinks.length > 0 && (
          <div className="mb-1">
            <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-400">Links Out</p>
            {links.sourceLinks.map((link) => {
              if (!link.targetItem?.id) return null;
              return (
                <LinkItem key={link.id} href={`/items/${link.targetItem.id}`} title={link.targetItem.title} variant="out" />
              );
            })}
          </div>
        )}

        {links.targetLinks.length > 0 && (
          <div>
            <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-400">Backlinks</p>
            {links.targetLinks.map((link) => {
              if (!link.sourceItem?.id) return null;
              return (
                <LinkItem key={link.id} href={`/items/${link.sourceItem.id}`} title={link.sourceItem.title} variant="in" />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
