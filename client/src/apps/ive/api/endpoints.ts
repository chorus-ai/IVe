import { apiFetch } from '../../../hooks/useApiFetch';
import type { IveTag, IveUserRef } from './types';

const BASE = '/api/ive/endpoint';

export interface SavedEndpoint {
  id?: number;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: {
    body?: Record<string, unknown>;
    attributes?: string[];
    countOnly?: boolean;
  };
  description?: string;
  /** Legacy free-form tags stored as a JSON blob on the row. Prefer iveTags. */
  tags?: string[];
  /** Tags from the iveTag join table (slug-only). */
  iveTags?: IveTag[];
  isPublic?: boolean;
  isCached?: boolean;
  createdBy?: IveUserRef;
  createdAt?: string;
  updatedAt?: string;
}

/* ─────── CRUD ─────── */

export function listEndpointsByUser(userId: number | string): Promise<SavedEndpoint[]> {
  return apiFetch<SavedEndpoint[]>(`${BASE}/users/${userId}`);
}

/** All endpoints visible to the caller: owned by them OR public. */
export function listVisibleEndpoints(): Promise<SavedEndpoint[]> {
  return apiFetch<SavedEndpoint[]>(BASE);
}

export function getEndpointById(id: number | string): Promise<SavedEndpoint> {
  return apiFetch<SavedEndpoint>(`${BASE}/${id}`);
}

/** Filter endpoints by tag slug via the iveTag join table. */
export function listEndpointsByTagSlug(slug: string): Promise<SavedEndpoint[]> {
  return apiFetch<SavedEndpoint[]>(`${BASE}?tag=${encodeURIComponent(slug)}`);
}

/** Legacy: filter via the JSON-blob `tags` column. Prefer listEndpointsByTagSlug. */
export function listEndpointsByLegacyTag(tagName: string): Promise<SavedEndpoint[]> {
  return apiFetch<SavedEndpoint[]>(`${BASE}/tags/${encodeURIComponent(tagName)}`);
}

export function createEndpoint(
  data: Omit<SavedEndpoint, 'id' | 'createdBy' | 'iveTags' | 'createdAt' | 'updatedAt'>
): Promise<SavedEndpoint> {
  return apiFetch<SavedEndpoint>(BASE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateEndpoint(id: number | string, data: Partial<SavedEndpoint>): Promise<SavedEndpoint> {
  return apiFetch<SavedEndpoint>(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteEndpoint(id: number | string): Promise<void> {
  return apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' });
}

/* ─────── Tags ─────── */

export function attachEndpointTags(id: number | string, slugs: string[]): Promise<SavedEndpoint> {
  return apiFetch<SavedEndpoint>(`${BASE}/${id}/tags`, {
    method: 'POST',
    body: JSON.stringify({ slugs }),
  });
}

export function setEndpointTags(id: number | string, slugs: string[]): Promise<SavedEndpoint> {
  return apiFetch<SavedEndpoint>(`${BASE}/${id}/tags`, {
    method: 'PUT',
    body: JSON.stringify({ slugs }),
  });
}

export function detachEndpointTag(id: number | string, tagId: number | string): Promise<SavedEndpoint> {
  return apiFetch<SavedEndpoint>(`${BASE}/${id}/tags/${tagId}`, { method: 'DELETE' });
}

/* ─────── Execution ─────── */

export interface EndpointRunResult {
  header: string[];
  rows: unknown[][];
  count?: number;
}

/**
 * Run a saved endpoint and return its rows.
 *
 * The stored `endpoint` is relative to the OMOP feature — ClinicalTablesDetail
 * builds it as `/<table>/search` — so it is prefixed here rather than at the
 * call site. A definition that already carries a full `/api/...` path is passed
 * through untouched.
 *
 * Paging and countOnly are query params, never body fields: the server's search
 * validator rejects them in the body (see omop-search-validator.js).
 */
export async function runEndpoint(
  ep: Pick<SavedEndpoint, 'endpoint' | 'method' | 'params'>,
  opts: { page?: number; pageSize?: number } = {},
): Promise<EndpointRunResult> {
  const { page = 1, pageSize = 25 } = opts;

  const path = ep.endpoint.startsWith('/api/') ? ep.endpoint : `/api/omop${ep.endpoint}`;
  const countOnly = !!ep.params?.countOnly;

  const qs = new URLSearchParams();
  if (countOnly) {
    qs.set('countOnly', 'true');
  } else {
    qs.set('page', String(page));
    qs.set('pageSize', String(pageSize));
  }

  const url = `${path}?${qs.toString()}`;
  const method = (ep.method ?? 'POST').toUpperCase();

  if (method === 'GET') return apiFetch<EndpointRunResult>(url);

  return apiFetch<EndpointRunResult>(url, {
    method: 'POST',
    body: JSON.stringify(ep.params?.body ?? {}),
  });
}
