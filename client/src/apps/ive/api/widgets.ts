import { apiFetch } from '../../../hooks/useApiFetch';
import type { WidgetConfig } from '../components/widgets/types';
import type { IveTag, IveUserRef } from './types';

const BASE = '/api/ive/widget';

export interface WidgetTemplate {
  id?: number;
  name: string;
  type: string;
  config: WidgetConfig | string;
  iveTags?: IveTag[];
  createdBy?: IveUserRef;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListWidgetsParams {
  type?: string;
  page?: number;
  pageSize?: number;
  sortOrder?: 'asc' | 'desc' | 'ASC' | 'DESC';
  /** When set, returns only widgets carrying this tag slug. */
  tag?: string;
}

const qs = (p: Record<string, string | number | undefined>) =>
  Object.entries(p)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');

/* ─────── CRUD ─────── */

export function listWidgets(params: ListWidgetsParams = {}): Promise<WidgetTemplate[]> {
  const q = qs(params as Record<string, string | number | undefined>);
  return apiFetch<WidgetTemplate[]>(q ? `${BASE}?${q}` : BASE);
}

export function getWidgetById(id: number | string): Promise<WidgetTemplate> {
  return apiFetch<WidgetTemplate>(`${BASE}/${id}`);
}

export function searchWidgets(name: string, page = 1, pageSize = 10, sortOrder: 'asc' | 'desc' = 'desc'): Promise<WidgetTemplate[]> {
  return apiFetch<WidgetTemplate[]>(`${BASE}/search`, {
    method: 'POST',
    body: JSON.stringify({ name, page, pageSize, sortOrder }),
  });
}

export function createWidget(
  data: Omit<WidgetTemplate, 'id' | 'createdBy' | 'iveTags' | 'createdAt' | 'updatedAt'>
): Promise<WidgetTemplate> {
  return apiFetch<WidgetTemplate>(BASE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateWidget(id: number | string, data: Partial<WidgetTemplate>): Promise<WidgetTemplate> {
  return apiFetch<WidgetTemplate>(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteWidget(id: number | string): Promise<void> {
  return apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' });
}

/* ─────── Tags ─────── */

export function attachWidgetTags(id: number | string, slugs: string[]): Promise<WidgetTemplate> {
  return apiFetch<WidgetTemplate>(`${BASE}/${id}/tags`, {
    method: 'POST',
    body: JSON.stringify({ slugs }),
  });
}

export function setWidgetTags(id: number | string, slugs: string[]): Promise<WidgetTemplate> {
  return apiFetch<WidgetTemplate>(`${BASE}/${id}/tags`, {
    method: 'PUT',
    body: JSON.stringify({ slugs }),
  });
}

export function detachWidgetTag(id: number | string, tagId: number | string): Promise<WidgetTemplate> {
  return apiFetch<WidgetTemplate>(`${BASE}/${id}/tags/${tagId}`, { method: 'DELETE' });
}

