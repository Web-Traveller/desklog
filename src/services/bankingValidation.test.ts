import { describe, it, expect } from 'vitest';
import {
  validateMobileNumber,
  validateAadhaarNumber,
  validateTransactionAmountRupees,
  validateCompanyChargeAgainstFee,
  TRANSACTION_AMOUNT_MAX_RUPEES,
} from '../utils/validationUtils';
import { rupeesToPaise, paiseToRupees } from '../utils/currencyUtils';

describe('Enterprise Input Validation & Rules', () => {
  describe('Mobile Number Validation', () => {
    it('accepts valid 10-digit mobile numbers', () => {
      expect(validateMobileNumber('9820012345').valid).toBe(true);
      expect(validateMobileNumber('7012345678').valid).toBe(true);
    });

    it('strips whitespace and hyphens before validating', () => {
      expect(validateMobileNumber('98200 12345').valid).toBe(true);
      expect(validateMobileNumber('98200-12345').valid).toBe(true);
    });

    it('allows empty mobile numbers for walk-in banking', () => {
      expect(validateMobileNumber('').valid).toBe(true);
    });

    it('rejects numbers that are too short or too long', () => {
      expect(validateMobileNumber('98200').valid).toBe(false);
      expect(validateMobileNumber('982001234567').valid).toBe(false);
      expect(validateMobileNumber('abcdefghij').valid).toBe(false);
    });
  });

  describe('Aadhaar Number Validation', () => {
    it('accepts valid 12-digit Aadhaar numbers', () => {
      expect(validateAadhaarNumber('123456789012').valid).toBe(true);
      expect(validateAadhaarNumber('1234 5678 9012').valid).toBe(true);
    });

    it('allows empty Aadhaar when optional', () => {
      expect(validateAadhaarNumber('').valid).toBe(true);
    });

    it('rejects invalid lengths', () => {
      expect(validateAadhaarNumber('12345').valid).toBe(false);
      expect(validateAadhaarNumber('12345678901234').valid).toBe(false);
      expect(validateAadhaarNumber('1234abcd5678').valid).toBe(false);
    });
  });

  describe('Transaction Amount Bounds', () => {
    it('accepts valid positive amounts within bounds', () => {
      expect(validateTransactionAmountRupees(100).valid).toBe(true);
      expect(validateTransactionAmountRupees(50000).valid).toBe(true);
      expect(validateTransactionAmountRupees(TRANSACTION_AMOUNT_MAX_RUPEES).valid).toBe(true);
    });

    it('rejects zero or negative amounts', () => {
      expect(validateTransactionAmountRupees(0).valid).toBe(false);
      expect(validateTransactionAmountRupees(-100).valid).toBe(false);
      expect(validateTransactionAmountRupees(NaN).valid).toBe(false);
    });

    it('rejects amounts exceeding the enterprise limit of ₹10,00,000', () => {
      expect(validateTransactionAmountRupees(1_000_001).valid).toBe(false);
      expect(validateTransactionAmountRupees(5_000_000).valid).toBe(false);
    });
  });

  describe('Financial Commission Integrity', () => {
    it('validates that company charge does not exceed customer fee', () => {
      // Customer Fee = ₹50, Company Charge = ₹30 => Commission = ₹20 (Valid)
      expect(validateCompanyChargeAgainstFee(50, 30).valid).toBe(true);
      // Customer Fee = ₹50, Company Charge = ₹50 => Commission = ₹0 (Valid)
      expect(validateCompanyChargeAgainstFee(50, 50).valid).toBe(true);
      // Customer Fee = ₹50, Company Charge = ₹60 => Negative Commission (Invalid)
      expect(validateCompanyChargeAgainstFee(50, 60).valid).toBe(false);
    });

    it('rejects negative company charge', () => {
      expect(validateCompanyChargeAgainstFee(50, -10).valid).toBe(false);
    });

    it('accurately converts rupees to integer paise and back without floating precision drift', () => {
      expect(rupeesToPaise(100)).toBe(10000);
      expect(rupeesToPaise(100.50)).toBe(10050);
      expect(paiseToRupees(10050)).toBe(100.50);
      expect(rupeesToPaise(0.01)).toBe(1);
    });
  });
});
