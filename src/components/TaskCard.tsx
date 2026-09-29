import React from 'react';
import { Task, TaskStatus } from '../types';
import { useDesk } from '../context/DeskContext';

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
  const { updateTaskStatus, navigateToCustomerTaskProfile, highlightedTaskId, setSelectedTaskToEdit, setIsEditTaskOpen, confirmDeleteTask } = useDesk();

  const activeHighlight = isHighlighted || highlightedTaskId === task.id;

  const handleStatusSelect = (newStatus: TaskStatus) => {
    if (newStatus !== task.status) {
      updateTaskStatus(task.id, newStatus);
    }
  };

  const handleTaskClick = () => {
    navigateToCustomerTaskProfile(task.customerId, task.id);
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
        <div className="flex items-center justify-between">
          <span
            className="font-caption-strong text-caption-strong text-on-surface hover:text-primary hover:underline cursor-pointer"
            onClick={handleTaskClick}
            title="Click to view task in customer profile"
          >
            {task.title}
          </span>
          <span className="font-micro-legal text-micro-legal text-outline font-mono">
            {task.createdDate}
          </span>
        </div>

        <div className="flex items-center justify-between text-fine-print text-on-surface-variant">
          <span>
            Customer:{' '}
            <button
              className="font-semibold text-on-surface hover:text-primary hover:underline"
              onClick={handleTaskClick}
            >
              {task.customerName}
            </button>
          </span>
          <span className="font-mono text-xs">{task.customerPhone}</span>
        </div>

        {task.scheduleDate && (
          <div className="text-xs text-primary font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">alarm</span>
            {task.scheduleDate}
          </div>
        )}
        {task.billingAmount !== undefined && (
          <div className="text-xs text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">payments</span>
            ₹{task.billingAmount} ({task.billingStatus}{task.amountPaid ? ` - Paid ₹${task.amountPaid}` : ''})
          </div>
        )}

        {/* Stage Status Change Selector */}
        <div className="flex items-center justify-between pt-1 mt-1 border-t border-surface-container/40 gap-space-xs">
          <span className="font-micro-legal text-micro-legal text-outline truncate flex-1">
            {task.subStatus || 'Stage'}
          </span>

          <div className="relative">
            <select
              className={`px-2 py-1 rounded-full font-fine-print text-fine-print font-medium focus:outline-none cursor-pointer transition-colors border border-surface-container-high/60 ${
                task.status === 'pending'
                  ? 'bg-tertiary-fixed text-on-tertiary-fixed font-bold'
                  : task.status === 'processing'
                  ? 'bg-secondary-fixed text-on-secondary-fixed-variant font-bold'
                  : 'bg-secondary text-on-secondary font-bold'
              }`}
              value={task.status}
              onChange={(e) => handleStatusSelect(e.target.value as TaskStatus)}
            >
              <option className="bg-surface-container-lowest text-on-surface" value="pending">
                Pending
              </option>
              <option className="bg-surface-container-lowest text-on-surface" value="processing">
                Processing
              </option>
              <option className="bg-surface-container-lowest text-on-surface" value="done">
                Done / Ready
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
      className={`flex flex-col md:flex-row md:items-center justify-between p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all gap-space-md border ${
        activeHighlight
          ? 'ring-4 ring-primary bg-primary-container/20 border-primary shadow-lg scale-[1.01] duration-300'
          : 'border-surface-container-high/30'
      }`}
    >
      <div className="flex items-start gap-space-md min-w-0 flex-1">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer ${
            task.status === 'processing'
              ? 'bg-primary-fixed text-primary'
              : task.status === 'done'
              ? 'bg-secondary-fixed text-secondary'
              : 'bg-tertiary-fixed text-tertiary'
          }`}
          onClick={handleTaskClick}
        >
          <span className="material-symbols-outlined text-xl">
            {task.status === 'processing'
              ? 'pending_actions'
              : task.status === 'done'
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
              ({task.customerName})
            </span>
            {activeHighlight && (
              <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary font-fine-print text-fine-print font-bold animate-pulse">
                Target Task
              </span>
            )}
          </div>

          <p className="font-caption text-caption text-on-surface-variant">
            {task.notes || task.subStatus || 'Task logged in desk register.'}
          </p>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-space-md font-fine-print text-fine-print text-outline mt-1">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">schedule</span>
              Created: <strong className="text-on-surface font-medium">{task.createdDate}</strong>
            </span>
            {task.updatedDate && (
              <>
                <span className="text-surface-dim">•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">update</span>
                  Updated: <strong className="text-on-surface font-medium">{task.updatedDate}</strong>
                </span>
              </>
            )}
            {task.scheduleDate && (
              <>
                <span className="text-surface-dim">•</span>
                <span className="flex items-center gap-1 text-primary">
                  <span className="material-symbols-outlined text-xs">alarm</span>
                  Scheduled: <strong className="font-medium">{task.scheduleDate}</strong>
                </span>
              </>
            )}
            {task.billingAmount !== undefined && (
              <>
                <span className="text-surface-dim">•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">payments</span>
                  ₹{task.billingAmount} ({task.billingStatus}{task.amountPaid ? ` - Paid ₹${task.amountPaid}` : ''})
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
            task.status === 'pending'
              ? 'bg-tertiary-fixed text-on-tertiary-fixed font-bold'
              : task.status === 'processing'
              ? 'bg-secondary-fixed text-on-secondary-fixed-variant font-bold'
              : 'bg-secondary text-on-secondary font-bold'
          }`}
          value={task.status}
          onChange={(e) => handleStatusSelect(e.target.value as TaskStatus)}
        >
          <option className="bg-surface-container-lowest text-on-surface" value="pending">
            Pending
          </option>
          <option className="bg-surface-container-lowest text-on-surface" value="processing">
            Processing
          </option>
          <option className="bg-surface-container-lowest text-on-surface" value="done">
            Done / Ready
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
