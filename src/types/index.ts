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
  aadhaar_number?: string;
}


export interface Service {
  id: string;
  name: string;
  /** Stored in integer paise, 1 INR = 100 Paise */
  default_price?: number;
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
  /** Stored in integer paise, 1 INR = 100 Paise */
  billing_amount?: number;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  tracker_id?: string;
  document_number?: string;
  work_type?: string;
}

export interface Payment {
  id: string;
  task_id: string;
  /** Stored in integer paise, 1 INR = 100 Paise */
  amount: number;
  created_at: string;
}

export type ActivityEventType =
  | 'customer_created'
  | 'customer_updated'
  | 'customer_deleted'
  | 'task_created'
  | 'task_edited'
  | 'task_scheduled'
  | 'task_rescheduled'
  | 'status_changed'
  | 'payment_added'
  | 'payment_updated'
  | 'payment_deleted'
  | 'task_ready'
  | 'task_delivered'
  | 'task_cancelled'
  | 'banking_transaction_added'
  | 'banking_transaction_updated'
  | 'banking_transaction_deleted';

export interface ActivityEvent {
  id: string;
  time: string;
  timePeriod: string;
  type: ActivityEventType | string; // union + string fallback for DB-sourced raw values
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

export interface BankTransferMeta {
  from_account?: string;
  beneficiary_bank?: string;
  beneficiary_account?: string;
  beneficiary_ifsc?: string;
  transaction_ref_no?: string;
}

export interface UpiTransferMeta {
  sender_info?: string;
  beneficiary_upi?: string;
  upi_transaction_id?: string;
}

export interface AePSWithdrawalMeta {
  customer_aadhaar_number?: string;
  customer_id_number?: string;
  customer_bank?: string;
  terminal_rrn?: string;
}

export interface DebitCardMiniAtmMeta {
  card_type?: string;
  approval_code?: string;
}

export interface UpiCashoutMeta {
  customer_upi?: string;
  transaction_ref_no?: string;
}

export interface CashToBankMeta {
  target_bank?: string;
  target_account?: string;
  target_ifsc?: string;
  depositor_info?: string;
  transaction_ref_no?: string;
}

export interface CashToUpiMeta {
  target_upi?: string;
  transaction_ref_no?: string;
}

export type BankingMetadata =
  | BankTransferMeta
  | UpiTransferMeta
  | AePSWithdrawalMeta
  | DebitCardMiniAtmMeta
  | UpiCashoutMeta
  | CashToBankMeta
  | CashToUpiMeta
  | Record<string, string>;

export function parseBankingMetadata(metadataStr?: string): Record<string, string> {
  if (!metadataStr) return {};
  try {
    const parsed = JSON.parse(metadataStr);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export interface BankingTransaction {
  id?: number;
  customer_id: string;
  transaction_type: 'Transfer' | 'Withdrawal' | 'Deposit' | 'DMT' | 'AEPS' | 'UPI' | 'BILL' | 'CREDIT' | 'SIM' | 'NEPAL' | 'CSC' | string;
  payment_mode: 'AePS' | 'UPI' | 'Bank Transfer' | 'Card' | 'Cash' | 'Cash to Bank Account' | 'Cash to UPI' | 'Debit Card / Mini ATM' | 'UPI Cash-out' | string;
  /** Stored in integer paise, 1 INR = 100 Paise */
  amount: number;
  transaction_ref_no?: string;
  metadata?: string; // Serialized BankingMetadata JSON string
  transaction_date: string;
  is_deleted: boolean;
  company_name?: string;
  customer_name?: string;
  customer_mobile?: string;
  account_or_aadhaar?: string;
  bank_name?: string;
  /** Stored in integer paise, 1 INR = 100 Paise */
  charges?: number;
  /** Stored in integer paise, 1 INR = 100 Paise */
  company_charge?: number;
  /** Stored in integer paise, 1 INR = 100 Paise */
  refund?: number;
  /** Stored in integer paise, 1 INR = 100 Paise */
  commission?: number;
  /** Transaction processing status.
   * Note: 'FAILD' is intentional — matches raw client data export from Excel ledger.
   * Display layer maps this to 'Failed' for the UI.
   */
  status?: 'SUCCESS' | 'FAILD' | 'IN PROGRESS' | string;
  remark?: string;
}

export interface BankAccountOpening {
  id?: number;
  customer_id?: string;
  visit_type?: string; // 'Walk-in', 'Branch', 'Referral', 'Google', 'Camp', 'KYC Other'
  account_date: string; // Opening date YYYY-MM-DD or ISO
  passbook_number?: string;
  bank_customer_id?: string; // Bank CIF / Customer ID
  account_number: string; // Bank Account Number
  customer_name: string;
  dob?: string;
  aadhaar_number?: string;
  pan_number?: string;
  scheme: string; // Bank / Scheme name: 'FINO', 'BARODA', 'KOTAK', 'AXIS', 'Airtel Bank', etc.
  mobile_number?: string;
  mailing_address?: string;
  area?: string;
  city?: string;
  state?: string;
  zip?: string;
  /** Stored in integer paise, 1 INR = 100 Paise */
  initial_deposit?: number;
  kyc_status?: 'Verified' | 'Pending' | 'Rejected' | string;
  notes?: string;
  document_status?: string;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
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
  | 'banking'
  | 'profile';

export const GENERAL_CUSTOMER: Customer = {
  id: 'cust-general',
  name: 'General / Walk-in Client',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  is_active: true,
  is_verified: false,
  note: 'Default profile for one-off walk-in customers and quick desk services.',
  avatar_initials: 'GW',
  avatar_color: 'bg-surface-container text-on-surface-variant',
};
