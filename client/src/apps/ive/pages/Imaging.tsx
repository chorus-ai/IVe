import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  WINDOW_PRESETS,
  frameUrl,
  getInstanceMetadata,
  getStudy,
  listStudies,
  type DicomInstanceMeta,
  type DicomSeries,
  type DicomStudyIndex,
} from '../api/dicom';

/**
 * Page 7b — DICOM viewer (`/ive/table/dicom`).
 *
 * Replaces the "coming soon" landing. Studies come from the server's `dicom`
 * feature, which proxies Orthanc and strips identifiers; nothing here talks to
 * a PACS directly.
 *
 * Deliberately no WebGL renderer: Orthanc applies window/level server-side, so
 * a frame is an image URL and a window change is a new cacheable URL. That
 * keeps cornerstone3D and its WASM codecs out of the bundle. The cost is that
 * windowing is a round trip — preset clicking, not drag-to-window. Fine for
 * review; this is not a diagnostic-read viewer and does not claim to be.
 *
 * Stays dark at every theme, as the previous page did: a bright frame around
 * radiology pixels hurts, and it is the convention readers expect.
 */
const ImagingView: React.FC = () => {
  const [studies, setStudies] = useState<DicomStudyIndex[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const [study, setStudy] = useState<DicomStudyIndex | null>(null);
  const [studyError, setStudyError] = useState<string | null>(null);
  const [seriesIdx, setSeriesIdx] = useState(0);
  const [frameIdx, setFrameIdx] = useState(0);
  const [preset, setPreset] = useState<string>('default');
  const [meta, setMeta] = useState<DicomInstanceMeta | null>(null);

  useEffect(() => {
    let cancelled = false;
    listStudies()
      .then((rows) => {
        if (cancelled) return;
        setStudies(rows);
        if (rows.length) setSelectedId(rows[0].id);
      })
      .catch((err) => !cancelled && setListError(err?.message ?? 'Could not load studies'));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setStudy(null);
    setStudyError(null);
    setMeta(null);
    setFrameIdx(0);
    setPreset('default');
    getStudy(selectedId)
      .then((s) => !cancelled && setStudy(s))
      .catch((err) => !cancelled && setStudyError(err?.message ?? 'Could not load study'));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !studies) return studies ?? [];
    return studies.filter(
      (s) =>
        (s.StudyDescription ?? '').toLowerCase().includes(q) ||
        (s.StudyInstanceUID ?? '').toLowerCase().includes(q),
    );
  }, [studies, query]);

  // Only series with pixel data. Real studies carry presentation states and
  // reports alongside images; Orthanc answers 415 for those.
  const viewable = useMemo(
    () => (study ? study.series.filter((s) => s.renderable !== false) : []),
    [study],
  );

  // Open on the largest series — series[0] is often a one-image scout.
  useEffect(() => {
    if (!viewable.length) return;
    let biggest = 0;
    viewable.forEach((s, i) => {
      if (s.instanceCount > viewable[biggest].instanceCount) biggest = i;
    });
    setSeriesIdx(biggest);
    setFrameIdx(0);
  }, [viewable]);

  const series: DicomSeries | undefined = viewable[seriesIdx];
  const instance = series?.instances[frameIdx];
  const total = series?.instances.length ?? 0;

  useEffect(() => {
    if (!instance) return;
    let cancelled = false;
    getInstanceMetadata(instance.id)
      .then((m) => !cancelled && setMeta(m))
      .catch(() => !cancelled && setMeta(null));
    return () => {
      cancelled = true;
    };
  }, [instance?.id]);

  const step = useCallback(
    (delta: number) =>
      setFrameIdx((i) => Math.min(Math.max(i + delta, 0), Math.max(total - 1, 0))),
    [total],
  );

  // Arrow keys page the stack — the expected gesture, and far better than the
  // slider for a 50-slice series. Ignored while typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); step(1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  const window_ = useMemo(() => {
    const p = WINDOW_PRESETS.find((x) => x.id === preset);
    if (p && p.center !== null && p.width !== null) return { center: p.center, width: p.width };
    // "Default" — whatever the instance itself declares. DX images store a
    // multi-valued window (VM 1-n); the first is DICOM's default.
    const c = Array.isArray(meta?.WindowCenter) ? meta?.WindowCenter[0] : meta?.WindowCenter;
    const w = Array.isArray(meta?.WindowWidth) ? meta?.WindowWidth[0] : meta?.WindowWidth;
    return typeof c === 'number' && typeof w === 'number' ? { center: c, width: w } : null;
  }, [preset, meta]);

  const src = instance
    ? frameUrl(instance.id, { windowCenter: window_?.center, windowWidth: window_?.width })
    : '';

  const chip =
    'rounded px-2 py-0.5 text-[11px] font-medium transition border border-slate-700 ' +
    'text-slate-400 hover:text-slate-200 hover:border-slate-500';
  const chipOn = 'rounded px-2 py-0.5 text-[11px] font-semibold border border-slate-600 bg-slate-800 text-slate-100';

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-slate-950 text-slate-100"
      // This page is dark at every theme, but the browser still paints native
      // widgets — scrollbars, the range input's track — from the document's
      // color-scheme, which is light. Declaring it here makes the UA render
      // them dark. Tailwind v3 ships no utility for this property.
      style={{ colorScheme: 'dark' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-3xl text-sky-400">radiology</span>
          <div>
            <h1 className="text-lg font-bold">DICOM Viewer</h1>
            <p className="text-xs text-slate-400">
              Radiology studies served through the API — identifiers stripped server-side
            </p>
          </div>
        </div>
        <span className="text-xs tabular-nums text-slate-500">
          {studies ? `${studies.length} studies` : ''}
        </span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Study list */}
        {/* Same 6px thin bar the CADA workspaces use (common/TextViewer.tsx),
            inverted for this dark page. Arbitrary variants keep it scoped to
            this element — the legacy Note panels inject a bare
            ::-webkit-scrollbar rule in a global <style>, which restyles every
            scrollable element on the page while they are mounted. */}
        <aside
          className="w-72 shrink-0 overflow-y-auto border-r border-slate-800
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-slate-700
            hover:[&::-webkit-scrollbar-thumb]:bg-slate-600"
          // Firefox has no pseudo-elements for this.
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
        >
          {listError && <p className="p-4 text-xs text-red-400">{listError}</p>}
          {!studies && !listError && <p className="p-4 text-xs text-slate-500">Loading studies…</p>}
          {studies && studies.length > 0 && (
            <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950 p-2">
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-base text-slate-500">
                  search
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter studies…"
                  aria-label="Filter studies"
                  className="w-full rounded border border-slate-800 bg-slate-900 py-1.5 pl-8 pr-7 text-xs text-slate-200 placeholder:text-slate-600 focus:border-sky-600 focus:outline-none focus:ring-0"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    aria-label="Clear filter"
                    className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-sm text-slate-500 hover:text-slate-300"
                  >
                    close
                  </button>
                )}
              </div>
              {query && (
                <p className="mt-1 text-[10px] tabular-nums text-slate-500">
                  {filtered.length} of {studies.length}
                </p>
              )}
            </div>
          )}

          {studies?.length === 0 && (
            <p className="p-4 text-xs text-slate-500">
              No studies in the PACS. Upload a DICOM file to see it here.
            </p>
          )}
          {studies && studies.length > 0 && filtered.length === 0 && (
            <p className="p-4 text-xs text-slate-500">No study matches “{query}”.</p>
          )}
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={`w-full border-b border-slate-900 px-4 py-3 text-left transition ${
                s.id === selectedId ? 'bg-slate-800/70' : 'hover:bg-slate-900'
              }`}
            >
              <p className="truncate text-sm font-medium text-slate-100">
                {s.StudyDescription || 'Untitled study'}
              </p>
              <p className="mt-0.5 text-[11px] tabular-nums text-slate-500">
                {s.seriesCount} series
              </p>
            </button>
          ))}
        </aside>

        {/* Viewer */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          {studyError && <p className="p-6 text-sm text-red-400">{studyError}</p>}
          {!study && !studyError && (
            <p className="p-6 text-sm text-slate-500">Select a study.</p>
          )}

          {study && !series && (
            <p className="p-6 text-sm text-slate-500">
              Nothing to display — this study's {study.seriesCount} series carry no image data
              (presentation states or reports).
            </p>
          )}

          {study && series && (
            <>
              {/* Series + window bar */}
              <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 px-3 py-2">
                {viewable.length > 1 &&
                  viewable.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => { setSeriesIdx(i); setFrameIdx(0); }}
                      className={i === seriesIdx ? chipOn : chip}
                    >
                      {s.Modality ?? '?'} {s.SeriesNumber ?? i + 1}
                      <span className="ml-1 opacity-60 tabular-nums">{s.instanceCount}</span>
                    </button>
                  ))}

                <div className="flex-1" />

                {/* Burned-in pixel text is PHI no header can hide. */}
                {meta?.BurnedInAnnotation === 'YES' && (
                  <span
                    title="Pixels may contain burned-in identifiers"
                    className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300"
                  >
                    Burned-in
                  </span>
                )}

                <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Window
                </span>
                {WINDOW_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPreset(p.id)}
                    className={preset === p.id ? chipOn : chip}
                  >
                    {p.label}
                  </button>
                ))}
                {window_ && (
                  <span className="ml-1 w-20 text-right text-[11px] tabular-nums text-slate-500">
                    C {Math.round(window_.center)} / W {Math.round(window_.width)}
                  </span>
                )}
              </div>

              {/* Frame — object-contain keeps the whole slice in view, so
                  paging a stack never scrolls or shifts the image. */}
              <div className="flex min-h-0 flex-1 items-center justify-center bg-black p-2">
                {src ? (
                  <img
                    key={instance!.id}
                    src={src}
                    alt={`Slice ${frameIdx + 1} of ${total}`}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <p className="text-xs text-slate-600">No frame</p>
                )}
              </div>

              {/* Stack navigation */}
              <div className="flex items-center gap-3 border-t border-slate-800 px-3 py-2">
                <button
                  onClick={() => step(-1)}
                  disabled={frameIdx === 0}
                  title="Previous slice (←)"
                  className="material-symbols-outlined text-lg text-slate-400 disabled:text-slate-700"
                >
                  chevron_left
                </button>
                <input
                  type="range"
                  min={0}
                  max={Math.max(total - 1, 0)}
                  value={frameIdx}
                  onChange={(e) => setFrameIdx(Number(e.target.value))}
                  className="flex-1 accent-sky-500"
                />
                <span className="w-16 text-right text-[11px] tabular-nums text-slate-400">
                  {frameIdx + 1} / {total}
                </span>
                <button
                  onClick={() => step(1)}
                  disabled={frameIdx >= total - 1}
                  title="Next slice (→)"
                  className="material-symbols-outlined text-lg text-slate-400 disabled:text-slate-700"
                >
                  chevron_right
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ImagingView;
