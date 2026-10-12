import React, { useMemo } from 'react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

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

const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pages = useMemo(() => buildPageList(page, totalPages), [page, totalPages]);

  if (total === 0) return null;

  const goTo = (next: number) => {
    if (next < 1 || next > totalPages || next === page) return;
    onPageChange(next);
  };

  return (
    <div
      className={`flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 px-4 py-2 ${className}`}
    >
      <span className="text-[11px] text-slate-500 dark:text-slate-400">
        {start}–{end} of {total}
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
          {pages.map((p, i) =>
            p === 'ellipsis' ? (
              <span key={`e-${i}`} className="px-1 text-[11px] text-slate-400">
                …
              </span>
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

        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="ml-1 rounded border border-slate-200 bg-slate-50 py-0.5 pl-2 pr-6 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 focus:outline-none"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};

export default Pagination;
