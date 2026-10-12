/**
 * The public CADA demo runs with no session. It is deployed where anyone can
 * open it, and every `/api` route behind `middleware/auth.js` answers 401 —
 * which our own 401 handling turns into a redirect to /signin. A visitor
 * clicking a Save button, or simply reloading the page, would be bounced to a
 * login form for an account they don't have.
 *
 * So requests to our API are refused here, at the network layer, rather than
 * relying on every annotation panel remembering to guard its own fetches. The
 * panels are the legacy components, shared with the authenticated app; this
 * keeps the demo safe without forking them.
 *
 * Demo fixtures are unaffected: they are absolute CDN URLs, not /api paths
 * (see apps/cada/api/files.ts).
 */

export const DEMO_PATH_PREFIX = '/cada/demo';

/** Thrown instead of issuing a request the demo isn't allowed to make. */
export class DemoOfflineError extends Error {
  constructor(url: string) {
    super(`Blocked in demo mode: ${url}`);
    this.name = 'DemoOfflineError';
  }
}

export function isDemoRoute(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.location.pathname.startsWith(DEMO_PATH_PREFIX)
  );
}

/** Our own API — relative /api/…, or an absolute URL on this origin. */
export function isApiUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('/api')) return true;
  return (
    typeof window !== 'undefined' &&
    url.startsWith(`${window.location.origin}/api`)
  );
}

/** True when this request must not be sent. */
export function isBlockedInDemo(url: string): boolean {
  return isDemoRoute() && isApiUrl(url);
}
