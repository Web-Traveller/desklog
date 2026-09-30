export type TaskStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'DELIVERED' | 'CANCELLED';

export interface Customer {
  id: string;
  name: string;
  mobile?: string;
  note?: string;
  created_at: string;
  updated_at: string;
  is_active?: boolean;
  is_verified?: boolean;
  avatar_initials?: string;
  avatar_color?: string;
}

export interface CustomerRelationship {
  id: string;
  customer_id: string;
  related_customer_id: string;
  relationship_type: string;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  default_price?: number; // In Rupees in frontend domain model
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  customer_id: string;
  service_id?: string;
  title: string;
  status: TaskStatus;
  scheduled_date?: string;
  scheduled_time?: string;
  target_date?: string;
  notes?: string;
  billing_amount?: number; // In Rupees in frontend domain model
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface Payment {
  id: string;
  task_id: string;
  amount: number; // In Rupees in frontend domain model
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  time: string;
  timePeriod: string;
  type: string; // 'customer_created' | 'customer_updated' | 'task_created' | 'task_edited' | 'task_scheduled' | 'task_rescheduled' | 'status_changed' | 'payment_added' | 'task_ready' | 'task_delivered' | 'task_cancelled'
  title: string;
  customerName: string;
  customerPhone: string;
  description: string;
  badgeText: string;
  status: string;
  taskId?: string;
  customerId?: string;
  date?: string;
}

export interface Setting {
  key: string;
  value: string;
}

export type ActivePage =
  | 'dashboard'
  | 'customers'
  | 'tasks'
  | 'calendar'
  | 'payments'
  | 'services'
  | 'settings'
  | 'search'
  | 'profile';

export const GENERAL_CUSTOMER: Customer = {
  id: 'cust-general',
  name: 'General / Walk-in Client',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_active: true,
  is_verified: false,
  note: 'Default profile for one-off walk-in customers and quick desk services.',
  avatar_initials: 'GW',
  avatar_color: 'bg-surface-container text-on-surface-variant',
};
