import React from 'react';
import { useLocation } from 'react-router-dom';

const Footer: React.FC = () => {
  const { pathname } = useLocation();
  const showFooter = pathname.includes('/tables') || pathname.includes('/table');

  if (!showFooter) return null;

  return (
        <footer className="h-10 border-t border-slate-200 dark:border-slate-800 bg-panel-light dark:bg-panel-dark px-6 flex items-center justify-between transition-colors duration-300 shrink-0">
        <div className="flex items-center gap-6">
        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            System Status: Active
        </div>
        <div className="h-3 w-px bg-slate-200 dark:bg-slate-800"></div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2 uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px]">database</span>
            Vocabulary v5.0 (v20231012)
        </div>
        </div>
        <div className="flex items-center gap-6">
        <a href="#" className="text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">Documentation</a>
        <a href="#" className="text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">System Logs</a>
        <a href="#" className="text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">Support</a>
        </div>
    </footer>
  );
};

export default Footer;