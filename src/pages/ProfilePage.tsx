import React, { useState, useEffect } from "react";
import { useDesk } from "../context/DeskContext";
import { CustomerAvatar } from "../components/CustomerAvatar";
import { MetricCard } from "../components/MetricCard";
import { TaskCard } from "../components/TaskCard";
import { EditCustomerModal } from "../components/EditCustomerModal";
import { CustomerSearchPicker } from "../components/CustomerSearchPicker";
import { calculateDueAmount } from "../services/paymentService";

export const ProfilePage: React.FC = () => {
  const {
    selectedCustomerId,
    highlightedTaskId,
    customers,
    tasks,
    payments,
    setCurrentPage,
    confirmDeleteCustomer,
    showToast,
    addRelationship,
    deleteRelationship,
    getRelationshipsForCustomer,
    navigateToCustomerProfile,
  } = useDesk();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState<
    "all" | "PROCESSING" | "DELIVERED"
  >("all");

  // Relationship Linking Form State
  const [isAddRelOpen, setIsAddRelOpen] = useState(false);
  const [relTargetCustId, setRelTargetCustId] = useState<string>("");
  const [relType, setRelType] = useState<string>("Son");

  const customer =
    customers.find((c) => c.id === selectedCustomerId) || customers[0];
  const customerTasks = tasks.filter((t) => t.customer_id === customer?.id);

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

  const customerRelationships = customer
    ? getRelationshipsForCustomer(customer.id)
    : [];

  const handleDeleteCustomer = () => {
    if (customer) {
      confirmDeleteCustomer(customer);
    }
  };

  const handleAddRelationshipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relTargetCustId || relTargetCustId === customer.id) {
      showToast("Please select another customer to link.", "warning");
      return;
    }
    await addRelationship(relTargetCustId, relType);
    setRelTargetCustId("");
    setIsAddRelOpen(false);
  };

  const filteredTasks = customerTasks.filter((t) => {
    if (taskFilter === "PROCESSING") return t.status !== "DELIVERED";
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
            </div>

            {customer.note && (
              <p className="font-fine-print text-fine-print text-outline mt-1 italic">
                "{customer.note}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Family & Related Customers Section */}
      <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-surface-container/60 flex flex-col gap-space-sm">
        <div className="flex items-center justify-between pb-space-xs border-b border-surface-container/40">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-xl">
              family_restroom
            </span>
            <h2 className="font-body-strong text-body-strong text-on-surface">
              Family & Related Customers
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-xs font-semibold text-outline">
              {customerRelationships.length} Linked
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsAddRelOpen(!isAddRelOpen)}
            className="px-3 py-1 rounded-full bg-primary-container text-on-primary hover:bg-primary transition-all font-button-utility text-xs font-semibold flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">
              {isAddRelOpen ? "close" : "add"}
            </span>
            <span>{isAddRelOpen ? "Cancel" : "Link Family Member"}</span>
          </button>
        </div>

        {isAddRelOpen && (
          <form
            onSubmit={handleAddRelationshipSubmit}
            className="p-3 bg-surface-container-low rounded-xl flex flex-col md:flex-row items-end gap-3 border border-surface-container-high/50 my-1 animate-fadeIn"
          >
            <div className="flex-1">
              <CustomerSearchPicker
                customers={customers.filter((c) => c.id !== customer.id)}
                label="Select Family Member / Related Customer"
                selectedCustomerId={relTargetCustId}
                onSelectCustomer={(c) => setRelTargetCustId(c.id)}
              />
            </div>
            <div className="flex flex-col gap-1 w-full md:w-44">
              <label className="font-fine-print text-fine-print text-on-surface-variant font-medium">
                Relationship
              </label>
              <select
                value={relType}
                onChange={(e) => setRelType(e.target.value)}
                className="px-3 py-2 rounded-xl bg-surface-container text-on-surface border border-surface-container-high focus:outline-none font-button-utility text-xs"
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Husband">Husband</option>
                <option value="Wife">Wife</option>
                <option value="Sibling">Sibling</option>
                <option value="Family">Family Member</option>
                <option value="Other">Other Associate</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full md:w-auto px-4 py-2 bg-primary text-on-primary rounded-xl font-button-utility text-xs font-semibold hover:bg-primary-container shadow-xs"
            >
              Link Relationship
            </button>
          </form>
        )}

        {customerRelationships.length === 0 ? (
          <p className="font-fine-print text-fine-print text-outline text-center py-2">
            No family members or related customers linked to this profile.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-xs pt-1">
            {customerRelationships.map((rel) => {
              const otherCustId =
                rel.customer_id === customer.id
                  ? rel.related_customer_id
                  : rel.customer_id;
              const otherCust = customers.find((c) => c.id === otherCustId);
              if (!otherCust) return null;

              return (
                <div
                  key={rel.id}
                  className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/40 flex items-center justify-between hover:bg-surface-container transition-colors"
                >
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => navigateToCustomerProfile(otherCust.id)}
                  >
                    <CustomerAvatar
                      colorClass={otherCust.avatar_color}
                      initials={otherCust.avatar_initials || "DS"}
                      size="sm"
                    />
                    <div className="flex flex-col">
                      <span className="font-body-strong text-body-strong text-on-surface hover:text-primary hover:underline font-semibold text-xs">
                        {otherCust.name}
                      </span>
                      <span className="font-caption text-caption text-on-surface-variant font-mono text-[11px]">
                        {otherCust.mobile || "No Mobile"} •{" "}
                        <strong className="text-primary">
                          {rel.relationship_type}
                        </strong>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteRelationship(rel.id)}
                    className="p-1 rounded-full text-outline hover:text-error hover:bg-surface-container"
                    title="Remove Link"
                  >
                    <span className="material-symbols-outlined text-sm">
                      link_off
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
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
          value={`₹${totalDueBalance}`}
        />
      </div>

      {/* Task History List */}
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
                taskFilter === "PROCESSING"
                  ? "bg-surface-container-lowest text-on-surface font-medium shadow-xs"
                  : "hover:text-on-surface"
              }`}
              onClick={() => setTaskFilter("PROCESSING")}
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
