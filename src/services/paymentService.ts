import { Payment } from '../types';

export function calculatePaidTotal(payments?: Payment[]): number {
  if (!Array.isArray(payments)) return 0;
  return payments.reduce((acc, p) => {
    const amt = typeof p?.amount === 'number' ? p.amount : 0;
    return acc + (isNaN(amt) ? 0 : amt);
  }, 0);
}

export function calculateDueAmount(billingAmount: number | undefined, payments?: Payment[]): number {
  const billing = typeof billingAmount === 'number' && !isNaN(billingAmount) ? Math.max(0, billingAmount) : 0;
  const paid = calculatePaidTotal(payments);
  return Math.max(0, billing - paid);
}

export function calculatePaymentStatus(
  billingAmount: number | undefined,
  payments?: Payment[]
): 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' {
  const billing = typeof billingAmount === 'number' && !isNaN(billingAmount) ? Math.max(0, billingAmount) : 0;
  const paid = calculatePaidTotal(payments);

  if (billing <= 0) {
    return 'PAID';
  }
  if (paid <= 0) {
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
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount) || amount <= 0) {
    return { valid: false, error: 'Payment amount must be a positive number.' };
  }
  return { valid: true };
}
