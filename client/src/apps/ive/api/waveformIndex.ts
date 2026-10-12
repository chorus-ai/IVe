import { apiFetch } from '../../../hooks/useApiFetch';

/**
 * Discovering a subject's waveform recordings from the bucket.
 *
 * There is no waveform index table — `cadaFiles` holds 1086 rows and none are
 * `.hea`/`.dat`. The records live on disk under BUCKET_PATH and are listed
 * through the existing `GET /api/bucket/<path>` endpoint, so this needs no
 * server change.
 *
 * Two layouts exist in the bucket, and they differ in what time information
 * they carry:
 *
 *   output/EPICU_E4104A/EPICU_E4104A-1693584000-2023-09-01_12-00-00.hea
 *     the epoch is in the filename, and the wfdb decoder returns a real
 *     StartTime plus a ~24h DurationSec. Placeable on a calendar axis.
 *
 *   waveforms/mimic_iv/p169/p16955095/82284982/82284982_0000.hea
 *     the path carries the subject id (p16955095), but the records are
 *     de-identified: StartTime comes back null. Duration is known (~600s),
 *     absolute position is not.
 *
 * So EPICU records can be drawn on the timeline and MIMIC ones cannot, which
 * is a property of the data rather than something to work around.
 */

interface BucketEntry {
  type: 'file' | 'dir';
  path: string;
}

interface BucketListing {
  fileLength: number;
  files: BucketEntry[];
}

export interface WaveformRecord {
  /** Bucket path without the .hea suffix — what /api/waveform/wfdb wants. */
  record: string;
  /** Epoch ms, from the filename. Null when the layout carries no timestamp. */
  startMs: number | null;
  /** Seconds, inferred from the next record's start (continuous recording). */
  durationSec: number | null;
  label: string;
}

/** `EPICU_E4104A-1693584000-...` -> 1693584000. Seconds since epoch. */
const epochFromName = (name: string): number | null => {
  const m = name.match(/-(\d{10})(?:\D|$)/);
  if (!m) return null;
  const secs = Number(m[1]);
  return Number.isFinite(secs) ? secs * 1000 : null;
};

const listDir = (path: string) =>
  apiFetch<BucketListing>(`/api/bucket/${path.split('/').map(encodeURIComponent).join('/')}`);

/**
 * Records under one bucket prefix, ordered in time.
 *
 * Duration is taken from the gap to the next record rather than by decoding
 * each one: a subject can have 86 records, and the wfdb decoder shells out to
 * Python per call. For a continuous recording the gap *is* the duration, and
 * the exact value is read when a record is actually opened.
 */
export async function listWaveformRecords(prefix: string): Promise<WaveformRecord[]> {
  const listing = await listDir(prefix);

  const heads = listing.files
    .filter((f) => f.type === 'file' && f.path.endsWith('.hea'))
    .map((f) => {
      const stem = f.path.replace(/\.hea$/, '');
      return {
        record: `${prefix}/${stem}`,
        startMs: epochFromName(stem),
        durationSec: null as number | null,
        label: stem,
      };
    })
    .filter((r) => r.startMs !== null)
    .sort((a, b) => (a.startMs! - b.startMs!));

  // Continuous recording: each block runs until the next one starts. The last
  // gets the median of the others so it is not drawn as a zero-width sliver.
  const gaps: number[] = [];
  for (let i = 0; i < heads.length - 1; i += 1) {
    const gap = (heads[i + 1].startMs! - heads[i].startMs!) / 1000;
    heads[i].durationSec = gap;
    if (gap > 0) gaps.push(gap);
  }
  if (heads.length) {
    const sorted = [...gaps].sort((a, b) => a - b);
    heads[heads.length - 1].durationSec = sorted.length
      ? sorted[Math.floor(sorted.length / 2)]
      : 3600;
  }

  return heads;
}

/** Subject folders under a root, e.g. `output` -> EPICU_E4103A, E4104A, … */
export async function listWaveformSubjects(root: string): Promise<string[]> {
  const listing = await listDir(root);
  return listing.files.filter((f) => f.type === 'dir').map((f) => f.path);
}
