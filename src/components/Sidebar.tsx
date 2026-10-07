import React from 'react';
import { useDesk } from '../context/DeskContext';
import { ActivePage } from '../types';

export const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage } = useDesk();

  const navItems: { id: ActivePage; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'customers', label: 'Customers', icon: 'group' },
    { id: 'tasks', label: 'Tasks Register', icon: 'assignment' },
    { id: 'calendar', label: 'Calendar Log', icon: 'calendar_month' },
    { id: 'payments', label: 'Payments', icon: 'payments' },
    { id: 'banking', label: 'Banking', icon: 'account_balance' },
    { id: 'services', label: 'Services Catalog', icon: 'design_services' },
  ];

  const bottomItems: { id: ActivePage; label: string; icon: string }[] = [
    { id: 'settings', label: 'Settings', icon: 'tune' },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface-container-lowest z-40 flex flex-col justify-between py-space-lg shadow-[0_1px_8px_rgba(0,0,0,0.03)] border-r border-surface-container/60">
      <div className="flex flex-col gap-space-xs px-space-sm">
        <div className="px-space-sm pb-space-xs">
          <span className="font-fine-print text-fine-print text-outline uppercase tracking-wider font-semibold">
            Workspace
          </span>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                className={`flex items-center gap-space-sm px-space-sm py-space-xs rounded-xl transition-all text-left font-button-utility text-button-utility ${
                  isActive
                    ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
                onClick={() => setCurrentPage(item.id)}
                type="button"
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="px-space-sm flex flex-col gap-1">
        <div className="px-space-sm pb-space-xs">
          <span className="font-fine-print text-fine-print text-outline uppercase tracking-wider font-semibold">
            System
          </span>
        </div>
        <nav className="flex flex-col gap-1">
          {bottomItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                className={`flex items-center gap-space-sm px-space-sm py-space-xs rounded-xl transition-all text-left font-button-utility text-button-utility ${
                  isActive
                    ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
                onClick={() => setCurrentPage(item.id)}
                type="button"
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
