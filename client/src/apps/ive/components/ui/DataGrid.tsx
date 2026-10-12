import React, { useMemo, useState } from 'react';

const buildPageList = (current: number, total: number): (number | 'ellipsis')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('ellipsis');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('ellipsis');
  pages.push(total);
  return pages;
};

export interface GridColDef<R = any> {
  field: string;
  headerName?: string;
  width?: number | string;
  flex?: number;
  align?: 'left' | 'center' | 'right';
  headerAlign?: 'left' | 'center' | 'right';
  sortable?: boolean;
  renderCell?: (params: { row: R; value: any }) => React.ReactNode;
  valueGetter?: (params: { row: R }) => any;
}

export interface DataGridProps<R = any> {
  rows: R[];
  columns: GridColDef<R>[];
  getRowId?: (row: R) => string | number;
  initialState?: {
    pagination?: { page?: number; pageSize?: number };
  };
  pageSizeOptions?: number[];
  checkboxSelection?: boolean;
  onSelectionChange?: (ids: (string | number)[]) => void;
  onRowClick?: (row: R) => void;
  loading?: boolean;
  emptyMessage?: string;
  style?: React.CSSProperties;
  className?: string;
  paginationMode?: 'client' | 'server';
  page?: number;
  pageSize?: number;
  rowCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  hidePagination?: boolean;
  stickyHeader?: boolean;
}

type SortState = { field: string; dir: 'asc' | 'desc' } | null;

