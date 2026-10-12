import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { MdClose } from "react-icons/md";

function normalizeResponse(data: any) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
}

function areSelectionsEqual(a: any[] = [], b: any[] = []) {
  if (a.length !== b.length) return false;

  const key = (o: any) => `${o.column_name ?? ""}::${o.concept_id ?? ""}`;
  const bKeys = b.map(key);
  const used = new Set<number>();

  for (const item of a) {
    const itemKey = key(item);
    const idx = bKeys.findIndex((k, i) => k === itemKey && !used.has(i));
    if (idx === -1) return false;
    used.add(idx);
  }

  return true;
}

export interface SearchConceptProps {
  apiPath?: string;
  table?: string;
  columnName?: string;
  label?: string;
  selectedOptions?: any[];
  handleSelectedOptionsChange: (values: any[]) => void;
  debounceMs?: number;
}

export function SearchConcept({
  apiPath = "/api/vocab/concept",
  table = "",
  columnName = "",
  label = "Search",
  selectedOptions = [],
  handleSelectedOptionsChange,
  debounceMs = 500,
}: SearchConceptProps) {
  
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingOptions, setPendingOptions] = useState<any[]>(selectedOptions);
  const [open, setOpen] = useState(false);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isFieldLevel = !!columnName;

  useEffect(() => {
    setPendingOptions(selectedOptions);
  }, [selectedOptions]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    setInputValue("");
    setOptions([]);
    setHasLoadedInitial(false);
  }, [table, columnName]);

  const loadInitial = useCallback(async () => {
    if (!table) return;

    setLoading(true);
    try {
      const params: Record<string, any> = { table };
      if (columnName) {
        params.column = columnName;
      }

      const res = await axios.get(apiPath, { params });

      const rows = normalizeResponse(res.data).map((item: any) => ({
        ...item,
        column_name: item?.column_name ?? item?.column ?? columnName ?? "",
      }));

      setOptions(rows);
      setHasLoadedInitial(true);
    } catch (err) {
      console.error("Initial autocomplete load error:", err);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [apiPath, table, columnName]);

  const fetchData = useCallback(
    async (value: string) => {
      const term = value.trim();

      if (!table) return;

      if (!term) {
        await loadInitial();
        return;
      }

      setLoading(true);
      try {
        const params: Record<string, any> = {
          table,
          name: term,
        };

        if (columnName) {
          params.column = columnName;
        }

        const res = await axios.get(`${apiPath}/search`, { params });

        const rows = normalizeResponse(res.data).map((item: any) => ({
          ...item,
          column_name: item?.column_name ?? item?.column ?? columnName ?? "",
        }));

        setOptions(rows);
      } catch (err) {
        console.error("Autocomplete fetch error:", err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [apiPath, table, columnName, loadInitial],
  );

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchData(value);
    }, debounceMs);
  };

  const handleFocus = async () => {
    setOpen(true);

    if (!hasLoadedInitial && !loading) {
      await loadInitial();
    }
  };

  const isSelected = (option: any) =>
    pendingOptions.some(
      (item) =>
        item?.concept_id === option?.concept_id &&
        (item?.column_name ?? "") ===
          (option?.column_name ?? option?.column ?? columnName ?? ""),
    );

  const syncFieldLevelChange = (nextValues: any[]) => {
    if (isFieldLevel) {
      handleSelectedOptionsChange(nextValues);
    }
  };

  const toggleOption = (option: any) => {
    const normalizedOption = {
      ...option,
      column_name: option?.column_name ?? option?.column ?? columnName ?? "",
    };

    setPendingOptions((prev) => {
      const exists = prev.some(
        (item) =>
          item?.concept_id === normalizedOption?.concept_id &&
          (item?.column_name ?? "") === (normalizedOption?.column_name ?? ""),
      );

      const nextValues = exists
        ? prev.filter(
            (item) =>
              !(
                item?.concept_id === normalizedOption?.concept_id &&
                (item?.column_name ?? "") ===
                  (normalizedOption?.column_name ?? "")
              ),
          )
        : [...prev, normalizedOption];

      syncFieldLevelChange(nextValues);
      return nextValues;
    });
  };

  const removeOption = (option: any) => {
    setPendingOptions((prev) => {
      const nextValues = prev.filter(
        (item) =>
          !(
            item?.concept_id === option?.concept_id &&
            (item?.column_name ?? "") ===
              (option?.column_name ?? option?.column ?? columnName ?? "")
          ),
      );

      syncFieldLevelChange(nextValues);
      return nextValues;
    });
  };

  const hasChanges = !areSelectionsEqual(pendingOptions, selectedOptions);
  const showMetaBadges = !isFieldLevel;

  return (
    <div ref={containerRef} className="relative">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2">
        {pendingOptions.length > 0 && <div className="mb-2 flex flex-wrap items-center gap-2">
          {pendingOptions.map((option, index) => (
            <span
              key={`${option?.concept_id ?? "?"}-${option?.column_name ?? index}`}
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-white px-2.5 py-1 text-xs text-primary dark:bg-slate-900"
            >
              <span>{option.concept_id ?? "?"}</span>
              <button
                type="button"
                onClick={() => removeOption(option)}
                className="rounded-full p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <MdClose size={12} />
              </button>
            </span>
          ))}
        </div>}

        <div className="flex items-center gap-2">
          <input
            value={inputValue}
            placeholder={label}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              void handleFocus();
            }}
            className="m-0 w-full border-0 bg-transparent px-1 py-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:text-slate-100"
          />

          {!isFieldLevel && hasChanges && (
            <button
              type="button"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-transparent px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => handleSelectedOptionsChange(pendingOptions)}
            >
              Update filter
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {loading && (
              <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                Loading...
              </div>
            )}

            {!loading && options.length === 0 && (
              <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                No results
              </div>
            )}

            {!loading &&
              options.map((option, idx) => {
                const selected = isSelected(option);
                const sub = [
                  option?.vocabulary_id && option?.concept_code
                    ? `${option.vocabulary_id}: ${option.concept_code}`
                    : null,
                  `CONCEPT_ID: ${option?.concept_id}`,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <button
                    key={`${option?.concept_id}-${option?.column_name ?? option?.column ?? columnName ?? "all"}-${idx}`}
                    type="button"
                    onClick={() => toggleOption(option)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span className="flex min-w-0 items-start gap-3">
                      <span className="flex min-w-0 max-w-xs flex-col leading-tight">
                        <span
                          className="truncate text-xs text-slate-700 dark:text-slate-300"
                          title={option?.concept_name ?? undefined}
                        >
                          {option?.concept_name ?? `CONCEPT_ID: ${option?.concept_id}`}
                        </span>
                        <span className="truncate text-[9px] text-slate-400 font-mono" title={sub}>
                          {sub}
                        </span>
                      </span>

                      {showMetaBadges && (
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="inline-flex items-center rounded-full border border-primary/30 bg-white px-2 py-0.5 text-xs text-primary dark:bg-slate-900">
                            {option?.column_name ?? option?.column ?? "?"}
                          </span>

                          <span className="inline-flex items-center rounded-full border border-emerald-300 bg-white px-2 py-0.5 text-xs text-emerald-600 dark:bg-slate-900 dark:border-emerald-700 dark:text-emerald-400">
                            count • {option?.count ?? "?"}
                          </span>
                        </span>
                      )}
                    </span>

                    {selected && (
                      <span className="material-symbols-outlined text-base text-primary shrink-0">check</span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );

}