const BASE_URL = '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('pansion_token');
}

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let body: unknown = null;
  if (contentType && contentType.includes('application/json')) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? (body as { message: string }).message
        : response.statusText;
    throw new ApiError(response.status, message, body);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string): Promise<T> =>
    request<T>(path, { method: 'GET' }),

  post: <T>(path: string, data?: unknown): Promise<T> =>
    request<T>(path, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  put: <T>(path: string, data?: unknown): Promise<T> =>
    request<T>(path, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(path: string, data?: unknown): Promise<T> =>
    request<T>(path, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(path: string): Promise<T> =>
    request<T>(path, { method: 'DELETE' }),
};

export default api;
