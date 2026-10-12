import { useEffect, useMemo, useState } from "react";
import { SearchConcept } from "./SearchConcept";

/* ------------------------------------------------------------------ */
/* Column-type helpers                                                */
/* ------------------------------------------------------------------ */

const isNumeric = (v: any) =>
  typeof v === "number" || /^-?\d+(\.\d+)?$/.test(String(v));

const isConceptIdColumn = (col: string) => col.endsWith("_concept_id");
const isIdColumn = (col: string) => col.endsWith("_id") && !isConceptIdColumn(col);
const isDateTimeColumn = (col: string) => col.endsWith("_datetime");
const isDateColumn = (col: string, sampleVal?: any) =>
  col.endsWith("_date") || (sampleVal != null && !isNaN(Date.parse(String(sampleVal))) && /\d{4}-\d{2}-\d{2}/.test(String(sampleVal)));
const isSourceValueColumn = (col: string) => col.endsWith("_source_value");
const isNumericColumn = (col: string, sampleVal?: any) =>
  isNumeric(sampleVal) ||
  col === "value_as_number" ||
  col === "range_low" ||
  col === "range_high";

type ColType = "concept_id" | "id" | "date" | "datetime" | "numeric" | "source_value" | "text";

const detectColType = (col: string, sampleVal?: any): ColType => {
  if (isConceptIdColumn(col)) return "concept_id";
  if (isIdColumn(col)) return "id";
  if (isDateTimeColumn(col)) return "datetime";
  if (isDateColumn(col, sampleVal)) return "date";
  if (isNumericColumn(col, sampleVal)) return "numeric";
  if (isSourceValueColumn(col)) return "source_value";
  return "text";
};

/* ------------------------------------------------------------------ */
/* Operators per column type                                          */
/* ------------------------------------------------------------------ */

type Op =
  | "contains"
  | "starts_with"
  | "ends_with"
  | "equals"
  | "gt"
  | "lt"
  | "between"
  | "in";

const OP_LABEL: Record<Op, string> = {
  contains: "contains",
  starts_with: "starts with",
  ends_with: "ends with",
  equals: "equals",
  gt: "greater than",
  lt: "less than",
  between: "between",
  in: "is one of",
};

const OPS_BY_TYPE: Record<ColType, Op[]> = {
  concept_id: ["in"],
  id: ["in"],
  date: ["between", "gt", "lt", "equals"],
  datetime: ["between", "gt", "lt", "equals"],
  numeric: ["between", "gt", "lt", "equals"],
  source_value: ["equals", "contains", "starts_with", "ends_with"],
  text: ["contains", "starts_with", "ends_with", "equals"],
};

/* ------------------------------------------------------------------ */
/* Rule shape + (de)serialisation against the existing filters record */
/* ------------------------------------------------------------------ */

type Rule = {
  id: string;        // local key only
  column: string;
  op: Op;
  value: any;        // shape depends on op (string, number, [a,b], number[])
};

const uid = () => Math.random().toString(36).slice(2);

// Convert one Rule -> the value shape the server expects for that column.
const ruleToFilterValue = (r: Rule): any => {
  if (r.value === "" || r.value === undefined || r.value === null) return "";
  switch (r.op) {
    case "contains":     return r.value;
    case "starts_with":  return { startsWith: r.value };
    case "ends_with":    return { endsWith: r.value };
    case "equals":       return { eq: r.value };
    case "gt":           return { gt: r.value };
    case "lt":           return { lt: r.value };
    case "between":      return Array.isArray(r.value) ? { between: r.value } : "";
    case "in":           return Array.isArray(r.value) ? r.value : [r.value];
    default:             return r.value;
  }
};

