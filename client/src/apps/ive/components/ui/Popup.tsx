import React, { useEffect, useRef } from "react";
import { MdClose } from "react-icons/md";

export function Popup({
  open,
  onClose,
  title,
  children,
  footer,
  widthClass = "w-full max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[90vh] flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl ${widthClass}`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              <MdClose size={16} />
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>

        {footer && (
          <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
