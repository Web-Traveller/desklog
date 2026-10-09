import React from "react";
import { useDesk } from "../context/DeskContext";
import { TaskCard } from "../components/TaskCard";
import { CustomerAvatar } from "../components/CustomerAvatar";
import { MetricCard } from "../components/MetricCard";
import { calculateDashboardMetrics } from "../services/taskService";
import { formatRupees } from "../utils/currencyUtils";

export const DashboardPage: React.FC = () => {
  const {
    tasks,
    customers,
    payments,
    setIsAddCustomerOpen,
    setIsAddTaskOpen,
    navigateToCustomerProfile,
    customerPage,
    setCustomerPage,
    ITEMS_PER_PAGE,
  } = useDesk();

  const metrics = calculateDashboardMetrics(tasks, payments);

  const pendingTasks = tasks.filter((t) => t.status === "PENDING");
  const processingTasks = tasks.filter((t) => t.status === "PROCESSING");
  const readyTasks = tasks.filter((t) => t.status === "READY");

  const custStartIdx = customerPage * ITEMS_PER_PAGE;
  const paginatedCustomers = customers.slice(
    custStartIdx,
    custStartIdx + ITEMS_PER_PAGE,
  );

  return (
    <div className="w-full max-w-[1380px] mx-auto px-gutter py-space-lg flex flex-col gap-space-lg animate-slideUp">
      {/* Top Desk Overview Bar */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-xs border-b border-surface-container">
        <div>
          <h1 className="font-display-md text-display-md text-on-surface font-semibold tracking-tight">
            Workspace
          </h1>
          <p className="font-caption text-caption text-on-surface-variant">
            Daily work log, active counter tasks, and today's schedule.
          </p>
        </div>
        <div className="flex items-center gap-space-xs">
          <button
            className="flex items-center gap-1.5 px-space-md py-space-xs rounded-full bg-primary-container text-on-primary hover:bg-primary transition-all active:scale-95 font-button-utility text-button-utility shadow-sm font-semibold"
            onClick={() => setIsAddTaskOpen(true)}
          >
            <span className="material-symbols-outlined text-base">
              add_task
            </span>
            <span>+ New Task</span>
          </button>
          <button
            className="flex items-center gap-1.5 px-space-md py-space-xs rounded-full bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-all active:scale-95 font-button-utility text-button-utility shadow-sm border border-surface-container-high/60"
            onClick={() => setIsAddCustomerOpen(true)}
          >
            <span className="material-symbols-outlined text-base text-primary">
              person_add
            </span>
            <span>+ New Customer</span>
          </button>
        </div>
      </div>

      {/* Metrics Row*/}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-space-sm">
        <MetricCard
          icon="hourglass_empty"
          title="Pending"
          value={metrics.pendingCount}
          subtitle="Work not started"
        />
        <MetricCard
          icon="pending_actions"
          iconColorClass="text-primary"
          title="Processing"
          value={metrics.processingCount}
          subtitle="In progress"
        />
        <MetricCard
          icon="check_circle"
          iconColorClass="text-secondary"
          title="Ready"
          value={metrics.readyCount}
          subtitle="Awaiting handover"
        />
        <MetricCard
          icon="warning"
          iconColorClass={
            metrics.overdueCount > 0 ? "text-error" : "text-outline"
          }
          title="Overdue"
          value={metrics.overdueCount}
          subtitle="Missed target date"
        />
        <MetricCard
          icon="payments"
          iconColorClass="text-secondary"
          title="Today's Collection"
          value={formatRupees(metrics.todayCollection)}
          subtitle="Payments received today"
        />
      </div>

      {/* Overdue Warning Alert */}
      {metrics.overdueTasks.length > 0 && (
        <div className="bg-error-container/40 border border-error/30 rounded-2xl p-space-md flex flex-col gap-space-sm mb-space-xs animate-fadeIn">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-error">
              warning
            </span>
            <h3 className="font-body-strong text-body-strong font-semibold text-error">
              {metrics.overdueTasks.length} Overdue Task
              {metrics.overdueTasks.length !== 1 ? "s" : ""} (Missed Target
              Date)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-sm">
            {metrics.overdueTasks.slice(0, 3).map((task) => (
              <TaskCard key={task.id} layout="kanban" task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Today's Scheduled Tasks Section */}
      {metrics.todayScheduledTasks.length > 0 && (
        <section className="bg-primary-container/10 border border-primary/20 rounded-2xl p-space-md flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-xl">
                alarm
              </span>
              <h2 className="font-body-strong text-body-strong text-on-surface font-semibold">
                Today's Scheduled Tasks ({metrics.todayScheduledTasks.length})
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-sm">
            {metrics.todayScheduledTasks.map((task) => (
              <TaskCard key={task.id} layout="kanban" task={task} />
            ))}
          </div>
        </section>
      )}

      {/* Active Task Kanban Board */}
      <section className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-xl text-primary">
              checklist
            </span>
            <h2 className="font-body-strong text-body-strong text-on-surface font-semibold">
              Active Tasks
            </h2>
          </div>
          <span className="font-fine-print text-fine-print text-on-surface-variant">
            {pendingTasks.length + processingTasks.length + readyTasks.length}{" "}
            Active Tasks
          </span>
        </div>

        {/* 3 Column Layout: Pending -> Processing -> Ready */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md items-start">
          {/* Pending Column */}
          <div className="bg-surface-container-lowest rounded-[22px] p-space-md flex flex-col gap-space-sm shadow-[0_1px_6px_rgba(0,0,0,0.02)] border border-surface-container/60">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
              <div className="flex items-center gap-space-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
                <h3 className="font-body-strong text-body-strong text-on-surface font-semibold">
                  Pending ({pendingTasks.length})
                </h3>
              </div>
            </div>

            <div className="flex flex-col gap-space-xs min-h-[140px]">
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
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                <h3 className="font-body-strong text-body-strong text-on-surface font-semibold">
                  Processing ({processingTasks.length})
                </h3>
              </div>
            </div>

            <div className="flex flex-col gap-space-xs min-h-[140px]">
              {processingTasks.length === 0 ? (
                <div className="py-8 text-center text-fine-print text-outline font-caption flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-2xl text-outline/50">
                    pending_actions
                  </span>
                  <span>No tasks in processing</span>
                </div>
              ) : (
                processingTasks.map((task) => (
                  <TaskCard key={task.id} layout="kanban" task={task} />
                ))
              )}
            </div>
          </div>

          {/* Ready Column */}
          <div className="bg-surface-container-lowest rounded-[22px] p-space-md flex flex-col gap-space-sm shadow-[0_1px_6px_rgba(0,0,0,0.02)] border border-surface-container/60">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
              <div className="flex items-center gap-space-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <h3 className="font-body-strong text-body-strong text-on-surface font-semibold">
                  Ready for Delivery ({readyTasks.length})
                </h3>
              </div>
            </div>

            <div className="flex flex-col gap-space-xs min-h-[140px]">
              {readyTasks.length === 0 ? (
                <div className="py-8 text-center text-fine-print text-outline font-caption flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-2xl text-outline/50">
                    task_alt
                  </span>
                  <span>No tasks ready for delivery</span>
                </div>
              ) : (
                readyTasks.map((task) => (
                  <TaskCard key={task.id} layout="kanban" task={task} />
                ))
              )}
            </div>
          </div>
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
            <h2 className="font-body-strong text-body-strong text-on-surface font-semibold">
              Recent Customer Profiles
            </h2>
            <span className="px-space-xs py-0.5 rounded-full bg-surface-container font-micro-legal text-micro-legal text-outline font-semibold">
              {customers.length} Registered
            </span>
          </div>
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
                (t) =>
                  t.customer_id === cust.id &&
                  t.status !== "DELIVERED" &&
                  t.status !== "CANCELLED",
              ).length;

              return (
                <div
                  key={cust.id}
                  className="grid grid-cols-12 px-space-md py-space-sm items-center hover:bg-surface-container-low transition-colors cursor-pointer"
                  onClick={() => navigateToCustomerProfile(cust.id)}
                >
                  <div className="col-span-5 flex items-center gap-space-xs">
                    <CustomerAvatar
                      colorClass={cust.avatar_color}
                      initials={cust.avatar_initials || "DS"}
                      size="sm"
                    />
                    <div>
                      <span className="font-body-strong text-body-strong text-on-surface block hover:text-primary transition-colors font-semibold">
                        {cust.name}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-3 font-caption text-caption text-on-surface font-mono">
                    {cust.mobile || "No Mobile"}
                  </div>
                  <div className="col-span-2 font-caption text-caption text-on-surface-variant">
                    {cust.created_at}
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

        {/* Customer Pagination */}
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
