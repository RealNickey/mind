interface ApiErrorPayload {
  error?: string;
  message?: string;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface JsonRequestOptions<TBody> {
  method?: HttpMethod;
  body?: TBody;
  signal?: AbortSignal;
  cache?: RequestCache;
  headers?: HeadersInit;
  errorMessage: string;
}

export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
  }
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
    // Ignore parsing failures and use fallback message.
  }

  return fallbackMessage;
}

function buildHeaders(headers: HeadersInit | undefined, hasBody: boolean): Headers | undefined {
  const normalized = new Headers(headers);
  if (hasBody && !normalized.has('Content-Type')) {
    normalized.set('Content-Type', 'application/json');
  }

  return [...normalized.keys()].length > 0 ? normalized : undefined;
}

async function readJsonResponse<TResponse>(response: Response): Promise<TResponse> {
  const text = await response.text();
  if (!text.trim()) {
    return undefined as TResponse;
  }

  try {
    return JSON.parse(text) as TResponse;
  } catch {
    throw new ApiClientError('Received an invalid JSON response', response.status);
  }
}

export async function requestJson<TResponse, TBody = undefined>(
  url: string,
  {
    method = 'GET',
    body,
    signal,
    cache,
    headers,
    errorMessage,
  }: JsonRequestOptions<TBody>
): Promise<TResponse> {
  const hasBody = body !== undefined;
  const response = await fetch(url, {
    method,
    signal,
    cache,
    headers: buildHeaders(headers, hasBody),
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new ApiClientError(await readApiErrorMessage(response, errorMessage), response.status);
  }

  return readJsonResponse<TResponse>(response);
}
