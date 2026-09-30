import React, { useState } from 'react';
import { useDesk } from '../context/DeskContext';
import { MetricCard } from '../components/MetricCard';

export const PaymentsPage: React.FC = () => {
  const { tasks, payments, customers, navigateToCustomerTaskProfile } = useDesk();
  const [searchTerm, setSearchTerm] = useState('');

  // Computations
  let totalReceived = 0;
  payments.forEach((p) => {
    totalReceived += p.amount;
  });

  let totalDue = 0;
  let tasksWithDues = 0;

  tasks.forEach((task) => {
    if (task.billing_amount && task.billing_amount > 0) {
      const paidForTask = payments
        .filter((p) => p.task_id === task.id)
        .reduce((acc, curr) => acc + curr.amount, 0);
      const due = task.billing_amount - paidForTask;
      if (due > 0) {
        totalDue += due;
        tasksWithDues++;
      }
    }
  });

  const filteredPayments = payments
    .map((pay) => {
      const task = tasks.find((t) => t.id === pay.task_id);
      const customer = customers.find((c) => c.id === task?.customer_id);
      return { pay, task, customer };
    })
    .filter(({ task, customer }) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        task?.title.toLowerCase().includes(q) ||
        customer?.name.toLowerCase().includes(q) ||
        customer?.mobile?.includes(q)
      );
    })
    .sort((a, b) => new Date(b.pay.created_at).getTime() - new Date(a.pay.created_at).getTime());

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
          value={`₹${totalReceived.toFixed(2)}`}
        />
        <MetricCard
          icon="pending"
          iconColorClass="text-error"
          subtitle={`From ${tasksWithDues} active tasks`}
          title="Outstanding Dues"
          value={`₹${totalDue.toFixed(2)}`}
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
          <div className="py-16 text-center text-on-surface-variant flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl text-outline/40">receipt_long</span>
            <span className="font-caption-strong text-caption-strong">No payments found</span>
            <p className="font-fine-print text-fine-print text-outline">
              {searchTerm ? `No transaction matching "${searchTerm}"` : 'Record your first payment on a task.'}
            </p>
          </div>
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
                {filteredPayments.map(({ pay, task, customer }) => (
                  <tr key={pay.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-space-md py-space-sm whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-body-strong text-body-strong text-on-surface">
                          {pay.created_at.split(' ')[0]} {pay.created_at.split(' ')[1]} {pay.created_at.split(' ')[2]}
                        </span>
                        <span className="font-micro-legal text-micro-legal text-outline">
                          {pay.created_at.split(' ').slice(3).join(' ')}
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
                      <span className="font-body-strong text-body-strong text-primary bg-primary-fixed/30 px-3 py-1 rounded-full">
                        ₹{pay.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-space-md py-space-sm text-center">
                      <button
                        className="px-3 py-1.5 rounded-full text-outline hover:text-primary hover:bg-primary-container transition-colors font-button-utility text-button-utility"
                        onClick={() => {
                          if (task && customer) navigateToCustomerTaskProfile(customer.id, task.id);
                        }}
                      >
                        View Task
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
