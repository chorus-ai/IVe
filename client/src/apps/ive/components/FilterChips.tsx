import { MdClose } from "react-icons/md";

export function FilterChips({
  filters = {},
  onChange,
}: {
  filters?: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
}) {
  const handleDelete = (key: string) => {
    const next = { ...(filters || {}) };
    delete next[key];
    onChange(next);
  };

  const formatLabel = (key: string, val: any) => {
    if (Array.isArray(val)) return `${key}: ${val.join(", ")}`;
    if (typeof val === "object" && val !== null) {
      if (val.eq != null) return `${key}: = ${val.eq}`;
      if (val.between) return `${key}: ${val.between[0]} \u2192 ${val.between[1]}`;
      const parts: string[] = [];
      if (val.gt != null) parts.push(`>${val.gt}`);
      if (val.lt != null) parts.push(`<${val.lt}`);
      return `${key}: ${parts.join(" \u2192 ")}`;
    }
    return `${key}: ${val}`;
  };

  const entries = Object.entries(filters || {}).filter(
    ([, v]) =>
      v !== "" &&
      v !== null &&
      v !== undefined &&
      !(Array.isArray(v) && v.length === 0),
  );

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([key, val]) => (
        <span
          key={key}
          className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
        >
          <span>{formatLabel(key, val)}</span>
          <button
            onClick={() => handleDelete(key)}
            className="rounded-full p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <MdClose size={12} />
          </button>
        </span>
      ))}
    </div>
  );
}
