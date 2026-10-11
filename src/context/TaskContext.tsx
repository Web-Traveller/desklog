import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Sentry from '@sentry/react';
import {
  Task,
  TaskStatus,
  Service,
  Payment,
  ActivityEvent,
  Setting,
} from '../types';
import {
  fetchTauriTasks,
  saveTauriTask,
  updateTauriTask,
  deleteTauriTask,
  fetchTauriActivities,
  saveTauriActivity,
  triggerDesktopNotification,
  fetchTauriServices,
  saveTauriService,
  updateTauriService,
  deleteTauriService,
  fetchTauriPayments,
  saveTauriPayment,
  fetchTauriSettings,
  saveTauriSetting,
  createTauriBackup,
  restoreTauriBackup,
} from '../api/tauri';
import { createActivityEvent } from '../services/activityService';
import { isTaskOverdue } from '../services/taskService';
import { useUI } from './UIContext';
import { useCustomers } from './CustomerContext';
import { useBanking } from './BankingContext';
import { formatRupees } from '../utils/currencyUtils';

interface TaskContextType {
  tasks: Task[];
  services: Service[];
  payments: Payment[];
  activities: ActivityEvent[];
  settings: Setting[];

  addService: (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  editService: (service: Service) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id' | 'created_at'>) => Promise<void>;

  addTask: (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus, cancellationReason?: string) => Promise<void>;
  updateTask: (taskId: string, taskData: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  confirmDeleteTask: (task: Task) => void;

  saveAppSetting: (key: string, value: string) => Promise<void>;
  getSettingValue: (key: string, defaultValue?: string) => string;

  createDatabaseBackup: () => Promise<string | null>;
  restoreDatabaseBackup: (backupPath: string) => Promise<boolean>;
  reloadTaskData: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);

  const { showToast, showConfirm } = useUI();
  const { customers, reloadCustomers } = useCustomers();
  const { reloadBankingTransactions } = useBanking();

  const reloadTaskData = async () => {
    const [dbTasks, dbServices, dbPayments, dbActivities, dbSettings] = await Promise.all([
      fetchTauriTasks(),
      fetchTauriServices(),
      fetchTauriPayments(),
      fetchTauriActivities(),
      fetchTauriSettings(),
    ]);

    if (dbTasks) setTasks(dbTasks);
    if (dbServices) setServices(dbServices);
    if (dbPayments) setPayments(dbPayments);
    if (dbActivities) setActivities(dbActivities);
    if (dbSettings) setSettings(dbSettings);
  };

  useEffect(() => {
    reloadTaskData();
  }, []);

  // Notifications check for overdue tasks with deduplication
  const [notifiedTaskIds, setNotifiedTaskIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (tasks.length === 0) return;
    const checkInterval = setInterval(() => {
      tasks.forEach(t => {
        if (isTaskOverdue(t) && !notifiedTaskIds.has(t.id)) {
          const cust = customers.find(c => c.id === t.customer_id);
          triggerDesktopNotification(
            `Task Overdue: ${t.title}`,
            `Task for ${cust ? cust.name : 'Customer'} is overdue.`
          );
          setNotifiedTaskIds(prev => new Set(prev).add(t.id));
        }
      });
    }, 1000 * 60 * 5); // Check every 5 minutes
    return () => clearInterval(checkInterval);
  }, [tasks, customers, notifiedTaskIds]);

