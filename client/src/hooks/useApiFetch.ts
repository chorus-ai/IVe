import { DemoOfflineError, isBlockedInDemo, isDemoRoute } from '../utils/demoMode';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Our own API, versus somewhere else. A cross-origin GET has to go out bare:
 * credentials require the server to name our origin and send
 * `Access-Control-Allow-Credentials`, and a `Content-Type` header turns the GET
 * into a preflighted request — a public CDN does neither, so either one makes
 * the browser block the response. The CADA demo fetches its fixtures from one.
 */
const isSameOrigin = (url: string) =>
  !/^https?:\/\//i.test(url) || url.startsWith(window.location.origin);

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // The public demo may not call our API at all — see utils/demoMode.ts.
  if (isBlockedInDemo(url)) throw new DemoOfflineError(url);

  const sameOrigin = isSameOrigin(url);

  const res = await fetch(url, {
    credentials: sameOrigin ? 'include' : 'omit',
    headers: sameOrigin
      ? {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...options.headers,
        }
      : { ...options.headers },
    ...options,
  });

  if (res.status === 401) {
    const path = window.location.pathname;
    if (
      !isDemoRoute() &&
      !url.includes('/auth/me') &&
      !path.startsWith('/signin') &&
      !path.startsWith('/signup') &&
      !path.startsWith('/resetpassword')
    ) {
      window.location.href = '/signin';
    }
    throw new ApiError('Unauthorized', 401);
  }

  if (!res.ok) {
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      data = await res.text();
    }
    const message =
      typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message: string }).message)
        : res.statusText;
    throw new ApiError(message, res.status, data);
  }

  const text = await res.text();
  if (!text) return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}
