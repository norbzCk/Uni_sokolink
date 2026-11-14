const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export interface ApiErrorBody {
  message?: string;
  code?: string;
  retryAfter?: number;
  fieldErrors?: string[];
  correlationId?: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly fieldErrors?: string[],
    public readonly retryAfter?: number,
    public readonly correlationId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function normalizeFieldErrors(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string');
  }
  if (value && typeof value === 'object') {
    return Object.values(value).filter((entry): entry is string => typeof entry === 'string');
  }
  return undefined;
}

function buildUrl(path: string): string {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL : API_BASE_URL + '/';
  return new URL(path.replace(/^\//, ''), base).toString();
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string | null,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', 'Bearer ' + accessToken);
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({ message: 'Request failed' }))) as ApiErrorBody;
    throw new ApiError(
      response.status,
      body.message ?? 'Request failed',
      body.code,
      normalizeFieldErrors(body.fieldErrors),
      body.retryAfter,
      body.correlationId,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return base + (path.startsWith('/') ? path : '/' + path);
}
