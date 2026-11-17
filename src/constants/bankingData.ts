/**
 * Master Banking & Kiosk Portal Data
 * Sourced directly from client's operational ledger (IRSHAD COMMUNICATION.xlsx)
 * Fully aligned with client's 7 core operational modes (NEPAL removed).
 * Supports dynamic auto-learning: any newly typed bank or portal is automatically
 * remembered in localStorage for future 1-keystroke suggestions.
 */

export type BankingModeId = 'DMT' | 'AEPS' | 'UPI' | 'UPI CASH' | 'BILL' | 'CREDIT' | 'CSC';

export interface BankingModeConfig {
  id: BankingModeId;
  label: string;
  shortDesc: string;
  icon: string;
  badgeClass: string;
  // Mode-specific identifier (Account / Aadhaar / UPI ID / Card / Consumer / Application)
  idFieldLabel: string;
  idFieldPlaceholder: string;
  idFieldHelper: string;
  idFieldType?: 'text' | 'number';
  // Mode-specific destination/provider (Bank / Biller / Issuer / Service)
  providerLabel: string;
  providerPlaceholder: string;
  providerHelper: string;
  defaultProviders: string[];
  suggestedPortals: string[];
  remarkPlaceholder: string;
}

export const BANKING_MODES: Record<BankingModeId, BankingModeConfig> = {
  DMT: {
    id: 'DMT',
    label: 'DMT',
    shortDesc: 'Money Transfer (Bank A/c)',
    icon: 'send_money',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    idFieldLabel: 'Beneficiary Account Number',
    idFieldPlaceholder: 'Enter 9 to 18 digit bank account number',
    idFieldHelper: 'Bank account number of receiver',
    idFieldType: 'text',
    providerLabel: 'Beneficiary Bank Name',
    providerPlaceholder: 'Type bank (e.g. State Bank of India, Bank of Baroda)',
    providerHelper: 'Destination bank of receiver',
    defaultProviders: [], // Uses TOP_INDIAN_BANKS
    suggestedPortals: ['SAFEPAY', 'PAYBINGO', 'BOB BC', 'FINO BANK', 'Airtel Bank BC', 'A2Zsuvidhaa'],
    remarkPlaceholder: 'e.g. IMPS / NEFT ref or notes (optional)',
  },
  AEPS: {
    id: 'AEPS',
    label: 'AEPS',
    shortDesc: 'Aadhaar ATM (Cash / Balance)',
    icon: 'fingerprint',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    idFieldLabel: 'Customer Aadhaar Number',
    idFieldPlaceholder: 'Enter 12-digit Aadhaar number',
    idFieldHelper: 'Customer Aadhaar for biometric authentication',
    idFieldType: 'text',
    providerLabel: 'Customer Linked Bank',
    providerPlaceholder: 'Select bank where Aadhaar is linked',
    providerHelper: 'Bank linked with customer fingerprint',
    defaultProviders: [], // Uses TOP_INDIAN_BANKS
    suggestedPortals: ['PAYBINGO', 'BOB BC', 'Airtel Bank BC', 'FINO BANK', 'Spice Money'],
    remarkPlaceholder: 'e.g. Cash withdrawal or balance enquiry',
  },
  UPI: {
    id: 'UPI',
    label: 'UPI',
    shortDesc: 'UPI Transfer / Collection',
    icon: 'qr_code_2',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    idFieldLabel: 'UPI ID / VPA / Mobile',
    idFieldPlaceholder: 'e.g. 9876543210@ybl or UPI ID',
    idFieldHelper: 'Receiver VPA, mobile, or UPI handle',
    idFieldType: 'text',
    providerLabel: 'Bank or Payment App (Optional)',
    providerPlaceholder: 'e.g. PhonePe, Google Pay, SBI',
    providerHelper: 'Optional target bank or app',
    defaultProviders: ['PhonePe', 'Google Pay', 'Paytm', 'BHIM', 'Amazon Pay'],
    suggestedPortals: ['PHONEPE', 'GOOGLE B', 'SAFEPAY', 'PAYTM B'],
    remarkPlaceholder: 'e.g. UPI Ref / transaction details',
  },
  'UPI CASH': {
    id: 'UPI CASH',
    label: 'UPI CASH',
    shortDesc: 'QR Scan & Cash Handover',
    icon: 'payments',
    badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    idFieldLabel: 'UPI UTR / Reference No.',
    idFieldPlaceholder: 'Enter 12-digit UTR from scanned payment',
    idFieldHelper: 'Customer scanned shop QR and gave cash',
    idFieldType: 'text',
    providerLabel: 'Shop QR / Account Used',
    providerPlaceholder: 'e.g. Google Pay Business, PhonePe QR',
    providerHelper: 'QR code where money was received',
    defaultProviders: ['Google Pay Business', 'PhonePe QR', 'Paytm Business QR', 'BharatPe QR'],
    suggestedPortals: ['GOOGLE B', 'PHONEPE B', 'PAYTM B'],
    remarkPlaceholder: 'e.g. Split notes (2000+2000) or counter time',
  },
  BILL: {
    id: 'BILL',
    label: 'BILL',
    shortDesc: 'Electricity, EMI & Utility',
    icon: 'receipt_long',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    idFieldLabel: 'Consumer No / Policy / CA No',
    idFieldPlaceholder: 'e.g. 172055004612 or Loan A/c',
    idFieldHelper: 'Bill account number or consumer number',
    idFieldType: 'text',
    providerLabel: 'Biller / Board / Company',
    providerPlaceholder: 'Select biller (e.g. MSEDC, L&T Finance)',
    providerHelper: 'Electricity board, loan company, or utility',
    defaultProviders: [
      'MSEDC (Mahavitaran)',
      'L n T FINANCE LIMITED',
      'Tata Power',
      'Adani Electricity',
      'Bajaj Finance EMI',
      'Torrent Power',
      'MSEDCL LT',
      'MSEDCL Solar',
    ],
    suggestedPortals: ['PAYBINGO', 'CSC', 'SAFEPAY', 'Airtel Bank BB'],
    remarkPlaceholder: 'e.g. Bill cycle, meter number or receipt ID',
  },
  CREDIT: {
    id: 'CREDIT',
    label: 'CREDIT',
    shortDesc: 'Credit Card Bill / Swipe',
    icon: 'credit_card',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    idFieldLabel: 'Card Number (Last 4 Digits)',
    idFieldPlaceholder: 'e.g. 5434 or 2001',
    idFieldHelper: 'Last 4 or 5 digits of customer credit card',
    idFieldType: 'text',
    providerLabel: 'Card Issuer / Bank',
    providerPlaceholder: 'Select bank (e.g. HDFC Bank, ICICI Bank, Amex)',
    providerHelper: 'Issuing bank of the credit card',
    defaultProviders: [
      'HDFC Bank',
      'ICICI Bank',
      'SBI Card',
      'Axis Bank',
      'Kotak Mahindra Bank',
      'AMERICAN EXPRESS',
      'RBL Bank',
      'OneCard',
      'Yes Bank',
      'IndusInd Bank',
    ],
    suggestedPortals: ['PAYTM B', 'PHONEPE B', 'CRED'],
    remarkPlaceholder: 'e.g. Card payment confirmation number',
  },
  CSC: {
    id: 'CSC',
    label: 'CSC',
    shortDesc: 'Citizen & Govt Services',
    icon: 'domain',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    idFieldLabel: 'Application / Reference / Vehicle No',
    idFieldPlaceholder: 'e.g. Ack No, Vehicle No, Token No',
    idFieldHelper: 'Acknowledgement, token, or vehicle number',
    idFieldType: 'text',
    providerLabel: 'Service / Department Name',
    providerPlaceholder: 'Select service (e.g. Police Verification, PAN)',
    providerHelper: 'Government or CSC citizen service',
    defaultProviders: [
      'Police Verification',
      'New PAN Card (NSDL)',
      'Correction PAN Card',
      'Vehicle / RTO Services',
      'Fastag Toll Recharge',
      'E-Shram Labour Card',
      'Ayushman Bharat Card',
      'Caste / Income Certificate',
      'Smart Card Aadhar',
    ],
    suggestedPortals: ['CSC', 'UCL CSC', 'NSDL'],
    remarkPlaceholder: 'e.g. Application tracking ID or token note',
  },
};

