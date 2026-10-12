import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../hooks/redux';
import { clearIveAlert } from '../../store';

const severityClass: Record<string, string> = {
  success: 'bg-emerald-500 text-white',
  info: 'bg-blue-500 text-white',
  warning: 'bg-amber-500 text-white',
  error: 'bg-red-500 text-white',
};

const severityIcon: Record<string, string> = {
  success: 'check_circle',
  info: 'info',
  warning: 'warning',
  error: 'error',
};

const Toast: React.FC = () => {
  const dispatch = useAppDispatch();
  const alert = useAppSelector((s) => s.ive.alert);

  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => dispatch(clearIveAlert()), 3000);
    return () => clearTimeout(timer);
  }, [alert, dispatch]);

  if (!alert) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ${severityClass[alert.severity] || severityClass.info}`}>
        <span className="material-symbols-outlined text-sm">{severityIcon[alert.severity] || 'info'}</span>
        <span className="text-xs tracking-widest">{alert.message}</span>
      </div>
    </div>
  );
};

export default Toast;
