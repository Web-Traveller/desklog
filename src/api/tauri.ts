import { invoke } from '@tauri-apps/api/core';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { Customer, CustomerRelationship, Task, ActivityEvent, Service, Payment, Setting } from '../types';

const isTauriEnv = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
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
  if (!isTauriEnv()) return null;
  try {
    return await invoke<Customer>('add_customer', { customer });
  } catch (err) {
    console.warn('Failed to save customer:', err);
    return null;
  }
}

export async function updateTauriCustomer(id: string, name: string, mobile?: string, note?: string): Promise<boolean> {
  if (!isTauriEnv()) return false;
  try {
    await invoke('edit_customer', { id, name, mobile, note });
    return true;
  } catch (err) {
    console.warn('Failed to update customer:', err);
    return false;
  }
}

export async function deleteTauriCustomer(id: string): Promise<boolean> {
  if (!isTauriEnv()) return false;
  try {
    await invoke('delete_customer', { id });
    return true;
  } catch (err) {
    console.warn('Failed to delete customer:', err);
    return false;
  }
}

// --- CUSTOMER RELATIONSHIPS ---
export async function fetchTauriRelationships(customerId: string): Promise<CustomerRelationship[] | null> {
  if (!isTauriEnv()) return null;
  try {
    return await invoke<CustomerRelationship[]>('get_customer_relationships', { customerId });
  } catch (err) {
    console.warn('Failed to fetch relationships:', err);
    return null;
  }
}

export async function saveTauriRelationship(relationship: CustomerRelationship): Promise<CustomerRelationship | null> {
  if (!isTauriEnv()) return null;
  try {
    return await invoke<CustomerRelationship>('add_customer_relationship', { relationship });
  } catch (err) {
    console.warn('Failed to save relationship:', err);
    return null;
  }
}

export async function deleteTauriRelationship(id: string): Promise<boolean> {
  if (!isTauriEnv()) return false;
  try {
    await invoke('delete_customer_relationship', { id });
    return true;
  } catch (err) {
    console.warn('Failed to delete relationship:', err);
    return false;
  }
}

// --- TASKS ---
export async function fetchTauriTasks(): Promise<Task[] | null> {
  if (!isTauriEnv()) return null;
  try {
    const tasks = await invoke<Task[]>('get_tasks');
    return tasks.map(t => ({
      ...t,
      // Convert DB cents -> rupees in JS domain model
      billing_amount: t.billing_amount !== undefined && t.billing_amount !== null ? t.billing_amount / 100 : undefined,
    }));
  } catch (err) {
    console.warn('Failed to fetch tasks:', err);
    return null;
  }
}

export async function fetchTauriTask(id: string): Promise<Task | null> {
  if (!isTauriEnv()) return null;
  try {
    const t = await invoke<Task | null>('get_task', { id });
    if (!t) return null;
    return {
      ...t,
      billing_amount: t.billing_amount !== undefined && t.billing_amount !== null ? t.billing_amount / 100 : undefined,
    };
  } catch (err) {
    console.warn('Failed to fetch task:', err);
    return null;
  }
}

export async function saveTauriTask(task: Task): Promise<Task | null> {
  if (!isTauriEnv()) return task;
  try {
    const rawBilling = task.billing_amount;
    const safeCents = rawBilling !== undefined && rawBilling !== null && !isNaN(Number(rawBilling))
      ? Math.round(Number(rawBilling) * 100)
      : undefined;

    const taskForDb = {
      ...task,
      billing_amount: safeCents,
    };
    const saved = await invoke<Task>('add_task', { task: taskForDb });
    return {
      ...saved,
      billing_amount: saved.billing_amount !== undefined && saved.billing_amount !== null ? Math.round(saved.billing_amount) / 100 : undefined,
    };
  } catch (err) {
    console.warn('Failed to save task:', err);
    return null;
  }
}

export async function updateTauriTask(task: Task): Promise<boolean> {
  if (!isTauriEnv()) return true;
  try {
    const rawBilling = task.billing_amount;
    const safeCents = rawBilling !== undefined && rawBilling !== null && !isNaN(Number(rawBilling))
      ? Math.round(Number(rawBilling) * 100)
      : undefined;

    const taskForDb = {
      ...task,
      billing_amount: safeCents,
    };
    await invoke('edit_task', { task: taskForDb });
    return true;
  } catch (err) {
    console.warn('Failed to edit task:', err);
    return false;
  }
}

export async function deleteTauriTask(id: string): Promise<boolean> {
  if (!isTauriEnv()) return false;
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
    const services = await invoke<Service[]>('get_services');
    return services.map(s => ({
      ...s,
      // Convert DB cents -> rupees in JS domain model
      default_price: s.default_price !== undefined && s.default_price !== null ? s.default_price / 100 : undefined,
    }));
  } catch (err) {
    console.warn('Failed to fetch services:', err);
    return null;
  }
}

export async function saveTauriService(service: Service): Promise<Service | null> {
  if (!isTauriEnv()) return service;
  try {
    const svcForDb = {
      ...service,
      // Convert rupees in JS -> cents in DB
      default_price: service.default_price !== undefined && service.default_price !== null ? Math.round(service.default_price * 100) : undefined,
    };
    const saved = await invoke<Service>('add_service', { service: svcForDb });
    return {
      ...saved,
      default_price: saved.default_price !== undefined && saved.default_price !== null ? saved.default_price / 100 : undefined,
    };
  } catch (err) {
    console.warn('Failed to save service:', err);
    return null;
  }
}

export async function updateTauriService(service: Service): Promise<boolean> {
  if (!isTauriEnv()) return true;
  try {
    const svcForDb = {
      ...service,
      // Convert rupees in JS -> cents in DB
      default_price: service.default_price !== undefined && service.default_price !== null ? Math.round(service.default_price * 100) : undefined,
    };
    await invoke('edit_service', { service: svcForDb });
    return true;
  } catch (err) {
    console.warn('Failed to edit service:', err);
    return false;
  }
}

export async function deleteTauriService(id: string): Promise<boolean> {
  if (!isTauriEnv()) return false;
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
    const payments = await invoke<Payment[]>('get_payments');
    return payments.map(p => ({
      ...p,
      // Convert DB cents -> rupees in JS domain model
      amount: p.amount / 100,
    }));
  } catch (err) {
    console.warn('Failed to fetch payments:', err);
    return null;
  }
}

export async function saveTauriPayment(payment: Payment): Promise<Payment | null> {
  if (!isTauriEnv()) return payment;
  try {
    const pForDb = {
      ...payment,
      // Convert rupees in JS -> cents in DB
      amount: Math.round(payment.amount * 100),
    };
    const saved = await invoke<Payment>('add_payment', { payment: pForDb });
    return {
      ...saved,
      amount: saved.amount / 100,
    };
  } catch (err) {
    console.warn('Failed to save payment:', err);
    return null;
  }
}

// --- ACTIVITIES ---
export async function fetchTauriActivities(): Promise<ActivityEvent[] | null> {
  if (!isTauriEnv()) return null;
  try {
    const raw = await invoke<any[]>('get_activities');
    return raw.map(a => ({
      id: a.id,
      time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timePeriod: new Date(a.created_at).toLocaleDateString(),
      type: a.activity_type,
      title: a.title,
      customerName: a.customer_id || '',
      customerPhone: '',
      description: a.description,
      badgeText: a.activity_type.toUpperCase().replace(/_/g, ' '),
      status: 'done',
      taskId: a.task_id,
      customerId: a.customer_id,
      date: new Date(a.created_at).toISOString(),
    }));
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
