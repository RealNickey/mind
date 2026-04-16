import { createHash } from 'node:crypto';
import { captureArchiveSnapshot, type ArchiveSnapshot } from './archive';
import type { Database } from './database.types';
import { db } from './db';
import {
  checkLinkHealth,
  type LinkHealthResult,
  type LinkHealthStatus,
} from './link-health';
import { normalizeSourceUrl } from './url-utils';

type ItemMetadataInsert = Database['public']['Tables']['ItemMetadata']['Insert'];

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const DEFAULT_SCAN_MULTIPLIER = 8;
const MAX_SCAN_LIMIT = 800;
const DEFAULT_CONCURRENCY = 4;
const MAX_CONCURRENCY = 8;
const MAX_LINK_HEALTH_HISTORY = 40;
const MAX_ARCHIVE_HISTORY = 10;
const DEFAULT_SNAPSHOT_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const FAILED_SNAPSHOT_RETRY_MS = 6 * 60 * 60 * 1000;

type JsonObject = Record<string, unknown>;

interface MetadataCandidate {
  itemId: string;
  sourceUrl: string | null;
  customData: unknown;
}

interface ItemCandidate {
  id: string;
  sourceUrl: string;
  updatedAt: string;
  metadata: MetadataCandidate | null;
}

interface DueCandidate {
  candidate: ItemCandidate;
  dueAtMs: number;
}

interface SuccessfulItemRefresh {
  itemId: string;
  sourceUrl: string;
  status: LinkHealthStatus;
  statusCode: number | null;
  checkedAt: string;
  changed: boolean;
  error: string | null;
  nextCheckAt: string;
  attempts: number;
  durationMs: number;
  snapshotCaptured: boolean;
  snapshotOutcome: string | null;
}

interface FailedItemRefresh {
  itemId: string;
  sourceUrl: string;
  error: string;
}

export interface RefreshLinkHealthOptions {
  itemId?: string | null;
  limit?: number;
  scanLimit?: number;
  concurrency?: number;
  force?: boolean;
  captureSnapshots?: boolean;
  snapshotMaxAgeMs?: number;
}

export interface RefreshLinkHealthResult {
  candidates: number;
  scheduled: number;
  deferred: number;
  checked: number;
  failures: FailedItemRefresh[];
  statusCounts: Record<LinkHealthStatus, number>;
  results: SuccessfulItemRefresh[];
}

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

function asLinkStatus(value: unknown): LinkHealthStatus | null {
  if (value === 'alive' || value === 'broken' || value === 'unknown') {
    return value;
  }

  return null;
}

function parsePositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed);
    }
  }

  return null;
}

