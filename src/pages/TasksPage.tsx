import React, { useState } from "react";
import { useDesk } from "../context/DeskContext";
import { TaskCard } from "../components/TaskCard";
import { EmptyState } from "../components/EmptyState";
import { MetricCard } from "../components/MetricCard";
import { TaskStatus } from "../types";
import { isTaskOverdue } from "../services/taskService";
import { calculatePaymentStatus } from "../services/paymentService";
import { formatRupees } from "../utils/currencyUtils";

export const TasksPage: React.FC = () => {
  const {
    tasks,
    customers,
    services,
    payments,
    setIsAddTaskOpen,
    taskPage,
    setTaskPage,
    ITEMS_PER_PAGE,
  } = useDesk();

  const [statusFilter, setStatusFilter] = useState<"ALL" | TaskStatus>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<
    "ALL" | "UNPAID" | "PARTIALLY_PAID" | "PAID"
  >("ALL");
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");
  const [overdueOnly, setOverdueOnly] = useState<boolean>(false);
  const [udhariOnly, setUdhariOnly] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const financialSummary = React.useMemo(() => {
    let billed = 0;
    let paid = 0;
    let udhariTasks = 0;

    tasks.forEach((t) => {
      const b = t.billing_amount || 0;
      billed += b;
      const taskPaid = payments
        .filter((p) => p.task_id === t.id)
        .reduce((sum, p) => sum + p.amount, 0);
      paid += taskPaid;
      if (b - taskPaid > 0) {
        udhariTasks++;
      }
    });

    const pending = Math.max(0, billed - paid);
    return { billed, paid, pending, udhariTasks };
  }, [tasks, payments]);

  const filteredTasks = React.useMemo(() => {
    return tasks.filter((t) => {
      // Status filter
      if (statusFilter !== "ALL" && t.status !== statusFilter) {
        return false;
      }

      // Udhari (Pending Balance) filter
      if (udhariOnly) {
        const taskPayments = payments.filter((p) => p.task_id === t.id);
        const taskPaid = taskPayments.reduce((acc, curr) => acc + curr.amount, 0);
        const due = (t.billing_amount || 0) - taskPaid;
        if (due <= 0) return false;
      }

      // Payment status filter
      if (paymentFilter !== "ALL") {
        const taskPayments = payments.filter((p) => p.task_id === t.id);
        const payStatus = calculatePaymentStatus(t.billing_amount, taskPayments);
        if (payStatus !== paymentFilter) return false;
      }

      // Service filter
      if (serviceFilter !== "ALL" && t.service_id !== serviceFilter) {
        return false;
      }

      // Overdue filter
      if (overdueOnly && !isTaskOverdue(t)) {
        return false;
      }

      // Search query - universal search across task, customer, aadhaar, mobile, tracker ID, document number
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const cust = customers.find((c) => c.id === t.customer_id);
        const titleMatch = t.title.toLowerCase().includes(q);
        const custNameMatch = (cust?.name || "").toLowerCase().includes(q);
        const custMobileMatch = (cust?.mobile || "").includes(q);
        const custAadhaarMatch = (cust?.aadhaar_number || "").includes(q);
        const trackerMatch = (t.tracker_id || "").toLowerCase().includes(q);
        const docMatch = (t.document_number || "").toLowerCase().includes(q);
        const workTypeMatch = (t.work_type || "").toLowerCase().includes(q);
        const noteMatch = (t.notes || "").toLowerCase().includes(q);
        const amountMatch = t.billing_amount !== undefined && t.billing_amount.toString().includes(q);
        return (
          titleMatch ||
          custNameMatch ||
          custMobileMatch ||
          custAadhaarMatch ||
          trackerMatch ||
          docMatch ||
          workTypeMatch ||
          noteMatch ||
          amountMatch
        );
      }

      return true;
    });
  }, [tasks, statusFilter, paymentFilter, payments, serviceFilter, overdueOnly, udhariOnly, searchTerm, customers]);

  const startIndex = taskPage * ITEMS_PER_PAGE;
  const paginatedTasks = React.useMemo(() => {
    return filteredTasks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTasks, startIndex, ITEMS_PER_PAGE]);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-gutter py-space-xl flex flex-col gap-space-lg animate-slideUp">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg border-b border-surface-container pb-space-xs">
        <div className="flex flex-col gap-space-xxs">
          <h1 className="font-display-md text-display-md text-on-surface tracking-tight font-semibold">
            Task & Work Order Register
          </h1>
          <p className="font-body text-body text-on-surface-variant max-w-2xl">
            Browse, search, and manage all {tasks.length} counter service tasks.
          </p>
        </div>

        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            className="flex items-center gap-1.5 px-space-md py-space-xs rounded-full bg-primary-container text-on-primary hover:bg-primary transition-all active:scale-95 font-button-utility text-button-utility shadow-sm font-semibold"
            onClick={() => setIsAddTaskOpen(true)}
            type="button"
          >
            <span className="material-symbols-outlined text-base">
              add_task
            </span>
            <span>+ Create New Task</span>
          </button>
        </div>
      </div>

      {/* Financial Overview - Billed, Paid, Pending (Udhari) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        <MetricCard
          title="Total Work Billed"
          value={formatRupees(financialSummary.billed)}
          icon="receipt_long"
          iconColorClass="text-primary"
          subtitle={`Across all ${tasks.length} recorded orders`}
        />
        <MetricCard
          title="Collected Revenue (Paid)"
          value={formatRupees(financialSummary.paid)}
          icon="check_circle"
          iconColorClass="text-emerald-500"
          subtitle="Realized cash & digital receipts"
        />
        <MetricCard
          title="Pending Due (Udhari)"
          value={formatRupees(financialSummary.pending)}
          icon="pending_actions"
          iconColorClass={financialSummary.pending > 0 ? "text-amber-500" : "text-emerald-500"}
          subtitle={`${financialSummary.udhariTasks} orders with unpaid balance`}
        />
      </div>

      {/* Primary Status Filter Pills */}
      <div className="flex items-center gap-space-xs overflow-x-auto pb-1 border-b border-surface-container/40">
        {(
          [
            "ALL",
            "PENDING",
            "PROCESSING",
            "READY",
            "DELIVERED",
            "CANCELLED",
          ] as const
        ).map((status) => {
          const count =
            status === "ALL"
              ? tasks.length
              : tasks.filter((t) => t.status === status).length;

          const isActive = statusFilter === status;

          return (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setTaskPage(0);
              }}
              type="button"
              className={`flex items-center gap-2 px-space-md py-2 rounded-full font-button-utility text-button-utility whitespace-nowrap transition-all ${
                isActive
                  ? "bg-primary text-on-primary font-semibold shadow-xs"
                  : "bg-surface-container hover:bg-surface-container-high text-on-surface"
              }`}
            >
              <span>{status === "ALL" ? "All Tasks" : status}</span>
              <span
                className={`px-2 py-0.2 rounded-full text-[11px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-surface-container-highest text-on-surface-variant"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Secondary Filter & Search Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md items-center bg-surface-container-lowest p-space-md rounded-2xl border border-surface-container/60 shadow-xs">
        <div className="md:col-span-4 relative flex items-center">
          <span className="material-symbols-outlined absolute left-space-sm text-outline pointer-events-none text-xl">
            search
          </span>
          <input
            className="w-full pl-10 pr-space-md py-2.5 rounded-full bg-surface-container-low text-on-surface placeholder:text-outline font-button-utility text-button-utility transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 border border-surface-container-high/40"
            placeholder="Search task, customer, mobile, Aadhaar, tracker ID, doc #..."
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setTaskPage(0);
            }}
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value as "ALL" | "UNPAID" | "PARTIALLY_PAID" | "PAID");
              setTaskPage(0);
            }}
            className="w-full px-space-md py-2.5 rounded-full bg-surface-container-low text-on-surface font-button-utility text-button-utility border border-surface-container-high/40 cursor-pointer"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="UNPAID">Unpaid Only</option>
            <option value="PARTIALLY_PAID">Partially Paid Only</option>
            <option value="PAID">Fully Paid Only</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <select
            value={serviceFilter}
            onChange={(e) => {
              setServiceFilter(e.target.value);
              setTaskPage(0);
            }}
            className="w-full px-space-md py-2.5 rounded-full bg-surface-container-low text-on-surface font-button-utility text-button-utility border border-surface-container-high/40 cursor-pointer"
          >
            <option value="ALL">All Services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3 flex items-center justify-end gap-space-sm">
          <button
            type="button"
            onClick={() => {
              setUdhariOnly(!udhariOnly);
              setTaskPage(0);
            }}
            className={`px-3 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              udhariOnly
                ? "bg-amber-600 text-white shadow-xs ring-2 ring-amber-400/40"
                : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant border border-surface-container-high/60"
            }`}
            title="Filter tasks that still have an unpaid balance (Udhari)"
          >
            <span className="material-symbols-outlined text-sm">
              account_balance_wallet
            </span>
            <span>Udhari ({financialSummary.udhariTasks})</span>
          </button>
          <label className="flex items-center gap-1.5 cursor-pointer font-fine-print text-fine-print text-on-surface font-semibold select-none">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => {
                setOverdueOnly(e.target.checked);
                setTaskPage(0);
              }}
              className="w-4 h-4 rounded text-error border-surface-container-high focus:ring-error"
            />
            <span className="text-error">Overdue</span>
          </label>
        </div>
      </div>

      {/* Task List */}
      {paginatedTasks.length === 0 ? (
        <EmptyState
          icon="assignment_turned_in"
          title="No tasks found"
          description={
            searchTerm
              ? `No tasks matching "${searchTerm}"`
              : "No task records matching the selected filters."
          }
          actionLabel="+ Create New Task"
          onAction={() => setIsAddTaskOpen(true)}
        />
      ) : (
        <div className="flex flex-col gap-space-sm">
          {paginatedTasks.map((task) => (
            <TaskCard key={task.id} layout="list" task={task} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between pt-space-md border-t border-surface-container">
        <button
          className="px-space-md py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high disabled:opacity-40 font-button-utility text-button-utility transition-all"
          disabled={taskPage === 0}
          onClick={() => setTaskPage(Math.max(0, taskPage - 1))}
        >
          ← Previous Page
        </button>
        <span className="font-caption text-caption text-on-surface font-medium">
          Showing {filteredTasks.length > 0 ? startIndex + 1 : 0}-
          {Math.min(startIndex + ITEMS_PER_PAGE, filteredTasks.length)} of{" "}
          {filteredTasks.length} tasks
        </span>
        <button
          className="px-space-md py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high disabled:opacity-40 font-button-utility text-button-utility transition-all"
          disabled={(taskPage + 1) * ITEMS_PER_PAGE >= filteredTasks.length}
          onClick={() => setTaskPage(taskPage + 1)}
        >
          Next Page →
        </button>
      </div>
    </div>
  );
};
