'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RichTextEditor from '@/app/components/RichTextEditor';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function EditItemPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchItem = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/items/${id}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch item');
        }

        const data = await res.json();
        setTitle(data.title || '');
        setDescription(data.description || '');
        setContent(data.content || '');
      } catch (err: unknown) {
        console.error(err);
        setError('Failed to load item for editing');
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const res = await fetch(`/api/items/${id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          content,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update item');
      }

      router.push(`/items/${id}`);
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-8">
        <div className="text-destructive font-semibold mb-4">{error}</div>
        <Link href="/">
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
            <ChevronLeft className="mr-2 h-4 w-4" /> Go Back
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link href={`/items/${id}`} className="text-muted-foreground hover:text-foreground inline-flex items-center underline-offset-4 hover:underline">
          <ChevronLeft className="mr-1 h-5 w-5" />
          Back to item
        </Link>
        <button 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:opacity-50"
          onClick={handleSave} 
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            className="w-full text-2xl font-bold bg-transparent border-b border-border py-2 focus:outline-none focus:border-primary transition-colors"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Item title..."
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-1">
            Description
          </label>
          <textarea
            id="description"
            className="w-full text-base bg-transparent border rounded-md border-border p-3 focus:outline-none focus:ring-1 focus:ring-primary min-h-[100px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description or summary..."
          />
        </div>

        <div className="flex-1 mt-4">
           <label className="block text-sm font-medium text-muted-foreground mb-1">
            Content
          </label>
          <div className="bg-background rounded-md overflow-hidden border">
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Write your note or rich text content here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
