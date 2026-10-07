import React, { createContext, useContext, useState } from 'react';
import { ActivePage, Task } from '../types';
import { getFormattedToday } from '../utils/dateUtils';
import { ToastNotification, ToastMessage } from '../components/ToastNotification';
import { ConfirmModal } from '../components/ConfirmModal';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
}

interface UIContextType {
  currentPage: ActivePage;
  setCurrentPage: (page: ActivePage) => void;
  previousPage: ActivePage;
  highlightedTaskId: string | null;
  setHighlightedTaskId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  taskDateFilter: string;
  setTaskDateFilter: (filter: string) => void;
  selectedCalendarDate: string;
  setSelectedCalendarDate: (date: string) => void;

  isAddCustomerOpen: boolean;
  setIsAddCustomerOpen: (open: boolean) => void;
  isAddTaskOpen: boolean;
  setIsAddTaskOpen: (open: boolean) => void;
  isEditTaskOpen: boolean;
  setIsEditTaskOpen: (open: boolean) => void;
  selectedTaskToEdit: Task | null;
  setSelectedTaskToEdit: (task: Task | null) => void;

  taskPage: number;
  setTaskPage: (page: number | ((prev: number) => number)) => void;
  customerPage: number;
  setCustomerPage: (page: number | ((prev: number) => number)) => void;
  ITEMS_PER_PAGE: number;

  showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  showConfirm: (options: ConfirmOptions) => void;
  navigateToCustomerProfile: (customerId: string, setSelectedCustomerId: (id: string) => void) => void;
  navigateToCustomerTaskProfile: (customerId: string, taskId: string, setSelectedCustomerId: (id: string) => void) => void;
  performSearch: (query: string) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPageInternal] = useState<ActivePage>('dashboard');
  const [previousPage, setPreviousPage] = useState<ActivePage>('dashboard');
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [taskDateFilter, setTaskDateFilter] = useState('Last 7 days');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(getFormattedToday());

  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [selectedTaskToEdit, setSelectedTaskToEdit] = useState<Task | null>(null);

  const [taskPage, setTaskPage] = useState(0);
  const [customerPage, setCustomerPage] = useState(0);
  const ITEMS_PER_PAGE = 20;

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const setCurrentPage = (page: ActivePage) => {
    setPreviousPage(currentPage);
    setCurrentPageInternal(page);
  };

  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showConfirm = (options: ConfirmOptions) => {
    setConfirmState({
      isOpen: true,
      ...options,
    });
  };

  const navigateToCustomerProfile = (customerId: string, setSelectedCustomerId: (id: string) => void) => {
    setSelectedCustomerId(customerId);
    setCurrentPage('profile');
  };

  const navigateToCustomerTaskProfile = (customerId: string, taskId: string, setSelectedCustomerId: (id: string) => void) => {
    setSelectedCustomerId(customerId);
    setHighlightedTaskId(taskId);
    setCurrentPage('profile');
  };

  const performSearch = (query: string) => {
    setSearchQuery(query);
    if (currentPage !== 'search') {
      setCurrentPage('search');
    }
  };

  return (
    <UIContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        previousPage,
        highlightedTaskId,
        setHighlightedTaskId,
        searchQuery,
        setSearchQuery,
        taskDateFilter,
        setTaskDateFilter,
        selectedCalendarDate,
        setSelectedCalendarDate,
        isAddCustomerOpen,
        setIsAddCustomerOpen,
        isAddTaskOpen,
        setIsAddTaskOpen,
        isEditTaskOpen,
        setIsEditTaskOpen,
        selectedTaskToEdit,
        setSelectedTaskToEdit,
        taskPage,
        setTaskPage,
        customerPage,
        setCustomerPage,
        ITEMS_PER_PAGE,
        showToast,
        showConfirm,
        navigateToCustomerProfile,
        navigateToCustomerTaskProfile,
        performSearch,
      }}
    >
      {children}
      <ToastNotification toasts={toasts} onDismiss={removeToast} />
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
        onConfirm={() => {
          confirmState.onConfirm();
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
