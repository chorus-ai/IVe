/** Shared API types for the IVE app. */

export interface IveTag {
  id: number;
  slug: string;
}

export interface IveUserRef {
  id: number;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface IveTagResources {
  tag: IveTag;
  layouts: unknown[];
  widgets: unknown[];
  endpoints: unknown[];
}

/** Convert any human label into a backend-acceptable slug. */
export function toSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Format a slug back into a display label (e.g. "admin-panel" → "Admin Panel"). */
export function fromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(' ');
}
