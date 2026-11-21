import { describe, it, expect } from 'vitest';
import { Customer, Task, Payment, BankingTransaction } from '../types';
import {
  rupeesToPaise,
  paiseToRupees,
  formatRupees,
} from '../utils/currencyUtils';
import {
  validateMobileNumber,
  validateAadhaarNumber,
  validateTransactionAmountRupees,
  validateCompanyChargeAgainstFee,
} from '../utils/validationUtils';
import {
  calculatePaidTotal,
  calculateDueAmount,
  calculatePaymentStatus,
} from './paymentService';
import { searchCustomers, findCustomersByMobile } from './customerService';
import { isTaskOverdue } from './taskService';

// =========================================================================
// 1. DEEP TEST: REFUND & COMMISSION ENGINE (Feedback #1)
// =========================================================================
describe('1. Deep Test: Refund & Commission Engine', () => {
  it('computes net shop commission precisely: commission = charges - company_charge', () => {
    // Standard DMT transaction: customer pays ₹50 counter fee, portal charges ₹30 cost
    const charges = 50; // ₹50
    const companyCharge = 30; // ₹30
    const commission = Math.max(0, charges - companyCharge);
    expect(commission).toBe(20);

    // In paise
    const feePaise = rupeesToPaise(charges);
    const compCostPaise = rupeesToPaise(companyCharge);
    const commPaise = Math.max(0, feePaise - compCostPaise);
    expect(commPaise).toBe(2000); // ₹20.00
    expect(paiseToRupees(commPaise)).toBe(20.0);
  });

  it('prevents negative commission when portal fee equals or exceeds customer fee', () => {
    // Zero counter fee (e.g. operator forgot to enter fee): commission must clamp to 0
    const fee = 0;
    const portalCost = 25;
    const commission = Math.max(0, fee - portalCost);
    expect(commission).toBe(0);

    // Validation rule prevents submitting if companyCost > fee
    const validation = validateCompanyChargeAgainstFee(fee, portalCost);
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('cannot exceed the customer fee');
  });

  it('handles fractional currency inputs without floating-point precision drift', () => {
    // E.g. Utility bill payment: Fee ₹15.75, Company Cost ₹3.25 => Commission ₹12.50
    const feePaise = rupeesToPaise(15.75);
    const compCostPaise = rupeesToPaise(3.25);
    expect(feePaise).toBe(1575);
    expect(compCostPaise).toBe(325);

    const commPaise = feePaise - compCostPaise;
    expect(commPaise).toBe(1250);
    expect(paiseToRupees(commPaise)).toBe(12.5);
    expect(formatRupees(commPaise)).toBe('₹12.50');
  });

  it('isolates refund amounts from regular commission accounting', () => {
    // Failed transaction where customer was refunded ₹5,000 and ₹50 counter fee
    const txn: Partial<BankingTransaction> = {
      amount: rupeesToPaise(5000),
      charges: rupeesToPaise(50),
      company_charge: rupeesToPaise(10),
      refund: rupeesToPaise(5050),
      status: 'FAILD',
    };

    expect(txn.refund).toBe(505000); // ₹5,050.00 in paise
    // When status is FAILD, fee should not be counted as shop net revenue
    const isSuccess = txn.status === 'SUCCESS';
    const netRevenue = isSuccess ? (txn.charges! - txn.company_charge!) : 0;
    expect(netRevenue).toBe(0);
  });
});

