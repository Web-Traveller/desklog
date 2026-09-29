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
    <div className="fixed bottom-6 right-6 z-[120] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md animate-fadeIn transition-all ${
            toast.type === 'success'
              ? 'bg-secondary-container/95 text-on-secondary-container border-secondary/30'
              : toast.type === 'error'
              ? 'bg-tertiary-container/95 text-on-tertiary-container border-tertiary/30'
              : toast.type === 'warning'
              ? 'bg-surface-container-highest text-on-surface border-warning/30'
              : 'bg-primary-container/95 text-on-primary-container border-primary/30'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-xl flex-shrink-0">
              {toast.type === 'success'
                ? 'check_circle'
                : toast.type === 'error'
                ? 'error'
                : toast.type === 'warning'
                ? 'warning'
                : 'info'}
            </span>
            <span className="font-caption-strong text-caption-strong font-medium truncate">
              {toast.message}
            </span>
          </div>

          <button
            className="p-1 rounded-full hover:bg-black/10 transition-colors flex-shrink-0"
            onClick={() => onDismiss(toast.id)}
            type="button"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      ))}
    </div>
  );
};
