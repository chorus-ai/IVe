import { apiFetch } from '../../../hooks/useApiFetch';

/**
 * DICOM studies, from the server's own `dicom` feature (`/api/dicom/*`).
 *
 * Not imported from `apps/cada` — that would be a cross-app dependency on
 * another app's internals. The HTTP feature is the shared boundary, and the
 * server never exposes Orthanc directly: it holds full PHI and knows nothing
 * of our sessions, so Node proxies and allowlists every response.
 */

export interface DicomInstanceRef {
  id: string;
  instanceNumber: number | null;
}

export interface DicomSeries {
  id: string;
  SeriesDescription?: string;
  SeriesNumber?: number;
  Modality?: string;
  instanceCount: number;
  /** False for series with no pixel data — presentation states, reports. */
  renderable: boolean;
  instances: DicomInstanceRef[];
}

export interface DicomStudyIndex {
  id: string;
  StudyDescription?: string;
  StudyInstanceUID?: string;
  seriesCount: number;
  instanceCount: number;
  renderableSeriesCount?: number;
  series: DicomSeries[];
}

/** Allowlisted header — no patient identifiers reach the client. */
export interface DicomInstanceMeta {
  Rows?: number;
  Columns?: number;
  WindowCenter?: number | number[];
  WindowWidth?: number | number[];
  Modality?: string;
  /** "YES" when pixels may carry burned-in identifiers no header can hide. */
  BurnedInAnnotation?: string;
  [tag: string]: unknown;
}

export const listStudies = () => apiFetch<DicomStudyIndex[]>('/api/dicom/studies');

export const getStudy = (id: string) =>
  apiFetch<DicomStudyIndex>(`/api/dicom/studies/${encodeURIComponent(id)}`);

export const getInstanceMetadata = (id: string) =>
  apiFetch<DicomInstanceMeta>(`/api/dicom/instances/${encodeURIComponent(id)}/metadata`);

/**
 * URL for a rendered frame. Orthanc applies window/level server-side, so a
 * window change is a new cacheable URL rather than a client-side re-render —
 * which is what lets this page exist without a WebGL renderer in the bundle.
 */
export function frameUrl(
  instanceId: string,
  opts: { windowCenter?: number; windowWidth?: number; width?: number } = {},
): string {
  const p = new URLSearchParams();
  if (opts.windowCenter !== undefined) p.set('wc', String(Math.round(opts.windowCenter)));
  if (opts.windowWidth !== undefined) p.set('ww', String(Math.round(opts.windowWidth)));
  if (opts.width !== undefined) p.set('w', String(Math.round(opts.width)));
  const qs = p.toString();
  return `/api/dicom/instances/${encodeURIComponent(instanceId)}/preview${qs ? `?${qs}` : ''}`;
}

/** CT presets from doc/ive/ive-page7b-dicom.md. */
export const WINDOW_PRESETS = [
  { id: 'default', label: 'Default', center: null, width: null },
  { id: 'soft', label: 'Soft tissue', center: 40, width: 400 },
  { id: 'lung', label: 'Lung', center: -600, width: 1500 },
  { id: 'bone', label: 'Bone', center: 300, width: 1500 },
  { id: 'brain', label: 'Brain', center: 40, width: 80 },
] as const;
