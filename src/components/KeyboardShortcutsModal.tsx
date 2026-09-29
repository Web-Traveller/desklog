import React from 'react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + N', macKey: '⌘N', description: 'Create New Task' },
    { key: 'Ctrl + Shift + C', macKey: '⌘⇧C', description: 'Add New Customer' },
    { key: '/', macKey: '/', description: 'Focus Global Search Bar' },
    { key: 'Esc', macKey: 'Esc', description: 'Close Modals / Clear Search' },
    { key: 'Ctrl + 1', macKey: '⌘1', description: 'Switch to Dashboard' },
    { key: 'Ctrl + 2', macKey: '⌘2', description: 'Switch to All Customers' },
    { key: 'Ctrl + 3', macKey: '⌘3', description: 'Switch to Calendar Log' },
    { key: 'Ctrl + 4', macKey: '⌘4', description: 'Switch to Settings' },
    { key: '?', macKey: '?', description: 'Toggle Hotkeys Help Dialog' },
  ];

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-2xl max-w-lg w-full border border-surface-container/60 flex flex-col gap-space-md">
        <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-xl">keyboard</span>
            <h3 className="font-tagline text-tagline font-semibold text-on-surface">
              Keyboard Shortcuts Guide
            </h3>
          </div>
          <button
            className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="grid grid-cols-1 divide-y divide-surface-container/60">
          {shortcuts.map((sc, i) => (
            <div key={i} className="py-2.5 flex items-center justify-between font-caption">
              <span className="text-on-surface font-medium">{sc.description}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-surface-container text-primary font-mono text-fine-print font-bold shadow-xs border border-surface-container-high/80">
                {isMac ? sc.macKey : sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-space-xs border-t border-surface-container text-fine-print text-outline">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-surface-container font-mono text-on-surface font-semibold">?</kbd> anytime to toggle</span>
          <button
            className="px-space-md py-1.5 rounded-full bg-primary-container text-on-primary font-button-utility text-button-utility font-medium hover:bg-primary transition-all"
            onClick={onClose}
            type="button"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
