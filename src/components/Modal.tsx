import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: string; // Material symbol icon name
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerRight?: React.ReactNode;
  closeOnBackdropClick?: boolean;
}

const MAX_WIDTH_CLASSES: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  full: 'max-w-5xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  maxWidth = '2xl',
  children,
  footer,
  headerRight,
  closeOnBackdropClick = true,
}) => {
  // Lock background body scroll while modal is active
  useBodyScrollLock(isOpen);

  // ESC key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = MAX_WIDTH_CLASSES[maxWidth] || 'max-w-2xl';

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto overscroll-contain bg-black/60 backdrop-blur-md transition-all duration-200 animate-in fade-in"
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      <div
        className={`relative w-full ${maxWidthClass} bg-surface-container-lowest dark:bg-slate-900 rounded-2xl shadow-2xl border border-surface-container/80 dark:border-slate-800 overflow-hidden my-auto transform transition-all duration-200 animate-in zoom-in-95 focus:outline-none overscroll-contain`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        {(title || icon) && (
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-container/70 dark:border-slate-800 bg-surface-container-low/40 dark:bg-slate-850/50">
            <div className="flex items-center gap-2.5 min-w-0">
              {icon && (
                <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">{icon}</span>
                </div>
              )}
              <div className="min-w-0">
                {typeof title === 'string' ? (
                  <h3 className="font-semibold text-sm sm:text-base text-on-surface truncate">
                    {title}
                  </h3>
                ) : (
                  title
                )}
                {subtitle && (
                  <p className="text-[11px] text-outline truncate mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {headerRight}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container dark:hover:bg-slate-800 transition-colors"
                title="Close (Esc)"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto max-h-[78vh] overscroll-contain">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="px-5 py-3 border-t border-surface-container/70 dark:border-slate-800 bg-surface-container-low/30 dark:bg-slate-850/40 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
