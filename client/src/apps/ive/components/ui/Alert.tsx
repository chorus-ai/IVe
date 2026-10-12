import React from "react";
import {
  MdInfoOutline,
  MdCheckCircleOutline,
  MdWarningAmber,
  MdErrorOutline,
} from "react-icons/md";

type Tone = "info" | "success" | "warning" | "danger";

const toneClass: Record<Tone, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-900/20 dark:text-blue-200",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-200",
  warning:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-200",
  danger:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200",
};

const toneIcon: Record<Tone, React.ComponentType<{ size?: number }>> = {
  info: MdInfoOutline,
  success: MdCheckCircleOutline,
  warning: MdWarningAmber,
  danger: MdErrorOutline,
};

export function Alert({
  tone = "info",
  title,
  children,
  className = "",
}: {
  tone?: Tone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const Icon = toneIcon[tone];
  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${toneClass[tone]} ${className}`}
    >
      <Icon size={16} />
      <div className="flex-1">
        {title && <div className="font-medium">{title}</div>}
        {children && <div className="text-xs opacity-90">{children}</div>}
      </div>
    </div>
  );
}
