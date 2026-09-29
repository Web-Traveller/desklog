export type TaskStatus = 'pending' | 'processing' | 'done';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  registeredDate: string;
  isVerified?: boolean;
  notes?: string;
  avatarInitials?: string;
  avatarColor?: string;
}

export interface Task {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  title: string;
  status: TaskStatus;
  createdDate: string;
  updatedDate?: string;
  targetDate?: string;
  subStatus?: string;
  notes?: string;
  billingAmount?: number;
  amountPaid?: number;
  billingStatus?: 'paid' | 'unpaid' | 'pending' | 'partial';
  billingDate?: string;
  scheduleDate?: string;
}

export interface ActivityEvent {
  id: string;
  time: string;
  timePeriod: string;
  type: 'task_created' | 'task_completed' | 'customer_registered';
  title: string;
  customerName: string;
  customerPhone: string;
  description: string;
  badgeText: string;
  status: 'done' | 'processing' | 'pending' | 'new';
  taskId?: string;
  date?: string;
}

export type ActivePage = 'dashboard' | 'customers' | 'calendar' | 'profile' | 'search' | 'settings';

export const GENERAL_CUSTOMER: Customer = {
  id: 'cust-general',
  name: 'General / Walk-in Client',
  phone: 'N/A',
  registeredDate: 'System Default',
  isVerified: false,
  notes: 'Default profile for one-off walk-in customers and quick desk services.',
  avatarInitials: 'GW',
  avatarColor: 'bg-surface-container text-on-surface-variant',
};
