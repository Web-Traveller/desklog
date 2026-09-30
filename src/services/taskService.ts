import { Task, Payment } from '../types';
import { getFormattedToday, parseDateString } from '../utils/dateUtils';

export function isTaskOverdue(task: Task, todayDateStr?: string): boolean {
  if (task.status === 'DELIVERED' || task.status === 'CANCELLED') {
    return false;
  }
  if (!task.target_date) return false;

  const today = todayDateStr ? new Date(todayDateStr) : new Date();
  today.setHours(0, 0, 0, 0);

  const targetParsed = parseDateString(task.target_date);
  if (!targetParsed) return false;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mIdx = monthNames.findIndex((m) => m.toLowerCase() === targetParsed.month.toLowerCase());

  if (mIdx !== -1) {
    const targetTime = new Date(targetParsed.year, mIdx, targetParsed.day);
    targetTime.setHours(0, 0, 0, 0);
    return targetTime.getTime() < today.getTime();
  }

  const isoDate = new Date(task.target_date);
  if (!isNaN(isoDate.getTime())) {
    isoDate.setHours(0, 0, 0, 0);
    return isoDate.getTime() < today.getTime();
  }

  return false;
}

export function isTaskScheduledToday(task: Task, todayStr?: string): boolean {
  if (!task.scheduled_date || task.status === 'DELIVERED' || task.status === 'CANCELLED') {
    return false;
  }
  const currentToday = todayStr || getFormattedToday();
  return task.scheduled_date.includes(currentToday) || task.scheduled_date.startsWith(getFormattedToday());
}

export function calculateDashboardMetrics(tasks: Task[], payments: Payment[]) {
  const pendingCount = tasks.filter((t) => t.status === 'PENDING').length;
  const processingCount = tasks.filter((t) => t.status === 'PROCESSING').length;
  const readyCount = tasks.filter((t) => t.status === 'READY').length;
  const overdueTasks = tasks.filter((t) => isTaskOverdue(t));
  const todayScheduledTasks = tasks.filter((t) => isTaskScheduledToday(t));

  const todayStr = getFormattedToday();
  const todayPayments = payments.filter((p) => {
    return p.created_at.includes(todayStr) || p.created_at.startsWith(todayStr);
  });
  const todayCollection = todayPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

  return {
    pendingCount,
    processingCount,
    readyCount,
    overdueCount: overdueTasks.length,
    overdueTasks,
    todayScheduledTasks,
    todayCollection,
  };
}
