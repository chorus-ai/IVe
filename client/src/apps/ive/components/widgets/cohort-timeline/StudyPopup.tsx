import React, { useEffect, useMemo, useState } from 'react';
import {
  listStudies,
  getStudy,
  frameUrl,
  type DicomStudyIndex,
} from '../../../api/dicom';

/**
 * The study behind an Imaging block on the timeline.
 *
 * There is still no procedure -> StudyInstanceUID link (see the IMAGING_RE
 * note in the timeline), so a block can't name its own study. It picks one by
 * position instead — `seq` modulo the number of studies in the PACS — which is
 * the same trick the waveform blocks use for their offset: different blocks
 * open different studies rather than all showing the first one. Swap this for
 * a lookup the moment the link exists.
 */
export default function StudyPopup({ seq }: { seq: number }) {
  const [studies, setStudies] = useState<DicomStudyIndex[] | null>(null);
  const [study, setStudy] = useState<DicomStudyIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seriesIdx, setSeriesIdx] = useState(0);
  const [frameIdx, setFrameIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listStudies()
      .then((rows) => !cancelled && setStudies(rows))
      .catch((err) => !cancelled && setError(err?.message ?? 'Could not load studies'));
    return () => { cancelled = true; };
  }, []);

  const pick = studies?.length ? studies[seq % studies.length] : null;

  useEffect(() => {
    if (!pick) return;
    let cancelled = false;
    setStudy(null);
    setFrameIdx(0);
    getStudy(pick.id)
      .then((s) => !cancelled && setStudy(s))
      .catch((err) => !cancelled && setError(err?.message ?? 'Could not load study'));
    return () => { cancelled = true; };
  }, [pick?.id]);

  // Only series with pixel data — Orthanc answers 415 for reports and
  // presentation states, which would render as a broken frame.
  const viewable = useMemo(
    () => (study ? study.series.filter((s) => s.renderable !== false) : []),
    [study],
  );

  // Open on the largest series; series[0] is often a one-image scout.
  useEffect(() => {
    if (!viewable.length) return;
    let biggest = 0;
    viewable.forEach((s, i) => {
      if (s.instanceCount > viewable[biggest].instanceCount) biggest = i;
    });
    setSeriesIdx(biggest);
    setFrameIdx(0);
  }, [viewable]);

  const series = viewable[seriesIdx];
  const instance = series?.instances[frameIdx];
  const total = series?.instances.length ?? 0;

  if (error) {
    return (
      <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
        {error}
      </div>
    );
  }

  if (!studies) {
    return (
      <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-400">
        <span className="material-symbols-outlined animate-spin text-primary">
          progress_activity
        </span>
        Loading studies…
      </div>
    );
  }

  if (!studies.length) {
    return (
      <div className="p-8 text-center text-sm text-slate-400">
        <div className="mb-2">
          <span className="material-symbols-outlined text-3xl">imagesmode</span>
        </div>
        No studies in the PACS.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-800 dark:text-slate-100">
          {pick?.StudyDescription || 'Study'}
        </span>
        {series && (
          <span>
            {series.Modality} · {series.SeriesDescription || `Series ${series.SeriesNumber ?? seriesIdx + 1}`}
          </span>
        )}
        <span className="font-mono text-[11px] text-slate-400">{pick?.StudyInstanceUID}</span>
      </div>

      <div className="flex gap-3">
        <div className="relative flex min-h-[360px] flex-1 items-center justify-center overflow-hidden rounded-lg bg-black">
          {instance ? (
            <img
              key={instance.id}
              src={frameUrl(instance.id, { width: 1200 })}
              alt={`${series?.Modality ?? 'Image'} ${frameIdx + 1} of ${total}`}
              className="max-h-[60vh] max-w-full object-contain"
            />
          ) : (
            <span className="text-xs text-slate-500">No renderable series in this study.</span>
          )}
          {total > 0 && (
            <div className="absolute left-3 top-2 font-mono text-[10px] leading-tight text-amber-300/80">
              <div>{frameIdx + 1} / {total}</div>
            </div>
          )}
        </div>

        {viewable.length > 1 && (
          <div className="w-28 shrink-0 space-y-1 overflow-y-auto custom-scrollbar">
            {viewable.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => { setSeriesIdx(i); setFrameIdx(0); }}
                className={`w-full rounded border px-2 py-1.5 text-left text-[11px] transition-colors ${
                  i === seriesIdx
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <span className="font-semibold">{s.Modality}</span>
                <span className="ml-1 text-slate-400">{s.instanceCount}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {total > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setFrameIdx((i) => Math.max(0, i - 1))}
            disabled={frameIdx === 0}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
          >
            <span className="material-symbols-outlined text-base">chevron_left</span>
          </button>
          <input
            type="range"
            min={0}
            max={total - 1}
            value={frameIdx}
            onChange={(e) => setFrameIdx(Number(e.target.value))}
            className="w-64 accent-primary"
          />
          <button
            type="button"
            onClick={() => setFrameIdx((i) => Math.min(total - 1, i + 1))}
            disabled={frameIdx >= total - 1}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
          >
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
}
