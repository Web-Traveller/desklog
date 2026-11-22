import React from 'react';
import { TaskStatus } from '../types';

export type AnyStatus = TaskStatus | 'SUCCESS' | 'FAILD' | 'IN PROGRESS' | 'Verified' | 'Active' | 'Pending' | 'Rejected' | 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE' | string;

interface StatusBadgeProps {
  status: AnyStatus;
  subText?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const getStatusCategory = (rawStatus?: string | null): 'success' | 'pending' | 'danger' | 'neutral' => {
  if (!rawStatus) return 'neutral';
  const s = rawStatus.trim().toUpperCase();

  // Green / Success
  if (
    s === 'SUCCESS' || 
    s === 'VERIFIED' || 
    s === 'ACTIVE' || 
    s === 'DELIVERED' || 
    s === 'READY' || 
    s === 'PAID' ||
    s === 'COMPLETED'
  ) {
    return 'success';
  }

  // Yellow / Amber / Pending
  if (
    s === 'PENDING' || 
    s === 'IN PROGRESS' || 
    s === 'PROCESSING' || 
    s === 'QUEUED' || 
    s === 'PARTIAL' ||
    s === 'WAITING'
  ) {
    return 'pending';
  }

  // Red / Rose / Failed
  if (
    s === 'FAILD' || 
    s === 'FAILED' || 
    s === 'REJECTED' || 
    s === 'CANCELLED' || 
    s === 'CANCELED' ||
    s === 'OVERDUE' ||
    s === 'UNPAID'
  ) {
    return 'danger';
  }

  return 'neutral';
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  subText, 
  size = 'md',
  className = '' 
}) => {
  const category = getStatusCategory(status);

  // Friendly text label
  let label = subText;
  if (!label) {
    const s = String(status || '').toUpperCase();
    if (s === 'FAILD') label = 'Failed';
    else if (s === 'IN PROGRESS') label = 'In Progress';
    else if (s === 'PENDING') label = 'Pending';
    else if (s === 'PROCESSING') label = 'Processing';
    else if (s === 'DELIVERED') label = 'Delivered';
    else if (s === 'SUCCESS') label = 'Success';
    else if (s === 'VERIFIED') label = 'Verified';
    else if (s === 'REJECTED') label = 'Rejected';
    else label = status;
  }

  let colorClasses = '';
  let dotColor = '';

  switch (category) {
    case 'success':
      colorClasses = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20';
      dotColor = 'bg-emerald-500';
      break;
    case 'pending':
      colorClasses = 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20';
      dotColor = 'bg-amber-500 animate-pulse';
      break;
    case 'danger':
      colorClasses = 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20';
      dotColor = 'bg-rose-500';
      break;
    case 'neutral':
    default:
      colorClasses = 'bg-surface-container text-on-surface-variant border border-surface-container-high';
      dotColor = 'bg-outline';
      break;
  }

  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full font-mono uppercase tracking-wider ${paddingClass} ${colorClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
};