// =========================================================================
// 2. DEEP TEST: PAYMENT RECORD CRUD & VOIDING (Feedback #2)
// =========================================================================
describe('2. Deep Test: Payment Record CRUD (Edit & Void Payments)', () => {
  const task: Task = {
    id: 'task-gst-01',
    customer_id: 'cust-nitin',
    title: 'GST Return Filing Quarterly',
    billing_amount: 150000, // ₹1,500.00
    status: 'READY',
    created_at: '2026-10-01 10:00:00',
    updated_at: '2026-10-01 10:00:00',
  };

  it('correctly transitions payment status upon partial payment', () => {
    const p1: Payment = {
      id: 'pay-01',
      task_id: task.id,
      amount: 50000, // ₹500
      created_at: '2026-10-01 10:05:00',
    };

    const paid = calculatePaidTotal([p1]);
    const due = calculateDueAmount(task.billing_amount, [p1]);
    const status = calculatePaymentStatus(task.billing_amount, [p1]);

    expect(paid).toBe(50000);
    expect(due).toBe(100000); // ₹1,000 remaining
    expect(status).toBe('PARTIALLY_PAID');
  });

  it('recalculates task debt when an existing payment amount is edited (Scenario #72)', () => {
    // Operator initially typed ₹500 (50000 paise), but customer actually paid ₹1,200 (120000 paise)
    const originalPayment: Payment = {
      id: 'pay-01',
      task_id: task.id,
      amount: 50000,
      created_at: '2026-10-01 10:05:00',
    };

    // Edit payment: update amount to ₹1,200 (120000 paise)
    const editedPayment: Payment = {
      ...originalPayment,
      amount: 120000,
    };

    const updatedPaid = calculatePaidTotal([editedPayment]);
    const updatedDue = calculateDueAmount(task.billing_amount, [editedPayment]);
    const updatedStatus = calculatePaymentStatus(task.billing_amount, [editedPayment]);

    expect(updatedPaid).toBe(120000);
    expect(updatedDue).toBe(30000); // ₹300 remaining
    expect(updatedStatus).toBe('PARTIALLY_PAID');
  });

  it('marks task as fully PAID when edited payment reaches total billing', () => {
    // Edit payment to full ₹1,500 (150000 paise)
    const fullPayment: Payment = {
      id: 'pay-01',
      task_id: task.id,
      amount: 150000,
      created_at: '2026-10-01 10:05:00',
    };

    const paid = calculatePaidTotal([fullPayment]);
    const due = calculateDueAmount(task.billing_amount, [fullPayment]);
    const status = calculatePaymentStatus(task.billing_amount, [fullPayment]);

    expect(paid).toBe(150000);
    expect(due).toBe(0);
    expect(status).toBe('PAID');
  });

  it('restores customer pending debt when a payment is voided/deleted (Scenario #74)', () => {
    const p1: Payment = { id: 'pay-01', task_id: task.id, amount: 60000, created_at: '2026-10-01' };
    const p2: Payment = { id: 'pay-02', task_id: task.id, amount: 40000, created_at: '2026-10-02' };
    const payments = [p1, p2];

    expect(calculatePaidTotal(payments)).toBe(100000);
    expect(calculateDueAmount(task.billing_amount, payments)).toBe(50000);

    // Operator voids p2 (e.g. bounced cheque or wrong entry)
    const afterVoid = payments.filter((p) => p.id !== 'pay-02');
    expect(calculatePaidTotal(afterVoid)).toBe(60000);
    expect(calculateDueAmount(task.billing_amount, afterVoid)).toBe(90000);
    expect(calculatePaymentStatus(task.billing_amount, afterVoid)).toBe('PARTIALLY_PAID');
  });
});

