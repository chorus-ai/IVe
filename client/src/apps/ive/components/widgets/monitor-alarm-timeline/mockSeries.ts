/**
 * Deterministic mock-signal helpers for the SuperAlarm-style ICU widgets
 * (monitor-alarm-score, monitor-alarm-timeline, monitor-vitals, labs-dotplot). These panels
 * have no backing endpoint yet, so they synthesize plausible bedside data;
 * seeding from the widget config keeps every render (and every subject)
 * stable instead of reshuffling on each mount.
 */

/** Small fast PRNG; same seed → same sequence. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable numeric seed from arbitrary config parts (person id, widget type…). */
export function seedFrom(...parts: (string | number | undefined)[]): number {
  const s = parts.map((p) => String(p ?? '')).join('|');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface MockTick {
  ts: number;
  /** 0..1 position along the axis. */
  frac: number;
  label: string;
}

export interface MockAxis {
  startTs: number;
  endTs: number;
  hours: number;
  ticks: MockTick[];
}

const DEFAULT_DAY = '2019-02-12';

function fmtTick(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const ampm = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = d.getMinutes();
  return `${d.getMonth() + 1}/${d.getDate()} ${h12}:${String(mm).padStart(2, '0')}${ampm}`;
}

/** Intraday review window (default: 12 h from midnight of `startDate`). */
export function buildAxis(startDate?: string, hours = 12, stepHours = 1.5): MockAxis {
  const base = new Date(`${startDate || DEFAULT_DAY}T00:00:00`);
  const startTs = Number.isFinite(base.getTime())
    ? base.getTime()
    : new Date(`${DEFAULT_DAY}T00:00:00`).getTime();
  const endTs = startTs + hours * 3600_000;
  const ticks: MockTick[] = [];
  for (let h = stepHours; h < hours; h += stepHours) {
    const ts = startTs + h * 3600_000;
    ticks.push({ ts, frac: h / hours, label: fmtTick(ts) });
  }
  return { startTs, endTs, hours, ticks };
}

/**
 * `count` event positions (0..1 fractions) clustered into bursts, the way
 * monitor alarms fire: a few dense episodes over a uniform background.
 */
export function genEvents(rand: () => number, count: number, clusters = 5): number[] {
  const centers = Array.from({ length: clusters }, () => rand());
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    if (rand() < 0.35) {
      out.push(rand()); // background noise
    } else {
      const c = centers[Math.floor(rand() * centers.length)];
      // Sum of two uniforms ≈ triangular spread around the cluster center.
      const spread = (rand() + rand() - 1) * 0.06;
      out.push(Math.min(1, Math.max(0, c + spread)));
    }
  }
  return out.sort((a, b) => a - b);
}

/** Bounded random walk with occasional spikes — a plausible vital-sign trend. */
export function genWalk(
  rand: () => number,
  n: number,
  opts: { base: number; jitter: number; spikeProb?: number; spikeMag?: number; min: number; max: number },
): number[] {
  const { base, jitter, spikeProb = 0.01, spikeMag = 0, min, max } = opts;
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < n; i++) {
    v += (rand() - 0.5) * jitter + (base - v) * 0.03; // mean-reverting
    let sample = v;
    if (spikeMag && rand() < spikeProb) sample += (rand() - 0.3) * spikeMag;
    out.push(Math.min(max, Math.max(min, sample)));
  }
  return out;
}

/** Histogram of `values` over [min, max] as normalized bin heights (0..1). */
export function histogram(values: number[], min: number, max: number, bins = 24): number[] {
  const counts = new Array(bins).fill(0);
  const span = max - min || 1;
  values.forEach((v) => {
    const b = Math.min(bins - 1, Math.max(0, Math.floor(((v - min) / span) * bins)));
    counts[b] += 1;
  });
  const peak = Math.max(...counts, 1);
  return counts.map((c) => c / peak);
}
