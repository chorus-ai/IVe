import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../hooks/useApiFetch';
import { useAppDispatch } from '../../../hooks/redux';
import { TABLE_CARDS, Concept } from '../types';
import { setTableFilters } from '../store';

function normalizeResponse(data: unknown): Concept[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'rows' in data && Array.isArray((data as { rows: unknown[] }).rows))
    return (data as { rows: Concept[] }).rows;
  return [];
}

function domainLabel(concept: Concept): string {
  return concept.table_name ?? concept.column_name ?? 'Concept';
}

type CategoryFilter = { table: string; column: string; keyword: string };

function columnForKeyword(table: string, keyword: string): string | null {
  const card = TABLE_CARDS.find((t) => t.key === table);
  if (!card) return null;
  const guess = `${keyword.toLowerCase()}_concept_id`;
  if (card.columns.includes(guess)) return guess;
  return card.columns.find((c) => c.endsWith('_concept_id')) ?? null;
}

const Search: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [category, setCategory] = useState<CategoryFilter | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search against /api/vocab/concept/search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const term = searchQuery.trim();
    if (!term) {
      setResults([]);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ name: term });
        if (category) {
          params.set('table', category.table);
          params.set('column', category.column);
        }
        const data = await apiFetch<unknown>(`/api/vocab/concept/search?${params}`);
        setResults(normalizeResponse(data));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, category]);

  const handleResultClick = (concept: Concept) => {
    if (!concept.column_name) {
      navigate(`/ive/table/${encodeURIComponent(concept.table_name)}`);
      return;
    }
    dispatch(setTableFilters({
      table: concept.table_name,
      filters: { [concept.column_name]: [concept.concept_id] },
    }));
    navigate(`/ive/table/${encodeURIComponent(concept.table_name)}`);
  };

  return (
    <div className="flex flex-col h-full w-full">
      <main className="flex-grow flex flex-col items-center justify-center px-6 relative overflow-hidden medical-grid w-full">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-3xl flex flex-col items-center text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
            Explore the <span className="text-primary">CHoRUS</span> OMOP CDM
          </h2>
          <p className="text-md text-slate-600 dark:text-slate-400 mb-10 max-w-xl leading-relaxed">
            Quickly find medical concepts across standardized vocabularies like
            SNOMED, RxNorm, and ICD-10.
          </p>

          <div className="w-full relative">
            <div className="relative flex items-center bg-white dark:bg-slate-900 border-2 border-primary rounded-2xl p-2 shadow-2xl shadow-primary/20 ring-4 ring-primary/10 transition-all duration-300">
              <div className="pl-4 text-primary">
                <span className="material-symbols-outlined text-2xl">
                  search
                </span>
              </div>
              <input
                className="w-full bg-transparent border-none focus:ring-0 text-md py-3 px-4 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search concepts..."
              />
              {loading && (
                <span className="material-symbols-outlined text-primary animate-spin mr-2">
                  progress_activity
                </span>
              )}
              <button className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20">
                <span>Search</span>
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </button>
            </div>

            {/* Results dropdown */}
            {searchQuery.trim() && (results.length > 0 || loading) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {results.slice(0, 20).map((concept, idx) => (
                    <div
                      key={`${concept.concept_id}-${idx}`}
                      onClick={() => handleResultClick(concept)}
                      className={`flex items-center justify-between p-4 rounded-xl cursor-pointer group transition-colors ${
                        idx === 0
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${idx === 0 ? "bg-primary/20" : "bg-slate-100 dark:bg-slate-800"}`}>
                          <span className={`material-symbols-outlined ${idx === 0 ? "text-primary" : "text-slate-500 dark:text-slate-400"}`}>
                            medical_information
                          </span>
                        </div>
                        <div className="text-left">
                          <p
                            className={`font-semibold group-hover:text-primary transition-colors ${
                              idx === 0
                                ? "font-bold text-slate-900 dark:text-white"
                                : "text-slate-700 dark:text-slate-200"
                            }`}
                          >
                            {concept.concept_name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Concept ID:{" "}
                            <span className="text-slate-700 dark:text-slate-300">{concept.concept_id}</span>
                            <span className="pl-4">Subject: </span>
                            <span className="font-bold text-emerald-500">{concept.count.toLocaleString()}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${
                            idx === 0
                              ? "bg-primary/20 text-primary"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {domainLabel(concept)}
                        </span>
                        {idx === 0 && (
                          <span className="material-symbols-outlined text-primary text-xl">
                            keyboard_return
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {loading && results.length === 0 && (
                    <div className="flex items-center justify-center py-8 text-slate-400">
                      <span className="material-symbols-outlined animate-spin mr-2">
                        progress_activity
                      </span>
                      Searching...
                    </div>
                  )}
                </div>

                {results.length > 0 && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center px-6">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest">
                      Showing top {Math.min(results.length, 20)} of{" "}
                      {results.length} results
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* No results */}
            {searchQuery.trim() &&
              searched &&
              !loading &&
              results.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                  <div className="p-8 text-center text-slate-400">
                    <span className="material-symbols-outlined text-3xl mb-2">
                      search_off
                    </span>
                    <p className="text-sm">
                      No concepts found for "{searchQuery}"
                    </p>
                  </div>
                </div>
              )}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 w-full mb-1">
              Common Categories
            </span>
            {TABLE_CARDS.map((t) => (
              // <button
              //   key={t.key}
              //   onClick={() => navigate(`/ive/table/${encodeURIComponent(t.key)}`)}
              //   className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-primary/50 hover:text-primary transition-colors"
              // >
              //   <span className="material-symbols-outlined text-lg">{t.icon}</span>
              //   {t.name}
              // </button>
              <React.Fragment key={t.key}>
                {t.domainKeywords.map((kw) => {
                  const isActive = category?.table === t.key && category?.keyword === kw;
                  return (
                    <button
                      key={`${t.key}-${kw}`}
                      onClick={() => {
                        if (isActive) {
                          setCategory(null);
                          return;
                        }
                        const column = columnForKeyword(t.key, kw);
                        if (!column) return;
                        setCategory({ table: t.key, column, keyword: kw });
                      }}
                      className={`flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border rounded-full text-sm font-semibold transition-colors ${
                        isActive
                          ? 'border-primary text-primary'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/50 hover:text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {isActive ? 'check' : t.icon}
                      </span>
                      {kw}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}   
            
            <button 
              onClick={() => navigate('/ive/tables')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-lg">more_horiz</span>
              Explore All Tables
            </button>
          </div>
        </div>
      </main>
      <footer className="w-full py-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              v5.4
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden md:block"></div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              OMOP Standard
            </div>
          </div>
          <div className="flex items-center gap-6">
            <a className="text-xs font-medium text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors" href="#">
              Documentation
            </a>
            <a
              className="text-xs font-medium text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors"
              href={import.meta.env.VITE_API_DOC}
              target="_blank"
              rel="noopener noreferrer"
            >
              API Reference
            </a>
            <a className="text-xs font-medium text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors" href="#">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Search;
