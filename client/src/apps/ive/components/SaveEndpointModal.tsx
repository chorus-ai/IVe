import React, { useEffect, useMemo, useState } from 'react';
import { toSlug } from '../api/types';

interface SaveEndpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    description: string;
    tagSlugs: string[];
    isPublic: boolean;
    isCached: boolean;
    countOnly: boolean;
    attributes: string[];
  }) => void;
  endpoint: { endpoint: string; method: string; params?: Record<string, unknown> } | null;
  /** All columns available for selection. */
  availableAttributes?: string[];
  /** Columns selected by default. */
  defaultAttributes?: string[];
  /** "create" (default) for save filter; "edit" for editing an existing endpoint. */
  mode?: 'create' | 'edit';
  initialValues?: {
    description?: string;
    tagSlugs?: string[];
    isPublic?: boolean;
    isCached?: boolean;
    countOnly?: boolean;
    attributes?: string[];
  };
}

const SaveEndpointModal: React.FC<SaveEndpointModalProps> = ({
  isOpen,
  onClose,
  onSave,
  endpoint,
  availableAttributes = [],
  defaultAttributes = [],
  mode = 'create',
  initialValues,
}) => {
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isCached, setIsCached] = useState(false);
  const [countOnly, setCountOnly] = useState(false);
  const [attrs, setAttrs] = useState<string[]>([]);
  const [attrFilter, setAttrFilter] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const iv = initialValues || {};
    setDescription(iv.description ?? '');
    setTagInput('');
    setTags(iv.tagSlugs ?? []);
    setIsPublic(iv.isPublic ?? true);
    setIsCached(iv.isCached ?? false);
    setCountOnly(iv.countOnly ?? false);
    setAttrs(
      iv.attributes
        ? iv.attributes
        : defaultAttributes.length
          ? defaultAttributes
          : availableAttributes
    );
    setAttrFilter('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const previewEndpoint = useMemo(() => {
    if (!endpoint) return null;
    const baseParams = { ...(endpoint.params || {}) };
    delete (baseParams as any).countOnly;
    const params: Record<string, unknown> = {
      ...baseParams,
      attributes: countOnly ? [] : attrs,
    };
    if (countOnly) params.countOnly = true;
    return { ...endpoint, params };
  }, [endpoint, attrs, countOnly]);

  if (!isOpen) return null;

  const addTag = (raw: string) => {
    const slug = toSlug(raw);
    if (!slug) return;
    if (!tags.includes(slug)) setTags([...tags, slug]);
    setTagInput('');
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const removeTag = (slug: string) => setTags(tags.filter((t) => t !== slug));

  const toggleAttr = (col: string) => {
    setAttrs((prev) => (prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]));
  };

  const allChecked = availableAttributes.length > 0 && attrs.length === availableAttributes.length;
  const toggleAll = () => setAttrs(allChecked ? [] : [...availableAttributes]);

  const filteredAttrs = attrFilter
    ? availableAttributes.filter((c) => c.toLowerCase().includes(attrFilter.toLowerCase()))
    : availableAttributes;

  const handleSave = () => {
    onSave({
      description: description.trim(),
      tagSlugs: tags,
      isPublic,
      isCached,
      countOnly,
      attributes: countOnly ? [] : attrs,
    });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 transition-colors duration-300 max-h-[90vh]">

        <div className="px-6 py-5 bg-slate-50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">
              {mode === 'edit' ? 'edit' : 'bookmark_add'}
            </span>
            {mode === 'edit' ? 'Edit Endpoint' : 'Save Filter as Endpoint'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {mode === 'edit'
              ? 'Update description, tags, attributes, and visibility.'
              : 'Persist the current search so you can re-run or share it later.'}
          </p>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          <div>
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Diabetic patients seen in 2026"
              className="m-0 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Tags (Press Enter)</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((slug) => (
                <span
                  key={slug}
                  className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-1 rounded-lg text-[10px] font-bold border border-primary/20"
                >
                  {slug}
                  <button onClick={() => removeTag(slug)} className="hover:text-primary/70">
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add tag..."
              className="m-0 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-slate-800 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              Public
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isCached}
                onChange={(e) => setIsCached(e.target.checked)}
                className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              Cached
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={countOnly}
                onChange={(e) => setCountOnly(e.target.checked)}
                className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              Count Only
            </label>
          </div>

          {!countOnly && availableAttributes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                  Attributes ({attrs.length}/{availableAttributes.length})
                </label>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  {allChecked ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <input
                type="text"
                value={attrFilter}
                onChange={(e) => setAttrFilter(e.target.value)}
                placeholder="Filter columns..."
                className="m-0 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary focus:border-primary transition-all text-slate-800 dark:text-white mb-2"
              />
              <div className="max-h-40 overflow-auto custom-scrollbar rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 grid grid-cols-2 gap-1">
                {filteredAttrs.map((col) => (
                  <label
                    key={col}
                    className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={attrs.includes(col)}
                      onChange={() => toggleAttr(col)}
                      className="size-3.5 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="truncate">{col}</span>
                  </label>
                ))}
                {filteredAttrs.length === 0 && (
                  <span className="text-[11px] text-slate-400 col-span-2 text-center py-2">No matches</span>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Endpoint Preview</label>
            <div className="h-40 w-full bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 font-mono text-xs text-blue-600 dark:text-blue-300 overflow-auto custom-scrollbar transition-colors duration-300">
              <pre>{JSON.stringify(previewEndpoint, null, 2)}</pre>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 transition-colors duration-300">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors uppercase tracking-widest"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!endpoint}
            className="px-6 py-2 bg-primary text-white text-xs font-bold rounded-xl uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mode === 'edit' ? 'Save Changes' : 'Confirm & Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveEndpointModal;
