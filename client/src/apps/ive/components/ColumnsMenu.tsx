import { useEffect, useRef, useState } from "react";

// Small dropdown that controls which DataGrid columns are visible. Lives in
// the table toolbar; previously this UI was bolted onto the filter sidebar.
export function ColumnsMenu({
  headers,
  hiddenCols,
  onToggle,
}: {
  headers: string[];
  hiddenCols: string[];
  onToggle: (col: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const hiddenCount = hiddenCols.length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <span className="material-symbols-outlined text-sm">view_column</span>
        Columns
        {hiddenCount > 0 && (
          <span className="ml-1 rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">
            {hiddenCount} hidden
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-64 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl">
          <div className="max-h-72 overflow-y-auto custom-scrollbar p-2">
            {headers.map((col) => {
              const hidden = hiddenCols.includes(col);
              return (
                <label
                  key={col}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <input
                    type="checkbox"
                    checked={!hidden}
                    onChange={() => onToggle(col)}
                    className="h-3.5 w-3.5"
                  />
                  <span className="truncate">{col}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
