import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Delete Record',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-inverse-surface/50 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-2xl max-w-md w-full border border-surface-container/80 flex flex-col gap-space-md transition-all scale-100">
        <div className="flex items-start gap-space-md">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              variant === 'danger'
                ? 'bg-tertiary-fixed text-tertiary'
                : variant === 'warning'
                ? 'bg-secondary-fixed text-secondary'
                : 'bg-primary-fixed text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">
              {variant === 'danger' ? 'delete_forever' : variant === 'warning' ? 'warning' : 'info'}
            </span>
          </div>

          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <h3 className="font-tagline text-tagline font-bold text-on-surface tracking-tight">
              {title}
            </h3>
            <p className="font-body text-body text-on-surface-variant leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-space-sm pt-space-xs border-t border-surface-container">
          <button
            className="px-space-md py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-button-utility text-button-utility font-medium transition-all active:scale-95"
            onClick={onCancel}
            type="button"
          >
            {cancelText}
          </button>
          <button
            className={`px-space-md py-2.5 rounded-full font-button-utility text-button-utility font-semibold transition-all active:scale-95 shadow-sm ${
              variant === 'danger'
                ? 'bg-tertiary text-on-tertiary hover:bg-tertiary/90'
                : 'bg-primary text-on-primary hover:bg-primary/90'
            }`}
            onClick={onConfirm}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
