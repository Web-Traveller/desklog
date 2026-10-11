import React from 'react';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[120] flex flex-col gap-2 max-w-md w-auto pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl shadow-lg border backdrop-blur-md animate-fadeIn transition-all ${
            toast.type === 'success'
              ? 'bg-secondary-container/95 text-on-secondary-container border-secondary/30'
              : toast.type === 'error'
              ? 'bg-tertiary-container/95 text-on-tertiary-container border-tertiary/30'
              : toast.type === 'warning'
              ? 'bg-surface-container-highest text-on-surface border-warning/30'
              : 'bg-primary-container/95 text-on-primary-container border-primary/30'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-base flex-shrink-0">
              {toast.type === 'success'
                ? 'check_circle'
                : toast.type === 'error'
                ? 'error'
                : toast.type === 'warning'
                ? 'warning'
                : 'info'}
            </span>
            <span className="font-button-utility text-xs font-medium truncate">
              {toast.message}
            </span>
          </div>

          <button
            className="p-0.5 rounded-full hover:bg-black/10 transition-colors flex-shrink-0 opacity-70 hover:opacity-100"
            onClick={() => onDismiss(toast.id)}
            type="button"
            title="Dismiss"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      ))}
    </div>
  );
};
