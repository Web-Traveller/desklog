/**
 * Input validation utilities for DeskLog enterprise data entry.
 * All monetary limits are expressed in RUPEES (display layer).
 * Maximum single-transaction value: ₹10,00,000 (hard block).
 * Warning threshold: ₹5,00,000 (soft warning, still submittable).
 */

/** Hard upper limit per single banking transaction in rupees. */
export const TRANSACTION_AMOUNT_MAX_RUPEES = 1_000_000; // ₹10,00,000

/** Regex patterns for Indian formats. */
const MOBILE_NUMBER_REGEX = /^\d{10}$/;
const AADHAAR_NUMBER_REGEX = /^\d{12}$/;

export interface ValidationResult {
  valid: boolean;
  /** User-visible error message if invalid. */
  error?: string;
  /** Non-blocking advisory shown as a warning toast, does not block submit. */
  warning?: string;
}

/**
 * Validates an Indian mobile number.
 * Accepts exactly 10 digits (spaces/hyphens stripped before calling).
 */
export function validateMobileNumber(mobile: string): ValidationResult {
  let cleaned = mobile.replace(/[\s-]/g, '');
  if (!cleaned) return { valid: true }; // Mobile is optional for walk-in banking

  // Handle common Indian phone prefixes: +91, 91 (when 12 digits), or leading 0 (when 11 digits)
  if (cleaned.startsWith('+91') && cleaned.length === 13) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  if (!MOBILE_NUMBER_REGEX.test(cleaned)) {
    return {
      valid: false,
      error: 'Mobile number must be exactly 10 digits (no spaces or dashes).',
    };
  }
  return { valid: true };
}

/**
 * Validates an Aadhaar number.
 * Accepts exactly 12 digits (spaces stripped before calling).
 */
export function validateAadhaarNumber(aadhaar: string): ValidationResult {
  const cleaned = aadhaar.replace(/\s/g, '');
  if (!cleaned) return { valid: true }; // Aadhaar is optional in some modes
  if (!AADHAAR_NUMBER_REGEX.test(cleaned)) {
    return {
      valid: false,
      error: 'Aadhaar number must be exactly 12 digits.',
    };
  }
  return { valid: true };
}

/**
 * Validates a transaction amount entered in RUPEES (display value).
 * Returns error if zero/negative or above the hard cap.
 */
export function validateTransactionAmountRupees(amountRupees: number): ValidationResult {
  if (!isFinite(amountRupees) || isNaN(amountRupees) || amountRupees <= 0) {
    return {
      valid: false,
      error: 'Amount must be a positive number greater than zero.',
    };
  }
  if (amountRupees > TRANSACTION_AMOUNT_MAX_RUPEES) {
    return {
      valid: false,
      error: `Amount ₹${amountRupees.toLocaleString('en-IN')} exceeds the maximum allowed single transaction limit of ₹${TRANSACTION_AMOUNT_MAX_RUPEES.toLocaleString('en-IN')}. Please verify and split if needed.`,
    };
  }
  return { valid: true };
}

/**
 * Validates that the company charge (portal deduction) does not exceed the customer fee.
 * Commission = charges - company_charge; must not be negative.
 */
export function validateCompanyChargeAgainstFee(
  chargesRupees: number,
  companyChargeRupees: number
): ValidationResult {
  if (companyChargeRupees < 0) {
    return {
      valid: false,
      error: 'Company cost cannot be negative.',
    };
  }
  if (companyChargeRupees > chargesRupees) {
    return {
      valid: false,
      error: `Company cost (₹${companyChargeRupees.toLocaleString('en-IN')}) cannot exceed the customer fee (₹${chargesRupees.toLocaleString('en-IN')}). This would result in a negative commission.`,
    };
  }
  return { valid: true };
}

/**
 * Validates an AEPS Aadhaar-based ID field specifically.
 * AEPS requires a 12-digit Aadhaar; other modes accept any reference.
 */
export function validateAepsIdentifier(identifier: string): ValidationResult {
  return validateAadhaarNumber(identifier);
}

/**
 * Strips and normalises a mobile number string for comparison.
 */
export function normaliseMobileNumber(mobile: string): string {
  return mobile.replace(/[\s-]/g, '');
}
