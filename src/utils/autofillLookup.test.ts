import { describe, it, expect } from 'vitest';
import { cleanDigits, normalizeMobile, lookupCustomerDetails } from './autofillLookup';
import { Customer, BankAccountOpening, BankingTransaction } from '../types';

describe('autofillLookup', () => {
  it('cleanDigits removes all non-numeric characters', () => {
    expect(cleanDigits('9876-543-210')).toBe('9876543210');
    expect(cleanDigits('+91 98765 43210')).toBe('919876543210');
    expect(cleanDigits('1234 5678 9012')).toBe('123456789012');
  });

  it('normalizes 10-digit Indian phone numbers', () => {
    expect(normalizeMobile('+91 9876543210')).toBe('9876543210');
    expect(normalizeMobile('98765-43210')).toBe('9876543210');
  });

  it('PREVENTS partial match when only 9 digits are entered', () => {
    const mockCustomers: Customer[] = [
      {
        id: 'c1',
        name: 'Ramesh Kumar',
        mobile: '9876543210',
        aadhaar_number: '123456789012',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        is_active: true,
      },
    ];

    // User only typed 9 digits
    const res = lookupCustomerDetails('987654321', { customers: mockCustomers });
    expect(res).toBeNull();

    // User only typed 11 digits of Aadhaar
    const resAadhaar = lookupCustomerDetails('12345678901', { customers: mockCustomers });
    expect(resAadhaar).toBeNull();
  });

  it('matches when full 10 digits are typed and picks the most recent record', () => {
    const mockOpenings: BankAccountOpening[] = [
      {
        id: 1,
        account_date: '2026-02-01',
        account_number: '111111111',
        customer_name: 'Older Name',
        mobile_number: '9876543210',
        aadhaar_number: '123456789012',
        scheme: 'FINO',
        created_at: '2026-02-01T10:00:00Z',
      },
      {
        id: 2,
        account_date: '2026-03-01',
        account_number: '222222222',
        customer_name: 'Newest Name',
        mobile_number: '9876543210',
        aadhaar_number: '123456789012',
        pan_number: 'ABCDE1234F',
        city: 'Mumbai',
        scheme: 'SBI',
        created_at: '2026-03-01T10:00:00Z',
      },
    ];

    const res = lookupCustomerDetails('9876543210', { accountOpenings: mockOpenings });
    expect(res).not.toBeNull();
    expect(res?.customer_name).toBe('Newest Name');
    expect(res?.pan_number).toBe('ABCDE1234F');
    expect(res?.city).toBe('Mumbai');
  });

  it('matches when full 12-digit Aadhaar is typed', () => {
    const mockOpenings: BankAccountOpening[] = [
      {
        id: 1,
        account_date: '2026-02-01',
        account_number: '111111111',
        customer_name: 'Aadhaar Customer',
        mobile_number: '9988776655',
        aadhaar_number: '555544443333',
        scheme: 'BARODA',
      },
    ];

    const res = lookupCustomerDetails('5555 4444 3333', { accountOpenings: mockOpenings });
    expect(res).not.toBeNull();
    expect(res?.customer_name).toBe('Aadhaar Customer');
    expect(res?.mobile_number).toBe('9988776655');
  });
});
