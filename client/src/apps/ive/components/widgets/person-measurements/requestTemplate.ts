import { useMemo } from 'react';
import { apiFetch } from '../../../../../hooks/useApiFetch';

/**
 * Executable request template for widget configs. The endpoint/method/body
 * live in the saved config as a template; the widget's live fields
 * (personId, concept lists…) are injected at fetch time via {{param}}
 * placeholders. Because the widget executes exactly this spec, the stored
 * endpoint can never drift from what the widget actually does — which also
 * makes it trustworthy context for AI layout assembly.
 */
export interface RequestSpec {
  /** URL, may contain {{param}} placeholders (URI-encoded on substitution). */
  endpoint: string;
  method?: 'GET' | 'POST';
  /** JSON body template; {{param}} placeholders are JSON-encoded on substitution. */
  body?: string;
}

export interface ResolvedRequest {
  endpoint: string;
  method: 'GET' | 'POST';
  body?: string;
}

export function resolveRequest(
  spec: RequestSpec,
  params: Record<string, unknown>,
): ResolvedRequest {
  const endpoint = spec.endpoint.replace(/\{\{(\w+)\}\}/g, (_, k: string) =>
    encodeURIComponent(String(params[k] ?? '')),
  );
  const body = spec.body?.replace(/\{\{(\w+)\}\}/g, (_, k: string) =>
    JSON.stringify(params[k] ?? null),
  );
  return { endpoint, method: spec.method ?? (body ? 'POST' : 'GET'), body };
}

/**
 * Memoized fetcher for a widget's optional request template. Returns
 * undefined when no template is configured, so callers can fall back to
 * their built-in query: `const load = fetchRows ?? builtInFetch`.
 */
export function useTemplatedFetch<T>(
  spec: RequestSpec | undefined,
  params: Record<string, unknown>,
): (() => Promise<T>) | undefined {
  const specKey = spec ? JSON.stringify(spec) : '';
  const paramsKey = JSON.stringify(params);
  return useMemo(() => {
    if (!spec?.endpoint) return undefined;
    return () => {
      const { endpoint, method, body } = resolveRequest(spec, params);
      return apiFetch<T>(endpoint, method === 'POST' ? { method, body } : undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specKey, paramsKey]);
}
