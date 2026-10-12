import { apiFetch } from '../../../hooks/useApiFetch'
import { qs } from '../utils/queryString'

export interface OmopTabularResponse {
  header: string[]
  rows: unknown[][]
  count?: number
}

export async function getOmopRows(
  table: string,
  params: { page: number; pageSize: number },
  filters?: Record<string, unknown>
): Promise<OmopTabularResponse> {
  const base = `/api/omop/${table}`
  const hasFilters = filters && Object.keys(filters).length > 0
  const query = qs(params)

  if (hasFilters) {
    return apiFetch<OmopTabularResponse>(`${base}/search?${query}`, {
      method: 'POST',
      body: JSON.stringify(filters),
    })
  }

  return apiFetch<OmopTabularResponse>(`${base}?${query}`)
}

export async function getOmopCount(
  table: string,
  filters?: Record<string, unknown>
): Promise<number> {
  const base = `/api/omop/${table}`
  const hasFilters = filters && Object.keys(filters).length > 0
  const query = qs({ countOnly: 'true'})

  const raw = hasFilters
    ? await apiFetch<OmopTabularResponse>(`${base}/search?${query}`, {
        method: 'POST',
        body: JSON.stringify(filters),
      })
    : await apiFetch<OmopTabularResponse>(`${base}?${query}`)

  return typeof raw.count === 'number' ? raw.count : -1
}
