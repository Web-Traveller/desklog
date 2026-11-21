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
    <div className="fixed bottom-4 right-4 z-[120] flex flex-col gap-1.5 max-w-sm w-auto pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-full shadow-md border backdrop-blur-md bg-inverse-surface/92 text-inverse-on-surface border-white/10 animate-fadeIn transition-all text-xs"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`material-symbols-outlined text-sm flex-shrink-0 ${
                toast.type === 'success'
                  ? 'text-emerald-400'
                  : toast.type === 'error'
                  ? 'text-rose-400'
                  : toast.type === 'warning'
                  ? 'text-amber-400'
                  : 'text-sky-400'
              }`}
            >
              {toast.type === 'success'
                ? 'check_circle'
                : toast.type === 'error'
                ? 'error'
                : toast.type === 'warning'
                ? 'warning'
                : 'info'}
            </span>
            <span className="font-button-utility font-medium truncate max-w-[280px]">
              {toast.message}
            </span>
          </div>

          <button
            className="p-0.5 rounded-full hover:bg-white/15 transition-colors flex-shrink-0 opacity-60 hover:opacity-100 flex items-center justify-center ml-1"
            onClick={() => onDismiss(toast.id)}
            type="button"
            title="Dismiss"
          >
            <span className="material-symbols-outlined text-[13px]">close</span>
          </button>
        </div>
      ))}
    </div>
  );
};
