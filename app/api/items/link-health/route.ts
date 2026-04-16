import { NextRequest, NextResponse } from 'next/server';
import { refreshLinkHealthForItems } from '@/app/lib/link-health-monitor';

export const runtime = 'nodejs';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const DEFAULT_CONCURRENCY = 4;
const MAX_CONCURRENCY = 8;
const DEFAULT_SNAPSHOT_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
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
}

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
    const body = await req.json().catch(() => ({}));
    const itemId = typeof body?.itemId === 'string' && body.itemId.trim() ? body.itemId.trim() : null;

    const result = await refreshLinkHealthForItems({
      itemId,
      limit: Math.min(parsePositiveInt(body?.limit, DEFAULT_LIMIT), MAX_LIMIT),
      scanLimit: parsePositiveInt(body?.scanLimit, DEFAULT_LIMIT * 8),
      concurrency: Math.min(parsePositiveInt(body?.concurrency, DEFAULT_CONCURRENCY), MAX_CONCURRENCY),
      force: itemId ? true : parseBoolean(body?.force, true),
      captureSnapshots: parseBoolean(body?.captureSnapshots, false),
      snapshotMaxAgeMs: parsePositiveInt(body?.snapshotMaxAgeMs, DEFAULT_SNAPSHOT_MAX_AGE_MS),
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

    const result = await refreshLinkHealthForItems({
      limit: Math.min(parsePositiveInt(searchParams.get('limit'), DEFAULT_LIMIT), MAX_LIMIT),
      scanLimit: parsePositiveInt(searchParams.get('scanLimit'), DEFAULT_LIMIT * 8),
      concurrency: Math.min(
        parsePositiveInt(searchParams.get('concurrency'), DEFAULT_CONCURRENCY),
        MAX_CONCURRENCY
      ),
      force: parseBoolean(searchParams.get('force'), false),
      captureSnapshots: parseBoolean(searchParams.get('captureSnapshots'), true),
      snapshotMaxAgeMs: parsePositiveInt(
        searchParams.get('snapshotMaxAgeMs'),
        DEFAULT_SNAPSHOT_MAX_AGE_MS
      ),
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