import React from "react";
import { MdClose } from "react-icons/md";

export function SlideOver({
  open,
  onClose,
  title,
  children,
  widthClass = "w-full max-w-md",
  footer,
  rightActions,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  widthClass?: string;
  footer?: React.ReactNode;
  rightActions?: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 right-0 p-4">
        <div
          className={`h-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-panel-light dark:bg-panel-dark shadow-2xl flex flex-col ${widthClass}`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h2>
              {rightActions}
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              <MdClose size={16} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>

          {footer && (
            <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 px-4 py-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
