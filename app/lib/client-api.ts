interface ApiErrorPayload {
  error?: string;
  message?: string;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface JsonRequestOptions<TBody> {
  method?: HttpMethod;
  body?: TBody;
  signal?: AbortSignal;
  errorMessage: string;
}

async function readApiErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  try {
    const payload = await response.json() as ApiErrorPayload;
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error;
    }
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message;
    }
  } catch {
    // Ignore response parsing failures and use fallback message.
  }

  return fallbackMessage;
}

async function requestJson<TResponse, TBody = undefined>(
  url: string,
  { method = 'GET', body, signal, errorMessage }: JsonRequestOptions<TBody>
): Promise<TResponse> {
  const hasBody = body !== undefined;
  const response = await fetch(url, {
    method,
    headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
    body: hasBody ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, errorMessage));
  }

  return response.json() as Promise<TResponse>;
}

export interface CanvasNodePosition {
  id: string;
  x: number;
  y: number;
}

interface SaveCanvasResponse {
  success: boolean;
}

export async function saveCanvasLayout(nodes: CanvasNodePosition[]): Promise<SaveCanvasResponse> {
  return requestJson<SaveCanvasResponse, { nodes: CanvasNodePosition[] }>('/api/canvas/save', {
    method: 'POST',
    body: { nodes },
    errorMessage: 'Failed to save canvas layout',
  });
}

export interface ImageColorData {
  hex: string;
  name?: string;
  rgb?: number[];
  population?: number;
}

interface ExtractColorsResponse {
  colors?: ImageColorData[];
}

function isImageColorData(value: unknown): value is ImageColorData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const color = value as { hex?: unknown; name?: unknown; rgb?: unknown; population?: unknown };
  if (typeof color.hex !== 'string' || !color.hex.trim()) {
    return false;
  }

  if (color.name !== undefined && typeof color.name !== 'string') {
    return false;
  }

  if (color.rgb !== undefined && (!Array.isArray(color.rgb) || !color.rgb.every((channel) => typeof channel === 'number'))) {
    return false;
  }

  if (color.population !== undefined && typeof color.population !== 'number') {
    return false;
  }

  return true;
}

export function imageColorsQueryKey(imageUrl: string) {
  return ['image-colors', imageUrl] as const;
}

export async function extractImageColors(imageUrl: string, signal?: AbortSignal): Promise<ImageColorData[]> {
  const payload = await requestJson<ExtractColorsResponse, { imageUrl: string }>('/api/items/extract-colors', {
    method: 'POST',
    body: { imageUrl },
    signal,
    errorMessage: 'Failed to extract colors',
  });

  if (!Array.isArray(payload.colors)) {
    return [];
  }

  return payload.colors.filter(isImageColorData);
}
