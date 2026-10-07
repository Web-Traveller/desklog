import { Task, Payment } from '../types';
import { getFormattedToday, parseDateString, dateMatchesCalendarDate } from '../utils/dateUtils';

export function isTaskOverdue(task?: Task, todayDateStr?: string): boolean {
  if (!task || task.status === 'DELIVERED' || task.status === 'CANCELLED') {
    return false;
  }
  if (!task.target_date) return false;

  const today = todayDateStr ? new Date(todayDateStr) : new Date();
  if (isNaN(today.getTime())) {
    return false;
  }
  today.setHours(0, 0, 0, 0);

  const targetParsed = parseDateString(task.target_date);
  if (targetParsed) {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mIdx = monthNames.findIndex((m) => m.toLowerCase() === targetParsed.month.toLowerCase());

    if (mIdx !== -1) {
      const targetTime = new Date(targetParsed.year, mIdx, targetParsed.day);
      if (!isNaN(targetTime.getTime())) {
        targetTime.setHours(0, 0, 0, 0);
        return targetTime.getTime() < today.getTime();
      }
    }
  }

  const isoDate = new Date(task.target_date);
  if (!isNaN(isoDate.getTime())) {
    isoDate.setHours(0, 0, 0, 0);
    return isoDate.getTime() < today.getTime();
  }

  return false;
}

export function isTaskScheduledToday(task?: Task, todayStr?: string): boolean {
  if (!task || !task.scheduled_date || task.status === 'DELIVERED' || task.status === 'CANCELLED') {
    return false;
  }
  const currentToday = todayStr || getFormattedToday();
  return dateMatchesCalendarDate(task.scheduled_date, currentToday);
}

export function calculateDashboardMetrics(tasks?: Task[], payments?: Payment[]) {
  const safeTasks = Array.isArray(tasks) ? tasks.filter(Boolean) : [];
  const safePayments = Array.isArray(payments) ? payments.filter(Boolean) : [];

  const pendingCount = safeTasks.filter((t) => t.status === 'PENDING').length;
  const processingCount = safeTasks.filter((t) => t.status === 'PROCESSING').length;
  const readyCount = safeTasks.filter((t) => t.status === 'READY').length;
  const overdueTasks = safeTasks.filter((t) => isTaskOverdue(t));
  const todayScheduledTasks = safeTasks.filter((t) => isTaskScheduledToday(t));

  const todayStr = getFormattedToday();
  const todayPayments = safePayments.filter((p) => {
    return p.created_at && dateMatchesCalendarDate(p.created_at, todayStr);
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

