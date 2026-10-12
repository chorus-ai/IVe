import { apiFetch } from '../../../hooks/useApiFetch';
import type { IveTag, IveTagResources } from './types';

const BASE = '/api/ive/tag';

/** Create a tag. Backend accepts slug only — frontend must normalize first. */
export function createTag(slug: string): Promise<IveTag> {
  return apiFetch<IveTag>(BASE, {
    method: 'POST',
    body: JSON.stringify({ slug }),
  });
}

export function listTags(): Promise<IveTag[]> {
  return apiFetch<IveTag[]>(BASE);
}

export function getTagBySlug(slug: string): Promise<IveTag> {
  return apiFetch<IveTag>(`${BASE}/${encodeURIComponent(slug)}`);
}

export function deleteTagById(id: number | string): Promise<void> {
  return apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' });
}

/** Fan-out: layouts + widgets + endpoints carrying this tag. */
export function getResourcesForSlug(slug: string): Promise<IveTagResources> {
  return apiFetch<IveTagResources>(`${BASE}/${encodeURIComponent(slug)}/resources`);
}
