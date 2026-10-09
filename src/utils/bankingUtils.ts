/**
 * Shared utility for formatting banking transaction reference / detail strings.
 * Extracted from BankingPage and ProfilePage to eliminate code duplication.
 */

import { BankingTransaction, parseBankingMetadata } from '../types';

export function formatRefDetails(tx: BankingTransaction): string {
  const meta = parseBankingMetadata(tx.metadata);
  if (Object.keys(meta).length === 0) return tx.transaction_ref_no || '-';

  if (tx.transaction_type === 'Transfer') {
    if (tx.payment_mode === 'Bank Transfer') {
      return `A/C: ${meta.beneficiary_account || ''} | IFSC: ${meta.beneficiary_ifsc || ''} | Ref: ${tx.transaction_ref_no || ''}`;
    }
    if (tx.payment_mode === 'UPI') {
      return `UPI: ${meta.beneficiary_upi || ''} | Ref: ${tx.transaction_ref_no || ''}`;
    }
  }

  if (tx.transaction_type === 'Withdrawal') {
    if (tx.payment_mode.startsWith('AePS')) {
      return `Aadhaar: ${meta.customer_aadhaar_number || meta.customer_id_number || ''} | Bank: ${meta.customer_bank || ''} | Ref: ${tx.transaction_ref_no || ''}`;
    }
  }

  // Generic fallback — show whatever metadata fields are available
  const parts: string[] = [];
  if (meta.target_account) parts.push(`A/C: ${meta.target_account}`);
  if (meta.target_upi) parts.push(`UPI: ${meta.target_upi}`);
  if (tx.transaction_ref_no) parts.push(`Ref: ${tx.transaction_ref_no}`);

  return parts.join(' | ') || '-';
}
