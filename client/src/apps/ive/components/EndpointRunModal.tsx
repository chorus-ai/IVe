import React, { useEffect, useMemo, useState } from 'react';
import { Popup } from './ui/Popup';
import { Button } from './ui/Button';
import { Alert } from './ui/Alert';
import DataGrid, { type GridColDef } from './ui/DataGrid';
import { runEndpoint, type EndpointRunResult, type SavedEndpoint } from '../api/endpoints';

const PAGE_SIZE = 25;

/**
 * Executes one saved endpoint and shows what came back.
 *
 * Saved endpoints were a catalogue until now — you could find a query
 * definition again but not run it. Paging is server-side: the definition is a
 * filter, not a result set, so the grid asks for one page at a time rather
 * than pulling everything to count it client-side.
 */
export default function EndpointRunModal({
  endpoint,
  onClose,
}: {
  endpoint: SavedEndpoint | null;
  onClose: () => void;
}) {
  const [result, setResult] = useState<EndpointRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const countOnly = !!endpoint?.params?.countOnly;

  useEffect(() => {
    if (!endpoint) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    runEndpoint(endpoint, { page, pageSize: PAGE_SIZE })
      .then((res) => !cancelled && setResult(res))
      .catch((err) => !cancelled && setError(err?.message ?? 'Request failed'))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [endpoint, page]);

  // Reset paging when a different endpoint is opened.
  useEffect(() => { setPage(1); setResult(null); }, [endpoint?.id]);

  const columns: GridColDef[] = useMemo(
    () =>
      (result?.header ?? []).map((name) => ({
        field: name,
        headerName: name,
        flex: 1,
        renderCell: ({ value }) =>
          value == null || value === ''
            ? <span className="text-xs text-slate-400">—</span>
            : String(value),
      })),
    [result?.header],
  );

  const rows = useMemo(
    () =>
      (result?.rows ?? []).map((row, i) => {
        const obj: Record<string, unknown> = { __id: `${page}-${i}` };
        (result?.header ?? []).forEach((h, j) => { obj[h] = row[j]; });
        return obj;
      }),
    [result, page],
  );

  const path = endpoint?.endpoint ?? '';

  return (
    <Popup
      open={endpoint !== null}
      onClose={onClose}
      title="Run endpoint"
      widthClass="w-[90vw] max-w-none"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {countOnly
              ? 'Count only — this definition returns a total, not rows.'
              : result
                ? `Page ${page} · ${rows.length} row${rows.length === 1 ? '' : 's'}`
                : ''}
          </span>
          <div className="flex items-center gap-2">
            {!countOnly && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading || rows.length < PAGE_SIZE}
                >
                  Next
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-blue-200 bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            {(endpoint?.method ?? 'POST').toUpperCase()}
          </span>
          <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {path}
          </code>
          {endpoint?.description && (
            <span className="text-xs text-slate-500 dark:text-slate-400">{endpoint.description}</span>
          )}
        </div>

        {endpoint?.params?.body && Object.keys(endpoint.params.body).length > 0 && (
          <details className="text-xs">
            <summary className="cursor-pointer select-none font-medium text-slate-500 hover:text-primary">
              Filters sent
            </summary>
            <pre className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[10px] leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
              {JSON.stringify(endpoint.params.body, null, 2)}
            </pre>
          </details>
        )}

        {error && (
          <Alert tone="danger" title="Request failed">
            {error}
          </Alert>
        )}

        {countOnly && !error && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {loading ? '…' : (result?.count ?? 0).toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              matching rows
            </div>
          </div>
        )}

        {!countOnly && !error && (
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => row.__id as string}
            loading={loading}
            hidePagination
            emptyMessage="No rows matched this endpoint."
            stickyHeader
            style={{ maxHeight: '60vh' }}
          />
        )}
      </div>
    </Popup>
  );
}
