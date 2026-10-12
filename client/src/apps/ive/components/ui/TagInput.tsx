import React, { useState } from 'react';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  maxTags?: number;
}

const TagInput: React.FC<TagInputProps> = ({
  value,
  onChange,
  placeholder = 'Add tag...',
  label,
  disabled = false,
  className = '',
  maxTags,
}) => {
  const [draft, setDraft] = useState('');

  const addTag = () => {
    const t = draft.trim();
    if (!t) return;
    if (value.includes(t)) {
      setDraft('');
      return;
    }
    if (maxTags != null && value.length >= maxTags) return;
    onChange([...value, t]);
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className={className}>
      {label && (
        <label className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          {label}
        </label>
      )}
      {value.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-primary/70"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={placeholder}
        disabled={disabled}
        className="m-0 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-800 transition-all focus:border-primary focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
      />
    </div>
  );
};

export default TagInput;
