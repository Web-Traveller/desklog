import { invoke } from '@tauri-apps/api/core';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { Customer, Task, ActivityEvent, Service, Payment, Setting, BankingTransaction } from '../types';

export const isTauriEnv = (): boolean => {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
};

// --- CUSTOMERS ---
export async function fetchTauriCustomers(): Promise<Customer[] | null> {
  if (!isTauriEnv()) return null;
  try {
    return await invoke<Customer[]>('get_customers');
  } catch (err) {
    console.warn('Failed to fetch customers:', err);
    return null;
  }
}

export async function saveTauriCustomer(customer: Customer): Promise<Customer | null> {
  if (!isTauriEnv()) return customer;
  try {
    return await invoke<Customer>('add_customer', { customer });
  } catch (err) {
    console.warn('Failed to save customer:', err);
    return null;
  }
}

export async function updateTauriCustomer(id: string, name: string, mobile?: string, note?: string, aadhaar_number?: string): Promise<boolean> {
  if (!isTauriEnv()) return true;
  try {
    await invoke('edit_customer', { id, name, mobile, note, aadhaar_number });
    return true;
  } catch (err) {
    console.warn('Failed to update customer:', err);
    return false;
  }
}

export async function deleteTauriCustomer(id: string): Promise<boolean> {
  if (!isTauriEnv()) return true;
  try {
    await invoke('delete_customer', { id });
    return true;
  } catch (err) {
    console.warn('Failed to delete customer:', err);
    return false;
  }
}

// --- TASKS ---
export async function fetchTauriTasks(): Promise<Task[] | null> {
  if (!isTauriEnv()) return null;
  try {
    return await invoke<Task[]>('get_tasks');
  } catch (err) {
    console.warn('Failed to fetch tasks:', err);
    return null;
  }
}

export async function fetchTauriTask(id: string): Promise<Task | null> {
  if (!isTauriEnv()) return null;
  try {
    return await invoke<Task | null>('get_task', { id });
  } catch (err) {
    console.warn('Failed to fetch task:', err);
    return null;
  }
}

export async function saveTauriTask(task: Task): Promise<Task | null> {
  if (!isTauriEnv()) return task;
  try {
    return await invoke<Task>('add_task', { task });
  } catch (err) {
    console.warn('Failed to save task:', err);
    return null;
  }
}

export async function updateTauriTask(task: Task): Promise<boolean> {
  if (!isTauriEnv()) return true;
  try {
    await invoke('edit_task', { task });
    return true;
  } catch (err) {
    console.warn('Failed to edit task:', err);
    return false;
  }
}

export async function deleteTauriTask(id: string): Promise<boolean> {
  if (!isTauriEnv()) return true;
  try {
    await invoke('delete_task', { id });
    return true;
  } catch (err) {
    console.warn('Failed to delete task:', err);
    return false;
  }
}

// --- SERVICES ---
export async function fetchTauriServices(): Promise<Service[] | null> {
  if (!isTauriEnv()) return null;
  try {
    return await invoke<Service[]>('get_services');
  } catch (err) {
    console.warn('Failed to fetch services:', err);
    return null;
  }
}

export async function saveTauriService(service: Service): Promise<Service | null> {
  if (!isTauriEnv()) return service;
  try {
    return await invoke<Service>('add_service', { service });
  } catch (err) {
    console.warn('Failed to save service:', err);
    return null;
  }
}

export async function updateTauriService(service: Service): Promise<boolean> {
  if (!isTauriEnv()) return true;
  try {
    await invoke('edit_service', { service });
    return true;
  } catch (err) {
    console.warn('Failed to edit service:', err);
    return false;
  }
}

export async function deleteTauriService(id: string): Promise<boolean> {
  if (!isTauriEnv()) return true;
  try {
    await invoke('delete_service', { id });
    return true;
  } catch (err) {
    console.warn('Failed to delete service:', err);
    return false;
  }
}

// --- PAYMENTS ---
export async function fetchTauriPayments(): Promise<Payment[] | null> {
  if (!isTauriEnv()) return null;
  try {
    return await invoke<Payment[]>('get_payments');
  } catch (err) {
    console.warn('Failed to fetch payments:', err);
    return null;
  }
}

export async function saveTauriPayment(payment: Payment): Promise<Payment | null> {
  if (!isTauriEnv()) return payment;
  try {
    return await invoke<Payment>('add_payment', { payment });
  } catch (err) {
    console.warn('Failed to save payment:', err);
    return null;
  }
}

// --- ACTIVITIES ---
interface RawActivityEvent {
  id: string;
  activity_type: string;
  title: string;
  description: string;
  task_id?: string;
  customer_id?: string;
  created_at?: string;
}