// Convert the current `filters` record back into a list of Rules so the modal
// re-opens with the same state.
const filtersToRules = (filters: Record<string, any>, sampleRow: Record<string, any>): Rule[] => {
  const out: Rule[] = [];
  for (const [col, val] of Object.entries(filters)) {
    if (val === "" || val == null) continue;
    const t = detectColType(col, sampleRow[col]);

    if (Array.isArray(val)) {
      out.push({ id: uid(), column: col, op: "in", value: val });
      continue;
    }
    if (typeof val === "object") {
      if ("between" in val) {
        out.push({ id: uid(), column: col, op: "between", value: val.between });
      } else if ("gt" in val && "lt" in val) {
        out.push({ id: uid(), column: col, op: "between", value: [val.gt, val.lt] });
      } else if ("gt" in val) {
        out.push({ id: uid(), column: col, op: "gt", value: val.gt });
      } else if ("lt" in val) {
        out.push({ id: uid(), column: col, op: "lt", value: val.lt });
      } else if ("eq" in val) {
        out.push({ id: uid(), column: col, op: "equals", value: val.eq });
      } else if ("startsWith" in val) {
        out.push({ id: uid(), column: col, op: "starts_with", value: val.startsWith });
      } else if ("endsWith" in val) {
        out.push({ id: uid(), column: col, op: "ends_with", value: val.endsWith });
      }
      continue;
    }
    // primitive
    out.push({ id: uid(), column: col, op: t === "text" || t === "source_value" ? "contains" : "equals", value: val });
  }
  return out;
};

// Collapse rules into the Record<column, value> shape downstream expects.
// Two rules on the same column: gt+lt collapse to between; otherwise last wins.
const rulesToFilters = (rules: Rule[]): Record<string, any> => {
  const out: Record<string, any> = {};
  for (const r of rules) {
    const v = ruleToFilterValue(r);
    if (v === "" || v == null) continue;

    if (r.column in out) {
      const prev = out[r.column];
      // gt then lt (or lt then gt) -> merge to between
      if (
        typeof prev === "object" && !Array.isArray(prev) &&
        typeof v === "object" && !Array.isArray(v) &&
        ("gt" in prev || "lt" in prev) &&
        ("gt" in v || "lt" in v)
      ) {
        const merged = { ...prev, ...v };
        if ("gt" in merged && "lt" in merged) {
          out[r.column] = { between: [merged.gt, merged.lt] };
        } else {
          out[r.column] = merged;
        }
        continue;
      }
    }
    out[r.column] = v;
  }
  return out;
};

/* ------------------------------------------------------------------ */
/* The modal                                                          */
/* ------------------------------------------------------------------ */