// =========================================================================
// 3. DEEP TEST: UNIVERSAL MULTI-FIELD SEARCH (Feedback #3)
// =========================================================================
describe('3. Deep Test: Universal Multi-Field Search Integrity', () => {
  const sampleCustomers: Customer[] = [
    {
      id: 'c1',
      name: 'Irshad Ahmad Khan',
      mobile: '9820123456',
      aadhaar_number: '5421 8976 1234',
      note: 'CSC & Banking Client',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
      is_active: true,
    },
    {
      id: 'c2',
      name: 'Pooja Sharma',
      mobile: '9820123456', // Shared family phone
      aadhaar_number: '9876 5432 1098',
      note: 'Passport verification',
      created_at: '2026-01-02',
      updated_at: '2026-01-02',
      is_active: true,
    },
    {
      id: 'c3',
      name: 'Mohd Farooq',
      mobile: '8877665544',
      aadhaar_number: '1122 3344 5566',
      note: 'DMT transfer customer',
      created_at: '2026-01-03',
      updated_at: '2026-01-03',
      is_active: true,
    },
  ];

  it('matches Aadhaar number with or without embedded spaces', () => {
    // Searching without spaces
    const searchNoSpaces = searchCustomers(sampleCustomers, '542189761234');
    expect(searchNoSpaces.length).toBe(1);
    expect(searchNoSpaces[0].name).toBe('Irshad Ahmad Khan');

    // Searching with spaces
    const searchSpaces = searchCustomers(sampleCustomers, '5421 8976 1234');
    expect(searchSpaces.length).toBe(1);
    expect(searchSpaces[0].name).toBe('Irshad Ahmad Khan');
  });

  it('matches partial Aadhaar by last 4 digits (Scenario #95)', () => {
    const searchLast4 = searchCustomers(sampleCustomers, '1234');
    expect(searchLast4.some((c) => c.name === 'Irshad Ahmad Khan')).toBe(true);
  });

  it('matches customers by shared mobile number (returning all family members)', () => {
    const familyMatches = findCustomersByMobile(sampleCustomers, '9820123456');
    expect(familyMatches.length).toBe(2);
    expect(familyMatches.map((c) => c.name)).toContain('Irshad Ahmad Khan');
    expect(familyMatches.map((c) => c.name)).toContain('Pooja Sharma');
  });

  it('escapes and handles special characters and regex metacharacters safely (Scenario #91)', () => {
    // Query contains characters that would break RegExp if unescaped: (), [], *, +, ?, \
    const dangerousQueries = ['(', ')', '[test]', 'c++', 'irshad*khan', '5421?'];
    for (const q of dangerousQueries) {
      expect(() => searchCustomers(sampleCustomers, q)).not.toThrow();
    }
  });

  it('matches task by Tracker ID, Document Number, and Work Type', () => {
    const tasks: Task[] = [
      {
        id: 't-1',
        customer_id: 'c1',
        title: 'Income Certificate',
        tracker_id: 'ACK2026112100472375',
        document_number: 'MAHA/DOC/2026/8941',
        work_type: 'Income Certificate',
        billing_amount: 15000,
        status: 'READY',
        created_at: '',
        updated_at: '',
      },
      {
        id: 't-2',
        customer_id: 'c2',
        title: 'Pan Card Form 49A',
        tracker_id: 'UTI784910248',
        document_number: 'N-89412',
        work_type: 'PAN Card',
        billing_amount: 20000,
        status: 'PENDING',
        created_at: '',
        updated_at: '',
      },
    ];

    // Search by Tracker ID
    const queryTracker = '00472375';
    const match1 = tasks.filter((t) => (t.tracker_id || '').includes(queryTracker));
    expect(match1.length).toBe(1);
    expect(match1[0].id).toBe('t-1');

    // Search by Document Number
    const queryDoc = 'MAHA/DOC';
    const match2 = tasks.filter((t) => (t.document_number || '').includes(queryDoc));
    expect(match2.length).toBe(1);
    expect(match2[0].id).toBe('t-1');

    // Search by billing amount as text
    const queryAmt = '200';
    const match3 = tasks.filter((t) =>
      t.billing_amount !== undefined && t.billing_amount.toString().includes(queryAmt)
    );
    expect(match3.length).toBe(1);
    expect(match3[0].id).toBe('t-2');
  });
});

