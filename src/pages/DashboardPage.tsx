import React from "react";
import { useDesk } from "../context/DeskContext";
import { TaskCard } from "../components/TaskCard";
import { CustomerAvatar } from "../components/CustomerAvatar";

import {
  getFormattedToday,
  dateMatchesCalendarDate,
  parseDateString,
} from "../utils/dateUtils";

export const DashboardPage: React.FC = () => {
  const {
    tasks,
    customers,
    setIsAddCustomerOpen,
    setIsAddTaskOpen,
    navigateToCustomerProfile,
    taskDateFilter,
    taskPage,
    setTaskPage,
    customerPage,
    setCustomerPage,
    ITEMS_PER_PAGE,
  } = useDesk();

  const filteredTasksByDate = tasks.filter((t) => {
    if (taskDateFilter === "Today") {
      const today = getFormattedToday();
      return (
        dateMatchesCalendarDate(t.createdDate, today) ||
        dateMatchesCalendarDate(t.updatedDate, today)
      );
    }
    if (taskDateFilter === "Last 3 days" || taskDateFilter === "Last 7 days") {
      const daysLimit = taskDateFilter === "Last 3 days" ? 3 : 7;
      const now = new Date();
      const cutoff = new Date(now.getTime() - daysLimit * 24 * 60 * 60 * 1000);
      const parsed = parseDateString(t.createdDate);
      if (parsed) {
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const mIdx = monthNames.findIndex(
          (m) => m.toLowerCase() === parsed.month.toLowerCase(),
        );
        if (mIdx !== -1) {
          const createdTime = new Date(parsed.year, mIdx, parsed.day).getTime();
          return createdTime >= cutoff.getTime();
        }
      }
    }
    return true;
  });

  const tasksPerPage = ITEMS_PER_PAGE;
  const paginatedTasksByDate = filteredTasksByDate.slice(
    taskPage * tasksPerPage,
    (taskPage + 1) * tasksPerPage,
  );

  const pendingTasks = paginatedTasksByDate.filter(
    (t) => t.status === "pending",
  );
  const processingTasks = paginatedTasksByDate.filter(
    (t) => t.status === "processing",
  );
  const doneTasks = paginatedTasksByDate.filter((t) => t.status === "done");

  const custStartIdx = customerPage * ITEMS_PER_PAGE;
  const paginatedCustomers = customers.slice(
    custStartIdx,
    custStartIdx + ITEMS_PER_PAGE,
  );

  return (
    <div className="w-full max-w-[1380px] mx-auto px-gutter py-space-lg flex flex-col gap-space-lg">
      {/* Top Desk Overview Bar */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-xs border-b border-surface-container">
        <div>
          <h1 className="font-display-md text-display-md text-on-surface font-semibold tracking-tight">
            Desk Overview
          </h1>
          <p className="font-caption text-caption text-on-surface-variant">
            Manage customer records and task statuses for{" "}
            {taskDateFilter.toLowerCase()}.
          </p>
        </div>
        <div className="flex items-center gap-space-xs">
          <button
            className="flex items-center gap-1.5 px-space-md py-space-xs rounded-full bg-primary-container text-on-primary hover:bg-primary transition-all active:scale-95 font-button-utility text-button-utility shadow-sm"
            onClick={() => setIsAddTaskOpen(true)}
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>New Task</span>
          </button>
          <button
            className="flex items-center gap-1.5 px-space-md py-space-xs rounded-full bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-all active:scale-95 font-button-utility text-button-utility shadow-sm border border-surface-container-high/60"
            onClick={() => setIsAddCustomerOpen(true)}
          >
            <span className="material-symbols-outlined text-base text-primary">
              person_add
            </span>
            <span>New Customer</span>
          </button>
        </div>
      </div>

      {/* Task Status Kanban Section */}
      <section className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-xl text-primary">
              checklist
            </span>
            <h2 className="font-body-strong text-body-strong text-on-surface">
              Task Status Management
            </h2>
          </div>
          <span className="font-fine-print text-fine-print text-on-surface-variant">
            Showing {filteredTasksByDate.length} tasks ({taskDateFilter})
          </span>
        </div>

        {/* 3 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md items-start">
          {/* Pending Column */}
          <div className="bg-surface-container-lowest rounded-[22px] p-space-md flex flex-col gap-space-sm shadow-[0_1px_6px_rgba(0,0,0,0.02)] border border-surface-container/60">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
              <div className="flex items-center gap-space-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
                <h3 className="font-body-strong text-body-strong text-on-surface">
                  Pending
                </h3>
              </div>
              <span className="px-space-xs py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-micro-legal text-micro-legal font-bold">
                {pendingTasks.length} Tasks
              </span>
            </div>

            <div className="flex flex-col gap-space-xs min-h-[120px]">
              {pendingTasks.length === 0 ? (
                <div className="py-8 text-center text-fine-print text-outline font-caption flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-2xl text-outline/50">
                    inbox
                  </span>
                  <span>No pending tasks</span>
                </div>
              ) : (
                pendingTasks.map((task) => (
                  <TaskCard key={task.id} layout="kanban" task={task} />
                ))
              )}
            </div>
          </div>

          {/* Processing Column */}
          <div className="bg-surface-container-lowest rounded-[22px] p-space-md flex flex-col gap-space-sm shadow-[0_1px_6px_rgba(0,0,0,0.02)] border border-surface-container/60">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
              <div className="flex items-center gap-space-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-container animate-pulse"></span>
                <h3 className="font-body-strong text-body-strong text-on-surface">
                  Processing
                </h3>
              </div>
              <span className="px-space-xs py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-micro-legal text-micro-legal font-bold">
                {processingTasks.length} Tasks
              </span>
            </div>

            <div className="flex flex-col gap-space-xs min-h-[120px]">
              {processingTasks.length === 0 ? (
                <div className="py-8 text-center text-fine-print text-outline font-caption flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-2xl text-outline/50">
                    pending_actions
                  </span>
                  <span>No tasks in review</span>
                </div>
              ) : (
                processingTasks.map((task) => (
                  <TaskCard key={task.id} layout="kanban" task={task} />
                ))
              )}
            </div>
          </div>

          {/* Done / Ready Column */}
          <div className="bg-surface-container-lowest rounded-[22px] p-space-md flex flex-col gap-space-sm shadow-[0_1px_6px_rgba(0,0,0,0.02)] border border-surface-container/60">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
              <div className="flex items-center gap-space-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <h3 className="font-body-strong text-body-strong text-on-surface">
                  Done / Ready for Delivery
                </h3>
              </div>
              <span className="px-space-xs py-0.5 rounded-full bg-surface-container font-micro-legal text-micro-legal font-bold text-secondary">
                {doneTasks.length} Tasks
              </span>
            </div>

            <div className="flex flex-col gap-space-xs min-h-[120px]">
              {doneTasks.length === 0 ? (
                <div className="py-8 text-center text-fine-print text-outline font-caption flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-2xl text-outline/50">
                    task_alt
                  </span>
                  <span>No tasks ready for handover</span>
                </div>
              ) : (
                doneTasks.map((task) => (
                  <TaskCard key={task.id} layout="kanban" task={task} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Task Pagination Controls */}
        <div className="flex justify-between items-center mt-4 px-4">
          <button
            onClick={() => setTaskPage(Math.max(0, taskPage - 1))}
            disabled={taskPage === 0}
            className="px-4 py-2 bg-surface-container rounded-full text-sm font-medium disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-outline">Page {taskPage + 1}</span>
          <button
            onClick={() => setTaskPage(taskPage + 1)}
            disabled={
              (taskPage + 1) * tasksPerPage >= filteredTasksByDate.length
            }
            className="px-4 py-2 bg-surface-container rounded-full text-sm font-medium disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </section>

      {/* Customer Directory Table Section */}
      <section
        className="flex flex-col gap-space-sm mt-space-sm"
        id="customers-section"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-xl text-primary">
              group
            </span>
            <h2 className="font-body-strong text-body-strong text-on-surface">
              Recent Customer Records
            </h2>
            <span className="px-space-xs py-0.5 rounded-full bg-surface-container font-micro-legal text-micro-legal text-outline font-semibold">
              {customers.length} Registered
            </span>
          </div>
          <button
            className="flex items-center gap-1 px-space-md py-1.5 rounded-full bg-primary-container text-on-primary font-button-utility text-button-utility hover:bg-primary transition-all active:scale-95 shadow-sm"
            onClick={() => setIsAddCustomerOpen(true)}
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Add Customer</span>
          </button>
        </div>

        {/* Directory Table */}
        <div className="bg-surface-container-lowest rounded-[22px] overflow-hidden shadow-[0_1px_6px_rgba(0,0,0,0.02)] border border-surface-container/60">
          <div className="grid grid-cols-12 px-space-md py-space-xs bg-surface-container font-fine-print text-fine-print text-outline font-semibold uppercase tracking-wider">
            <div className="col-span-5">Customer Name</div>
            <div className="col-span-3">Mobile Number</div>
            <div className="col-span-2">Registered Date</div>
            <div className="col-span-2 text-right">Active Tasks</div>
          </div>

          <div className="divide-y divide-surface-container">
            {paginatedCustomers.map((cust) => {
              const activeCount = tasks.filter(
                (t) => t.customerId === cust.id && t.status !== "done",
              ).length;

              return (
                <div
                  key={cust.id}
                  className="grid grid-cols-12 px-space-md py-space-sm items-center hover:bg-surface-container-low transition-colors cursor-pointer"
                  onClick={() => navigateToCustomerProfile(cust.id)}
                >
                  <div className="col-span-5 flex items-center gap-space-xs">
                    <CustomerAvatar
                      colorClass={cust.avatarColor}
                      initials={cust.avatarInitials || "DS"}
                      size="sm"
                    />
                    <div>
                      <span className="font-body-strong text-body-strong text-on-surface block hover:text-primary transition-colors">
                        {cust.name}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-3 font-caption text-caption text-on-surface font-mono">
                    {cust.phone}
                  </div>
                  <div className="col-span-2 font-caption text-caption text-on-surface-variant">
                    {cust.registeredDate}
                  </div>
                  <div className="col-span-2 text-right">
                    <span
                      className={`px-space-xs py-0.5 rounded-full font-fine-print text-fine-print font-medium ${
                        activeCount > 0
                          ? "bg-primary-container text-on-primary"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {activeCount} Active
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Pagination Controls */}
        <div className="flex justify-between items-center mt-4 px-4">
          <button
            onClick={() => setCustomerPage(Math.max(0, customerPage - 1))}
            disabled={customerPage === 0}
            className="px-4 py-2 bg-surface-container rounded-full text-sm font-medium disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-outline">Page {customerPage + 1}</span>
          <button
            onClick={() => setCustomerPage(customerPage + 1)}
            disabled={(customerPage + 1) * ITEMS_PER_PAGE >= customers.length}
            className="px-4 py-2 bg-surface-container rounded-full text-sm font-medium disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
};
