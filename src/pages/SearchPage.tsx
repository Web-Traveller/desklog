import React, { useState } from 'react';
import { useDesk } from '../context/DeskContext';
import { CustomerCard } from '../components/CustomerCard';
import { TaskCard } from '../components/TaskCard';

export const SearchPage: React.FC = () => {
  const { searchQuery, customers, tasks } = useDesk();
  const [activeFilter, setActiveFilter] = useState<'all' | 'customers' | 'tasks'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'recent' | 'name'>('relevance');

  const query = searchQuery.trim().toLowerCase();

  let matchingCustomers = customers.filter(
    (c) =>
      !query ||
      c.name.toLowerCase().includes(query) ||
      (c.mobile || "").includes(query) ||
      c.note?.toLowerCase().includes(query)
  );

  let matchingTasks = tasks.filter(
    (t) =>
      !query ||
      t.title.toLowerCase().includes(query) ||
      (customers.find(c => c.id === t.customer_id)?.name || "").toLowerCase().includes(query) ||
      (customers.find(c => c.id === t.customer_id)?.mobile || "").includes(query)
  );

  if (sortBy === 'name') {
    matchingCustomers = [...matchingCustomers].sort((a, b) => a.name.localeCompare(b.name));
    matchingTasks = [...matchingTasks].sort((a, b) => a.id.localeCompare(b.id));
  } else if (sortBy === 'recent') {
    matchingCustomers = [...matchingCustomers].reverse();
    matchingTasks = [...matchingTasks].reverse();
  }

  const totalMatches = matchingCustomers.length + matchingTasks.length;

  return (
    <div className="w-full px-gutter py-space-lg max-w-[1240px] mx-auto flex flex-col gap-space-lg">
      {/* Search Header Hero Tile */}
      <div className="w-full rounded-[18px] bg-surface-container-lowest p-space-xl shadow-xs border border-surface-container/60">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
          <div className="flex flex-col gap-space-xs max-w-2xl">
            <div className="flex items-center gap-space-xs">
              <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-fine-print text-fine-print font-medium">
                <span className="material-symbols-outlined text-xs">manage_search</span>
                Active Query
              </span>
              <span className="font-fine-print text-fine-print text-on-surface-variant">
                Indexed {customers.length} customer desks & {tasks.length} tasks
              </span>
            </div>

            <h1 className="font-display-md text-display-md text-on-surface tracking-tight">
              Search Results for{' '}
              <span className="text-primary-container">“{searchQuery || 'All'}”</span>
            </h1>

            <p className="font-body text-body text-on-surface-variant">
              Showing{' '}
              <strong className="text-on-surface font-semibold">{totalMatches} matching records</strong>{' '}
              discovered across verified profiles, counter tasks, contact numbers, and notary notes.
            </p>
          </div>

          {/* Sort Controls */}
          <div className="flex flex-wrap items-center gap-space-sm">
            <div className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container text-on-surface font-button-utility text-button-utility border border-surface-container-high/50">
              <span className="material-symbols-outlined text-sm text-outline">sort</span>
              <span className="text-on-surface-variant">Sort:</span>
              <select
                className="bg-transparent font-medium text-on-surface focus:outline-none cursor-pointer"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="relevance">Highest Relevance</option>
                <option value="recent">Most Recent Date</option>
                <option value="name">Customer Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Segment Filter Pills */}
        <div className="mt-space-lg pt-space-md flex items-center gap-space-xs overflow-x-auto pb-1 border-t border-surface-container/40">
          <button
            className={`filter-pill flex items-center gap-space-xs px-space-md py-space-xs rounded-full font-button-utility text-button-utility whitespace-nowrap transition-all ${
              activeFilter === 'all'
                ? 'bg-primary-container text-on-primary font-semibold shadow-xs'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
            }`}
            onClick={() => setActiveFilter('all')}
            type="button"
          >
            <span>All Results</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[11px] font-semibold">
              {totalMatches}
            </span>
          </button>

          <button
            className={`filter-pill flex items-center gap-space-xs px-space-md py-space-xs rounded-full font-button-utility text-button-utility whitespace-nowrap transition-all ${
              activeFilter === 'customers'
                ? 'bg-primary-container text-on-primary font-semibold shadow-xs'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
            }`}
            onClick={() => setActiveFilter('customers')}
            type="button"
          >
            <span>Customers</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-on-surface-variant text-[11px] font-semibold">
              {matchingCustomers.length}
            </span>
          </button>

          <button
            className={`filter-pill flex items-center gap-space-xs px-space-md py-space-xs rounded-full font-button-utility text-button-utility whitespace-nowrap transition-all ${
              activeFilter === 'tasks'
                ? 'bg-primary-container text-on-primary font-semibold shadow-xs'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
            }`}
            onClick={() => setActiveFilter('tasks')}
            type="button"
          >
            <span>Tasks & Services</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-on-surface-variant text-[11px] font-semibold">
              {matchingTasks.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Results Column */}
      <div className="flex flex-col gap-space-xl">
        {/* Customer Profiles Results */}
        {(activeFilter === 'all' || activeFilter === 'customers') && (
          <section className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-xl">person_pin</span>
                <h2 className="font-tagline text-tagline text-on-surface font-semibold">
                  Customer Profiles
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-fine-print text-fine-print font-medium">
                  {matchingCustomers.length} matches
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-space-md">
              {matchingCustomers.map((cust) => {
                const custTasks = tasks.filter((t) => t.customer_id === cust.id);
                const activeCount = custTasks.filter((t) => t.status !== 'DELIVERED').length;
                const completedCount = custTasks.filter((t) => t.status === 'DELIVERED').length;
                const ongoingTask = custTasks.find((t) => t.status !== 'DELIVERED')?.title;

                return (
                  <CustomerCard
                    key={cust.id}
                    activeTasksCount={activeCount}
                    completedTasksCount={completedCount}
                    customer={cust}
                    highlightQuery={searchQuery}
                    ongoingTaskTitle={ongoingTask}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Tasks & Services Results */}
        {(activeFilter === 'all' || activeFilter === 'tasks') && (
          <section className="flex flex-col gap-space-md mt-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-xl">checklist</span>
                <h2 className="font-tagline text-tagline text-on-surface font-semibold">
                  Task & Service Records
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-fine-print text-fine-print font-medium">
                  {matchingTasks.length} matches
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-space-xs">
              {matchingTasks.map((task) => (
                <TaskCard key={task.id} layout="list" task={task} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