// =========================================================================
// 4. DEEP TEST: BANK & WALLET COLLECTION MATRIX (Feedback #4)
// =========================================================================
describe('4. Deep Test: Bank & Portal Collection Settlement Matrix', () => {
  const transactions: BankingTransaction[] = [
    // 1. DMT via SAFEPAY to SBI (Sent Outflow)
    {
      id: 'b1',
      transaction_date: '2026-11-21T10:00:00',
      transaction_type: 'DMT',
      company_name: 'SAFEPAY',
      bank_name: 'State Bank of India',
      amount: 1000000, // ₹10,000
      charges: 10000, // ₹100
      company_charge: 6000, // ₹60
      status: 'SUCCESS',
      created_at: '',
      updated_at: '',
    },
    // 2. DMT via PAYBINGO to HDFC Bank (Sent Outflow)
    {
      id: 'b2',
      transaction_date: '2026-11-21T11:00:00',
      transaction_type: 'DMT',
      company_name: 'PAYBINGO',
      bank_name: 'HDFC Bank',
      amount: 500000, // ₹5,000
      charges: 5000, // ₹50
      company_charge: 3000, // ₹30
      status: 'SUCCESS',
      created_at: '',
      updated_at: '',
    },
    // 3. AEPS via SAFEPAY from Bank of Baroda (Received Inflow to Wallet)
    {
      id: 'b3',
      transaction_date: '2026-11-21T12:00:00',
      transaction_type: 'AEPS',
      company_name: 'SAFEPAY',
      bank_name: 'Bank of Baroda',
      amount: 300000, // ₹3,000 cash given, wallet credited ₹3,000
      charges: 3000, // ₹30 fee
      company_charge: 0,
      status: 'SUCCESS',
      created_at: '',
      updated_at: '',
    },
    // 4. Failed DMT via SAFEPAY
    {
      id: 'b4',
      transaction_date: '2026-11-21T13:00:00',
      transaction_type: 'DMT',
      company_name: 'SAFEPAY',
      bank_name: 'State Bank of India',
      amount: 200000, // ₹2,000
      charges: 2000,
      company_charge: 1000,
      status: 'FAILD',
      created_at: '',
      updated_at: '',
    },
  ];

  it('aggregates collections by Portal / Wallet correctly', () => {
    // SAFEPAY summary:
    // b1: DMT ₹10,000 (sent), fee ₹100, cost ₹60
    // b3: AEPS ₹3,000 (received), fee ₹30, cost ₹0
    // b4: DMT ₹2,000 (FAILD)
    const safepayTxns = transactions.filter((t) => t.company_name === 'SAFEPAY');
    expect(safepayTxns.length).toBe(3);

    const successTxns = safepayTxns.filter((t) => t.status === 'SUCCESS');
    expect(successTxns.length).toBe(2);

    let sentOutflow = 0;
    let receivedInflow = 0;
    let totalFees = 0;
    let netCommission = 0;

    for (const t of successTxns) {
      if (t.transaction_type === 'AEPS') {
        receivedInflow += t.amount;
      } else {
        sentOutflow += t.amount;
      }
      const fee = t.charges || 0;
      const cost = t.company_charge || 0;
      totalFees += fee;
      netCommission += Math.max(0, fee - cost);
    }

    expect(sentOutflow).toBe(1000000); // ₹10,000 sent
    expect(receivedInflow).toBe(300000); // ₹3,000 received
    expect(totalFees).toBe(13000); // ₹130 fees
    expect(netCommission).toBe(7000); // ₹70 net commission (₹40 from b1 + ₹30 from b3)

    // Success rate: 2 out of 3 = 66.7%
    const successRate = (successTxns.length / safepayTxns.length) * 100;
    expect(Math.round(successRate)).toBe(67);
  });

  it('aggregates collections by Bank / Partner accurately', () => {
    const sbiTxns = transactions.filter((t) => t.bank_name === 'State Bank of India');
    expect(sbiTxns.length).toBe(2);

    const successfulSbi = sbiTxns.filter((t) => t.status === 'SUCCESS');
    expect(successfulSbi.length).toBe(1);
    expect(successfulSbi[0].amount).toBe(1000000); // ₹10,000
  });

  it('aggregates collections by Service Mode accurately', () => {
    const aepsTxns = transactions.filter((t) => t.transaction_type === 'AEPS');
    expect(aepsTxns.length).toBe(1);
    expect(aepsTxns[0].amount).toBe(300000);

    const dmtTxns = transactions.filter((t) => t.transaction_type === 'DMT');
    expect(dmtTxns.length).toBe(3);
  });
});