export function FilterModal({
  open,
  onClose,
  table,
  headers,
  sampleRow,
  filters,
  onApply,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  table: string;
  headers: string[];
  sampleRow: Record<string, any>;
  filters: Record<string, any>;
  onApply: (next: Record<string, any>) => void;
  onClear: () => void;
}) {
  const [rules, setRules] = useState<Rule[]>([]);

  // Hydrate rules from the applied filters whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    const next = filtersToRules(filters, sampleRow);
    setRules(next.length ? next : [makeBlankRule(headers)]);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const setRule = (id: string, patch: Partial<Rule>) => {
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRule = () => setRules((rs) => [...rs, makeBlankRule(headers)]);

  const removeRule = (id: string) =>
    setRules((rs) => (rs.length === 1 ? [makeBlankRule(headers)] : rs.filter((r) => r.id !== id)));

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Filter</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-5">
          {rules.map((rule, idx) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              showAnd={idx > 0}
              showAdd={idx === rules.length - 1}
              table={table}
              headers={headers}
              sampleRow={sampleRow}
              onChange={(patch) => setRule(rule.id, patch)}
              onAdd={addRule}
              onRemove={() => removeRule(rule.id)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              onClear();
              setRules([makeBlankRule(headers)]);
            }}
            className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(rulesToFilters(rules.filter((r) => r.column)));
              onClose();
            }}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Single rule row                                                    */
/* ------------------------------------------------------------------ */

function makeBlankRule(headers: string[]): Rule {
  const column = headers[0] || "";
  const t = detectColType(column);
  return { id: uid(), column, op: OPS_BY_TYPE[t][0], value: "" };
}

function RuleRow({
  rule,
  showAnd,
  showAdd,
  table,
  headers,
  sampleRow,
  onChange,
  onAdd,
  onRemove,
}: {
  rule: Rule;
  showAnd: boolean;
  showAdd: boolean;
  table: string;
  headers: string[];
  sampleRow: Record<string, any>;
  onChange: (patch: Partial<Rule>) => void;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const colType = useMemo(
    () => detectColType(rule.column, sampleRow[rule.column]),
    [rule.column, sampleRow],
  );
  const ops = OPS_BY_TYPE[colType];

  const selectClass =
    "w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/30";
  const inputClass =
    "w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  // When the column changes, snap operator to the first valid one for its
  // type and clear the value (so we never carry a string into a date input).
  const onColumnChange = (column: string) => {
    const t = detectColType(column, sampleRow[column]);
    onChange({ column, op: OPS_BY_TYPE[t][0], value: "" });
  };

  return (
    <div>
      {showAnd && (
        <div className="my-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          <span className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            AND
          </span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>
      )}

      <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
        Where
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Column dropdown */}
        <select
          value={rule.column}
          onChange={(e) => onColumnChange(e.target.value)}
          className={selectClass}
        >
          {headers.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>

        {/* Operator dropdown */}
        <select
          value={rule.op}
          onChange={(e) => onChange({ op: e.target.value as Op, value: "" })}
          className={selectClass}
        >
          {ops.map((op) => (
            <option key={op} value={op}>
              {OP_LABEL[op]}
            </option>
          ))}
        </select>
      </div>

      {/* Value editor (depends on column type + operator) */}
      <div className="mt-3">
        <ValueEditor
          rule={rule}
          colType={colType}
          table={table}
          inputClass={inputClass}
          onChange={(value) => onChange({ value })}
        />
      </div>

      {/* Row actions */}
      <div className="mt-3 flex items-center justify-end gap-4 text-sm font-medium">
        {showAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="text-primary hover:underline"
          >
            Add
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Value editor                                                       */
/* ------------------------------------------------------------------ */

function ValueEditor({
  rule,
  colType,
  table,
  inputClass,
  onChange,
}: {
  rule: Rule;
  colType: ColType;
  table: string;
  inputClass: string;
  onChange: (value: any) => void;
}) {
  // Concept_id: SearchConcept multi-select.
  if (colType === "concept_id") {
    const ids: any[] = Array.isArray(rule.value) ? rule.value : [];
    const selectedOpts = ids.map((id) => ({ concept_id: id, column_name: rule.column }));
    return (
      <SearchConcept
        table={table}
        columnName={rule.column}
        label={`Search ${rule.column}`}
        selectedOptions={selectedOpts}
        handleSelectedOptionsChange={(values) => {
          const nextIds = values
            .filter((v) => v?.column_name === rule.column)
            .map((v) => v.concept_id);
          onChange(nextIds);
        }}
      />
    );
  }

  // Free-text ID list parsed into an array of numbers/strings.
  if (colType === "id") {
    const arr = Array.isArray(rule.value) ? rule.value : [];
    return (
      <input
        type="text"
        placeholder="e.g. 12, 34, 56"
        defaultValue={arr.join(", ")}
        onBlur={(e) => {
          const parsed = e.target.value
            .split(/[,\s]+/)
            .map((s) => s.trim())
            .filter(Boolean)
            .map((s) => (Number.isNaN(Number(s)) ? s : Number(s)));
          onChange(parsed);
        }}
        className={inputClass}
      />
    );
  }

  // Between (two inputs of the same type as the column).
  if (rule.op === "between") {
    const arr: any[] = Array.isArray(rule.value) ? rule.value : ["", ""];
    const [a, b] = [arr[0] ?? "", arr[1] ?? ""];
    const inputType =
      colType === "date" ? "date" :
      colType === "datetime" ? "datetime-local" :
      colType === "numeric" ? "number" : "text";
    return (
      <div className="grid grid-cols-2 gap-2">
        <input
          type={inputType}
          value={a}
          onChange={(e) => onChange([castByType(e.target.value, colType), b])}
          className={inputClass}
          placeholder="from"
        />
        <input
          type={inputType}
          value={b}
          onChange={(e) => onChange([a, castByType(e.target.value, colType)])}
          className={inputClass}
          placeholder="to"
        />
      </div>
    );
  }

  // gt / lt / equals — single typed input.
  if (rule.op === "gt" || rule.op === "lt" || rule.op === "equals") {
    const inputType =
      colType === "date" ? "date" :
      colType === "datetime" ? "datetime-local" :
      colType === "numeric" ? "number" : "text";
    return (
      <input
        type={inputType}
        value={rule.value ?? ""}
        onChange={(e) => onChange(castByType(e.target.value, colType))}
        className={inputClass}
        placeholder="value"
      />
    );
  }

  // Default text input for contains / starts_with / ends_with.
  return (
    <input
      type="text"
      value={rule.value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
      placeholder="value"
    />
  );
}

const castByType = (raw: string, t: ColType): any => {
  if (raw === "") return "";
  if (t === "numeric") {
    const n = Number(raw);
    return Number.isNaN(n) ? raw : n;
  }
  return raw;
};
