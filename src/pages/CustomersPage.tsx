import React, { useState } from 'react';
import { useDesk } from '../context/DeskContext';
import { CustomerCard } from '../components/CustomerCard';
import { EmptyState } from '../components/EmptyState';

export const CustomersPage: React.FC = () => {
  const { customers, tasks, setIsAddCustomerOpen, confirmDeleteCustomer, navigateToCustomerProfile } = useDesk();
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(18);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filteredCustomers = React.useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter((cust) => {
      return (
        cust.name.toLowerCase().includes(q) ||
        (cust.mobile || "").includes(q) ||
        (cust.aadhaar_number || "").includes(q)
      );
    });
  }, [customers, customerSearch]);

  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const currentPageSafe = Math.min(page, totalPages - 1);
  const startIndex = currentPageSafe * pageSize;
  const paginatedCustomers = React.useMemo(() => {
    return filteredCustomers.slice(startIndex, startIndex + pageSize);
  }, [filteredCustomers, startIndex, pageSize]);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-gutter py-space-md flex flex-col gap-4 animate-slideUp">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container">
        <div>
          <h1 className="font-display-md text-2xl text-on-surface font-semibold tracking-tight">
            Customer Directory
          </h1>
          <p className="text-xs text-on-surface-variant">
            Managing {customers.length} registered customer profiles
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95 font-button-utility text-xs font-semibold shadow-sm"
            onClick={() => setIsAddCustomerOpen(true)}
            type="button"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>+ Add New Customer</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search + View Mode Switcher + Items Per Page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface-container-lowest p-3 rounded-2xl border border-surface-container/60 shadow-xs">
        <div className="relative flex items-center w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 text-outline pointer-events-none text-lg">
            search
          </span>
          <input
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-surface-container text-on-surface placeholder:text-outline text-xs transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 border-none"
            placeholder="Search by name, phone, or Aadhaar..."
            type="text"
            value={customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              setPage(0);
            }}
          />
          {customerSearch && (
            <button
              className="absolute right-3 text-outline hover:text-on-surface text-xs"
              onClick={() => {
                setCustomerSearch('');
                setPage(0);
              }}
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 justify-between md:justify-end flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-surface-container p-1 rounded-xl gap-1 border border-surface-container-high/30">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-base">grid_view</span>
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-base">table_rows</span>
              <span>Table</span>
            </button>
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              className="px-2 py-1 bg-surface-container text-on-surface rounded-lg border-none text-xs focus:ring-1 focus:ring-primary/20"
            >
              <option value={12}>12</option>
              <option value={18}>18</option>
              <option value={30}>30</option>
              <option value={60}>60</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Listing Section */}
      {paginatedCustomers.length === 0 ? (
        <EmptyState
          icon="person_off"
          title="No customers found"
          description={customerSearch ? `No client matching "${customerSearch}"` : 'Register your first client to get started.'}
          actionLabel="+ Add New Customer"
          onAction={() => setIsAddCustomerOpen(true)}
        />
      ) : viewMode === 'grid' ? (
        /* Compact Responsive Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3.5">
          {paginatedCustomers.map((customer) => {
            const custTasks = tasks.filter((t) => t.customer_id === customer.id);
            const activeTasks = custTasks.filter((t) => t.status !== 'DELIVERED');
            const completedTasks = custTasks.filter((t) => t.status === 'DELIVERED');
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
      ) : (
        /* Sleek Table View for High Volume */
        <div className="bg-surface-container-lowest rounded-2xl border border-surface-container/60 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant border-b border-surface-container">
                <tr>
                  <th className="p-3 font-semibold">Customer Name</th>
                  <th className="p-3 font-semibold">Mobile Number</th>
                  <th className="p-3 font-semibold">Aadhaar</th>
                  <th className="p-3 font-semibold">Active Tasks</th>
                  <th className="p-3 font-semibold">Remarks</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.map((customer) => {
                  const custTasks = tasks.filter((t) => t.customer_id === customer.id);
                  const activeTasks = custTasks.filter((t) => t.status !== 'DELIVERED');

                  return (
                    <tr
                      key={customer.id}
                      onClick={() => navigateToCustomerProfile(customer.id)}
                      className="border-b border-surface-container/40 last:border-0 hover:bg-surface-container-low/50 cursor-pointer transition-colors"
                    >
                      <td className="p-3 font-semibold text-on-surface">
                        {customer.name}
                        {customer.id === 'cust-general' && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-surface-container text-on-surface-variant font-bold">
                            Default
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-on-surface-variant">{customer.mobile || '—'}</td>
                      <td className="p-3 font-mono text-on-surface-variant">{customer.aadhaar_number || '—'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                          activeTasks.length > 0 ? 'bg-primary-container text-on-primary-container font-bold' : 'bg-surface-container text-on-surface-variant'
                        }`}>
                          {activeTasks.length} Active
                        </span>
                      </td>
                      <td className="p-3 text-on-surface-variant truncate max-w-[200px]">{customer.note || '—'}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => navigateToCustomerProfile(customer.id)}
                            className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-primary-container hover:text-on-primary-container font-medium text-xs transition-colors"
                          >
                            Profile →
                          </button>
                          {customer.id !== 'cust-general' && (
                            <button
                              type="button"
                              onClick={() => confirmDeleteCustomer(customer)}
                              className="p-1 text-outline hover:text-error rounded-full transition-colors"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-surface-container">
        <span className="text-xs text-on-surface-variant">
          Showing {filteredCustomers.length > 0 ? startIndex + 1 : 0}-
          {Math.min(startIndex + pageSize, filteredCustomers.length)} of {filteredCustomers.length} clients
        </span>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high disabled:opacity-40 text-xs font-medium transition-all"
            disabled={currentPageSafe === 0}
            onClick={() => setPage(Math.max(0, currentPageSafe - 1))}
          >
            ← Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i)
            .filter((p) => p === 0 || p === totalPages - 1 || Math.abs(p - currentPageSafe) <= 2)
            .map((p, idx, arr) => {
              const prev = arr[idx - 1];
              const showEllipsis = prev !== undefined && p - prev > 1;
              return (
                <React.Fragment key={p}>
                  {showEllipsis && <span className="px-1 text-xs text-outline">...</span>}
                  <button
                    type="button"
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      p === currentPageSafe
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                    }`}
                  >
                    {p + 1}
                  </button>
                </React.Fragment>
              );
            })}

          <button
            className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high disabled:opacity-40 text-xs font-medium transition-all"
            disabled={currentPageSafe >= totalPages - 1}
            onClick={() => setPage(currentPageSafe + 1)}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};
