import React, { useState } from 'react';
import { useDesk } from '../context/DeskContext';
import { MetricCard } from '../components/MetricCard';
import { EmptyState } from '../components/EmptyState';
import { EditPaymentModal } from '../components/EditPaymentModal';
import { Payment, Task, Customer } from '../types';
import { formatDisplayDate } from '../utils/dateUtils';
import { formatRupees } from '../utils/currencyUtils';

export const PaymentsPage: React.FC = () => {
  const { tasks, payments, customers, navigateToCustomerTaskProfile } = useDesk();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [editingPayment, setEditingPayment] = useState<{ pay: Payment; task?: Task; customer?: Customer } | null>(null);
  const PAGE_SIZE = 15;

  // Memoized Computations
  const { totalReceived, totalDue, tasksWithDues } = React.useMemo(() => {
    let received = 0;
    payments.forEach((p) => {
      received += p.amount;
    });

    let due = 0;
    let withDues = 0;

    tasks.forEach((task) => {
      if (task.billing_amount && task.billing_amount > 0) {
        const paidForTask = payments
          .filter((p) => p.task_id === task.id)
          .reduce((acc, curr) => acc + curr.amount, 0);
        const taskDue = task.billing_amount - paidForTask;
        if (taskDue > 0) {
          due += taskDue;
          withDues++;
        }
      }
    });

    return { totalReceived: received, totalDue: due, tasksWithDues: withDues };
  }, [payments, tasks]);

  const filteredPayments = React.useMemo(() => {
    return payments
      .map((pay) => {
        const task = tasks.find((t) => t.id === pay.task_id);
        const customer = customers.find((c) => c.id === task?.customer_id);
        return { pay, task, customer };
      })
      .filter(({ pay, task, customer }) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase().trim();
        const cleanQ = searchTerm.replace(/[\s-]/g, '').toLowerCase();
        const titleMatch = task?.title.toLowerCase().includes(q) || false;
        const nameMatch = customer?.name.toLowerCase().includes(q) || false;
        const mobileMatch = customer?.mobile ? customer.mobile.replace(/[\s-]/g, '').includes(cleanQ) : false;
        const aadhaarMatch = customer?.aadhaar_number ? customer.aadhaar_number.replace(/[\s-]/g, '').includes(cleanQ) : false;
        const trackerMatch = task?.tracker_id ? task.tracker_id.toLowerCase().includes(q) : false;
        const docMatch = task?.document_number ? task.document_number.toLowerCase().includes(q) : false;
        const amtStr = String(Math.floor((pay.amount || 0) / 100));
        const amountMatch = amtStr.includes(cleanQ);
        return titleMatch || nameMatch || mobileMatch || aadhaarMatch || trackerMatch || docMatch || amountMatch;
      })
      .sort((a, b) => new Date(b.pay.created_at).getTime() - new Date(a.pay.created_at).getTime());
  }, [payments, tasks, customers, searchTerm]);

  const totalPages = Math.ceil(filteredPayments.length / PAGE_SIZE) || 1;
  const safePage = Math.min(page, totalPages - 1);
  const paginatedPayments = React.useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return filteredPayments.slice(start, start + PAGE_SIZE);
  }, [filteredPayments, safePage, PAGE_SIZE]);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-gutter py-space-xl flex flex-col gap-space-xl animate-slideUp">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg border-b border-surface-container pb-space-xs">
        <div className="flex flex-col gap-space-xxs">
          <h1 className="font-display-md text-display-md text-on-surface tracking-tight font-semibold">
            Payments Ledger
          </h1>
          <p className="font-body text-body text-on-surface-variant max-w-2xl">
            Track all incoming revenues, partial payments, and outstanding dues across all tasks.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm">
        <MetricCard
          icon="account_balance_wallet"
          iconColorClass="text-primary"
          subtitle="All time collections"
          title="Total Received"
          value={formatRupees(totalReceived)}
        />
        <MetricCard
          icon="pending"
          iconColorClass="text-error"
          subtitle={`From ${tasksWithDues} active tasks`}
          title="Outstanding Dues"
          value={formatRupees(totalDue)}
        />
        <MetricCard
          icon="receipt_long"
          iconColorClass="text-secondary"
          subtitle="Total transactions"
          title="Payments Recorded"
          value={payments.length}
        />
        <MetricCard
          icon="trending_up"
          iconColorClass="text-tertiary"
          subtitle="Awaiting clearance"
          title="Tasks w/ Dues"
          value={tasksWithDues}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-space-md bg-surface-container-lowest rounded-2xl shadow-xs border border-surface-container/60 overflow-hidden">
        {/* Table Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md p-space-md border-b border-surface-container/60 bg-surface-container-lowest">
          <div className="relative flex items-center w-full sm:w-96">
            <span className="material-symbols-outlined absolute left-space-sm text-outline pointer-events-none text-xl">
              search
            </span>
            <input
              className="w-full pl-10 pr-space-md py-2.5 rounded-full bg-surface-container-low text-on-surface placeholder:text-outline font-button-utility text-button-utility transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 border border-surface-container-high/40"
              placeholder="Search by customer or task..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="font-fine-print text-fine-print text-on-surface-variant">
            Showing {filteredPayments.length} transactions
          </span>
        </div>

        {/* Payments Table */}
        {filteredPayments.length === 0 ? (
          <EmptyState
            icon="receipt_long"
            title="No payments found"
            description={searchTerm ? `No transaction matching "${searchTerm}"` : 'Record your first payment on a task.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container/50 border-b border-surface-container">
                  <th className="px-space-md py-space-sm font-caption-strong text-caption-strong text-outline">Date & Time</th>
                  <th className="px-space-md py-space-sm font-caption-strong text-caption-strong text-outline">Customer</th>
                  <th className="px-space-md py-space-sm font-caption-strong text-caption-strong text-outline">Task / Service</th>
                  <th className="px-space-md py-space-sm font-caption-strong text-caption-strong text-outline text-right">Amount Paid</th>
                  <th className="px-space-md py-space-sm font-caption-strong text-caption-strong text-outline text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/60">
                {paginatedPayments.map(({ pay, task, customer }) => (
                  <tr key={pay.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-space-md py-space-sm whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-body-strong text-body-strong text-on-surface font-mono">
                          {formatDisplayDate(pay.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="px-space-md py-space-sm">
                      <div className="flex flex-col">
                        <span className="font-body-strong text-body-strong text-on-surface">
                          {customer?.name || 'Unknown'}
                        </span>
                        <span className="font-caption text-caption text-on-surface-variant font-mono">
                          {customer?.mobile || 'No mobile'}
                        </span>
                      </div>
                    </td>
                    <td className="px-space-md py-space-sm">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-primary bg-primary-container p-1 rounded-full">
                          assignment
                        </span>
                        <span className="font-body text-body text-on-surface-variant max-w-[250px] truncate">
                          {task?.title || 'Unknown Task'}
                        </span>
                      </div>
                    </td>
                    <td className="px-space-md py-space-sm text-right">
                      <span className="font-body-strong text-body-strong text-primary bg-primary-fixed/30 px-3 py-1 rounded-full font-mono">
                        {formatRupees(pay.amount)}
                      </span>
                    </td>
                    <td className="px-space-md py-space-sm text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-full text-xs font-semibold text-outline hover:text-primary hover:bg-surface-container transition-colors flex items-center gap-1"
                          onClick={() => setEditingPayment({ pay, task, customer })}
                          title="Edit Payment"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-full text-xs font-semibold text-outline hover:text-primary hover:bg-primary-container transition-colors"
                          onClick={() => {
                            if (task && customer) navigateToCustomerTaskProfile(customer.id, task.id);
                          }}
                        >
                          View Task
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredPayments.length > PAGE_SIZE && (
          <div className="flex items-center justify-between p-space-md border-t border-surface-container/60 bg-surface-container-lowest">
            <span className="font-fine-print text-fine-print text-on-surface-variant">
              Showing {safePage * PAGE_SIZE + 1} - {Math.min((safePage + 1) * PAGE_SIZE, filteredPayments.length)} of {filteredPayments.length} transactions
            </span>
            <div className="flex items-center gap-space-xs">
              <button
                className="px-space-md py-1.5 rounded-full border border-surface-container-high text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container font-button-utility text-button-utility transition-all active:scale-95"
                disabled={safePage === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
              >
                Previous
              </button>
              <span className="font-caption text-caption text-on-surface px-space-xs">
                {safePage + 1} / {totalPages}
              </span>
              <button
                className="px-space-md py-1.5 rounded-full border border-surface-container-high text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container font-button-utility text-button-utility transition-all active:scale-95"
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Payment Modal */}
      <EditPaymentModal
        isOpen={!!editingPayment}
        payment={editingPayment?.pay || null}
        task={editingPayment?.task}
        customer={editingPayment?.customer}
        onClose={() => setEditingPayment(null)}
      />
    </div>
  );
};
