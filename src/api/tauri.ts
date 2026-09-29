import { invoke } from '@tauri-apps/api/core';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { Customer, Task, ActivityEvent } from '../types';

const isTauriEnv = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export async function fetchTauriCustomers(): Promise<Customer[] | null> {
  if (!isTauriEnv()) return null;
  try {
    return await invoke<Customer[]>('get_customers');
  } catch (err) {
    console.warn('Failed to fetch customers from Tauri Rust DB:', err);
    return null;
  }
}

export async function fetchTauriCustomersPaginated(limit: number, offset: number): Promise<Customer[] | null> {
  if (!isTauriEnv()) return null;
  try {
    return await invoke<Customer[]>('get_customers_paginated', { limit, offset });
  } catch (err) {
    console.warn('Failed to fetch customers paginated from Tauri Rust DB:', err);
    return null;
  }
}

export async function saveTauriCustomer(customer: Customer): Promise<Customer | null> {
  if (!isTauriEnv()) return null;
  try {
    return await invoke<Customer>('add_customer', { customer });
  } catch (err) {
    console.warn('Failed to save customer to Tauri Rust DB:', err);
    return null;
  }
}

export async function updateTauriCustomer(id: string, name: string, phone: string, notes?: string): Promise<boolean> {
  if (!isTauriEnv()) return false;
  try {
    await invoke('edit_customer', { id, name, phone, notes });
    return true;
  } catch (err) {
    console.warn('Failed to update customer in Tauri Rust DB:', err);
    return false;
  }
}

export async function deleteTauriCustomer(id: string): Promise<boolean> {
  if (!isTauriEnv()) return true;
  try {
    await invoke('delete_customer', { id });
    return true;
  } catch (err) {
    console.warn('Failed to delete customer in Tauri Rust DB:', err);
    return false;
  }
}

export async function fetchTauriTasks(): Promise<Task[] | null> {
  if (!isTauriEnv()) return null;
  try {
    const tasks = await invoke<Task[]>('get_tasks');
    return tasks.map(t => ({
      ...t,
      billingAmount: t.billingAmount !== undefined && t.billingAmount !== null ? t.billingAmount / 100 : undefined,
      amountPaid: t.amountPaid !== undefined && t.amountPaid !== null ? t.amountPaid / 100 : undefined,
    }));
  } catch (err) {
    console.warn('Failed to fetch tasks from Tauri Rust DB:', err);
    return null;
  }
}

export async function fetchTauriTasksPaginated(limit: number, offset: number): Promise<Task[] | null> {
  if (!isTauriEnv()) return null;
  try {
    const tasks = await invoke<Task[]>('get_tasks_paginated', { limit, offset });
    return tasks.map(t => ({
      ...t,
      billingAmount: t.billingAmount !== undefined && t.billingAmount !== null ? t.billingAmount / 100 : undefined,
      amountPaid: t.amountPaid !== undefined && t.amountPaid !== null ? t.amountPaid / 100 : undefined,
    }));
  } catch (err) {
    console.warn('Failed to fetch tasks paginated from Tauri Rust DB:', err);
    return null;
  }
}

export async function saveTauriTask(task: Task): Promise<Task | null> {
  if (!isTauriEnv()) return task;
  try {
    const taskForDb = {
      ...task,
      billingAmount: task.billingAmount !== undefined && task.billingAmount !== null ? Math.round(task.billingAmount * 100) : undefined,
      amountPaid: task.amountPaid !== undefined && task.amountPaid !== null ? Math.round(task.amountPaid * 100) : undefined,
    };
    const saved = await invoke<Task>('add_task', { task: taskForDb });
    return {
      ...saved,
      billingAmount: saved.billingAmount !== undefined && saved.billingAmount !== null ? saved.billingAmount / 100 : undefined,
      amountPaid: saved.amountPaid !== undefined && saved.amountPaid !== null ? saved.amountPaid / 100 : undefined,
    };
  } catch (err) {
    console.warn('Failed to save task to Tauri Rust DB:', err);
    return null;
  }
}

export async function updateTauriTaskStatus(id: string, status: string, updatedDate: string, subStatus?: string): Promise<boolean> {
  if (!isTauriEnv()) return false;
  try {
    await invoke('update_task_status', {
      id,
      status,
      updatedDate,
      subStatus,
    });
    return true;
  } catch (err) {
    console.warn('Failed to update task status in Tauri Rust DB:', err);
    return false;
  }
}

export async function updateTauriTask(task: Task): Promise<boolean> {
  if (!isTauriEnv()) return true;
  try {
    const taskForDb = {
      ...task,
      billingAmount: task.billingAmount !== undefined && task.billingAmount !== null ? Math.round(task.billingAmount * 100) : undefined,
      amountPaid: task.amountPaid !== undefined && task.amountPaid !== null ? Math.round(task.amountPaid * 100) : undefined,
    };
    await invoke('edit_task', { task: taskForDb });
    return true;
  } catch (err) {
    console.warn('Failed to edit task in Tauri Rust DB:', err);
    return false;
  }
}

export async function deleteTauriTask(id: string): Promise<boolean> {
  if (!isTauriEnv()) return true;
  try {
    await invoke('delete_task', { id });
    return true;
  } catch (err) {
    console.warn('Failed to delete task in Tauri Rust DB:', err);
    return false;
  }
}

export async function fetchTauriActivities(): Promise<ActivityEvent[] | null> {
  if (!isTauriEnv()) return null;
  try {
    return await invoke<ActivityEvent[]>('get_activities');
  } catch (err) {
    console.warn('Failed to fetch activities from Tauri Rust DB:', err);
    return null;
  }
}

export async function saveTauriActivity(activity: ActivityEvent): Promise<ActivityEvent | null> {
  if (!isTauriEnv()) return activity;
  try {
    return await invoke<ActivityEvent>('add_activity', { activity });
  } catch (err) {
    console.warn('Failed to save activity in Tauri Rust DB:', err);
    return null;
  }
}

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
