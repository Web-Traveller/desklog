import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  isTableRow?: boolean;
  colSpan?: number;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
  isTableRow = false,
  colSpan = 1,
  compact = false,
}) => {
  const content = (
    <div
      className={`flex flex-col items-center justify-center text-center mx-auto animate-fadeIn ${
        compact ? 'py-space-md px-space-sm gap-1.5' : 'py-space-xl px-space-md gap-space-sm'
      }`}
    >
      <div
        className={`rounded-2xl bg-surface-container-high/40 flex items-center justify-center text-outline/60 ${
          compact ? 'w-10 h-10' : 'w-14 h-14'
        }`}
      >
        <span className={`material-symbols-outlined ${compact ? 'text-xl' : 'text-3xl'}`}>
          {icon}
        </span>
      </div>

      <div className="flex flex-col gap-0.5 max-w-md">
        <h4 className={`font-body-strong text-on-surface font-semibold ${compact ? 'text-sm' : 'text-base'}`}>
          {title}
        </h4>
        {description && (
          <p className="font-caption text-caption text-on-surface-variant">
            {description}
          </p>
        )}
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 px-space-md py-2 rounded-full bg-primary-container text-on-primary hover:bg-primary transition-all active:scale-95 font-button-utility text-button-utility font-medium shadow-xs"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );

  if (isTableRow) {
    return (
      <tr>
        <td colSpan={colSpan} className="p-space-lg">
          {content}
        </td>
      </tr>
    );
  }

  return (
    <div className="w-full bg-surface-container-lowest rounded-2xl border border-surface-container/60 shadow-xs overflow-hidden">
      {content}
    </div>
  );
};