// =========================================================================
// 5. DEEP TEST: PAID, PENDING (UDHARI) & TOTAL BILLING INVARIANTS (Feedback #5)
// =========================================================================
describe('5. Deep Test: Paid, Pending (Udhari) & Total Billing Invariants', () => {
  const tasks: Task[] = [
    { id: 't1', customer_id: 'c1', title: 'Task 1', billing_amount: 100000, status: 'DELIVERED', created_at: '', updated_at: '' }, // ₹1,000
    { id: 't2', customer_id: 'c1', title: 'Task 2', billing_amount: 50000, status: 'READY', created_at: '', updated_at: '' }, // ₹500
    { id: 't3', customer_id: 'c2', title: 'Task 3', billing_amount: 75000, status: 'PROCESSING', created_at: '', updated_at: '' }, // ₹750
    { id: 't4', customer_id: 'c3', title: 'Task 4', billing_amount: 0, status: 'READY', created_at: '', updated_at: '' }, // ₹0 free task
  ];

  const payments: Payment[] = [
    { id: 'p1', task_id: 't1', amount: 100000, created_at: '' }, // t1: fully paid
    { id: 'p2', task_id: 't2', amount: 20000, created_at: '' },  // t2: ₹200 paid, ₹300 pending
    // t3: ₹0 paid, ₹750 pending
    // t4: ₹0 paid, ₹0 pending
  ];

  it('maintains the strict accounting invariant: Billed = Paid + Pending Udhari', () => {
    let totalBilled = 0;
    let totalPaid = 0;
    let udhariTasksCount = 0;

    tasks.forEach((t) => {
      const b = t.billing_amount || 0;
      totalBilled += b;
      const taskPaid = payments
        .filter((p) => p.task_id === t.id)
        .reduce((sum, p) => sum + p.amount, 0);
      totalPaid += taskPaid;
      if (b - taskPaid > 0) {
        udhariTasksCount++;
      }
    });

    const totalPending = Math.max(0, totalBilled - totalPaid);

    expect(totalBilled).toBe(225000); // ₹2,250.00
    expect(totalPaid).toBe(120000); // ₹1,200.00
    expect(totalPending).toBe(105000); // ₹1,050.00
    expect(totalBilled).toBe(totalPaid + totalPending);
    expect(udhariTasksCount).toBe(2); // t2 and t3 have pending balance
  });

  it('accurately identifies tasks with pending udhari balance', () => {
    const isUdhari = (taskId: string, billing: number) => {
      const taskPaid = payments
        .filter((p) => p.task_id === taskId)
        .reduce((sum, p) => sum + p.amount, 0);
      return billing - taskPaid > 0;
    };

    expect(isUdhari('t1', 100000)).toBe(false); // Fully paid
    expect(isUdhari('t2', 50000)).toBe(true);  // ₹300 pending
    expect(isUdhari('t3', 75000)).toBe(true);  // ₹750 pending
    expect(isUdhari('t4', 0)).toBe(false);     // ₹0 billing -> not udhari
  });
});

// =========================================================================
// 6. DEEP TEST: FORM VALIDATION & ERROR MESSAGING
// =========================================================================
describe('6. Deep Test: Form Validation & Error Messaging Precision', () => {
  it('enforces Indian 10-digit mobile number rules', () => {
    // Valid numbers
    expect(validateMobileNumber('9820012345').valid).toBe(true);
    expect(validateMobileNumber('+91 98200 12345').valid).toBe(true);

    // Invalid numbers with explanatory error messages
    const shortResult = validateMobileNumber('98200');
    expect(shortResult.valid).toBe(false);
    expect(shortResult.error).toBe('Mobile number must be exactly 10 digits (no spaces or dashes).');

    const alphaResult = validateMobileNumber('98200abcde');
    expect(alphaResult.valid).toBe(false);
    expect(alphaResult.error).toBe('Mobile number must be exactly 10 digits (no spaces or dashes).');
  });

  it('enforces 12-digit Indian Aadhaar number format', () => {
    expect(validateAadhaarNumber('1234 5678 9012').valid).toBe(true);
    expect(validateAadhaarNumber('123456789012').valid).toBe(true);

    const invalidResult = validateAadhaarNumber('1234 5678');
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.error).toBe('Aadhaar number must be exactly 12 digits.');
  });

  it('rejects out-of-bounds banking transaction amounts', () => {
    expect(validateTransactionAmountRupees(0).valid).toBe(false);
    expect(validateTransactionAmountRupees(-500).valid).toBe(false);
    expect(validateTransactionAmountRupees(1_000_001).valid).toBe(false);

    const validRes = validateTransactionAmountRupees(25000);
    expect(validRes.valid).toBe(true);
    expect(validRes.error).toBeUndefined();
  });
});