export async function fetchTauriActivities(): Promise<ActivityEvent[] | null> {
  if (!isTauriEnv()) return null;
  try {
    const raw = await invoke<RawActivityEvent[]>('get_activities');
    return raw.map(a => {
      let timeStr = 'Just Now';
      let dateIsoStr = new Date().toISOString();
      try {
        if (a.created_at) {
          const d = new Date(a.created_at);
          if (!isNaN(d.getTime())) {
            timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            dateIsoStr = d.toISOString();
          }
        }
      } catch {
        // Fallback
      }

      return {
        id: a.id,
        time: timeStr,
        timePeriod: a.created_at || 'Recently',
        type: a.activity_type,
        title: a.title,
        customerName: a.customer_id || '',
        customerPhone: '',
        description: a.description,
        badgeText: a.activity_type ? a.activity_type.toUpperCase().replace(/_/g, ' ') : 'ACTIVITY',
        status: 'done',
        taskId: a.task_id,
        customerId: a.customer_id,
        date: dateIsoStr,
      };
    });
  } catch (err) {
    console.warn('Failed to fetch activities:', err);
    return null;
  }
}

export async function saveTauriActivity(activity: ActivityEvent): Promise<ActivityEvent | null> {
  if (!isTauriEnv()) return activity;
  try {
    const raw = {
      id: activity.id,
      activity_type: activity.type,
      title: activity.title,
      description: activity.description,
      task_id: activity.taskId || null,
      customer_id: activity.customerId || null,
      created_at: activity.date || new Date().toISOString(),
    };
    await invoke('add_activity', { activity: raw });
    return activity;
  } catch (err) {
    console.warn('Failed to save activity:', err);
    return null;
  }
}

// --- SETTINGS ---
export async function fetchTauriSettings(): Promise<Setting[] | null> {
  if (!isTauriEnv()) return null;
  try {
    return await invoke<Setting[]>('get_settings');
  } catch (err) {
    console.warn('Failed to fetch settings:', err);
    return null;
  }
}

export async function saveTauriSetting(key: string, value: string): Promise<boolean> {
  if (!isTauriEnv()) return true;
  try {
    await invoke('save_setting', { key, value });
    return true;
  } catch (err) {
    console.warn('Failed to save setting:', err);
    return false;
  }
}

// --- BACKUP & RESTORE ---
export async function createTauriBackup(): Promise<string | null> {
  if (!isTauriEnv()) return null;
  try {
    return await invoke<string>('create_backup');
  } catch (err) {
    console.warn('Failed to create database backup:', err);
    return null;
  }
}

export async function restoreTauriBackup(backupPath: string): Promise<boolean> {
  if (!isTauriEnv()) return false;
  try {
    await invoke('restore_backup', { backupPath });
    return true;
  } catch (err) {
    console.warn('Failed to restore database backup:', err);
    return false;
  }
}

// --- BANKING TRANSACTIONS ---
export async function fetchTauriBankingTransactions(): Promise<BankingTransaction[] | null> {
  if (!isTauriEnv()) return null;
  try {
    return await invoke<BankingTransaction[]>('get_banking_transactions');
  } catch (err) {
    console.warn('Failed to fetch banking transactions:', err);
    return null;
  }
}

export async function fetchTauriBankingTransactionsForCustomer(customerId: string): Promise<BankingTransaction[] | null> {
  if (!isTauriEnv()) return null;
  try {
    return await invoke<BankingTransaction[]>('get_banking_transactions_for_customer', { customerId });
  } catch (err) {
    console.warn('Failed to fetch banking transactions for customer:', err);
    return null;
  }
}

export async function saveTauriBankingTransaction(tx: BankingTransaction): Promise<BankingTransaction | null> {
  if (!isTauriEnv()) return tx;
  try {
    return await invoke<BankingTransaction>('add_banking_transaction', { tx });
  } catch (err) {
    console.warn('Failed to save banking transaction:', err);
    return null;
  }
}

export async function deleteTauriBankingTransaction(id: number): Promise<boolean> {
  if (!isTauriEnv()) return true;
  try {
    await invoke('delete_banking_transaction', { id });
    return true;
  } catch (err) {
    console.warn('Failed to delete banking transaction:', err);
    return false;
  }
}

// --- DESKTOP NOTIFICATIONS ---
export async function triggerDesktopNotification(title: string, body: string): Promise<void> {
  if (!isTauriEnv()) {
    console.log(`[Browser Notification]: ${title} - ${body}`);
    return;
  }

  try {
    let granted = await isPermissionGranted();
    if (!granted) {
      const permission = await requestPermission();
      granted = permission === 'granted';
    }
    if (granted) {
      sendNotification({ title, body });
    }
  } catch (err) {
    console.warn('Notification error:', err);
  }
}
