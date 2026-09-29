import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { AddCustomerModal } from './AddCustomerModal';
import { AddTaskModal } from './AddTaskModal';
import { EditTaskModal } from './EditTaskModal';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface LayoutProps {
  children: React.ReactNode;
  onOpenHelpModal: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onOpenHelpModal }) => {
  // Hook registering global desktop keyboard shortcuts
  useKeyboardShortcuts(onOpenHelpModal);

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface antialiased flex flex-col">
      <Header onOpenHelpModal={onOpenHelpModal} />
      <Sidebar />

      <div className="pl-64 flex-1">
        <main className="w-full pt-16 min-h-screen">
          {children}
        </main>
      </div>

      <AddCustomerModal />
      <AddTaskModal />
      <EditTaskModal />
    </div>
  );
};
