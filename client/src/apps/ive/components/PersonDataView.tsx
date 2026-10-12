import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WidgetConfig } from './widgets/types';
import RegistryWidget from './widgets/registry';
import PersonVisitTimeline from './PersonVisitTimeline';

const PersonDataView: React.FC = () => {
  const { personId = '' } = useParams<{ personId: string }>();
  const navigate = useNavigate();
  const onClose = () => navigate(-1);

  // The record is now organised by visit occurrence rather than by table: one card
  // per OMOP table listed every row the person ever had, with no way to tell
  // which admission it belonged to.
  const headerWidget: WidgetConfig = {
    id: 'p-header',
    type: 'patient_profile',
    title: `${personId} (Historical Record)`,
    w: 12,
    h: 'auto',
    config: { personId },
  };

  return (
    <div className="flex flex-1 overflow-hidden h-full flex-col bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Person View</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Person ID: {personId}</p>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <RegistryWidget widget={headerWidget} onRemove={() => {}} isEditMode={false} />
          <PersonVisitTimeline personId={personId} />
        </div>
      </div>
    </div>
  );
};

export default PersonDataView;
