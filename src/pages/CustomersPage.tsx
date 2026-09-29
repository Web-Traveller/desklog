import React, { useState } from 'react';
import { useDesk } from '../context/DeskContext';
import { CustomerCard } from '../components/CustomerCard';

export const CustomersPage: React.FC = () => {
  const { customers, tasks, setIsAddCustomerOpen, customerPage, setCustomerPage, ITEMS_PER_PAGE } = useDesk();
  const [customerSearch, setCustomerSearch] = useState<string>('');

  const filteredCustomers = customers.filter((cust) => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return cust.name.toLowerCase().includes(q) || cust.phone.includes(q);
  });

  const startIndex = customerPage * ITEMS_PER_PAGE;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="w-full max-w-[1380px] mx-auto px-gutter py-space-lg flex flex-col gap-space-lg">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg pb-space-xs border-b border-surface-container">
        <div className="flex flex-col gap-space-xxs">
          <h1 className="font-display-md text-display-md text-on-surface font-semibold tracking-tight">
            Customer Directory
          </h1>
          <p className="font-body text-body text-on-surface-variant max-w-2xl">
            Browse and manage all {customers.length} registered customer profiles and phone records.
          </p>
        </div>

        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            className="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-primary-container text-on-primary hover:bg-primary transition-all active:scale-95 font-button-utility text-button-utility shadow-sm"
            onClick={() => setIsAddCustomerOpen(true)}
            type="button"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>+ Add New Customer</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md">
        <div className="relative flex items-center w-full sm:w-96">
          <span className="material-symbols-outlined absolute left-space-sm text-outline pointer-events-none text-xl">
            search
          </span>
          <input
            className="w-full pl-10 pr-space-md py-2.5 rounded-full bg-surface-container-lowest text-on-surface placeholder:text-outline font-button-utility text-button-utility transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xs border border-surface-container/60"
            placeholder="Search customers by name or mobile number..."
            type="text"
            value={customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              setCustomerPage(0);
            }}
          />
          {customerSearch && (
            <button
              className="absolute right-space-sm text-outline hover:text-on-surface text-sm"
              onClick={() => {
                setCustomerSearch('');
                setCustomerPage(0);
              }}
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-space-xs font-fine-print text-fine-print text-on-surface-variant">
          <span>
            Showing {filteredCustomers.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredCustomers.length)} of {filteredCustomers.length} clients
          </span>
        </div>
      </div>

      {/* Grid of Customer Cards */}
      {paginatedCustomers.length === 0 ? (
        <div className="py-16 text-center text-on-surface-variant flex flex-col items-center gap-2 bg-surface-container-lowest rounded-2xl border border-surface-container/60">
          <span className="material-symbols-outlined text-4xl text-outline/40">person_off</span>
          <span className="font-caption-strong text-caption-strong">No customers found</span>
          <p className="font-fine-print text-fine-print text-outline">
            {customerSearch ? `No client matching "${customerSearch}"` : 'Register your first client to get started.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-space-md">
          {paginatedCustomers.map((customer) => {
            const custTasks = tasks.filter((t) => t.customerId === customer.id);
            const activeTasks = custTasks.filter((t) => t.status !== 'done');
            const completedTasks = custTasks.filter((t) => t.status === 'done');
            const ongoingTask = activeTasks[0]?.title;

            return (
              <CustomerCard
                key={customer.id}
                activeTasksCount={activeTasks.length}
                completedTasksCount={completedTasks.length}
                customer={customer}
                highlightQuery={customerSearch}
                ongoingTaskTitle={ongoingTask}
              />
            );
          })}
        </div>
      )}

      {/* Pagination Controls for 500+ scale */}
        <div className="flex items-center justify-between pt-space-md border-t border-surface-container">
          <button
            className="px-space-md py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high disabled:opacity-40 font-button-utility text-button-utility transition-all"
            disabled={customerPage === 0}
            onClick={() => setCustomerPage(Math.max(0, customerPage - 1))}
          >
            ← Previous Page
          </button>
          <span className="font-caption text-caption text-on-surface font-medium">
            Page {customerPage + 1}
          </span>
          <button
            className="px-space-md py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high disabled:opacity-40 font-button-utility text-button-utility transition-all"
            disabled={(customerPage + 1) * ITEMS_PER_PAGE >= filteredCustomers.length}
            onClick={() => setCustomerPage(customerPage + 1)}
          >
            Next Page →
          </button>
        </div>
    </div>
  );
};
