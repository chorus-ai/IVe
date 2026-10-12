import React, { useRef, useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks/redux";
import { loadConcept } from "../api/concepts";

interface Props {
  conceptId: string | number | null | undefined;
  className?: string;
}

const ConceptHoverIcon: React.FC<Props> = ({ conceptId, className = "" }) => {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const iconRef = useRef<HTMLSpanElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const hasConcept =
    conceptId != null && conceptId !== "" && Number(conceptId) !== 0;
  const key = hasConcept ? String(conceptId) : null;

  const detail = useAppSelector((s) => (key ? s.ive.concepts.byId[key] : undefined));
  const loading = useAppSelector((s) => (key ? !!s.ive.concepts.loading[key] : false));
  const error = useAppSelector((s) => (key ? s.ive.concepts.errors[key] : undefined));
  const conceptsState = useAppSelector((s) => s.ive.concepts);

  useEffect(() => {
    if (!open || !key) return;
    loadConcept(dispatch, key, conceptsState);
  }, [open, key, conceptsState, dispatch]);

  if (!hasConcept) return null;

  const handleEnter = () => {
    if (iconRef.current) {
      const r = iconRef.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 6, left: r.left });
    }
    setOpen(true);
  };

  const handleLeave = () => setOpen(false);

  return (
    <>
      <span
        ref={iconRef}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className={`material-symbols-outlined cursor-help text-[14px] leading-none text-slate-400 hover:text-primary ${className}`}
      >
        open_in_new
      </span>
      {open && coords && (
        <div
          style={{ position: "fixed", top: coords.top, left: coords.left, zIndex: 50 }}
          className="pointer-events-none max-w-xs rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-800 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          {loading && (
            <span className="text-slate-500 dark:text-slate-300">Loading…</span>
          )}
          {error && (
            <span className="text-red-600 dark:text-red-300">{error}</span>
          )}
          {detail && (
            <div className="space-y-0.5">
              <div className="font-medium text-slate-900 dark:text-slate-50">
                {detail.concept_name ?? "(no name)"}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {[detail.domain_id, detail.vocabulary_id, detail.concept_code]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ConceptHoverIcon;
