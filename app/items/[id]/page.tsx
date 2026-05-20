import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, Pencil } from 'lucide-react';
import ItemPreview from '@/app/components/previews/ItemPreview';
import { LinkedItemsPanel } from '@/app/components/LinkedItemsPanel';
import { ItemInsightsPanel } from '@/app/components/ItemInsightsPanel';
import { ImageAnalysis } from '@/app/components/ImageAnalysis';
import PlaceMap from '@/app/components/PlaceMap';
import { getItemByIdWithRelations } from '@/app/lib/item-hydration';

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function asLinkHealthStatus(value: unknown): 'alive' | 'broken' | 'unknown' | null {
  if (value === 'alive' || value === 'broken' || value === 'unknown') {
    return value;
  }

  return null;
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getItemByIdWithRelations(id);

  if (!item) {
    notFound();
  }

  const sourceUrl = item.metadata?.sourceUrl ?? item.sourceUrl;
  const metadataCustom = asObject(item.metadata?.customData);
  const location = asObject(metadataCustom?.location);

  const latitude = asNumber(
    metadataCustom?.latitude ??
    metadataCustom?.lat ??
    location?.latitude ??
    location?.lat
  );
  const longitude = asNumber(
    metadataCustom?.longitude ??
    metadataCustom?.lng ??
    metadataCustom?.lon ??
    location?.longitude ??
    location?.lng ??
    location?.lon
  );
  const mapName = asString(metadataCustom?.placeName ?? location?.name) ?? item.title;

  const textForReading = [item.content, item.description]
    .filter((entry): entry is string => Boolean(entry && entry.trim()))
    .join('\n\n')
    .trim();

  const rawLinkHealth = asObject(metadataCustom?.linkHealth);
  const statusCandidate = asLinkHealthStatus(rawLinkHealth?.status);
  const initialLinkHealth = rawLinkHealth && statusCandidate
    ? {
        status: statusCandidate,
        statusCode: asNumber(rawLinkHealth.statusCode),
        checkedAt: asString(rawLinkHealth.checkedAt) ?? item.updatedAt,
        error: asString(rawLinkHealth.error),
      }
    : null;

  const imageAnalysisUrl = asString(item.metadata?.imageUrl) ?? null;

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>

          <div className="flex items-center gap-2">
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Open source
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <Link
              href={`/items/${item.id}/edit`}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <ItemPreview item={item} />
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Notes and Content</h2>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                {item.content || item.description || 'No additional notes saved yet.'}
              </p>
            </div>

            {imageAnalysisUrl && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-3 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Image Analysis</h2>
                <ImageAnalysis imageUrl={imageAnalysisUrl} />
              </div>
            )}

            {typeof latitude === 'number' && typeof longitude === 'number' && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-3 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Place Context</h2>
                <PlaceMap latitude={latitude} longitude={longitude} name={mapName} />
              </div>
            )}

            {(item.tags?.length ?? 0) > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-3 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {item.tags?.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Item Details</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-zinc-500">Type</dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-100">{item.type}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-zinc-500">Created</dt>
                  <dd className="text-right text-zinc-700 dark:text-zinc-300">{formatDate(item.createdAt)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-zinc-500">Updated</dt>
                  <dd className="text-right text-zinc-700 dark:text-zinc-300">{formatDate(item.updatedAt)}</dd>
                </div>
              </dl>
            </div>

            <LinkedItemsPanel itemId={item.id} />

            <ItemInsightsPanel
              itemId={item.id}
              sourceUrl={sourceUrl}
              initialLinkHealth={initialLinkHealth}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
