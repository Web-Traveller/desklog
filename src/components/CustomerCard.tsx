import React from 'react';
import { Customer } from '../types';
import { CustomerAvatar } from './CustomerAvatar';
import { useDesk } from '../context/DeskContext';

interface CustomerCardProps {
  customer: Customer;
  activeTasksCount?: number;
  completedTasksCount?: number;
  ongoingTaskTitle?: string;
  highlightQuery?: string;
  isCompact?: boolean;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  activeTasksCount = 0,
  completedTasksCount = 0,
  ongoingTaskTitle,
  highlightQuery,
}) => {
  const { navigateToCustomerProfile, confirmDeleteCustomer } = useDesk();

  const renderHighlightedName = (name: string, query?: string) => {
    if (!query) return name;
    const parts = name.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-primary-fixed text-on-primary-fixed px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleDeleteCustomer = (e: React.MouseEvent) => {
    e.stopPropagation();
    confirmDeleteCustomer(customer);
  };

  return (
    <div
      onClick={() => navigateToCustomerProfile(customer.id)}
      className="group cursor-pointer rounded-xl bg-surface-container-lowest p-3.5 flex flex-col justify-between gap-2.5 transition-all hover:border-primary/40 hover:shadow-md border border-surface-container/60 shadow-xs relative"
    >
      {/* Top Header: Avatar + Info + Badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <CustomerAvatar
            colorClass={customer.avatar_color}
            initials={customer.avatar_initials || 'CU'}
            size="sm"
          />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                {renderHighlightedName(customer.name, highlightQuery)}
              </h3>
              {customer.id === 'cust-general' && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-surface-container text-on-surface-variant font-bold">
                  Default
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-on-surface-variant font-mono">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-outline">call</span>
                {customer.mobile || "No Mobile"}
              </span>
              {customer.aadhaar_number && (
                <span className="hidden sm:flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-outline">badge</span>
                  {customer.aadhaar_number.slice(-4)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Task Counts */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
            activeTasksCount > 0 ? 'bg-primary-container text-on-primary-container font-bold' : 'bg-surface-container text-on-surface-variant'
          }`}>
            {activeTasksCount} Active
          </span>
          {completedTasksCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-surface-container text-on-surface-variant">
              {completedTasksCount} Done
            </span>
          )}
        </div>
      </div>

      {/* Ongoing Task Banner if present */}
      {ongoingTaskTitle && (
        <div className="rounded-lg bg-surface-container-low px-2.5 py-1 flex items-center justify-between gap-2 text-xs border border-surface-container-high/30">
          <div className="flex items-center gap-1 min-w-0">
            <span className="material-symbols-outlined text-primary text-[14px]">hourglass_top</span>
            <span className="text-on-surface-variant truncate text-[11px] font-medium">{ongoingTaskTitle}</span>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-surface-container/40 text-xs">
        <span className="text-[11px] text-outline truncate max-w-[180px]">
          {customer.note || "No remarks"}
        </span>

        <div className="flex items-center gap-1">
          {customer.id !== 'cust-general' && (
            <button
              className="p-1 rounded-full text-outline hover:text-error hover:bg-error-container/20 transition-colors"
              onClick={handleDeleteCustomer}
              title="Delete Customer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
          )}
          <span className="text-primary font-semibold text-[11px] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            Profile →
          </span>
        </div>
      </div>
    </div>
  );
};
