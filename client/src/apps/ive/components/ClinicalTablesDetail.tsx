import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { MdClose } from "react-icons/md";
import { useAppDispatch, useAppSelector } from "../../../hooks/redux";
import { getTableCard } from "../types";
import {
  setTableFilters,
  setTablePage,
  setTablePageSize,
  addEndpoint,
  setTableLoading,
  setTableData,
  setTableError,
  setTableCount,
  showIveAlert,
  makeTable,
  type TableState,
} from "../store";
import { getOmopRows, getOmopCount } from "../api/omop";
import { createEndpoint, attachEndpointTags } from "../api/endpoints";
import { loadConcept } from "../api/concepts";
import SaveEndpointModal from "./SaveEndpointModal";

const defaultTable = makeTable();

import { FilterChips } from "./FilterChips";
import { FilterModal } from "./FilterModal";
import { ColumnsMenu } from "./ColumnsMenu";
import DataGrid, { type GridColDef } from "./ui/DataGrid";

const CONCEPT_API_PATH = "/api/vocab/concept";
const CONCEPT_DEBOUNCE_MS = 500;

const normalizeConceptResponse = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
};

function formatDatetime(value: unknown): { date: string; time: string } | null {
  if (value == null || value === "") return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  const date = d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
  return { date, time };
}

/* ------------------------------------------------------------------ */
/* Endpoint comparison helpers                                        */
/* ------------------------------------------------------------------ */

const normalizeBody = (obj: any) => {
  if (obj == null || typeof obj !== "object" || Array.isArray(obj)) return obj;

  const sortedKeys = Object.keys(obj).sort();
  const out: Record<string, any> = {};

  sortedKeys.forEach((k) => {
    const v = obj[k];
    if (Array.isArray(v)) {
      out[k] = v.slice().sort();
    } else if (v && typeof v === "object") {
      out[k] = normalizeBody(v);
    } else {
      out[k] = v;
    }
  });

  return out;
};

const endpointSignature = (se: any) => {
  if (!se) return "";
  const { endpoint, method = "GET", params = {} } = se;
  const { body = {}, attributes = [], countOnly } = params;

  const normalized = {
    endpoint,
    method,
    body: normalizeBody(body),
    attributes: attributes ? attributes.slice().sort() : [],
    countOnly: !!countOnly,
  };

  return JSON.stringify(normalized);
};

/* ------------------------------------------------------------------ */
/* Props                                                              */
/* ------------------------------------------------------------------ */

interface ClinicalTablesDetailProps {
  tableKey: string;
  personId?: string | null;
  visitId?: string | null;
  externalFilters?: Record<string, unknown> | undefined;
}

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */

const ClinicalTablesDetail: React.FC<ClinicalTablesDetailProps> = ({
  tableKey,
  personId = null,
  visitId = null,
  externalFilters = undefined,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const tableState: TableState =
    useAppSelector((s) => s.ive.tables[tableKey]) ?? defaultTable;

  const { header, rows, count, page, pageSize, loading, error, filters: storeFilters } = tableState;
  const filters = externalFilters ?? storeFilters;
  const filtersKey = JSON.stringify(filters);

  const conceptsState = useAppSelector((s) => s.ive.concepts);

  useEffect(() => {
    let cancelled = false;
    const filtersSnapshot = filters;

    dispatch(setTableLoading({ table: tableKey }));

    getOmopRows(tableKey, { page, pageSize }, filters)
      .then(({ header, rows }) => {
        if (cancelled) return;
        dispatch(
          setTableData({
            table: tableKey,
            header,
            rows,
            count: -1,
            page,
            pageSize,
            filters: filtersSnapshot,
          }),
        );
      })
      .catch((err: Error) => {
        if (cancelled) return;
        dispatch(setTableError({ table: tableKey, error: err.message }));
        dispatch(showIveAlert({ message: err.message, severity: "warning" }));
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, tableKey, page, pageSize, filtersKey]);

  // Count is independent of pagination — refetch only when table or filters change
  useEffect(() => {
    let cancelled = false;
    getOmopCount(tableKey, Object.keys(filters).length ? filters : undefined)
      .then((count) => {
        if (cancelled) return;
        dispatch(setTableCount({ table: tableKey, count }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, tableKey, filtersKey]);

  const savedEndpoints = useAppSelector((s) => s.ive.endpoint);

  const setFilters = useCallback(
    (f: Record<string, unknown>) =>
      dispatch(setTableFilters({ table: tableKey, filters: f })),
    [dispatch, tableKey],
  );
  const setPage = useCallback(
    (p: number) => dispatch(setTablePage({ table: tableKey, page: p })),
    [dispatch, tableKey],
  );
  const setPageSize = useCallback(
    (ps: number) => dispatch(setTablePageSize({ table: tableKey, pageSize: ps })),
    [dispatch, tableKey],
  );

  const [hiddenCols, setHiddenCols] = useState<string[]>([]);
  const [openFilter, setOpenFilter] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<any[]>([]);
  const [openSaveEndpoint, setOpenSaveEndpoint] = useState(false);

  /* ---- inline concept search state ---- */
  const [conceptInput, setConceptInput] = useState("");
  const [conceptOptions, setConceptOptions] = useState<any[]>([]);
  const [conceptLoading, setConceptLoading] = useState(false);
  const [conceptOpen, setConceptOpen] = useState(false);
  const [pendingConcepts, setPendingConcepts] = useState<any[]>(selectedOptions);
  const [hasLoadedInitialConcepts, setHasLoadedInitialConcepts] = useState(false);
  const conceptDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conceptContainerRef = useRef<HTMLDivElement | null>(null);

  const headers = header;
  const visibleHeaders = headers.filter((h) => !hiddenCols.includes(h));
  const displayName = getTableCard(tableKey)?.name ?? tableKey;

  const conceptColIdx = useMemo(
    () => headers
      .map((name, idx) => ({ name, idx }))
      .filter(({ name }) => name.endsWith("_concept_id"))
      .map(({ idx }) => idx),
    [headers],
  );

  /* ---- eagerly resolve concept_id cells visible in the current page ---- */
  useEffect(() => {
    if (conceptColIdx.length === 0 || rows.length === 0) return;
    const ids = new Set<string>();
    rows.forEach((row) => {
      conceptColIdx.forEach((ci) => {
        const v = (row as unknown[])[ci];
        if (v != null && v !== "" && Number(v) !== 0) ids.add(String(v));
      });
    });
    ids.forEach((id) => loadConcept(dispatch, id, conceptsState));
  }, [rows, conceptColIdx, conceptsState, dispatch]);

  /* ---- sync person / visit from props ---- */
  useEffect(() => {
    if (personId) {
      setFilters({ ...filters, person_id: personId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId]);

  useEffect(() => {
    if (visitId) {
      setFilters({ ...filters, visit_occurrence_id: visitId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitId]);

  /* ---- sync concept selections from filters ---- */
  useEffect(() => {
    const conceptSelections: any[] = [];

    Object.entries(filters).forEach(([key, value]) => {
      if (!key.endsWith("_concept_id")) return;
      if (!Array.isArray(value) || value.length === 0) return;

      value.forEach((id: any) => {
        conceptSelections.push({ concept_id: id, column_name: key });
      });
    });

    setSelectedOptions(conceptSelections);
  }, [filters]);

  /* ---- inline concept search effects ---- */
  useEffect(() => {
    setPendingConcepts(selectedOptions);
  }, [selectedOptions]);

  useEffect(
    () => () => {
      if (conceptDebounceRef.current) clearTimeout(conceptDebounceRef.current);
    },
    [],
  );

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!conceptContainerRef.current?.contains(e.target as Node)) {
        setConceptOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    setConceptInput("");
    setConceptOptions([]);
    setHasLoadedInitialConcepts(false);
  }, [tableKey]);

  const loadInitialConcepts = useCallback(async () => {
    if (!tableKey) return;
    setConceptLoading(true);
    try {
      const res = await axios.get(CONCEPT_API_PATH, { params: { table: tableKey } });
      const rows = normalizeConceptResponse(res.data).map((item: any) => ({
        ...item,
        column_name: item?.column_name ?? item?.column ?? "",
      }));
      setConceptOptions(rows);
      setHasLoadedInitialConcepts(true);
    } catch (err) {
      console.error("Initial concept load error:", err);
      setConceptOptions([]);
    } finally {
      setConceptLoading(false);
    }
  }, [tableKey]);

  const fetchConcepts = useCallback(
    async (value: string) => {
      const term = value.trim();
      if (!tableKey) return;
      if (!term) {
        await loadInitialConcepts();
        return;
      }
      setConceptLoading(true);
      try {
        const res = await axios.get(`${CONCEPT_API_PATH}/search`, {
          params: { table: tableKey, name: term },
        });
        const rows = normalizeConceptResponse(res.data).map((item: any) => ({
          ...item,
          column_name: item?.column_name ?? item?.column ?? "",
        }));
        setConceptOptions(rows);
      } catch (err) {
        console.error("Concept search error:", err);
        setConceptOptions([]);
      } finally {
        setConceptLoading(false);
      }
    },
    [tableKey, loadInitialConcepts],
  );

  const handleConceptInputChange = (value: string) => {
    setConceptInput(value);
    setConceptOpen(true);
    if (conceptDebounceRef.current) clearTimeout(conceptDebounceRef.current);
    conceptDebounceRef.current = setTimeout(() => {
      void fetchConcepts(value);
    }, CONCEPT_DEBOUNCE_MS);
  };

  const handleConceptFocus = async () => {
    setConceptOpen(true);
    if (!hasLoadedInitialConcepts && !conceptLoading) {
      await loadInitialConcepts();
    }
  };

  const isConceptSelected = (option: any) =>
    pendingConcepts.some(
      (item) =>
        item?.concept_id === option?.concept_id &&
        (item?.column_name ?? "") === (option?.column_name ?? option?.column ?? ""),
    );

  const toggleConcept = (option: any) => {
    const normalized = {
      ...option,
      column_name: option?.column_name ?? option?.column ?? "",
    };
    const exists = pendingConcepts.some(
      (item) =>
        item?.concept_id === normalized.concept_id &&
        (item?.column_name ?? "") === normalized.column_name,
    );
    const next = exists
      ? pendingConcepts.filter(
          (item) =>
            !(
              item?.concept_id === normalized.concept_id &&
              (item?.column_name ?? "") === normalized.column_name
            ),
        )
      : [...pendingConcepts, normalized];
    setPendingConcepts(next);
    handleSelectedOptionsChange(next);
  };

  const removePendingConcept = (option: any) => {
    const next = pendingConcepts.filter(
      (item) =>
        !(
          item?.concept_id === option?.concept_id &&
          (item?.column_name ?? "") ===
            (option?.column_name ?? option?.column ?? "")
        ),
    );
    setPendingConcepts(next);
    handleSelectedOptionsChange(next);
  };

  /* ---- concept selection handler ---- */
  const handleSelectedOptionsChange = (values: any[]) => {
    const conceptFilterKeys = Object.keys(filters).filter((k) =>
      k.endsWith("_concept_id"),
    );

    if (!values || values.length === 0) {
      if (!conceptFilterKeys.length) return;
      const nextFilters = { ...filters };
      conceptFilterKeys.forEach((key) => {
        delete nextFilters[key];
      });
      setFilters(nextFilters);
      return;
    }

    const byColumn = values.reduce((acc: any, opt: any) => {
      if (!opt?.column_name || opt?.concept_id == null) return acc;
      const col = opt.column_name;
      if (!acc[col]) acc[col] = new Set();
      acc[col].add(opt.concept_id);
      return acc;
    }, {});

    const nextFilters = { ...filters };
    conceptFilterKeys.forEach((key) => {
      delete nextFilters[key];
    });

    Object.entries(byColumn).forEach(([col, idSet]: [string, any]) => {
      nextFilters[col] = Array.from(idSet);
    });

    setFilters(nextFilters);
  };

  /* ---- build search endpoint for saving ---- */
  const buildSearchEndpointFromFilters = () => {
    const hasFilters = Object.keys(filters).length > 0;
    if (!hasFilters) return null;

    const body: Record<string, any> = {};

    Object.entries(filters).forEach(([key, rawValue]) => {
      if (rawValue == null || rawValue === "") return;
      if (Array.isArray(rawValue) && rawValue.length === 0) return;
      body[key] = rawValue;
    });

    return {
      endpoint: `/${tableKey}/search`,
      method: "POST",
      params: { body, attributes: visibleHeaders },
    };
  };

  const currentSearchEndpoint = useMemo(
    () => buildSearchEndpointFromFilters(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, visibleHeaders, tableKey],
  );

  const isCurrentSearchSaved = useMemo(() => {
    if (!currentSearchEndpoint) return true;
    const currentSig = endpointSignature(currentSearchEndpoint);
    return savedEndpoints.some(
      (se: any) => endpointSignature(se) === currentSig,
    );
  }, [currentSearchEndpoint, savedEndpoints]);

  const handleSaveFilters = () => {
    if (!currentSearchEndpoint) return;
    setOpenSaveEndpoint(true);
  };

  const handleConfirmSaveEndpoint = ({
    description,
    tagSlugs,
    isPublic,
    isCached,
    countOnly,
    attributes,
  }: {
    description: string;
    tagSlugs: string[];
    isPublic: boolean;
    isCached: boolean;
    countOnly: boolean;
    attributes: string[];
  }) => {
    if (!currentSearchEndpoint) return;
    const baseParams = { ...(currentSearchEndpoint.params || {}) };
    delete (baseParams as any).countOnly;
    const params: Record<string, unknown> = {
      ...baseParams,
      attributes: countOnly ? [] : attributes,
    };
    if (countOnly) params.countOnly = true;
    const payload = {
      ...currentSearchEndpoint,
      description,
      isPublic,
      isCached,
      params,
    };
    createEndpoint(payload as any)
      .then(async (saved) => {
        if (saved.id && tagSlugs.length) {
          try {
            const tagged = await attachEndpointTags(saved.id, tagSlugs);
            dispatch(addEndpoint(tagged));
          } catch {
            dispatch(addEndpoint(saved));
          }
        } else {
          dispatch(addEndpoint(saved));
        }
        dispatch(showIveAlert({ message: 'Endpoint saved successfully', severity: 'success' }));
      })
      .catch(() => {
        dispatch(addEndpoint(payload as any));
        dispatch(showIveAlert({ message: 'Endpoint saved successfully', severity: 'success' }));
      })
      .finally(() => setOpenSaveEndpoint(false));
  };

  const onDatabaseClick = () => navigate("/ive/tables");
  const handlePersonClick = (pid: number) => navigate(`/ive/person/${pid}`);
  const handleVisitClick = (vid: number) => navigate(`/ive/visit/${vid}`);
  const onClearFilters = () => {
    setFilters({});
  };

  const gridRows = useMemo(
    () =>
      rows.map((row, idx) => {
        const obj: Record<string, any> = { __id: idx };
        headers.forEach((h, i) => {
          obj[h] = (row as unknown[])[i];
        });
        return obj;
      }),
    [rows, headers],
  );

  const gridColumns: GridColDef<Record<string, any>>[] = useMemo(
    () =>
      visibleHeaders.map((col) => {
        const isPersonId = col === "person_id";
        const isVisitId = col === "visit_occurrence_id";
        const isLink = isPersonId || isVisitId;
        const isConceptId = col.endsWith("_concept_id");
        const isDatetime = col.endsWith("_datetime");
        const isTime = col.endsWith("_time") && !isDatetime;
        return {
          field: col,
          headerName: col.replace(/_/g, " ").toUpperCase(),
          sortable: false,
          renderCell: ({ value }) => {
            if (value === null || value === undefined) {
              return (
                <span className="italic text-slate-300 dark:text-slate-700">
                  null
                </span>
              );
            }
            if (isLink) {
              return (
                <span
                  className="cursor-pointer font-bold text-primary hover:underline"
                  onClick={() => {
                    if (isPersonId) handlePersonClick(Number(value));
                    if (isVisitId) handleVisitClick(Number(value));
                  }}
                >
                  {String(value)}
                </span>
              );
            }
            if (isConceptId) {
              const rec = conceptsState.byId[String(value)];
              const cname = rec?.concept_name;
              const codePart = rec?.vocabulary_id && rec?.concept_code
                ? `${rec.vocabulary_id}: ${rec.concept_code}`
                : null;
              const idPart = `CONCEPT_ID: ${value}`;
              const sub = [codePart, idPart].filter(Boolean).join(" · ");
              return (
                <div className="flex max-w-xs flex-col leading-tight">
                  <span className="truncate" title={cname ?? undefined}>
                    {cname ?? String(value)}
                  </span>
                  {cname && (
                    <span className="truncate text-[9px] text-slate-400 font-mono" title={sub}>
                      {sub}
                    </span>
                  )}
                </div>
              );
            }
            if (isDatetime) {
              const dt = formatDatetime(value);
              if (dt) {
                return (
                  <span title={String(value)}>
                    <span>{dt.date}</span>
                    <span className="text-slate-400 dark:text-slate-500 ml-1.5 font-mono">{dt.time}</span>
                  </span>
                );
              }
            }
            if (isTime) {
              return (
                <span className="text-slate-400 dark:text-slate-500 font-mono">{String(value)}</span>
              );
            }
            return String(value);
          },
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleHeaders, conceptsState],
  );

  return (
    <div className="flex h-full flex-1 overflow-hidden">
      <main className="flex flex-grow flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="bg-panel-light dark:bg-panel-dark border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
          <span
            className={`material-symbols-outlined text-lg ${
              onDatabaseClick
                ? "cursor-pointer hover:text-primary dark:hover:text-primary transition-colors"
                : ""
            }`}
            onClick={onDatabaseClick}
          >
            database
          </span>
          <span className="material-symbols-outlined text-sm">
            chevron_right
          </span>
        </div>

        <div
          className={`flex items-center gap-2 text-sm ${
            onClearFilters
              ? "cursor-pointer hover:text-primary dark:hover:text-primary transition-colors text-slate-500 dark:text-slate-400"
              : "text-slate-900 dark:text-white"
          }`}
          onClick={onClearFilters}
        >
          <span className="material-symbols-outlined text-lg">table</span>
          <span className="font-medium">{displayName}</span>
        </div>
      </div>

        <div className="flex items-center gap-3">
              <div ref={conceptContainerRef} className="relative w-80">
                <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 dark:border-slate-800 dark:bg-slate-900">
                  <span className="material-symbols-outlined text-sm text-slate-400">
                    search
                  </span>
                  <input
                    value={conceptInput}
                    placeholder={
                      pendingConcepts.length > 0
                        ? `${pendingConcepts.length} selected`
                        : "Search Concepts"
                    }
                    onChange={(e) => handleConceptInputChange(e.target.value)}
                    onFocus={() => {
                      void handleConceptFocus();
                    }}
                    className="m-0 w-full border-0 bg-transparent px-0 py-0.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:text-slate-100"
                  />
                </div>

                {conceptOpen && (
                  <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                    {pendingConcepts.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-2 dark:border-slate-800">
                        {pendingConcepts.map((option, index) => (
                          <span
                            key={`${option?.concept_id ?? "?"}-${option?.column_name ?? index}`}
                            className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-white px-2.5 py-1 text-xs text-primary dark:bg-slate-900"
                          >
                            <span>{option.concept_id ?? "?"}</span>
                            <button
                              type="button"
                              onClick={() => removePendingConcept(option)}
                              className="rounded-full p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <MdClose size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {conceptLoading && (
                        <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                          Loading...
                        </div>
                      )}

                      {!conceptLoading && conceptOptions.length === 0 && (
                        <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                          No results
                        </div>
                      )}

                      {!conceptLoading &&
                        conceptOptions.map((option, idx) => {
                          const selected = isConceptSelected(option);
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
                              key={`${option?.concept_id}-${option?.column_name ?? option?.column ?? "all"}-${idx}`}
                              type="button"
                              onClick={() => toggleConcept(option)}
                              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              <span className="flex min-w-0 max-w-xs flex-col leading-tight">
                                <span
                                  className="truncate text-xs text-slate-700 dark:text-slate-300"
                                  title={option?.concept_name ?? undefined}
                                >
                                  {option?.concept_name ?? `CONCEPT_ID: ${option?.concept_id}`}
                                </span>
                                <span className="truncate font-mono text-[9px] text-slate-400" title={sub}>
                                  {sub}
                                </span>
                              </span>

                              {selected && (
                                <span className="material-symbols-outlined shrink-0 text-base text-primary">
                                  check
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              <ColumnsMenu
                headers={headers}
                hiddenCols={hiddenCols}
                onToggle={(col) =>
                  setHiddenCols((prev) =>
                    prev.includes(col) ? prev.filter((x) => x !== col) : [...prev, col],
                  )
                }
              />
              <button
                className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                onClick={() => setOpenFilter(true)}
              >
                <span className="material-symbols-outlined text-sm">
                  filter_alt
                </span>
                Filter
              </button>
            </div>
    </div>

        {Object.keys(filters).length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-4 pt-2">
            <FilterChips
              filters={filters}
              onChange={(nextFilters) => setFilters(nextFilters)}
            />
            {!isCurrentSearchSaved && (
              <button
                className="text-xs font-medium text-primary hover:underline"
                onClick={handleSaveFilters}
              >
                Save Filter
              </button>
            )}
          </div>
        )}

        <div className="custom-scrollbar flex-grow overflow-auto p-3">
          {loading && rows.length === 0 && (
            <div className="flex h-32 items-center justify-center">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined animate-spin text-base">
                  progress_activity
                </span>
                <span className="text-xs">Loading {displayName}...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex h-32 items-center justify-center">
              <div className="text-center">
                <span className="material-symbols-outlined mb-1 text-2xl text-red-400">
                  error
                </span>
                <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
                <button
                  className="mt-2 text-xs text-primary hover:underline"
                  onClick={() => setPage(page)}
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {!error &&
            (loading ? rows.length > 0 : true) &&
            visibleHeaders.length > 0 && (
              <DataGrid
                rows={gridRows}
                columns={gridColumns}
                getRowId={(row) => row.__id}
                paginationMode="server"
                page={page}
                pageSize={pageSize}
                pageSizeOptions={[10, 20, 50, 100]}
                rowCount={count >= 0 ? count : rows.length}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                stickyHeader
                loading={loading}
                emptyMessage={`No records found in ${displayName}`}
              />
            )}

          {!loading && !error && rows.length === 0 && (
            <div className="flex h-32 items-center justify-center">
              <div className="text-center text-slate-400">
                <span className="material-symbols-outlined mb-1 text-2xl">
                  table_rows
                </span>
                <p className="text-xs">No records found in {displayName}</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <SaveEndpointModal
        isOpen={openSaveEndpoint}
        onClose={() => setOpenSaveEndpoint(false)}
        onSave={handleConfirmSaveEndpoint}
        endpoint={currentSearchEndpoint as any}
        availableAttributes={headers}
        defaultAttributes={visibleHeaders}
      />

      {headers.length > 0 && (
        <FilterModal
          open={openFilter}
          onClose={() => setOpenFilter(false)}
          table={tableKey}
          headers={headers}
          sampleRow={Object.fromEntries(headers.map((h, i) => [h, rows[0]?.[i]]))}
          filters={filters}
          onApply={(next) => setFilters(next)}
          onClear={() => setFilters({})}
        />
      )}
    </div>
  );
};

export default ClinicalTablesDetail;
