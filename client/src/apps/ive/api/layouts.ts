import { DashboardLayout, WidgetConfig } from '../components/widgets/types';
import { apiFetch } from '../../../hooks/useApiFetch';
import type { IveTag, IveUserRef } from './types';

const BASE = '/api/ive/layout';

// Server response shape
interface ServerLayout {
  id: number;
  name: string;
  config: WidgetConfig[] | string;
  iveTags?: IveTag[];
  createdBy?: IveUserRef;
  createdAt?: string;
  updatedAt?: string;
}

function toLayout(raw: ServerLayout): DashboardLayout {
  const widgets = Array.isArray(raw.config)
    ? raw.config
    : raw.config
      ? JSON.parse(raw.config as string)
      : [];
  return {
    id: String(raw.id),
    name: raw.name,
    tags: (raw.iveTags ?? []).map((t) => t.slug),
    date: raw.createdAt?.split('T')[0] ?? new Date().toISOString().split('T')[0],
    widgets,
    createdBy: raw.createdBy,
    iveTags: raw.iveTags ?? [],
  };
}

/* ─────── CRUD ─────── */

export async function listLayouts({
  page = 1,
  pageSize = 10,
  sortOrder = 'DESC',
  q = '',
  tag,
}: {
  page?: number;
  pageSize?: number;
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
  q?: string;
  /** Filter by tag slug. Skips pagination/search params. */
  tag?: string;
} = {}): Promise<DashboardLayout[]> {
  let raw: ServerLayout[];
  if (tag) {
    raw = await apiFetch<ServerLayout[]>(`${BASE}?tag=${encodeURIComponent(tag)}`);
  } else if (q.trim()) {
    raw = await apiFetch<ServerLayout[]>(`${BASE}/search`, {
      method: 'POST',
      body: JSON.stringify({ name: q, page, pageSize, sortOrder }),
    });
  } else {
    raw = await apiFetch<ServerLayout[]>(
      `${BASE}?page=${page}&pageSize=${pageSize}&sortOrder=${sortOrder}`
    );
  }
  return raw.map(toLayout);
}

export async function getLayoutById(id: number | string): Promise<DashboardLayout> {
  const raw = await apiFetch<ServerLayout>(`${BASE}/${id}`);
  return toLayout(raw);
}

export async function createLayout({
  name,
  widgets,
}: {
  name: string;
  widgets: WidgetConfig[];
}): Promise<DashboardLayout> {
  const raw = await apiFetch<ServerLayout>(BASE, {
    method: 'POST',
    body: JSON.stringify({ name, config: widgets }),
  });
  return toLayout(raw);
}

export async function updateLayout({
  id,
  name,
  widgets,
}: {
  id: number | string;
  name: string;
  widgets: WidgetConfig[];
}): Promise<DashboardLayout> {
  const raw = await apiFetch<ServerLayout>(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, config: widgets }),
  });
  return toLayout(raw);
}

export async function deleteLayout(id: number | string): Promise<void> {
  return apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' });
}

/* ─────── Tags ─────── */

export async function attachLayoutTags(id: number | string, slugs: string[]): Promise<DashboardLayout> {
  const raw = await apiFetch<ServerLayout>(`${BASE}/${id}/tags`, {
    method: 'POST',
    body: JSON.stringify({ slugs }),
  });
  return toLayout(raw);
}

export async function setLayoutTags(id: number | string, slugs: string[]): Promise<DashboardLayout> {
  const raw = await apiFetch<ServerLayout>(`${BASE}/${id}/tags`, {
    method: 'PUT',
    body: JSON.stringify({ slugs }),
  });
  return toLayout(raw);
}

export async function detachLayoutTag(id: number | string, tagId: number | string): Promise<DashboardLayout> {
  const raw = await apiFetch<ServerLayout>(`${BASE}/${id}/tags/${tagId}`, { method: 'DELETE' });
  return toLayout(raw);
}