function DataGrid<R extends Record<string, any>>({
  rows,
  columns,
  getRowId = (row) => row.id,
  initialState,
  pageSizeOptions = [10, 25, 50],
  checkboxSelection = false,
  onSelectionChange,
  onRowClick,
  loading = false,
  emptyMessage = 'No rows',
  style,
  className = '',
  paginationMode = 'client',
  page: pageProp,
  pageSize: pageSizeProp,
  rowCount,
  onPageChange,
  onPageSizeChange,
  hidePagination = false,
  stickyHeader = false,
}: DataGridProps<R>) {
  const [pageInner, setPageInner] = useState(initialState?.pagination?.page ?? 1);
  const [pageSizeInner, setPageSizeInner] = useState(
    initialState?.pagination?.pageSize ?? pageSizeOptions[0] ?? 10,
  );
  const [sort, setSort] = useState<SortState>(null);
  const [selected, setSelected] = useState<Set<string | number>>(new Set());

  const isControlled = pageProp != null || pageSizeProp != null;
  const page = pageProp ?? pageInner;
  const pageSize = pageSizeProp ?? pageSizeInner;

  const setPage = (p: number) => {
    if (!isControlled) setPageInner(p);
    onPageChange?.(p);
  };
  const setPageSize = (ps: number) => {
    if (!isControlled) setPageSizeInner(ps);
    onPageSizeChange?.(ps);
  };

  const sortedRows = useMemo(() => {
    if (!sort || paginationMode === 'server') return rows;
    const col = columns.find((c) => c.field === sort.field);
    if (!col) return rows;
    const get = (row: R) =>
      col.valueGetter ? col.valueGetter({ row }) : row[col.field];
    const copy = [...rows];
    copy.sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (va < vb) return sort.dir === 'asc' ? -1 : 1;
      if (va > vb) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [rows, sort, columns, paginationMode]);

  const total =
    paginationMode === 'server' ? (rowCount ?? rows.length) : sortedRows.length;
  const pageRows = useMemo(() => {
    if (paginationMode === 'server') return rows;
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize, paginationMode, rows]);

  const allOnPageSelected =
    pageRows.length > 0 && pageRows.every((r) => selected.has(getRowId(r)));
  const someOnPageSelected =
    !allOnPageSelected && pageRows.some((r) => selected.has(getRowId(r)));

  const updateSelected = (next: Set<string | number>) => {
    setSelected(next);
    onSelectionChange?.(Array.from(next));
  };

  const togglePageAll = () => {
    const next = new Set(selected);
    if (allOnPageSelected) {
      pageRows.forEach((r) => next.delete(getRowId(r)));
    } else {
      pageRows.forEach((r) => next.add(getRowId(r)));
    }
    updateSelected(next);
  };

  const toggleRow = (id: string | number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    updateSelected(next);
  };

  const toggleSort = (col: GridColDef<R>) => {
    if (col.sortable === false) return;
    setSort((prev) => {
      if (!prev || prev.field !== col.field) return { field: col.field, dir: 'asc' };
      if (prev.dir === 'asc') return { field: col.field, dir: 'desc' };
      return null;
    });
  };

  const colWidthStyle = (col: GridColDef<R>): React.CSSProperties => {
    if (col.width != null) return { width: col.width, minWidth: col.width };
    if (col.flex != null) return { flex: col.flex };
    return { flex: 1 };
  };

  return (
    <div
      style={style}
      className={`flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 ${className}`}
    >
      <div className="custom-scrollbar overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className={`bg-slate-50 dark:bg-slate-800/50 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
            <tr>
              {checkboxSelection && (
                <th className="w-10 px-3 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someOnPageSelected;
                    }}
                    onChange={togglePageAll}
                    className="h-3.5 w-3.5 rounded border-slate-300 accent-primary"
                  />
                </th>
              )}
              {columns.map((col) => {
                const sorted = sort?.field === col.field;
                return (
                  <th
                    key={col.field}
                    style={colWidthStyle(col)}
                    className={`whitespace-nowrap px-3 py-2 font-semibold uppercase tracking-wide text-[11px] text-slate-500 dark:text-slate-400 ${
                      col.headerAlign === 'right'
                        ? 'text-right'
                        : col.headerAlign === 'center'
                          ? 'text-center'
                          : 'text-left'
                    } ${col.sortable !== false ? 'cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200' : ''}`}
                    onClick={() => toggleSort(col)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.headerName ?? col.field}
                      {sorted && (
                        <span className="material-symbols-outlined text-sm">
                          {sort!.dir === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (checkboxSelection ? 1 : 0)}
                  className="px-3 py-8 text-center text-slate-400"
                >
                  Loading…
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (checkboxSelection ? 1 : 0)}
                  className="px-3 py-8 text-center text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => {
                const id = getRowId(row);
                const isSelected = selected.has(id);
                return (
                  <tr
                    key={id}
                    onClick={() => onRowClick?.(row)}
                    className={`border-t border-slate-100 transition-colors dark:border-slate-800 ${
                      onRowClick ? 'cursor-pointer' : ''
                    } ${
                      isSelected
                        ? 'bg-primary/5'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {checkboxSelection && (
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(id)}
                          className="h-3.5 w-3.5 rounded border-slate-300 accent-primary"
                        />
                      </td>
                    )}
                    {columns.map((col) => {
                      const value = col.valueGetter
                        ? col.valueGetter({ row })
                        : row[col.field];
                      return (
                        <td
                          key={col.field}
                          style={colWidthStyle(col)}
                          className={`whitespace-nowrap px-3 py-2 ${
                            col.align === 'right'
                              ? 'text-right'
                              : col.align === 'center'
                                ? 'text-center'
                                : 'text-left'
                          }`}
                        >
                          {col.renderCell ? col.renderCell({ row, value }) : value}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!hidePagination && total > 0 && (() => {
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const startRow = (page - 1) * pageSize + 1;
        const endRow = Math.min(page * pageSize, total);
        const pageList = buildPageList(page, totalPages);
        const goTo = (next: number) => {
          if (next < 1 || next > totalPages || next === page) return;
          setPage(next);
        };
        return (
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 px-4 py-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {startRow}–{endRow} of {total}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => goTo(page - 1)}
                disabled={page <= 1}
                className="rounded p-0.5 text-slate-500 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-slate-700"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <div className="flex items-center gap-1">
                {pageList.map((p, i) =>
                  p === 'ellipsis' ? (
                    <span key={`e-${i}`} className="px-1 text-[11px] text-slate-400">…</span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => goTo(p)}
                      className={`h-7 min-w-[28px] rounded-lg px-2 text-[11px] font-bold transition-all ${
                        page === p
                          ? 'bg-primary text-white shadow-sm shadow-primary/20'
                          : 'border border-transparent text-slate-500 hover:border-slate-200 hover:bg-white dark:hover:border-slate-800 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
              </div>
              <button
                type="button"
                onClick={() => goTo(page + 1)}
                disabled={page >= totalPages}
                className="rounded p-0.5 text-slate-500 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-slate-700"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
              <select
                className="rounded border border-slate-200 bg-slate-50 py-0.5 pl-2 pr-6 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 focus:outline-none"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {/* The current pageSize may come from a controlled prop that
                    doesn't match pageSizeOptions (e.g. a store default); if it's
                    missing from the list the <select> can't match any <option>
                    and silently displays the first one instead of the real value. */}
                {(pageSizeOptions.includes(pageSize) ? pageSizeOptions : [...pageSizeOptions, pageSize].sort((a, b) => a - b)).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default DataGrid;
