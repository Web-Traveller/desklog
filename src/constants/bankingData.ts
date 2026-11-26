/**
 * Master Banking & Kiosk Portal Data
 * Sourced directly from client's operational ledger (IRSHAD COMMUNICATION.xlsx)
 * Fully aligned with client's 7 core operational modes (NEPAL removed).
 * Supports dynamic auto-learning: any newly typed bank or portal is automatically
 * remembered in localStorage for future 1-keystroke suggestions.
 */

export type BankingModeId = 'DMT' | 'AEPS' | 'UPI' | 'UPI CASH' | 'BILL' | 'CREDIT' | 'CSC' | 'NEPAL' | 'SIM';

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
    providerPlaceholder: 'Select or type bank / card issuer (e.g. SBI Card, HDFC, OneCard)',
    providerHelper: 'Issuing bank or card provider',
    defaultProviders: [], // Uses full TOP_INDIAN_BANKS + Card Issuers
    suggestedPortals: ['PAYTM B', 'PHONEPE B', 'CRED', 'SAFEPAY'],
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
  NEPAL: {
    id: 'NEPAL',
    label: 'NEPAL',
    shortDesc: 'Nepal Remittance Transfer',
    icon: 'travel_explore',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    idFieldLabel: 'Receiver Citizenship / Account No.',
    idFieldPlaceholder: 'Enter receiver citizenship no or Nepal bank account',
    idFieldHelper: 'Citizenship or bank account of recipient in Nepal',
    idFieldType: 'text',
    providerLabel: 'Partner Bank / Rail in Nepal',
    providerPlaceholder: 'e.g. Prabhu Bank, Global IME, Kumari Bank',
    providerHelper: 'Destination bank or remittance agent in Nepal',
    defaultProviders: [
      'Prabhu Bank',
      'Global IME Bank',
      'Nepal Investment Mega Bank',
      'Everest Bank',
      'Nabil Bank',
      'Himalayan Bank',
    ],
    suggestedPortals: ['Prabhu Money Transfer', 'SAFEPAY', 'A2Zsuvidhaa'],
    remarkPlaceholder: 'e.g. Prabhu MT Pin or receiver district',
  },
  SIM: {
    id: 'SIM',
    label: 'SIM',
    shortDesc: 'SIM Card & Mobile Recharges',
    icon: 'sim_card',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    idFieldLabel: 'SIM / Mobile Number',
    idFieldPlaceholder: 'Enter 10-digit SIM mobile number',
    idFieldHelper: 'Mobile number activated or recharged',
    idFieldType: 'text',
    providerLabel: 'Telecom Operator',
    providerPlaceholder: 'Select operator (e.g. Airtel, Jio, VI)',
    providerHelper: 'Mobile network operator',
    defaultProviders: ['VODAPHONE', 'AIRTEL', 'JIO', 'BSNL'],
    suggestedPortals: ['VODAPHONE', 'Airtel Bank BC', 'MobiKwik', 'PAYTM B'],
    remarkPlaceholder: 'e.g. Plan code or FRC activation note',
  },
};

export const BANKING_MODE_KEYS: BankingModeId[] = ['DMT', 'AEPS', 'UPI', 'UPI CASH', 'BILL', 'CREDIT', 'CSC', 'NEPAL', 'SIM'];

/**
 * Universal Mode Config Resolver - Modular Architecture
 * Returns full configuration for standard modes or dynamically synthesized
 * configuration for any user-added custom payment method / service mode.
 */
export function getBankingModeConfig(mode?: string | null): BankingModeConfig {
  if (!mode) return BANKING_MODES.DMT;
  const key = mode.trim();
  if (BANKING_MODES[key as BankingModeId]) {
    return BANKING_MODES[key as BankingModeId];
  }
  // Safe dynamic fallback for user-created custom payment methods
  return {
    id: key as any,
    label: key,
    shortDesc: `${key} Service / Payment`,
    icon: 'payments',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    idFieldLabel: `${key} Account / Ref / Mobile`,
    idFieldPlaceholder: `Enter ${key} account, reference, or identifier`,
    idFieldHelper: `Reference or number for ${key}`,
    idFieldType: 'text',
    providerLabel: `${key} Partner / Bank / Operator`,
    providerPlaceholder: `Select or type bank or provider`,
    providerHelper: `Provider or service operator for ${key}`,
    defaultProviders: [],
    suggestedPortals: ['SAFEPAY', 'PAYBINGO', 'FINO BANK', 'BOB BC'],
    remarkPlaceholder: `e.g. ${key} reference or notes`,
  };
}

