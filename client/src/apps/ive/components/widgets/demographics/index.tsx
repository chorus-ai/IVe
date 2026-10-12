import React, { useEffect, useState } from 'react';
import WidgetFrame from '../WidgetFrame';
import { apiFetch } from '../../../../../hooks/useApiFetch';
import type { WidgetComponentProps } from '../types';

export interface DemographicsData {
  gender: { label: string; percentage: number }[];
  avgAge: number;
  total: number;
}

export interface DemographicsConfig {
  /** 'static' shows the built-in sample data; 'endpoint' fetches the URL below. */
  source?: 'static' | 'endpoint';
  endpoint?: string;
  method?: 'GET' | 'POST';
  body?: string;
  /** Show the Avg Age / Total footer row. */
  showSummary?: boolean;
}

/** Built-in sample cohort, shown when source is 'static' (and as fetch fallback). */
const STATIC_DATA: DemographicsData = {
  gender: [
    { label: 'Female', percentage: 58 },
    { label: 'Male', percentage: 42 },
    { label: 'Other', percentage: 0 },
  ],
  avgAge: 64.2,
  total: 1245,
};

const BAR_COLORS = ['bg-primary', 'bg-blue-400', 'bg-slate-500'];

const DemographicsWidget: React.FC<WidgetComponentProps<DemographicsConfig>> = ({
  title, config, isEditMode, onRemove, onEdit,
}) => {
  const { source = 'static', endpoint, method = 'GET', body } = config;
  const showSummary = config.showSummary !== false;

  const [remote, setRemote] = useState<DemographicsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRemote(null);
    setError(null);
    if (source !== 'endpoint' || !endpoint) return;
    let cancelled = false;
    setLoading(true);
    apiFetch<DemographicsData>(endpoint, method === 'POST' ? { method: 'POST', body } : undefined)
      .then((d) => { if (!cancelled) setRemote(d); })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Request failed');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [source, endpoint, method, body]);

  const data = remote ?? STATIC_DATA;

  return (
    <WidgetFrame
      title={title}
      isEditMode={isEditMode}
      onRemove={onRemove}
      onEdit={onEdit}
    >
      <div className="p-6">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6">Gender Distribution</p>
        {error && (
          <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-2 mb-4">{error}</p>
        )}
        <div className={`space-y-6 ${loading ? 'opacity-50' : ''}`}>
          {data.gender.map((stat, i) => (
            <div key={stat.label} className="space-y-2">
              <div className="flex justify-between items-end text-xs font-bold transition-colors duration-300">
                <span className="text-slate-500 dark:text-slate-400 uppercase tracking-widest">{stat.label}</span>
                <span className="text-slate-900 dark:text-white text-sm">{stat.percentage}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden shadow-inner transition-colors duration-300">
                <div
                  className={`${BAR_COLORS[i % BAR_COLORS.length]} h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(19,109,236,0.3)]`}
                  style={{ width: `${stat.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {showSummary && (
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-around transition-colors duration-300">
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Avg Age</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-300">{data.avgAge}</p>
            </div>
            <div className="w-px bg-slate-100 dark:bg-slate-800 h-10 transition-colors duration-300"></div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-300">{data.total.toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </WidgetFrame>
  );
};

export default DemographicsWidget;
