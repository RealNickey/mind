import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { checkLinkHealth, type LinkHealthStatus } from '@/app/lib/link-health';
import { normalizeSourceUrl } from '@/app/lib/url-utils';
import type { Database } from '@/app/lib/database.types';

type ItemMetadataInsert = Database['public']['Tables']['ItemMetadata']['Insert'];

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as JsonObject;
}

function asObjectArray(value: unknown): JsonObject[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is JsonObject => Boolean(asObject(entry)));
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function asLinkStatus(value: unknown): LinkHealthStatus | null {
  if (value === 'alive' || value === 'broken' || value === 'unknown') {
    return value;
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const itemId = typeof body?.itemId === 'string' && body.itemId.trim() ? body.itemId.trim() : null;
    const requestedLimit = parsePositiveInt(body?.limit, DEFAULT_LIMIT);
    const limit = Math.min(requestedLimit, MAX_LIMIT);

    let query = db.from('Item').select('id, sourceUrl').order('updatedAt', { ascending: false }).limit(limit);
    if (itemId) {
      query = db.from('Item').select('id, sourceUrl').eq('id', itemId).limit(1);
    }

    const { data: items, error: itemError } = await query;
    if (itemError) {
      throw itemError;
    }

    const candidates = (items ?? []).filter((item) => Boolean(item.sourceUrl));
    if (candidates.length === 0) {
      return NextResponse.json({ checked: 0, results: [] });
    }

    const candidateIds = candidates.map((item) => item.id);
    const { data: metadataRows, error: metadataError } = await db
      .from('ItemMetadata')
      .select('itemId, sourceUrl, customData')
      .in('itemId', candidateIds);

    if (metadataError) {
      throw metadataError;
    }

    const metadataByItemId = new Map((metadataRows ?? []).map((row) => [row.itemId, row]));
    const results: Array<{
      itemId: string;
      sourceUrl: string;
      status: LinkHealthStatus;
      statusCode: number | null;
      checkedAt: string;
      changed: boolean;
      error: string | null;
    }> = [];

    for (const item of candidates) {
      const metadata = metadataByItemId.get(item.id);
      const sourceUrl = normalizeSourceUrl(metadata?.sourceUrl ?? item.sourceUrl) ?? null;
      if (!sourceUrl) {
        continue;
      }

      const health = await checkLinkHealth(sourceUrl);
      const customData = asObject(metadata?.customData) ?? {};
      const currentHealth = asObject(customData.linkHealth);
      const previousStatus = asLinkStatus(currentHealth?.status);

      const history = asObjectArray(customData.linkHealthHistory);
      const nextHistory = [health as unknown as JsonObject, ...history].slice(0, 20);

      const nextCustomData = {
        ...customData,
        normalizedSourceUrl: sourceUrl,
        linkHealth: health,
        linkHealthHistory: nextHistory,
      };

      const metadataPayload: ItemMetadataInsert = {
        itemId: item.id,
        sourceUrl,
        customData: nextCustomData as unknown as ItemMetadataInsert['customData'],
      };

      const { error: upsertError } = await db
        .from('ItemMetadata')
        .upsert(metadataPayload, { onConflict: 'itemId' });

      if (upsertError) {
        throw upsertError;
      }

      results.push({
        itemId: item.id,
        sourceUrl,
        status: health.status,
        statusCode: health.statusCode,
        checkedAt: health.checkedAt,
        changed: previousStatus !== null && previousStatus !== health.status,
        error: health.error,
      });
    }

    return NextResponse.json({
      checked: results.length,
      results,
    });
  } catch (error) {
    console.error('Link health refresh failed:', error);
    return NextResponse.json({ error: 'Failed to refresh link health' }, { status: 500 });
  }
}