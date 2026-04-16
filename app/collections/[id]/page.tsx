"use client";

import React, { useEffect, useState, use } from 'react';
import MasonryGrid from '@/app/components/MasonryGrid';

export default function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [collection, setCollection] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCollection() {
      try {
        const res = await fetch(`/api/collections/${resolvedParams.id}`);
        if (res.ok) {
          const data = await res.json();
          setCollection(data);
        }
      } catch (err) {
        console.error('Error fetching collection', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCollection();
  }, [resolvedParams.id]);

  if (loading) return <div className="p-8">Loading collection...</div>;
  if (!collection) return <div className="p-8">Collection not found.</div>;

  return (
    <div className="p-8">
      <h1 className="text-4xl font-playfair mb-4">{collection.name}</h1>
      {collection.description && <p className="mb-8 text-muted-foreground">{collection.description}</p>}
      
      <div className="mt-8">
        <MasonryGrid items={collection.items || []} />
      </div>
    </div>
  );
}
