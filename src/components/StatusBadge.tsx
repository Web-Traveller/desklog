import React from 'react';
import { TaskStatus } from '../types';

interface StatusBadgeProps {
  status: TaskStatus;
  subText?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, subText, size = 'md' }) => {
  switch (status) {
    case 'PENDING':
      return (
        <span className={`inline-flex items-center gap-1.5 px-space-xs py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-micro-legal text-micro-legal font-bold ${size === 'sm' ? 'text-[10px]' : ''}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
          <span>{subText || 'Pending'}</span>
        </span>
      );
    case 'PROCESSING':
      return (
        <span className={`inline-flex items-center gap-1.5 px-space-xs py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-micro-legal text-micro-legal font-bold ${size === 'sm' ? 'text-[10px]' : ''}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
          <span>{subText || 'Processing'}</span>
        </span>
      );
    case 'DELIVERED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-space-xs py-0.5 rounded-full bg-surface-container font-micro-legal text-micro-legal font-bold text-secondary ${size === 'sm' ? 'text-[10px]' : ''}`}>
          <span className="material-symbols-outlined text-xs text-secondary">check</span>
          <span>{subText || 'Ready / Done'}</span>
        </span>
      );
    default:
      return null;
  }
};
