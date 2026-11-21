import React from 'react';
import { Task, TaskStatus } from '../types';
import { useDesk } from '../context/DeskContext';
import { formatRupees } from '../utils/currencyUtils';
import { formatDisplayDate } from '../utils/dateUtils';

interface TaskCardProps {
  task: Task;
  layout?: 'kanban' | 'list';
  isHighlighted?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  layout = 'kanban',
  isHighlighted = false,
}) => {
  const { updateTaskStatus, navigateToCustomerTaskProfile, highlightedTaskId, setSelectedTaskToEdit, setIsEditTaskOpen, confirmDeleteTask, customers, payments } = useDesk();

  const taskPayments = payments.filter(p => p.task_id === task.id);
  const totalPaid = taskPayments.reduce((acc, curr) => acc + curr.amount, 0);
  const billingPaise = task.billing_amount || 0;
  const pendingDuePaise = Math.max(0, billingPaise - totalPaid);
  const isFullyPaid = billingPaise > 0 && totalPaid >= billingPaise;
  const hasPendingDue = pendingDuePaise > 0;

  const activeHighlight = isHighlighted || highlightedTaskId === task.id;

  const handleStatusSelect = (newStatus: TaskStatus) => {
    if (newStatus !== task.status) {
      updateTaskStatus(task.id, newStatus);
    }
  };

  const handleTaskClick = () => {
    navigateToCustomerTaskProfile(task.customer_id, task.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTaskToEdit(task);
    setIsEditTaskOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    confirmDeleteTask(task);
  };

  if (layout === 'kanban') {
    return (
      <div
        id={`task-card-${task.id}`}
        className={`p-space-sm rounded-xl bg-surface-container-low hover:bg-surface-container flex flex-col gap-space-xxs transition-all border shadow-xs ${
          activeHighlight
            ? 'ring-4 ring-primary bg-primary-container/20 border-primary shadow-lg scale-[1.01] duration-300'
            : 'border-surface-container-high/30'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className="font-caption-strong text-caption-strong text-on-surface hover:text-primary hover:underline cursor-pointer truncate flex-1"
            onClick={handleTaskClick}
            title={task.title}
          >
            {task.title}
          </span>
          <span className="font-micro-legal text-micro-legal text-outline font-mono flex-shrink-0">
            {formatDisplayDate(task.created_at)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 text-fine-print text-on-surface-variant">
          <span className="truncate flex-1 min-w-0">
            Customer:{' '}
            <button
              className="font-semibold text-on-surface hover:text-primary hover:underline truncate align-bottom max-w-[130px]"
              onClick={handleTaskClick}
              title={customers.find(c => c.id === task.customer_id)?.name || ""}
            >
              {(customers.find(c => c.id === task.customer_id)?.name || "")}
            </button>
          </span>
          <span className="font-mono text-xs flex-shrink-0">{(customers.find(c => c.id === task.customer_id)?.mobile || "")}</span>
        </div>

        {(task.work_type || task.tracker_id || task.document_number) && (
          <div className="flex flex-wrap items-center gap-1 text-[11px] font-mono">
            {task.work_type && (
              <span className="px-1.5 py-0.2 rounded font-sans text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                {task.work_type}
              </span>
            )}
            {task.tracker_id && (
              <span className="bg-surface-container px-1 py-0.2 rounded border border-surface-container-high/50 text-outline" title="Tracker ID">
                Trk: <strong className="text-on-surface font-mono">{task.tracker_id}</strong>
              </span>
            )}
            {task.document_number && (
              <span className="bg-surface-container px-1 py-0.2 rounded border border-surface-container-high/50 text-outline" title="Document Number">
                Doc: <strong className="text-on-surface font-mono">{task.document_number}</strong>
              </span>
            )}
          </div>
        )}

        {task.scheduled_date && (
          <div className="text-xs text-primary font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">alarm</span>
            {formatDisplayDate(task.scheduled_date)}
          </div>
        )}
        {task.billing_amount !== undefined && (
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono pt-0.5">
            <span className="text-on-surface font-semibold" title="Total Service Billing">
              Total: <strong>{formatRupees(billingPaise)}</strong>
            </span>
            <span className="text-outline/40">|</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium" title="Paid Advance / Amount Received">
              Paid: {formatRupees(totalPaid)}
            </span>
            {hasPendingDue ? (
              <span className="px-1.5 py-0.2 rounded font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30" title="Pending Balance (Udhari)">
                Due: {formatRupees(pendingDuePaise)}
              </span>
            ) : isFullyPaid ? (
              <span className="px-1.5 py-0.2 rounded font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Paid ✓
              </span>
            ) : null}
          </div>
        )}

        {/* Stage Status Change Selector */}
        <div className="flex items-center justify-between pt-1 mt-1 border-t border-surface-container/40 gap-space-xs">
          <span className="font-micro-legal text-micro-legal text-outline truncate flex-1">
            {task.status || 'Stage'}
          </span>

          <div className="relative flex items-center">
            <select
              className={`px-2 py-1 rounded-full font-fine-print text-fine-print font-medium focus:outline-none cursor-pointer transition-colors border border-surface-container-high/60 ${
                task.status === 'PENDING'
                  ? 'bg-tertiary-fixed text-on-tertiary-fixed font-bold'
                  : task.status === 'PROCESSING'
                  ? 'bg-secondary-fixed text-on-secondary-fixed-variant font-bold'
                  : task.status === 'READY'
                  ? 'bg-primary-container text-on-primary-container font-bold'
                  : task.status === 'CANCELLED'
                  ? 'bg-error-container text-on-error-container font-bold'
                  : 'bg-secondary text-on-secondary font-bold'
              }`}
              value={task.status}
              onChange={(e) => handleStatusSelect(e.target.value as TaskStatus)}
            >
              <option className="bg-surface-container-lowest text-on-surface" value="PENDING">
                Pending
              </option>
              <option className="bg-surface-container-lowest text-on-surface" value="PROCESSING">
                Processing
              </option>
              <option className="bg-surface-container-lowest text-on-surface" value="READY">
                Ready
              </option>
              <option className="bg-surface-container-lowest text-on-surface" value="DELIVERED">
                Delivered
              </option>
              <option className="bg-surface-container-lowest text-on-surface" value="CANCELLED">
                Cancelled
              </option>
            </select>
            <button
              className="p-1 rounded-full text-outline hover:text-primary hover:bg-surface-container transition-colors ml-1"
              onClick={handleEditClick}
              title="Edit Task"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
            <button
              className="p-1 rounded-full text-outline hover:text-error hover:bg-surface-container transition-colors ml-0.5"
              onClick={handleDeleteClick}
              title="Delete Task"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`task-card-${task.id}`}
      className={`flex flex-col md:flex-row md:items-center justify-between px-space-md py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all gap-space-sm border ${
        activeHighlight
          ? 'ring-4 ring-primary bg-primary-container/20 border-primary shadow-lg scale-[1.01] duration-300'
          : 'border-surface-container-high/30'
      }`}
    >
      <div className="flex items-start gap-space-sm min-w-0 flex-1">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer ${
            task.status === 'PROCESSING'
              ? 'bg-primary-fixed text-primary'
              : task.status === 'READY'
              ? 'bg-primary-container text-on-primary-container'
              : task.status === 'DELIVERED'
              ? 'bg-secondary-fixed text-secondary'
              : 'bg-tertiary-fixed text-tertiary'
          }`}
          onClick={handleTaskClick}
        >
          <span className="material-symbols-outlined text-xl">
            {task.status === 'PROCESSING'
              ? 'pending_actions'
              : task.status === 'READY'
              ? 'task_alt'
              : task.status === 'DELIVERED'
              ? 'check_circle'
              : 'hourglass_empty'}
          </span>
        </div>

        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex flex-wrap items-center gap-space-xs">
            <span
              className="font-body-strong text-body-strong text-on-surface font-semibold hover:text-primary hover:underline cursor-pointer"
              onClick={handleTaskClick}
            >
              {task.title}
            </span>
            <span className="font-fine-print text-fine-print text-on-surface-variant">
              ({(customers.find(c => c.id === task.customer_id)?.name || "")})
            </span>
            {task.work_type && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-fine-print text-fine-print font-medium">
                {task.work_type}
              </span>
            )}
            {activeHighlight && (
              <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary font-fine-print text-fine-print font-bold animate-pulse">
                Target Task
              </span>
            )}
          </div>

          <p className="font-caption text-caption text-on-surface-variant">
            {task.notes || task.status || 'Task logged in desk register.'}
          </p>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-space-md font-fine-print text-fine-print text-outline mt-1">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">schedule</span>
              Created: <strong className="text-on-surface font-medium">{formatDisplayDate(task.created_at)}</strong>
            </span>
            {task.updated_at && (
              <>
                <span className="text-surface-dim">•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">update</span>
                  Updated: <strong className="text-on-surface font-medium">{formatDisplayDate(task.updated_at)}</strong>
                </span>
              </>
            )}
            {task.scheduled_date && (
              <>
                <span className="text-surface-dim">•</span>
                <span className="flex items-center gap-1 text-primary">
                  <span className="material-symbols-outlined text-xs">alarm</span>
                  Scheduled: <strong className="font-medium">{formatDisplayDate(task.scheduled_date)}</strong>
                </span>
              </>
            )}
            {task.tracker_id && (
              <>
                <span className="text-surface-dim">•</span>
                <span className="flex items-center gap-1 font-mono text-outline">
                  <span className="material-symbols-outlined text-xs">tag</span>
                  Tracker: <strong className="text-on-surface font-medium">{task.tracker_id}</strong>
                </span>
              </>
            )}
            {task.document_number && (
              <>
                <span className="text-surface-dim">•</span>
                <span className="flex items-center gap-1 font-mono text-outline">
                  <span className="material-symbols-outlined text-xs">description</span>
                  Doc #: <strong className="text-on-surface font-medium">{task.document_number}</strong>
                </span>
              </>
            )}
            {task.billing_amount !== undefined && (
              <>
                <span className="text-surface-dim">•</span>
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className="text-on-surface font-semibold" title="Total Billing">Total: {formatRupees(billingPaise)}</span>
                  <span className="text-outline/40">|</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium" title="Paid Advance">Paid: {formatRupees(totalPaid)}</span>
                  {hasPendingDue ? (
                    <span className="px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30" title="Pending Balance (Udhari)">
                      Due: {formatRupees(pendingDuePaise)}
                    </span>
                  ) : isFullyPaid ? (
                    <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      Paid ✓
                    </span>
                  ) : null}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stage Selector & Navigation Trigger */}
      <div className="flex items-center gap-space-xs self-end md:self-center flex-shrink-0">
        <span className="font-fine-print text-fine-print text-on-surface-variant font-medium">Stage:</span>
        <select
          className={`px-3 py-1.5 rounded-full font-button-utility text-button-utility font-medium focus:outline-none cursor-pointer border border-surface-container-high/60 shadow-xs ${
            task.status === 'PENDING'
              ? 'bg-tertiary-fixed text-on-tertiary-fixed font-bold'
              : task.status === 'PROCESSING'
              ? 'bg-secondary-fixed text-on-secondary-fixed-variant font-bold'
              : task.status === 'READY'
              ? 'bg-primary-container text-on-primary-container font-bold'
              : task.status === 'CANCELLED'
              ? 'bg-error-container text-on-error-container font-bold'
              : 'bg-secondary text-on-secondary font-bold'
          }`}
          value={task.status}
          onChange={(e) => handleStatusSelect(e.target.value as TaskStatus)}
        >
          <option className="bg-surface-container-lowest text-on-surface" value="PENDING">
            Pending
          </option>
          <option className="bg-surface-container-lowest text-on-surface" value="PROCESSING">
            Processing
          </option>
          <option className="bg-surface-container-lowest text-on-surface" value="READY">
            Ready
          </option>
          <option className="bg-surface-container-lowest text-on-surface" value="DELIVERED">
            Delivered
          </option>
          <option className="bg-surface-container-lowest text-on-surface" value="CANCELLED">
            Cancelled
          </option>
        </select>
        <button
          className="p-1.5 rounded-full text-outline hover:text-primary hover:bg-surface-container transition-colors ml-1"
          onClick={handleEditClick}
          title="Edit Task"
          type="button"
        >
          <span className="material-symbols-outlined text-lg">edit</span>
        </button>
        <button
          className="p-1.5 rounded-full text-outline hover:text-primary hover:bg-surface-container transition-colors"
          onClick={handleTaskClick}
          title="Open in Customer Profile"
          type="button"
        >
          <span className="material-symbols-outlined text-lg">open_in_new</span>
        </button>
        <button
          className="p-1.5 rounded-full text-outline hover:text-error hover:bg-surface-container transition-colors"
          onClick={handleDeleteClick}
          title="Delete Task"
          type="button"
        >
          <span className="material-symbols-outlined text-lg">delete</span>
        </button>
      </div>
    </div>
  );
};
