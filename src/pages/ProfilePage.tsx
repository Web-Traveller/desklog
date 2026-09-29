import React, { useState, useEffect } from 'react';
import { useDesk } from '../context/DeskContext';
import { CustomerAvatar } from '../components/CustomerAvatar';
import { MetricCard } from '../components/MetricCard';
import { TaskCard } from '../components/TaskCard';
import { EditCustomerModal } from '../components/EditCustomerModal';

export const ProfilePage: React.FC = () => {
  const {
    selectedCustomerId,
    highlightedTaskId,
    customers,
    tasks,
    setCurrentPage,
    confirmDeleteCustomer,
    showToast,
  } = useDesk();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'all' | 'processing' | 'done'>('all');

  const customer = customers.find((c) => c.id === selectedCustomerId) || customers[0];
  const customerTasks = tasks.filter((t) => t.customerId === customer?.id);

  const pendingCount = customerTasks.filter((t) => t.status === 'pending').length;
  const processingCount = customerTasks.filter((t) => t.status === 'processing').length;
  const doneCount = customerTasks.filter((t) => t.status === 'done').length;

  const totalDueBalance = customerTasks.reduce((acc, t) => {
    const amount = t.billingAmount || 0;
    const paid = t.amountPaid || 0;
    return acc + Math.max(0, amount - paid);
  }, 0);

  const handleDeleteCustomer = () => {
    if (customer) {
      confirmDeleteCustomer(customer);
    }
  };

  const filteredTasks = customerTasks.filter((t) => {
    if (taskFilter === 'processing') return t.status !== 'done';
    if (taskFilter === 'done') return t.status === 'done';
    return true;
  });

  // Auto-scroll to highlighted task card if triggered from Calendar/Search
  useEffect(() => {
    if (highlightedTaskId) {
      const el = document.getElementById(`task-card-${highlightedTaskId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedTaskId]);

  const handleCopyPhone = () => {
    if (customer?.phone && customer.phone !== 'N/A') {
      navigator.clipboard?.writeText(customer.phone);
      showToast(`Mobile number ${customer.phone} copied to clipboard.`, 'success');
    }
  };



  if (!customer) return null;

  return (
    <div className="w-full max-w-6xl mx-auto px-gutter py-space-xl flex flex-col gap-space-xl">
      {/* Top Nav Breadcrumbs & Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md border-b border-surface-container pb-space-xs">
        <div className="flex flex-col gap-space-xxs">
          <button
            className="inline-flex items-center gap-1.5 text-secondary hover:text-primary transition-colors font-button-utility text-button-utility w-fit group"
            onClick={() => setCurrentPage('customers')}
            type="button"
          >
            <span className="material-symbols-outlined text-base transition-transform group-hover:-translate-x-0.5">
              arrow_back
            </span>
            <span>Back to All Customers</span>
          </button>
          <div className="flex items-center gap-space-sm mt-1">
            <h1 className="font-display-md text-display-md text-on-surface tracking-tight font-semibold">
              Customer Profile
            </h1>
          </div>
        </div>

        {customer.id !== 'cust-general' && (
          <div className="flex items-center gap-space-sm">
            <button
              className="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container-lowest hover:bg-surface-container transition-transform active:scale-95 text-on-surface font-button-utility text-button-utility shadow-xs border border-surface-container/60"
              onClick={() => setIsEditOpen(true)}
              type="button"
            >
              <span className="material-symbols-outlined text-lg text-outline">edit</span>
              <span>Edit Details</span>
            </button>
            <button
              className="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-tertiary-fixed text-on-tertiary-fixed hover:bg-tertiary transition-transform active:scale-95 font-button-utility text-button-utility shadow-xs"
              onClick={handleDeleteCustomer}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
              <span>Delete Customer</span>
            </button>
          </div>
        )}
      </div>

      {/* Customer Identity Card */}
      <div className="w-full bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-space-lg relative overflow-hidden">
        <div className="flex items-start md:items-center gap-space-md min-w-0">
          <CustomerAvatar
            colorClass={customer.avatarColor}
            initials={customer.avatarInitials || 'DS'}
            size="lg"
          />
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-space-xs">
              <span className="font-tagline text-tagline text-on-surface font-semibold tracking-tight truncate">
                {customer.name}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-fine-print text-fine-print">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                Active Profile
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-space-md text-on-surface-variant font-caption text-caption">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-outline">call</span>
                <span className="font-medium text-on-surface font-mono">{customer.phone}</span>
                {customer.phone !== 'N/A' && (
                  <button
                    className="text-outline hover:text-primary transition-colors ml-0.5 inline-flex items-center"
                    onClick={handleCopyPhone}
                    title="Copy Mobile"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>
                )}
              </div>
              <span className="text-surface-dim">/</span>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-outline">
                  calendar_month
                </span>
                <span>Enrolled: {customer.registeredDate}</span>
              </div>
            </div>

            {customer.notes && (
              <p className="font-fine-print text-fine-print text-outline mt-1 italic">
                "{customer.notes}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Task Summary Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-space-md">
        <MetricCard
          icon="folder_open"
          title="Total Tasks"
          value={customerTasks.length}
        />
        <MetricCard
          icon="hourglass_empty"
          title="Pending"
          value={pendingCount}
        />
        <MetricCard
          icon="pending_actions"
          iconColorClass="text-primary"
          title="Processing"
          value={processingCount}
        />
        <MetricCard
          icon="check_circle"
          iconColorClass="text-secondary"
          title="Completed"
          value={doneCount}
        />
        <MetricCard
          icon="payments"
          iconColorClass={totalDueBalance > 0 ? "text-tertiary" : "text-secondary"}
          title="Due Balance"
          value={`₹${totalDueBalance}`}
        />
      </div>

      {/* Task History List */}
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-lg" id="customer-task-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-xs border-b border-surface-container">
          <div className="flex items-center gap-space-sm">
            <h2 className="font-tagline text-tagline font-semibold text-on-surface">
              Task History
            </h2>
            <span className="font-caption text-caption text-on-surface-variant">
              Chronological Record
            </span>
          </div>

          <div className="flex items-center p-1 rounded-xl bg-surface-container text-on-surface-variant font-button-utility text-button-utility">
            <button
              className={`px-space-sm py-1 rounded-lg transition-all ${
                taskFilter === 'all'
                  ? 'bg-surface-container-lowest text-on-surface font-medium shadow-xs'
                  : 'hover:text-on-surface'
              }`}
              onClick={() => setTaskFilter('all')}
              type="button"
            >
              All ({customerTasks.length})
            </button>
            <button
              className={`px-space-sm py-1 rounded-lg transition-all ${
                taskFilter === 'processing'
                  ? 'bg-surface-container-lowest text-on-surface font-medium shadow-xs'
                  : 'hover:text-on-surface'
              }`}
              onClick={() => setTaskFilter('processing')}
              type="button"
            >
              Active ({pendingCount + processingCount})
            </button>
            <button
              className={`px-space-sm py-1 rounded-lg transition-all ${
                taskFilter === 'done'
                  ? 'bg-surface-container-lowest text-on-surface font-medium shadow-xs'
                  : 'hover:text-on-surface'
              }`}
              onClick={() => setTaskFilter('done')}
              type="button"
            >
              Completed ({doneCount})
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-space-md">
          {filteredTasks.length === 0 ? (
            <div className="py-8 text-center text-fine-print text-outline font-caption">
              No tasks found for this filter.
            </div>
          ) : (
            filteredTasks.map((t) => (
              <TaskCard
                key={t.id}
                isHighlighted={t.id === highlightedTaskId}
                layout="list"
                task={t}
              />
            ))
          )}
        </div>
      </div>



      <EditCustomerModal
        customer={customer}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
    </div>
  );
};
