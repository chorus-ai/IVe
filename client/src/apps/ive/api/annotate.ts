import { apiFetch } from '../../../hooks/useApiFetch';

/**
 * Subject-level annotation — the smallest slice of doc/ive/IVe_annotation_plan.md.
 *
 * One event per subject, no geometry: the target is the person, and the form
 * captures a verdict about them. Every richer target (note span, DICOM ROI,
 * waveform segment) reuses this same project -> queue -> form -> save -> next
 * loop with a richer `selection`, so proving this proves the flow.
 *
 * Uses CADA's existing endpoints unchanged — `cadaProject`, `cadaEvent`,
 * `cadaAnnotation`, `form`. Nothing new server-side. Called over HTTP rather
 * than importing apps/cada, which would be a cross-app dependency.
 */

export interface AnnotateFormField {
  id: number;
  label: string;
  type: string;
  required: boolean;
  order: number;
  options?: Record<string, string[]> | string[] | null;
}

export interface AnnotateEvent {
  id: number;
  /** For a subject event this is the person id. */
  cadaFile?: { id: number; path: string };
  cadaAnnotations?: {
    id: number;
    userId: number;
    completed: boolean;
    cadaAnnotationValues?: { id: number; field: string; value: string }[];
  }[];
}

export interface AnnotateProject {
  id: number;
  name: string;
  projectType?: string;
  attributes?: string | null;
}

/** Events assigned to this user, incomplete first. */
export const getQueue = (pid: number, uid: number, showCompleted = false) => {
  const params = new URLSearchParams({ pid: String(pid), uid: String(uid), pageSize: '1000' });
  if (!showCompleted) params.set('completed', '0');
  return apiFetch<AnnotateEvent[]>(`/api/cada/event/assignments?${params}`);
};

export const getProject = (pid: number) =>
  apiFetch<AnnotateProject>(`/api/cada/project/${pid}`);

export const getForm = (formId: number) =>
  apiFetch<{ id: number; title: string; formFields: AnnotateFormField[] }>(
    `/api/form/form/${formId}`,
  );

/**
 * One value per form field. CADA stores values individually rather than as a
 * blob, so a save is N posts; `completed` is flipped on the last one so a
 * half-saved event is never marked done.
 */
export async function saveAnnotation(
  cadaAnnotationId: number,
  values: { field: string; value: string }[],
): Promise<void> {
  for (let i = 0; i < values.length; i += 1) {
    await apiFetch('/api/cada/event/annotationValue', {
      method: 'POST',
      body: JSON.stringify({
        ...values[i],
        cadaAnnotationId,
        completed: i === values.length - 1,
      }),
    });
  }
}
