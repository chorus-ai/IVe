import { apiFetch } from '../../../hooks/useApiFetch';
import {
  conceptLoaded,
  conceptLoading,
  conceptError,
  type ConceptRecord,
  type ConceptsState,
} from '../store';

const BASE = '/api/vocab/concept';

export function getConcept(id: string | number): Promise<ConceptRecord> {
  return apiFetch<ConceptRecord>(`${BASE}/${id}`);
}

export function searchConcepts(
  name: string,
  table?: string,
): Promise<{ rows?: ConceptRecord[] } | ConceptRecord[]> {
  const params = new URLSearchParams();
  params.set('name', name);
  if (table) params.set('table', table);
  return apiFetch(`${BASE}/search?${params.toString()}`);
}

/** Module-level dedupe so concurrent dispatches in the same tick don't double-fetch. */
const inFlight = new Set<string>();

const isLoadable = (id: unknown): id is string | number =>
  id != null && id !== '' && Number(id) !== 0 && Number.isFinite(Number(id));

/**
 * Dispatch a fetch for the given concept id, but only if it isn't already
 * cached, in-flight, or errored in the redux store. Safe to call repeatedly.
 */
export function loadConcept(
  dispatch: (action: unknown) => void,
  id: string | number | null | undefined,
  state: ConceptsState,
): void {
  if (!isLoadable(id)) return;
  const key = String(id);
  if (state.byId[key] || state.loading[key] || state.errors[key]) return;
  if (inFlight.has(key)) return;

  inFlight.add(key);
  dispatch(conceptLoading(key));
  getConcept(key)
    .then((c) => dispatch(conceptLoaded({ ...c, concept_id: c?.concept_id ?? key })))
    .catch((e) => {
      dispatch(conceptError({ id: key, error: e?.message ?? 'Failed to load' }));
      // Also seed byId with a stub so the UI can render the canonical "no name"
      // state ("—") and we don't try to re-fetch on every re-render.
      dispatch(conceptLoaded({ concept_id: key }));
    })
    .finally(() => inFlight.delete(key));
}