export const BANKING_MODE_KEYS: BankingModeId[] = ['DMT', 'AEPS', 'UPI', 'UPI CASH', 'BILL', 'CREDIT', 'CSC'];

export const TOP_INDIAN_BANKS = [
  'State Bank of India',
  'Bank of Baroda',
  'Union Bank of India',
  'Bank of Maharashtra',
  'Punjab National Bank',
  'Canara Bank',
  'Central Bank of India',
  'Indian Bank',
  'Indian Overseas Bank',
  'UCO Bank',
  'Punjab & Sind Bank',
  'Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'IndusInd Bank',
  'YES Bank',
  'IDFC FIRST Bank',
  'Federal Bank',
  'India Post Payments Bank',
  'Fino Payments Bank',
  'Airtel Payments Bank',
  'Paytm Payments Bank',
  'Vidharbha Konkan Gramin Bank',
  'Baroda Uttar Pradesh Gramin Bank',
  'Pragathi Krishna Gramin Bank',
  'Maharashtra Gramin Bank',
];

export const COMMON_COMPANIES = [
  'SAFEPAY',
  'PAYBINGO',
  'BOB BC',
  'Airtel Bank BC',
  'FINO BANK',
  'PHONEPE',
  'GOOGLE B',
  'PAYTM B',
  'CSC',
  'A2Zsuvidhaa',
  'Soulpay',
  'Digikhata',
  'PaySwitch',
  'PayBiz',
  'AXIS CSC',
  'PayPoint',
  'MobiKwik',
];

export function getLearnedBanks(): string[] {
  try {
    const raw = localStorage.getItem('desklog_learned_banks');
    if (raw) {
      const extra: string[] = JSON.parse(raw);
      const combined = Array.from(new Set([...TOP_INDIAN_BANKS, ...extra]));
      return combined;
    }
  } catch {}
  return TOP_INDIAN_BANKS;
}

export function saveLearnedBank(bank: string): void {
  const clean = bank.trim();
  if (!clean || TOP_INDIAN_BANKS.includes(clean)) return;
  try {
    const raw = localStorage.getItem('desklog_learned_banks');
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(clean)) {
      list.push(clean);
      localStorage.setItem('desklog_learned_banks', JSON.stringify(list));
    }
  } catch {}
}

export function getLearnedCompanies(): string[] {
  try {
    const raw = localStorage.getItem('desklog_learned_companies');
    if (raw) {
      const extra: string[] = JSON.parse(raw);
      return Array.from(new Set([...COMMON_COMPANIES, ...extra]));
    }
  } catch {}
  return COMMON_COMPANIES;
}

export function saveLearnedCompany(company: string): void {
  const clean = company.trim();
  if (!clean || COMMON_COMPANIES.includes(clean)) return;
  try {
    const raw = localStorage.getItem('desklog_learned_companies');
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(clean)) {
      list.push(clean);
      localStorage.setItem('desklog_learned_companies', JSON.stringify(list));
    }
  } catch {}
}
