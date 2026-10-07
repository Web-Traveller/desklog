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
    <div className="rounded-[18px] bg-surface-container-lowest p-space-lg flex flex-col gap-space-md transition-all hover:-translate-y-0.5 duration-200 border border-surface-container/60 shadow-[0_1px_6px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-space-md">
        <div className="flex items-start gap-space-md">
          <CustomerAvatar
            colorClass={customer.avatar_color}
            initials={customer.avatar_initials || 'DS'}
            size="md"
          />
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-space-xs flex-wrap">
              <h3 className="font-body-strong text-body-strong text-on-surface">
                {renderHighlightedName(customer.name, highlightQuery)}
              </h3>
              {customer.id === 'cust-general' && (
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-fine-print text-fine-print font-bold">
                  System Default Walk-in
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-space-md gap-y-1 font-caption text-caption text-on-surface-variant">
              <span className="flex items-center gap-1 font-mono">
                <span className="material-symbols-outlined text-sm text-outline">call</span>
                {customer.mobile || "No Mobile"}
              </span>
              {customer.aadhaar_number && (
                <span className="flex items-center gap-1 font-mono">
                  <span className="material-symbols-outlined text-sm text-outline">badge</span>
                  {customer.aadhaar_number}
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-outline">event</span>
                Enrolled {customer.created_at}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-space-xs self-start">
          <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-fine-print text-fine-print font-medium">
            {activeTasksCount} Active {activeTasksCount === 1 ? 'Task' : 'Tasks'}
          </span>
          {completedTasksCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-fine-print text-fine-print">
              {completedTasksCount} Completed
            </span>
          )}
        </div>
      </div>

      {ongoingTaskTitle && (
        <div className="rounded-xl bg-surface-container-low p-space-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm border border-surface-container-high/30">
          <div className="flex items-center gap-space-xs min-w-0">
            <span className="material-symbols-outlined text-primary text-base">hourglass_top</span>
            <span className="font-caption-strong text-caption-strong text-on-surface">Ongoing:</span>
            <span className="font-caption text-caption text-on-surface-variant truncate">
              {ongoingTaskTitle}
            </span>
          </div>
          <span className="font-fine-print text-fine-print text-outline flex-shrink-0">Updated recently</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs border-t border-surface-container/40">
        <span className="font-fine-print text-fine-print text-on-surface-variant">
          {customer.note || 'Desk Client Profile'}
        </span>
        <div className="flex items-center gap-space-xs">
          {customer.id !== 'cust-general' && (
            <button
              className="px-space-sm py-space-xs rounded-full bg-surface-container hover:bg-tertiary-fixed text-on-surface hover:text-on-tertiary-fixed font-button-utility text-button-utility transition-transform active:scale-95"
              onClick={handleDeleteCustomer}
              title="Delete Customer"
              type="button"
            >
              <span className="material-symbols-outlined text-base">delete</span>
            </button>
          )}
          <button
            className="px-space-md py-space-xs rounded-full bg-primary-container text-on-primary font-button-utility text-button-utility hover:bg-primary transition-transform active:scale-95 shadow-sm"
            onClick={() => navigateToCustomerProfile(customer.id)}
            type="button"
          >
            View Full Profile →
          </button>
        </div>
      </div>
    </div>
  );
};
