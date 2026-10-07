import React from 'react';
import { Customer, Task, Service, Payment, Setting, BankingTransaction, ActivityEvent, ActivePage, TaskStatus } from '../types';
import { UIProvider, useUI, ConfirmOptions } from './UIContext';
import { CustomerProvider, useCustomers } from './CustomerContext';
import { TaskProvider, useTasks } from './TaskContext';
import { BankingProvider, useBanking } from './BankingContext';

export type { ConfirmOptions };

export interface DeskContextType {
  currentPage: ActivePage;
  setCurrentPage: (page: ActivePage) => void;
  previousPage: ActivePage;
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  highlightedTaskId: string | null;
  setHighlightedTaskId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  taskDateFilter: string;
  setTaskDateFilter: (filter: string) => void;
  selectedCalendarDate: string;
  setSelectedCalendarDate: (date: string) => void;

  customers: Customer[];
  tasks: Task[];
  bankingTransactions: BankingTransaction[];
  activities: ActivityEvent[];
  services: Service[];
  payments: Payment[];
  settings: Setting[];

  addService: (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  editService: (service: Service) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id' | 'created_at'>) => Promise<void>;

  addCustomer: (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => Promise<Customer>;
  editCustomer: (id: string, customerData: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  addBankingTransaction: (tx: Omit<BankingTransaction, 'id' | 'is_deleted'>) => Promise<void>;
  deleteBankingTransaction: (id: number) => Promise<void>;

  addTask: (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus, cancellationReason?: string) => Promise<void>;
  updateTask: (taskId: string, taskData: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  saveAppSetting: (key: string, value: string) => Promise<void>;
  getSettingValue: (key: string, defaultValue?: string) => string;

  createDatabaseBackup: () => Promise<string | null>;
  restoreDatabaseBackup: (backupPath: string) => Promise<boolean>;

  confirmDeleteTask: (task: Task) => void;
  confirmDeleteCustomer: (customer: Customer) => void;
  showConfirm: (options: ConfirmOptions) => void;
  showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;

  isAddCustomerOpen: boolean;
  setIsAddCustomerOpen: (open: boolean) => void;
  isAddTaskOpen: boolean;
  setIsAddTaskOpen: (open: boolean) => void;
  isEditTaskOpen: boolean;
  setIsEditTaskOpen: (open: boolean) => void;
  selectedTaskToEdit: Task | null;
  setSelectedTaskToEdit: (task: Task | null) => void;

  navigateToCustomerProfile: (customerId: string) => void;
  navigateToCustomerTaskProfile: (customerId: string, taskId: string) => void;
  performSearch: (query: string) => void;

  taskPage: number;
  setTaskPage: (page: number | ((prev: number) => number)) => void;
  customerPage: number;
  setCustomerPage: (page: number | ((prev: number) => number)) => void;
  ITEMS_PER_PAGE: number;
}

export const DeskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UIProvider>
      <CustomerProvider>
        <BankingProvider>
          <TaskProvider>
            {children}
          </TaskProvider>
        </BankingProvider>
      </CustomerProvider>
    </UIProvider>
  );
};

export function useDesk(): DeskContextType {
  const ui = useUI();
  const cust = useCustomers();
  const task = useTasks();
  const bank = useBanking();

  return {
    ...ui,
    ...cust,
    ...task,
    ...bank,
    navigateToCustomerProfile: (customerId: string) =>
      ui.navigateToCustomerProfile(customerId, cust.setSelectedCustomerId),
    navigateToCustomerTaskProfile: (customerId: string, taskId: string) =>
      ui.navigateToCustomerTaskProfile(customerId, taskId, cust.setSelectedCustomerId),
  };
}

export { useUI, useCustomers, useTasks, useBanking };
