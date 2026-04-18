import { NextRequest, NextResponse } from 'next/server';
import { refreshLinkHealthForItems } from '@/app/lib/link-health-monitor';
import { z } from 'zod';

export const runtime = 'nodejs';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const DEFAULT_CONCURRENCY = 4;
const MAX_CONCURRENCY = 8;
const DEFAULT_SNAPSHOT_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

const positiveIntParam = (fallback: number) =>
  z.preprocess((value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }

    return Math.floor(parsed);
  }, z.number().int().positive());

const boundedPositiveIntParam = (fallback: number, max: number) =>
  positiveIntParam(fallback).transform((value) => Math.min(value, max));

const booleanParam = (fallback: boolean) =>
  z.preprocess((value) => {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
        return true;
      }

      if (normalized === 'false' || normalized === '0' || normalized === 'no') {
        return false;
      }
    }

    return fallback;
  }, z.boolean());

const nullableTrimmedStringParam = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}, z.string().nullable());

const linkHealthBodySchema = z.preprocess(
  (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {}),
  z.object({
    itemId: nullableTrimmedStringParam,
    limit: boundedPositiveIntParam(DEFAULT_LIMIT, MAX_LIMIT),
    scanLimit: positiveIntParam(DEFAULT_LIMIT * 8),
    concurrency: boundedPositiveIntParam(DEFAULT_CONCURRENCY, MAX_CONCURRENCY),
    force: booleanParam(true),
    captureSnapshots: booleanParam(false),
    snapshotMaxAgeMs: positiveIntParam(DEFAULT_SNAPSHOT_MAX_AGE_MS),
  })
);

const linkHealthQuerySchema = z.object({
  limit: boundedPositiveIntParam(DEFAULT_LIMIT, MAX_LIMIT),
  scanLimit: positiveIntParam(DEFAULT_LIMIT * 8),
  concurrency: boundedPositiveIntParam(DEFAULT_CONCURRENCY, MAX_CONCURRENCY),
  force: booleanParam(false),
  captureSnapshots: booleanParam(true),
  snapshotMaxAgeMs: positiveIntParam(DEFAULT_SNAPSHOT_MAX_AGE_MS),
});

function extractTokenFromAuthHeader(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const [scheme, token] = value.split(' ', 2);
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
    return null;
  }

  return token.trim() || null;
}

function authorizeCronRequest(req: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Missing CRON_SECRET for scheduled link-health job' },
        { status: 503 }
      );
    }

    return null;
  }

  const tokenFromAuth = extractTokenFromAuthHeader(req.headers.get('authorization'));
  const tokenFromHeader = req.headers.get('x-cron-secret');
  const tokenFromQuery = req.nextUrl.searchParams.get('token');
  const providedToken = tokenFromAuth ?? tokenFromHeader ?? tokenFromQuery;

  if (!providedToken || providedToken !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const rawBodyText = await req.text();
    let rawBody: unknown = {};

    if (rawBodyText.trim()) {
      try {
        rawBody = JSON.parse(rawBodyText);
      } catch {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
      }
    }

    const parseResult = linkHealthBodySchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { itemId, limit, scanLimit, concurrency, force, captureSnapshots, snapshotMaxAgeMs } =
      parseResult.data;

    const result = await refreshLinkHealthForItems({
      itemId,
      limit,
      scanLimit,
      concurrency,
      force: itemId ? true : force,
      captureSnapshots,
      snapshotMaxAgeMs,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Link health refresh failed:', error);
    return NextResponse.json({ error: 'Failed to refresh link health' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const unauthorized = authorizeCronRequest(req);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const parseResult = linkHealthQuerySchema.safeParse({
      limit: searchParams.get('limit'),
      scanLimit: searchParams.get('scanLimit'),
      concurrency: searchParams.get('concurrency'),
      force: searchParams.get('force'),
      captureSnapshots: searchParams.get('captureSnapshots'),
      snapshotMaxAgeMs: searchParams.get('snapshotMaxAgeMs'),
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { limit, scanLimit, concurrency, force, captureSnapshots, snapshotMaxAgeMs } = parseResult.data;

    const result = await refreshLinkHealthForItems({
      limit,
      scanLimit,
      concurrency,
      force,
      captureSnapshots,
      snapshotMaxAgeMs,
    });

    return NextResponse.json({
      job: 'link-health-monitor',
      ...result,
    });
  } catch (error) {
    console.error('Scheduled link health run failed:', error);
    return NextResponse.json({ error: 'Failed to execute scheduled link health run' }, { status: 500 });
  }
}