/**
 * Client Data Book Work Types for Citizen & Documentation Tasks (Work Manager)
 */
export const CLIENT_WORK_TYPES = [
  'Domicile Income Certificate',
  'Income Certificate',
  'Domicile Urgent',
  'PAN CARD',
  'NEW PAN',
  'CORRECTION PAN',
  'PAN FIND AND PAN CARD',
  'Fino Bank KYC',
  'PF KYC',
  'Food Linces',
  'ITR',
  'MOB UPDATE',
  'LITE BILL',
  'CARD PAYMENT',
  'DISH TV',
  'IRCTC TATKAL',
  'IRCTC NORMAL',
  'Police Verification',
  'Aadhar Card Update',
  'E-Shram Labour Card',
  'Ayushman Bharat Card',
];

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
  'Idbi Bank',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'IndusInd Bank',
  'Yes Bank',
  'IDFC First Bank',
  'Federal Bank',
  'Bandhan Bank',
  'RBL Bank',
  'South Indian Bank',
  'Karnataka Bank',
  'Karur Vysya Bank',
  'City Union Bank',
  'Dhanlaxmi Bank',
  'Tamilnad Mercantile Bank',
  'CSB Bank',
  'Jammu & Kashmir Bank',
  'DCB Bank',
  'India Post Payments Bank',
  'Fino Payments Bank',
  'Airtel Payments Bank',
  'Paytm Payments Bank',
  'Jio Payments Bank',
  'NSDL Payments Bank',
  'AU Small Finance Bank',
  'Ujjivan Small Finance Bank',
  'Equitas Small Finance Bank',
  'Jana Small Finance Bank',
  'ESAF Small Finance Bank',
  'Utkarsh Small Finance Bank',
  'Fincare Small Finance Bank',
  'North East Small Finance Bank',
  'Suryoday Small Finance Bank',
  'Capital Small Finance Bank',
  'VIDHARBHA KONKAN GRAMIN BANK',
  'Pragathi Krishna Gramin Bank',
  'Baroda Uttar Pradesh Gramin Bank',
  'Maharashtra Gramin Bank',
  'AMERICAN EXPRESS',
  'SBI Card',
  'OneCard',
];

export const COMMON_COMPANIES = [
  'SAFEPAY',
  'PAYBINGO',
  'BOB BC',
  'AXIS CSC',
  'FINO BANK',
  'Airtel Bank BC',
  'Airtel Bank BB',
  'A2Zsuvidhaa',
  'Digikhata',
  'PayBiz',
  'PaySwich',
  'PayPoint',
  'MobiKwik',
  'PHONEPE B',
  'GOOGLE B',
  'PAYTM B',
  'UT Current A',
  'CSC',
  'Soulpay',
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

/**
 * Bank Account Opening Master Definitions (sourced from Banking.xlsm)
 */
export const ACCOUNT_OPENING_SCHEMES = [
  'FINO',
  'BARODA',
  'KOTAK',
  'AXIS',
  'Airtel Bank',
  'PUNJAB',
  'State Bank of India',
  'Union Bank of India',
  'Bank of Maharashtra',
  'HDFC Bank',
  'ICICI Bank',
  'Canara Bank',
  'Indian Bank',
];

export const ACCOUNT_OPENING_VISIT_TYPES = [
  'Walk-in',
  'Branch',
  'Referral',
  'Google',
  'Camp',
  'KYC Other',
];

export const ACCOUNT_OPENING_KYC_STATUSES = [
  'Verified',
  'Pending',
  'Rejected',
];

export const INDIAN_STATES = [
  'Maharashtra',
  'Uttar Pradesh',
  'Madhya Pradesh',
  'Bihar',
  'Delhi',
  'Gujarat',
  'Karnataka',
  'Rajasthan',
  'West Bengal',
  'Andhra Pradesh',
  'Tamil Nadu',
  'Telangana',
  'Kerala',
  'Punjab',
  'Haryana',
  'Odisha',
  'Assam',
  'Jharkhand',
  'Chhattisgarh',
  'Uttarakhand',
  'Himachal Pradesh',
  'Goa',
  'Jammu and Kashmir',
  'Arunachal Pradesh',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Sikkim',
  'Tripura',
];
