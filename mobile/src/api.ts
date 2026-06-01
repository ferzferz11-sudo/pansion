const BASE_URL = '/api/v1';

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });

  let body: unknown = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    body = await response.json();
  } else {
    const text = await response.text();
    body = text || null;
  }

  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'error' in body
        ? (body as { error: string }).error
        : typeof body === 'object' && body !== null && 'message' in body
        ? (body as { message: string }).message
        : String(body) || response.statusText;
    throw new ApiError(response.status, message, body);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string, token?: string | null): Promise<T> =>
    request<T>(path, { method: 'GET' }, token),

  post: <T>(path: string, data?: unknown, token?: string | null): Promise<T> =>
    request<T>(path, { method: 'POST', body: data !== undefined ? JSON.stringify(data) : undefined }, token),

  put: <T>(path: string, data?: unknown, token?: string | null): Promise<T> =>
    request<T>(path, { method: 'PUT', body: data ? JSON.stringify(data) : undefined }, token),

  patch: <T>(path: string, data?: unknown, token?: string | null): Promise<T> =>
    request<T>(path, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }, token),

  delete: <T>(path: string, token?: string | null): Promise<T> =>
    request<T>(path, { method: 'DELETE' }, token),
};

export default api;
