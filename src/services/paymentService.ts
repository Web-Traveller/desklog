import { Payment } from '../types';

export function calculatePaidTotal(payments: Payment[]): number {
  return payments.reduce((acc, p) => acc + (p.amount || 0), 0);
}

export function calculateDueAmount(billingAmount: number | undefined, payments: Payment[]): number {
  const billing = billingAmount || 0;
  const paid = calculatePaidTotal(payments);
  return Math.max(0, billing - paid);
}

export function calculatePaymentStatus(
  billingAmount: number | undefined,
  payments: Payment[]
): 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' {
  const billing = billingAmount || 0;
  const paid = calculatePaidTotal(payments);

  if (paid <= 0 || billing <= 0) {
    return 'UNPAID';
  }
  if (paid >= billing) {
    return 'PAID';
  }
  return 'PARTIALLY_PAID';
}

export function validatePaymentAmount(
  amount: number
): { valid: boolean; error?: string } {
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: 'Payment amount must be a positive number.' };
  }
  return { valid: true };
}