  const addService = async (serviceData: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newService: Service = {
      ...serviceData,
      id: `srv-${Date.now()}`,
      created_at: now,
      updated_at: now,
    };
    try {
      const saved = await saveTauriService(newService);
      setServices(prev => [...prev, saved]);
      showToast(`Service "${saved.name}" added.`, 'success');
    } catch (err) {
      console.error('Failed to add service:', err);
      showToast(`Failed to add service: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const editService = async (service: Service) => {
    try {
      await updateTauriService(service);
      setServices(prev => prev.map(s => (s.id === service.id ? service : s)));
      showToast(`Service details updated.`, 'success');
    } catch (err) {
      console.error('Failed to update service:', err);
      showToast(`Failed to update service: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const deleteService = async (id: string) => {
    try {
      await deleteTauriService(id);
      setServices(prev => prev.map(s => (s.id === id ? { ...s, is_active: false } : s)));
      showToast(`Service deactivated.`, 'info');
    } catch (err) {
      console.error('Failed to delete service:', err);
      showToast(`Failed to delete service: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const addPayment = async (paymentData: Omit<Payment, 'id' | 'created_at'>) => {
    const newPayment: Payment = {
      ...paymentData,
      id: `pay-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    try {
      const saved = await saveTauriPayment(newPayment);
      setPayments(prev => [...prev, saved]);
      showToast(`Payment recorded successfully.`, 'success');

      const targetTask = tasks.find(t => t.id === saved.task_id);
      const targetCustomer = targetTask ? customers.find(c => c.id === targetTask.customer_id) : undefined;

      const act = createActivityEvent({
        type: 'payment_added',
        title: `Payment received: ${formatRupees(saved.amount)}`,
        description: `Payment recorded for task ${targetTask?.title || 'Desk Work'}.`,
        taskId: saved.task_id,
        customerId: targetCustomer?.id,
        customerName: targetCustomer?.name,
        customerPhone: targetCustomer?.mobile,
      });
      await saveTauriActivity(act);
    } catch (err) {
      console.error('Failed to add payment:', err);
      showToast(`Failed to record payment: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      created_at: now,
      updated_at: now,
    };

    try {
      const saved = await saveTauriTask(newTask);
      setTasks(prev => [saved, ...prev]);
      showToast(`Task "${saved.title}" created.`, 'success');

      const cust = customers.find(c => c.id === saved.customer_id);
      const act = createActivityEvent({
        type: 'task_created',
        title: `New task created: ${saved.title}`,
        description: `Service request logged for ${cust ? cust.name : 'Client'}.`,
        taskId: saved.id,
        customerId: cust?.id,
        customerName: cust?.name,
        customerPhone: cust?.mobile,
      });
      await saveTauriActivity(act);
    } catch (err) {
      console.error('Failed to add task:', err);
      Sentry.captureException(err, { tags: { action: 'add_task' }, extra: { taskTitle: newTask.title, customerId: newTask.customer_id } });
      showToast(`Failed to create task: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const updateTaskStatus = async (
    taskId: string,
    newStatus: TaskStatus,
    cancellationReason?: string
  ) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;

    const completed_at = newStatus === 'DELIVERED' ? new Date().toISOString() : target.completed_at;
    const updatedTask: Task = {
      ...target,
      status: newStatus,
      completed_at,
      cancellation_reason: cancellationReason || target.cancellation_reason,
      updated_at: new Date().toISOString(),
    };

    try {
      await updateTauriTask(updatedTask);
      setTasks(prev => prev.map(t => (t.id === taskId ? updatedTask : t)));
      showToast(`Task status updated to ${newStatus}.`, 'info');

      const cust = customers.find(c => c.id === target.customer_id);
      let actType = 'status_changed';
      if (newStatus === 'READY') actType = 'task_ready';
      if (newStatus === 'DELIVERED') actType = 'task_delivered';
      if (newStatus === 'CANCELLED') actType = 'task_cancelled';

      const act = createActivityEvent({
        type: actType,
        title: `Task ${newStatus.toLowerCase()}: ${target.title}`,
        description: `Status set to ${newStatus}${cancellationReason ? ` (${cancellationReason})` : ''}.`,
        taskId,
        customerId: cust?.id,
        customerName: cust?.name,
        customerPhone: cust?.mobile,
      });
      await saveTauriActivity(act);
    } catch (err) {
      console.error('Failed to update task status:', err);
      showToast(`Failed to update status: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const updateTask = async (taskId: string, taskData: Partial<Task>) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;

    const updatedTask: Task = {
      ...target,
      ...taskData,
      updated_at: new Date().toISOString(),
    };

    try {
      await updateTauriTask(updatedTask);
      setTasks(prev => prev.map(t => (t.id === taskId ? updatedTask : t)));
      showToast(`Task updated successfully.`, 'success');

      const cust = customers.find(c => c.id === target.customer_id);
      const act = createActivityEvent({
        type: 'task_edited',
        title: `Task edited: ${updatedTask.title}`,
        description: `Task details updated.`,
        taskId,
        customerId: cust?.id,
        customerName: cust?.name,
        customerPhone: cust?.mobile,
      });
      await saveTauriActivity(act);
    } catch (err) {
      console.error('Failed to update task:', err);
      showToast(`Failed to update task: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const deleteTask = async (taskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    try {
      await deleteTauriTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      showToast(`Task deleted.`, 'info');

      if (target) {
        const cust = customers.find(c => c.id === target.customer_id);
        const act = createActivityEvent({
          type: 'task_cancelled',
          title: `Task deleted: ${target.title}`,
          description: `Task removed from records.`,
          taskId,
          customerId: cust?.id,
          customerName: cust?.name,
          customerPhone: cust?.mobile,
        });
        await saveTauriActivity(act);
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
      showToast(`Failed to delete task: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const confirmDeleteTask = (task: Task) => {
    showConfirm({
      title: 'Delete Task',
      message: `Are you sure you want to delete task "${task.title}"? This operation cannot be undone.`,
      confirmText: 'Delete Task',
      variant: 'danger',
      onConfirm: () => deleteTask(task.id),
    });
  };

  const saveAppSetting = async (key: string, value: string) => {
    const success = await saveTauriSetting(key, value);
    if (success) {
      setSettings(prev => {
        const exists = prev.find(s => s.key === key);
        if (exists) {
          return prev.map(s => (s.key === key ? { key, value } : s));
        }
        return [...prev, { key, value }];
      });
      showToast(`Settings updated.`, 'success');
    }
  };

  const getSettingValue = (key: string, defaultValue: string = ''): string => {
    const found = settings.find(s => s.key === key);
    return found ? found.value : defaultValue;
  };

  const createDatabaseBackup = async (): Promise<string | null> => {
    const path = await createTauriBackup();
    if (path) {
      showToast(`Database backup saved successfully.`, 'success');
      return path;
    }
    showToast(`Failed to create backup.`, 'error');
    return null;
  };

  const restoreDatabaseBackup = async (backupPath: string): Promise<boolean> => {
    const success = await restoreTauriBackup(backupPath);
    if (success) {
      showToast(`Database restored successfully. Reloading data...`, 'success');
      await reloadCustomers();
      await reloadTaskData();
      if (reloadBankingTransactions) await reloadBankingTransactions();
      return true;
    }
    showToast(`Failed to restore database from backup.`, 'error');
    return false;
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        services,
        payments,
        activities,
        settings,
        addService,
        editService,
        deleteService,
        addPayment,
        addTask,
        updateTaskStatus,
        updateTask,
        deleteTask,
        confirmDeleteTask,
        saveAppSetting,
        getSettingValue,
        createDatabaseBackup,
        restoreDatabaseBackup,
        reloadTaskData,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    console.warn('useTasks called outside TaskProvider');
    return {
      tasks: [],
      services: [],
      payments: [],
      activities: [],
      settings: [],
      addService: async () => {},
      editService: async () => {},
      deleteService: async () => {},
      addPayment: async () => {},
      addTask: async () => {},
      updateTaskStatus: async () => {},
      updateTask: async () => {},
      deleteTask: async () => {},
      confirmDeleteTask: () => {},
      saveAppSetting: async () => {},
      getSettingValue: () => '',
      createDatabaseBackup: async () => null,
      restoreDatabaseBackup: async () => false,
      reloadTaskData: async () => {},
    };
  }
  return context;
};
