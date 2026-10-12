import React from 'react';
import { inputCls, labelCls } from './settings';
import type { RequestSpec } from './requestTemplate';

interface RequestTemplateSectionProps {
  request?: RequestSpec;
  onChange: (next?: RequestSpec) => void;
  /** Placeholder names injectable into the template, e.g. "personId", "conceptIds (number[])". */
  placeholders: string[];
  endpointPlaceholder?: string;
  bodyPlaceholder?: string;
}

/**
 * Collapsible "Custom Request (advanced)" settings block shared by widgets
 * that accept an executable request template overriding their built-in query.
 */
const RequestTemplateSection: React.FC<RequestTemplateSectionProps> = ({
  request, onChange, placeholders,
  endpointPlaceholder = '/api/omop/…/search?page=1&pageSize=0',
  bodyPlaceholder = '{ "person_id": {{personId}} }',
}) => (
  <details className="text-xs text-slate-500 dark:text-slate-400" open={!!request?.endpoint}>
    <summary className="cursor-pointer font-bold uppercase tracking-wider">Custom Request (advanced)</summary>
    <div className="mt-3 space-y-3">
      <p>
        Overrides the built-in query. Live fields above are injected via{' '}
        {placeholders.map((p, i) => (
          <React.Fragment key={p}>
            {i > 0 && ', '}
            <code className="font-mono">{`{{${p}}}`}</code>
          </React.Fragment>
        ))}
        .
      </p>
      <div className="grid grid-cols-[100px_1fr] gap-2">
        <div>
          <label className={labelCls}>Method</label>
          <select
            value={request?.method ?? 'POST'}
            onChange={(e) => request && onChange({ ...request, method: e.target.value as 'GET' | 'POST' })}
            className={inputCls}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Endpoint</label>
          <input
            type="text"
            value={request?.endpoint ?? ''}
            onChange={(e) => onChange(e.target.value
              ? { method: 'POST', body: '', ...request, endpoint: e.target.value }
              : undefined)}
            placeholder={endpointPlaceholder}
            className={`${inputCls} font-mono`}
          />
        </div>
      </div>
      <div>
        <label className={labelCls}>Body Template (JSON)</label>
        <textarea
          rows={3}
          value={request?.body ?? ''}
          onChange={(e) => request && onChange({ ...request, body: e.target.value })}
          placeholder={bodyPlaceholder}
          className={`${inputCls} font-mono`}
        />
      </div>
    </div>
  </details>
);

export default RequestTemplateSection;