function parseIsoMs(value: unknown): number | null {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function chunk<T>(values: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function readMetadataByItemIds(itemIds: string[]): Promise<Map<string, MetadataCandidate>> {
  const metadataByItemId = new Map<string, MetadataCandidate>();
  if (itemIds.length === 0) {
    return metadataByItemId;
  }

  for (const idChunk of chunk(itemIds, 200)) {
    const { data, error } = await db
      .from('ItemMetadata')
      .select('itemId, sourceUrl, customData')
      .in('itemId', idChunk);

    if (error) {
      throw error;
    }

    for (const row of data ?? []) {
      metadataByItemId.set(row.itemId, {
        itemId: row.itemId,
        sourceUrl: row.sourceUrl,
        customData: row.customData,
      });
    }
  }

  return metadataByItemId;
}

function defaultIntervalMsForStatus(status: LinkHealthStatus, streak: number): number {
  const safeStreak = clamp(streak, 1, 12);

  if (status === 'alive') {
    return Math.min(14 * 24 * 60 * 60 * 1000, 24 * 60 * 60 * 1000 * Math.pow(2, safeStreak - 1));
  }

  if (status === 'broken') {
    return Math.min(48 * 60 * 60 * 1000, 60 * 60 * 1000 * Math.pow(2, safeStreak - 1));
  }

  return Math.min(12 * 60 * 60 * 1000, 20 * 60 * 1000 * Math.pow(2, safeStreak - 1));
}

function jitterFactorForItem(itemId: string): number {
  const firstByte = createHash('sha256').update(itemId).digest()[0] ?? 0;
  return 0.85 + (firstByte / 255) * 0.3;
}

function deriveDueAtMs(currentHealth: JsonObject | null, itemId: string): number {
  if (!currentHealth) {
    return 0;
  }

  const explicitNextCheckAtMs = parseIsoMs(currentHealth.nextCheckAt);
  if (explicitNextCheckAtMs !== null) {
    return explicitNextCheckAtMs;
  }

  const checkedAtMs = parseIsoMs(currentHealth.checkedAt);
  const status = asLinkStatus(currentHealth.status);
  if (checkedAtMs === null || !status) {
    return 0;
  }

  const explicitIntervalMs = parsePositiveInt(currentHealth.intervalMs);
  if (explicitIntervalMs) {
    return checkedAtMs + explicitIntervalMs;
  }

  const streak = parsePositiveInt(currentHealth.streak) ?? 1;
  const intervalMs = Math.round(defaultIntervalMsForStatus(status, streak) * jitterFactorForItem(itemId));
  return checkedAtMs + intervalMs;
}

function buildLinkHealthState(
  latestResult: LinkHealthResult,
  previousHealth: JsonObject | null,
  itemId: string
): JsonObject {
  const previousStatus = asLinkStatus(previousHealth?.status);
  const previousStreak = parsePositiveInt(previousHealth?.streak) ?? 1;
  const streak = previousStatus === latestResult.status ? clamp(previousStreak + 1, 1, 12) : 1;
  const intervalMs = Math.round(
    defaultIntervalMsForStatus(latestResult.status, streak) * jitterFactorForItem(itemId)
  );

  const checkedAtMs = parseIsoMs(latestResult.checkedAt) ?? Date.now();
  const nextCheckAt = new Date(checkedAtMs + intervalMs).toISOString();

  const previousChangedAt = parseIsoMs(previousHealth?.lastChangedAt) !== null
    ? (previousHealth?.lastChangedAt as string)
    : null;

  return {
    ...latestResult,
    streak,
    intervalMs,
    nextCheckAt,
    lastChangedAt:
      previousStatus === latestResult.status
        ? previousChangedAt ?? latestResult.checkedAt
        : latestResult.checkedAt,
  };
}

function fingerprintsMatch(a: JsonObject, b: JsonObject, fields: string[]): boolean {
  return fields.every((field) => {
    const left = a[field];
    const right = b[field];
    return left === right;
  });
}

function prependBoundedHistory(
  previousHistory: JsonObject[],
  nextEntry: JsonObject,
  limit: number,
  dedupeWindowMs: number,
  dedupeFields: string[]
): JsonObject[] {
  const latest = previousHistory[0];

  if (latest) {
    const latestCheckedAtMs = parseIsoMs(latest.checkedAt) ?? parseIsoMs(latest.capturedAt);
    const nextCheckedAtMs = parseIsoMs(nextEntry.checkedAt) ?? parseIsoMs(nextEntry.capturedAt);

    if (
      latestCheckedAtMs !== null &&
      nextCheckedAtMs !== null &&
      Math.abs(nextCheckedAtMs - latestCheckedAtMs) <= dedupeWindowMs &&
      fingerprintsMatch(latest, nextEntry, dedupeFields)
    ) {
      return [nextEntry, ...previousHistory.slice(1)].slice(0, limit);
    }
  }

  return [nextEntry, ...previousHistory].slice(0, limit);
}

function shouldCaptureSnapshot(
  customData: JsonObject,
  statusChanged: boolean,
  nowMs: number,
  snapshotMaxAgeMs: number
): boolean {
  if (statusChanged) {
    return true;
  }

  const latestSnapshot = asObject(customData.archiveSnapshotLatest);
  if (!latestSnapshot) {
    return true;
  }

  const capturedAtMs = parseIsoMs(latestSnapshot.capturedAt);
  if (capturedAtMs === null) {
    return true;
  }

  const ageMs = nowMs - capturedAtMs;
  const outcome = typeof latestSnapshot.outcome === 'string' ? latestSnapshot.outcome : 'unknown';

  if (outcome !== 'captured') {
    return ageMs >= FAILED_SNAPSHOT_RETRY_MS;
  }

  return ageMs >= snapshotMaxAgeMs;
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T, index: number) => Promise<R>
): Promise<R[]> {
  if (values.length === 0) {
    return [];
  }

  const result: R[] = new Array(values.length);
  let nextIndex = 0;
  const workerCount = Math.min(concurrency, values.length);

  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= values.length) {
        return;
      }

      result[currentIndex] = await mapper(values[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);
  return result;
}

async function loadCandidates(options: {
  itemId: string | null;
  scanLimit: number;
}): Promise<ItemCandidate[]> {
  const itemId = options.itemId;

  if (itemId) {
    const [{ data: itemRow, error: itemError }, metadataById] = await Promise.all([
      db.from('Item').select('id, sourceUrl, updatedAt').eq('id', itemId).maybeSingle(),
      readMetadataByItemIds([itemId]),
    ]);

    if (itemError) {
      throw itemError;
    }

    const metadata = metadataById.get(itemId) ?? null;
    const normalizedSourceUrl = normalizeSourceUrl(metadata?.sourceUrl ?? itemRow?.sourceUrl) ?? null;
    if (!itemRow || !normalizedSourceUrl) {
      return [];
    }

    return [
      {
        id: itemRow.id,
        sourceUrl: normalizedSourceUrl,
        updatedAt: itemRow.updatedAt,
        metadata,
      },
    ];
  }

  const halfLimit = Math.max(1, Math.ceil(options.scanLimit / 2));
  const [latestItemsResult, oldestItemsResult] = await Promise.all([
    db
      .from('Item')
      .select('id, sourceUrl, updatedAt')
      .not('sourceUrl', 'is', null)
      .order('updatedAt', { ascending: false })
      .limit(halfLimit),
    db
      .from('Item')
      .select('id, sourceUrl, updatedAt')
      .not('sourceUrl', 'is', null)
      .order('updatedAt', { ascending: true })
      .limit(halfLimit),
  ]);

  if (latestItemsResult.error) {
    throw latestItemsResult.error;
  }

  if (oldestItemsResult.error) {
    throw oldestItemsResult.error;
  }

  const byId = new Map<string, { id: string; sourceUrl: string | null; updatedAt: string }>();
  for (const row of [...(latestItemsResult.data ?? []), ...(oldestItemsResult.data ?? [])]) {
    byId.set(row.id, row);
  }

  const rows = [...byId.values()];
  if (rows.length === 0) {
    return [];
  }

  const metadataById = await readMetadataByItemIds(rows.map((row) => row.id));

  const candidates: ItemCandidate[] = [];
  for (const row of rows) {
    const metadata = metadataById.get(row.id) ?? null;
    const normalizedSourceUrl = normalizeSourceUrl(metadata?.sourceUrl ?? row.sourceUrl) ?? null;

    if (!normalizedSourceUrl) {
      continue;
    }

    candidates.push({
      id: row.id,
      sourceUrl: normalizedSourceUrl,
      updatedAt: row.updatedAt,
      metadata,
    });
  }

  return candidates;
}

function pickDueCandidates(
  candidates: ItemCandidate[],
  limit: number,
  force: boolean
): DueCandidate[] {
  const nowMs = Date.now();
  const dueCandidates: DueCandidate[] = [];

  for (const candidate of candidates) {
    const customData = asObject(candidate.metadata?.customData);
    const currentHealth = asObject(customData?.linkHealth);
    const dueAtMs = deriveDueAtMs(currentHealth, candidate.id);

    if (force || dueAtMs <= nowMs) {
      dueCandidates.push({ candidate, dueAtMs });
    }
  }

  dueCandidates.sort((a, b) => {
    if (a.dueAtMs !== b.dueAtMs) {
      return a.dueAtMs - b.dueAtMs;
    }

    return a.candidate.updatedAt.localeCompare(b.candidate.updatedAt);
  });

  return dueCandidates.slice(0, limit);
}

async function refreshCandidate(
  candidate: ItemCandidate,
  options: { captureSnapshots: boolean; snapshotMaxAgeMs: number }
): Promise<{ success?: SuccessfulItemRefresh; failure?: FailedItemRefresh }> {
  try {
    const customData = asObject(candidate.metadata?.customData) ?? {};
    const previousHealth = asObject(customData.linkHealth);
    const previousStatus = asLinkStatus(previousHealth?.status);

    const latestHealth = await checkLinkHealth(candidate.sourceUrl);
    const nextHealth = buildLinkHealthState(latestHealth, previousHealth, candidate.id);
    const statusChanged = previousStatus !== null && previousStatus !== latestHealth.status;

    let snapshot: ArchiveSnapshot | null = null;
    if (
      options.captureSnapshots &&
      shouldCaptureSnapshot(customData, statusChanged, Date.now(), options.snapshotMaxAgeMs)
    ) {
      snapshot = await captureArchiveSnapshot(candidate.sourceUrl);
    }

    const linkHealthHistory = prependBoundedHistory(
      asObjectArray(customData.linkHealthHistory),
      nextHealth,
      MAX_LINK_HEALTH_HISTORY,
      5 * 60 * 1000,
      ['status', 'statusCode', 'error', 'checkedUrl']
    );

    let nextCustomData: JsonObject = {
      ...customData,
      normalizedSourceUrl: candidate.sourceUrl,
      linkHealth: nextHealth,
      linkHealthHistory,
    };

    if (snapshot) {
      const snapshotRecord = snapshot as unknown as JsonObject;
      const snapshotHistory = prependBoundedHistory(
        asObjectArray(customData.archiveSnapshots),
        snapshotRecord,
        MAX_ARCHIVE_HISTORY,
        10 * 60 * 1000,
        ['outcome', 'statusCode', 'contentHash', 'finalUrl', 'error']
      );

      nextCustomData = {
        ...nextCustomData,
        archiveSnapshotLatest: snapshotRecord,
        archiveSnapshots: snapshotHistory,
      };
    }

    const payload: ItemMetadataInsert = {
      itemId: candidate.id,
      sourceUrl: candidate.sourceUrl,
      customData: nextCustomData as ItemMetadataInsert['customData'],
    };

    const { error: upsertError } = await db
      .from('ItemMetadata')
      .upsert(payload, { onConflict: 'itemId' });

    if (upsertError) {
      throw upsertError;
    }

    return {
      success: {
        itemId: candidate.id,
        sourceUrl: candidate.sourceUrl,
        status: latestHealth.status,
        statusCode: latestHealth.statusCode,
        checkedAt: latestHealth.checkedAt,
        changed: statusChanged,
        error: latestHealth.error,
        nextCheckAt: typeof nextHealth.nextCheckAt === 'string' ? nextHealth.nextCheckAt : latestHealth.checkedAt,
        attempts: latestHealth.attempts,
        durationMs: latestHealth.durationMs,
        snapshotCaptured: Boolean(snapshot),
        snapshotOutcome: snapshot?.outcome ?? null,
      },
    };
  } catch (error) {
    return {
      failure: {
        itemId: candidate.id,
        sourceUrl: candidate.sourceUrl,
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

export async function refreshLinkHealthForItems(
  rawOptions: RefreshLinkHealthOptions
): Promise<RefreshLinkHealthResult> {
  const itemId = typeof rawOptions.itemId === 'string' && rawOptions.itemId.trim().length > 0
    ? rawOptions.itemId.trim()
    : null;

  const limit = clamp(parsePositiveInt(rawOptions.limit) ?? DEFAULT_LIMIT, 1, MAX_LIMIT);
  const scanLimit = clamp(
    parsePositiveInt(rawOptions.scanLimit) ?? limit * DEFAULT_SCAN_MULTIPLIER,
    limit,
    MAX_SCAN_LIMIT
  );
  const concurrency = clamp(
    parsePositiveInt(rawOptions.concurrency) ?? DEFAULT_CONCURRENCY,
    1,
    MAX_CONCURRENCY
  );
  const force = itemId ? true : Boolean(rawOptions.force);
  const captureSnapshots = Boolean(rawOptions.captureSnapshots);
  const snapshotMaxAgeMs = clamp(
    parsePositiveInt(rawOptions.snapshotMaxAgeMs) ?? DEFAULT_SNAPSHOT_MAX_AGE_MS,
    30 * 60 * 1000,
    90 * 24 * 60 * 60 * 1000
  );

  const candidates = await loadCandidates({ itemId, scanLimit });
  const dueCandidates = pickDueCandidates(candidates, limit, force);

  const workItems = await mapWithConcurrency(dueCandidates, concurrency, async (due) => {
    return refreshCandidate(due.candidate, {
      captureSnapshots,
      snapshotMaxAgeMs,
    });
  });

  const results: SuccessfulItemRefresh[] = [];
  const failures: FailedItemRefresh[] = [];

  for (const outcome of workItems) {
    if (outcome.success) {
      results.push(outcome.success);
      continue;
    }

    if (outcome.failure) {
      failures.push(outcome.failure);
    }
  }

  const statusCounts: Record<LinkHealthStatus, number> = {
    alive: 0,
    broken: 0,
    unknown: 0,
  };

  for (const result of results) {
    statusCounts[result.status] += 1;
  }

  return {
    candidates: candidates.length,
    scheduled: dueCandidates.length,
    deferred: Math.max(0, candidates.length - dueCandidates.length),
    checked: results.length,
    failures,
    statusCounts,
    results,
  };
}