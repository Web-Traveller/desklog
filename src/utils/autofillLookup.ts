import { Customer, BankAccountOpening, BankingTransaction } from '../types';

export interface AutofillCustomerData {
  customer_name?: string;
  mobile_number?: string;
  aadhaar_number?: string;
  pan_number?: string;
  dob?: string;
  mailing_address?: string;
  area?: string;
  city?: string;
  state?: string;
  zip?: string;
  source: 'customer' | 'account_opening' | 'banking_transaction';
  record_date?: string;
}

/**
 * Strips formatting characters (spaces, hyphens, prefixes) to retrieve raw digits.
 */
export function cleanDigits(val?: string | null): string {
  if (!val) return '';
  return val.replace(/\D/g, '');
}

/**
 * Normalizes Indian mobile number to last 10 digits.
 */
export function normalizeMobile(val?: string | null): string {
  const digits = cleanDigits(val);
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

/**
 * Normalizes Aadhaar number to 12 digits.
 */
export function normalizeAadhaar(val?: string | null): string {
  return cleanDigits(val);
}

/**
 * Smart lookup for existing customer records across customers, account openings, and banking ledger.
 * STRICT RULE: Only matches when input has exactly 10 digits (mobile) or exactly 12 digits (Aadhaar).
 * Prevents premature partial matching (e.g. 9 digits of a phone matching a different customer).
 */
export function lookupCustomerDetails(
  query: string,
  sources: {
    customers?: Customer[];
    accountOpenings?: BankAccountOpening[];
    bankingTransactions?: BankingTransaction[];
  }
): AutofillCustomerData | null {
  if (!query) return null;

  const rawDigits = cleanDigits(query);
  const isExactMobile = rawDigits.length === 10;
  const isExactAadhaar = rawDigits.length === 12;

  // STRICT REQUIREMENT: If it's neither exactly 10 nor exactly 12 digits, do not attempt matching
  if (!isExactMobile && !isExactAadhaar) {
    return null;
  }

  const matches: Array<{ data: AutofillCustomerData; timestamp: number }> = [];

  const parseTime = (dateStr?: string): number => {
    if (!dateStr) return 0;
    const t = new Date(dateStr).getTime();
    return isNaN(t) ? 0 : t;
  };

  // 1. Search Bank Account Openings (richest customer profile: name, mobile, aadhaar, address, pan, dob)
  if (sources.accountOpenings && sources.accountOpenings.length > 0) {
    for (const item of sources.accountOpenings) {
      if (item.is_deleted) continue;

      const accMobile = normalizeMobile(item.mobile_number);
      const accAadhaar = normalizeAadhaar(item.aadhaar_number);

      const matched =
        (isExactMobile && accMobile === rawDigits) ||
        (isExactAadhaar && accAadhaar === rawDigits);

      if (matched && item.customer_name?.trim()) {
        const time = parseTime(item.updated_at || item.created_at || item.account_date);
        matches.push({
          timestamp: time,
          data: {
            customer_name: item.customer_name.trim(),
            mobile_number: item.mobile_number?.trim(),
            aadhaar_number: item.aadhaar_number?.trim(),
            pan_number: item.pan_number?.trim(),
            dob: item.dob?.trim(),
            mailing_address: item.mailing_address?.trim(),
            area: item.area?.trim(),
            city: item.city?.trim(),
            state: item.state?.trim(),
            zip: item.zip?.trim(),
            source: 'account_opening',
            record_date: item.account_date,
          },
        });
      }
    }
  }

  // 2. Search Customers Directory
  if (sources.customers && sources.customers.length > 0) {
    for (const cust of sources.customers) {
      if (cust.id === 'cust-general') continue; // Skip walk-in dummy

      const custMobile = normalizeMobile(cust.mobile);
      const custAadhaar = normalizeAadhaar(cust.aadhaar_number);

      const matched =
        (isExactMobile && custMobile === rawDigits) ||
        (isExactAadhaar && custAadhaar === rawDigits);

      if (matched && cust.name?.trim()) {
        const time = parseTime(cust.updated_at || cust.created_at);
        matches.push({
          timestamp: time,
          data: {
            customer_name: cust.name.trim(),
            mobile_number: cust.mobile?.trim(),
            aadhaar_number: cust.aadhaar_number?.trim(),
            source: 'customer',
            record_date: cust.created_at,
          },
        });
      }
    }
  }

  // 3. Search Banking Transactions Ledger (frequent walk-in records)
  if (sources.bankingTransactions && sources.bankingTransactions.length > 0) {
    for (const tx of sources.bankingTransactions) {
      if (tx.is_deleted) continue;

      const txMobile = normalizeMobile(tx.customer_mobile);
      const txAadhaarOrAcc = normalizeAadhaar(tx.account_or_aadhaar);

      const matched =
        (isExactMobile && txMobile === rawDigits) ||
        (isExactAadhaar && txAadhaarOrAcc === rawDigits);

      if (matched && tx.customer_name?.trim() && tx.customer_name !== 'General Walk-in') {
        const time = parseTime(tx.transaction_date);
        matches.push({
          timestamp: time,
          data: {
            customer_name: tx.customer_name.trim(),
            mobile_number: tx.customer_mobile?.trim(),
            aadhaar_number: isExactAadhaar ? tx.account_or_aadhaar?.trim() : undefined,
            source: 'banking_transaction',
            record_date: tx.transaction_date,
          },
        });
      }
    }
  }

  if (matches.length === 0) return null;

  // Sort by most recent occurrence first
  matches.sort((a, b) => b.timestamp - a.timestamp);

  // Take the most recent entry, but enrich any missing fields (like address or PAN) from older matching entries
  const primary = { ...matches[0].data };
  for (let i = 1; i < matches.length; i++) {
    const candidate = matches[i].data;
    if (!primary.pan_number && candidate.pan_number) primary.pan_number = candidate.pan_number;
    if (!primary.dob && candidate.dob) primary.dob = candidate.dob;
    if (!primary.mailing_address && candidate.mailing_address) primary.mailing_address = candidate.mailing_address;
    if (!primary.area && candidate.area) primary.area = candidate.area;
    if (!primary.city && candidate.city) primary.city = candidate.city;
    if (!primary.state && candidate.state) primary.state = candidate.state;
    if (!primary.zip && candidate.zip) primary.zip = candidate.zip;
    if (!primary.mobile_number && candidate.mobile_number) primary.mobile_number = candidate.mobile_number;
    if (!primary.aadhaar_number && candidate.aadhaar_number) primary.aadhaar_number = candidate.aadhaar_number;
  }

  return primary;
}
