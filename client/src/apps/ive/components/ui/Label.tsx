import React from "react";

export function Label({
  children,
  htmlFor,
  required,
  className = "",
}: {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-xs font-medium text-slate-600 dark:text-slate-400 ${className}`}
    >
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}
