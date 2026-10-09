import React, { useState, useEffect } from "react";
import { useDesk } from "../context/DeskContext";
import { CustomerAvatar } from "../components/CustomerAvatar";
import { MetricCard } from "../components/MetricCard";
import { TaskCard } from "../components/TaskCard";
import { EditCustomerModal } from "../components/EditCustomerModal";
import { EmptyState } from "../components/EmptyState";
import { calculateDueAmount } from "../services/paymentService";
import { formatDisplayDate } from "../utils/dateUtils";
import { formatRupees } from "../utils/currencyUtils";
import { formatRefDetails } from "../utils/bankingUtils";

export const ProfilePage: React.FC = () => {
  const {
    selectedCustomerId,
    highlightedTaskId,
    customers,
    tasks,
    payments,
    bankingTransactions,
    setCurrentPage,
    confirmDeleteCustomer,
    showToast,
  } = useDesk();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState<
    "all" | "active" | "DELIVERED"
  >("all");
  const [activeTab, setActiveTab] = useState<"tasks" | "banking">("tasks");

  const customer =
    customers.find((c) => c.id === selectedCustomerId) || customers[0];
  const customerTasks = tasks.filter((t) => t.customer_id === customer?.id);
  const customerBankingTxs = bankingTransactions.filter(tx => tx.customer_id === customer?.id);

  const pendingCount = customerTasks.filter(
    (t) => t.status === "PENDING",
  ).length;
  const processingCount = customerTasks.filter(
    (t) => t.status === "PROCESSING",
  ).length;
  const doneCount = customerTasks.filter(
    (t) => t.status === "DELIVERED",
  ).length;

  // Calculate actual dynamic due balance using paymentService
  const totalDueBalance = customerTasks.reduce((acc, t) => {
    const taskPayments = payments.filter((p) => p.task_id === t.id);
    return acc + calculateDueAmount(t.billing_amount, taskPayments);
  }, 0);

  const handleDeleteCustomer = () => {
    if (customer) {
      confirmDeleteCustomer(customer);
    }
  };

  const filteredTasks = customerTasks.filter((t) => {
    if (taskFilter === "active") return t.status !== "DELIVERED";
    if (taskFilter === "DELIVERED") return t.status === "DELIVERED";
    return true;
  });

  useEffect(() => {
    if (highlightedTaskId) {
      const el = document.getElementById(`task-card-${highlightedTaskId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [highlightedTaskId]);

  const handleCopyPhone = () => {
    if (customer?.mobile && customer.mobile !== "N/A") {
      navigator.clipboard?.writeText(customer.mobile);
      showToast(
        `Mobile number ${customer.mobile} copied to clipboard.`,
        "success",
      );
    }
  };

  if (!customer) return null;

  return (
    <div className="w-full max-w-6xl mx-auto px-gutter py-space-xl flex flex-col gap-space-xl animate-slideUp">
      {/* Top Nav Breadcrumbs & Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md border-b border-surface-container pb-space-xs">
        <div className="flex flex-col gap-space-xxs">
          <button
            className="inline-flex items-center gap-1.5 text-secondary hover:text-primary transition-colors font-button-utility text-button-utility w-fit group"
            onClick={() => setCurrentPage("customers")}
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

        {customer.id !== "cust-general" && (
          <div className="flex items-center gap-space-sm">
            <button
              className="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container-lowest hover:bg-surface-container transition-transform active:scale-95 text-on-surface font-button-utility text-button-utility shadow-xs border border-surface-container/60"
              onClick={() => setIsEditOpen(true)}
              type="button"
            >
              <span className="material-symbols-outlined text-lg text-outline">
                edit
              </span>
              <span>Edit Details</span>
            </button>
            <button
              className="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-tertiary-fixed text-on-tertiary-fixed hover:bg-tertiary transition-transform active:scale-95 font-button-utility text-button-utility shadow-xs"
              onClick={handleDeleteCustomer}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">archive</span>
              <span>Archive Customer</span>
            </button>
          </div>
        )}
      </div>

      {/* Customer Identity Card */}
      <div className="w-full bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-space-lg relative overflow-hidden">
        <div className="flex items-start md:items-center gap-space-md min-w-0">
          <CustomerAvatar
            colorClass={customer.avatar_color}
            initials={customer.avatar_initials || "DS"}
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
                <span className="material-symbols-outlined text-base text-outline">
                  call
                </span>
                <span className="font-medium text-on-surface font-mono">
                  {customer.mobile || "No Mobile"}
                </span>
                {customer.mobile && customer.mobile !== "N/A" && (
                  <button
                    className="text-outline hover:text-primary transition-colors ml-0.5 inline-flex items-center"
                    onClick={handleCopyPhone}
                    title="Copy Mobile"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">
                      content_copy
                    </span>
                  </button>
                )}
              </div>
              <span className="text-surface-dim">/</span>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-outline">
                  calendar_month
                </span>
                <span>Enrolled: {customer.created_at}</span>
              </div>
              {customer.aadhaar_number && (
                <>
                  <span className="text-surface-dim">/</span>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-outline">
                      badge
                    </span>
                    <span className="font-mono">{customer.aadhaar_number}</span>
                  </div>
                </>
              )}
            </div>

            {customer.note && (
              <p className="font-fine-print text-fine-print text-outline mt-1 italic">
                "{customer.note}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Task Summary Metrics */}
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
          iconColorClass={
            totalDueBalance > 0 ? "text-tertiary" : "text-secondary"
          }
          title="Due Balance"
          value={formatRupees(totalDueBalance)}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-container gap-4 mt-4">
        <button
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "tasks" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-surface-variant"
          }`}
          onClick={() => setActiveTab("tasks")}
        >
          Task History
        </button>
        <button
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "banking" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-surface-variant"
          }`}
          onClick={() => setActiveTab("banking")}
        >
          Banking History
        </button>
      </div>

      {activeTab === "tasks" && (
      <div
        className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-lg"
        id="customer-task-section"
      >
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
                taskFilter === "all"
                  ? "bg-surface-container-lowest text-on-surface font-medium shadow-xs"
                  : "hover:text-on-surface"
              }`}
              onClick={() => setTaskFilter("all")}
              type="button"
            >
              All ({customerTasks.length})
            </button>
            <button
              className={`px-space-sm py-1 rounded-lg transition-all ${
                taskFilter === "active"
                  ? "bg-surface-container-lowest text-on-surface font-medium shadow-xs"
                  : "hover:text-on-surface"
              }`}
              onClick={() => setTaskFilter("active")}
              type="button"
            >
              Active ({pendingCount + processingCount})
            </button>
            <button
              className={`px-space-sm py-1 rounded-lg transition-all ${
                taskFilter === "DELIVERED"
                  ? "bg-surface-container-lowest text-on-surface font-medium shadow-xs"
                  : "hover:text-on-surface"
              }`}
              onClick={() => setTaskFilter("DELIVERED")}
              type="button"
            >
              Completed ({doneCount})
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-space-md">
          {filteredTasks.length === 0 ? (
            <EmptyState
              compact
              icon="assignment"
              title="No tasks found"
              description="No tasks logged matching the selected stage filter."
            />
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
      )}

      {activeTab === "banking" && (
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-lg">
        <div className="flex items-center gap-space-sm pb-space-xs border-b border-surface-container">
          <h2 className="font-tagline text-tagline font-semibold text-on-surface">
            Banking History
          </h2>
          <span className="font-caption text-caption text-on-surface-variant">
            Recent Transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-lowest sticky top-0 border-b border-surface-variant">
              <tr>
                <th className="p-4 font-medium text-sm text-on-surface-variant whitespace-nowrap">Date</th>
                <th className="p-4 font-medium text-sm text-on-surface-variant">Type</th>
                <th className="p-4 font-medium text-sm text-on-surface-variant">Mode</th>
                <th className="p-4 font-medium text-sm text-on-surface-variant text-right">Amount</th>
                <th className="p-4 font-medium text-sm text-on-surface-variant">Ref / Details</th>
              </tr>
            </thead>
            <tbody>
              {customerBankingTxs.length === 0 ? (
                <EmptyState
                  compact
                  isTableRow
                  colSpan={5}
                  icon="account_balance_wallet"
                  title="No banking history"
                  description="No banking transactions recorded for this customer profile."
                />
              ) : (
                customerBankingTxs.map((tx) => (
                  <tr key={tx.id} className="border-b border-surface-variant/50 hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="p-4 text-sm text-on-surface whitespace-nowrap">
                      {formatDisplayDate(tx.transaction_date)}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                        tx.transaction_type === 'Transfer' ? 'bg-primary-container text-on-primary-container' :
                        tx.transaction_type === 'Withdrawal' ? 'bg-tertiary-container text-on-tertiary-container' :
                        'bg-secondary-container text-on-secondary-container'
                      }`}>
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-on-surface-variant">
                      {tx.payment_mode}
                    </td>
                    <td className="p-4 text-sm font-semibold text-right text-on-surface font-mono">
                      {formatRupees(tx.amount)}
                    </td>
                    <td className="p-4 text-sm text-on-surface-variant font-mono">
                      {formatRefDetails(tx)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      <EditCustomerModal
        customer={customer}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
    </div>
  );
};
