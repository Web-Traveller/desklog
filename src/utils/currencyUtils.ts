/**
 * Utility functions for consistent currency representation.
 * All monetary amounts in the database are stored as integer paise/cents (1 INR = 100 Paise).
 */

export function formatRupees(amountInPaise?: number | null, showDecimals: boolean = true): string {
  if (amountInPaise === undefined || amountInPaise === null || isNaN(amountInPaise) || !isFinite(amountInPaise)) {
    return '₹0';
  }
  const rupees = amountInPaise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? (rupees % 1 === 0 ? 0 : 2) : 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function rupeesToPaise(rupees?: number | string | null): number {
  if (rupees === undefined || rupees === null) return 0;
  const parsed = typeof rupees === 'number' ? rupees : parseFloat(rupees);
  if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

export function paiseToRupees(paise?: number | null): number {
  if (paise === undefined || paise === null || isNaN(paise) || !isFinite(paise)) return 0;
  return paise / 100;
}
