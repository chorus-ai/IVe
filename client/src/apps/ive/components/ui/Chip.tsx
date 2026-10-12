import React from "react";
import { MdClose } from "react-icons/md";

export function Chip({
  children,
  onDelete,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onDelete?: () => void;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 ${
        onClick ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800" : ""
      } ${className}`}
    >
      <span>{children}</span>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded-full p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <MdClose size={12} />
        </button>
      )}
    </span>
  );
}
