import { ActivityEvent } from '../types';

export function createActivityEvent(params: {
  type: string;
  title: string;
  description: string;
  taskId?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  badgeText?: string;
}): ActivityEvent {
  const now = new Date();
  return {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timePeriod: 'Just Now',
    type: params.type,
    title: params.title,
    customerName: params.customerName || '',
    customerPhone: params.customerPhone || '',
    description: params.description,
    badgeText: params.badgeText || params.type.toUpperCase().replace(/_/g, ' '),
    status: 'done',
    taskId: params.taskId,
    customerId: params.customerId,
    date: new Date().toISOString(),
  };
}
