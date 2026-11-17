/**
 * Master Banking & Kiosk Portal Data
 * Sourced directly from client's operational ledger (IRSHAD COMMUNICATION.xlsx)
 * Supports dynamic auto-learning: any newly typed bank or portal is automatically
 * remembered in localStorage for future 1-keystroke suggestions.
 */

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
  'Airtel Bank BC',
  'PAYBINGO',
  'Soulpay',
  'BOB BC',
  'A2Zsuvidhaa',
  'FINO BANK',
  'PHONEPE',
  'GOOGLE B',
  'PAYTM B',
  'Digikhata',
  'Prabhu Money Transfer',
  'PaySwitch',
  'PayBiz',
  'AXIS CSC',
  'CSC',
];

export const WORK_TYPES = [
  'DMT',
  'AEPS',
  'UPI',
  'BILL',
  'CREDIT',
  'SIM',
  'NEPAL',
  'Other',
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
