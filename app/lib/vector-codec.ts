export function serializeVector(vector: readonly number[]): string {
  return `[${vector.join(',')}]`;
}

export function parseVector(raw: string | null | undefined): number[] | null {
  if (typeof raw !== 'string') {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
    return null;
  }

  const entries = trimmed
    .slice(1, -1)
    .split(',')
    .map((entry) => Number(entry.trim()));

  if (entries.length === 0 || entries.some((entry) => !Number.isFinite(entry))) {
    return null;
  }

  return entries;
}