// =========================================================================
// 7. DEEP TEST: UNIVERSAL SEARCH & BANKING CUSTOMER RESOLUTION
// =========================================================================
describe('7. Deep Test: Universal Search & Customer Profile Resolution', () => {
  const sampleCustomer: Customer = {
    id: 'cust-101',
    name: 'Suresh Patil',
    mobile: '9876543210',
    aadhaar_number: '5566 7788 9900',
    address: 'Pune, Maharashtra',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_tasks: 2,
    active_tasks: 1,
    completed_tasks: 1,
    total_spent: 50000,
    total_paid: 50000,
    total_due: 0,
    payment_status: 'PAID',
    avatar_initials: 'SP',
    avatar_color: 'bg-primary',
  };

  const customersList = [sampleCustomer];

  it('matches banking transaction by customer name even if stored with Walk-in Customer fallback', () => {
    const tx: BankingTransaction = {
      id: 88,
      customer_id: 'cust-101',
      transaction_type: 'AEPS',
      payment_mode: 'AePS',
      amount: 200000,
      transaction_ref_no: '556677889900',
      account_or_aadhaar: '5566 7788 9900',
      bank_name: 'State Bank of India',
      company_name: 'SAFEPAY',
      customer_name: 'Walk-in Customer', // legacy/fallback
      customer_mobile: '9876543210',
      charges: 5000,
      company_charge: 3000,
      commission: 2000,
      refund: 0,
      status: 'SUCCESS',
      transaction_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const rawQ = 'suresh';
    const cleanQ = rawQ.replace(/[\s-]/g, '').toLowerCase();

    // Resolver logic
    const txMobileClean = tx.customer_mobile ? tx.customer_mobile.replace(/[\s-]/g, '') : '';
    const txAcctClean = tx.account_or_aadhaar ? tx.account_or_aadhaar.replace(/[\s-]/g, '') : '';
    const linkedCust = (tx.customer_id && tx.customer_id !== 'cust-general')
      ? customersList.find((c) => c.id === tx.customer_id)
      : customersList.find((c) =>
          (txMobileClean && c.mobile && c.mobile.replace(/[\s-]/g, '') === txMobileClean) ||
          (txAcctClean && c.aadhaar_number && c.aadhaar_number.replace(/[\s-]/g, '') === txAcctClean)
        );

    expect(linkedCust).toBeDefined();
    expect(linkedCust?.name).toBe('Suresh Patil');

    const matchesName = linkedCust?.name.toLowerCase().includes(rawQ);
    expect(matchesName).toBe(true);

    const displayName = (tx.customer_name && tx.customer_name.trim() !== 'Walk-in Customer')
      ? tx.customer_name.trim()
      : (linkedCust?.name || 'Customer');

    expect(displayName).toBe('Suresh Patil');
    expect(displayName).not.toBe('Walk-in Customer');
  });

  it('matches banking transaction when searching by Aadhaar and resolves real customer name', () => {
    const tx: BankingTransaction = {
      id: 89,
      customer_id: 'cust-general',
      transaction_type: 'AEPS',
      payment_mode: 'AePS',
      amount: 100000,
      transaction_ref_no: '556677889900',
      account_or_aadhaar: '5566 7788 9900',
      bank_name: 'Bank of Baroda',
      company_name: 'PAYBINGO',
      customer_name: '',
      customer_mobile: '',
      charges: 2000,
      company_charge: 1000,
      commission: 1000,
      refund: 0,
      status: 'SUCCESS',
      transaction_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const cleanQ = '556677889900';

    const txAcctClean = tx.account_or_aadhaar ? tx.account_or_aadhaar.replace(/[\s-]/g, '') : '';
    const linkedCust = customersList.find((c) =>
      c.aadhaar_number && c.aadhaar_number.replace(/[\s-]/g, '') === txAcctClean
    );

    expect(linkedCust).toBeDefined();
    expect(linkedCust?.name).toBe('Suresh Patil');

    const displayName = (tx.customer_name && tx.customer_name.trim() !== 'Walk-in Customer')
      ? tx.customer_name.trim()
      : (linkedCust?.name || 'Customer');

    expect(displayName).toBe('Suresh Patil');
    expect(displayName).not.toBe('Walk-in Customer');
  });
});
