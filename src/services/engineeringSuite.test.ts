import { describe, it, expect } from 'vitest';
import { parseDateString, dateMatchesCalendarDate, formatDisplayDate, getFormattedToday } from '../utils/dateUtils';
import { isTaskOverdue, isTaskScheduledToday } from '../services/taskService';
import { findCustomersByMobile, searchCustomers } from '../services/customerService';
import { Customer, Task } from '../types';

describe('dateUtils', () => {
  it('parses formatted dates like "27 Sep 2026"', () => {
    const res = parseDateString('27 Sep 2026');
    expect(res).toEqual({ day: 27, month: 'Sep', year: 2026 });
  });

  it('parses ISO date strings like "2026-10-15"', () => {
    const res = parseDateString('2026-10-15');
    expect(res).toEqual({ day: 15, month: 'Oct', year: 2026 });
  });

  it('accurately matches calendar date formats', () => {
    expect(dateMatchesCalendarDate('2026-10-15T09:30:00.000Z', '15 Oct 2026')).toBe(true);
    expect(dateMatchesCalendarDate('15 Oct 2026', '15 Oct 2026')).toBe(true);
    expect(dateMatchesCalendarDate('14 Oct 2026', '15 Oct 2026')).toBe(false);
  });

  it('handles "Today" keyword matching', () => {
    const today = getFormattedToday();
    expect(dateMatchesCalendarDate(today, 'Today')).toBe(true);
  });
});

describe('taskService rules', () => {
  it('identifies overdue tasks correctly', () => {
    const pastTask: Task = {
      id: 'task-1',
      customer_id: 'cust-1',
      title: 'PAN Correction',
      status: 'PENDING',
      target_date: '2026-01-01',
      created_at: '2025-12-01T00:00:00Z',
      updated_at: '2025-12-01T00:00:00Z',
    };
    expect(isTaskOverdue(pastTask, '2026-06-01')).toBe(true);

    const completedTask: Task = {
      ...pastTask,
      status: 'DELIVERED',
    };
    expect(isTaskOverdue(completedTask, '2026-06-01')).toBe(false);
  });

  it('identifies tasks scheduled today', () => {
    const today = getFormattedToday();
    const task: Task = {
      id: 'task-2',
      customer_id: 'cust-1',
      title: 'Aadhaar Link',
      status: 'PROCESSING',
      scheduled_date: today,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    expect(isTaskScheduledToday(task)).toBe(true);
  });
});

describe('customerService lookup', () => {
  const mockCustomers: Customer[] = [
    {
      id: 'c1',
      name: 'Ramesh Sharma',
      mobile: '9876543210',
      aadhaar_number: '1234 5678 9012',
      note: 'Frequent client',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
      is_active: true,
    },
    {
      id: 'c2',
      name: 'Suresh Patil',
      mobile: '9123456780',
      aadhaar_number: '9876 5432 1098',
      note: 'Exam application',
      created_at: '2026-01-02',
      updated_at: '2026-01-02',
      is_active: true,
    },
    {
      id: 'c3',
      name: 'Inactive User',
      mobile: '9876500000',
      created_at: '2026-01-03',
      updated_at: '2026-01-03',
      is_active: false,
    },
  ];

  it('finds active customer by partial mobile number', () => {
    const results = findCustomersByMobile(mockCustomers, '987654');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Ramesh Sharma');
  });

  it('ignores inactive customers during search', () => {
    const results = searchCustomers(mockCustomers, 'Inactive');
    expect(results.length).toBe(0);
  });

  it('matches customer by Aadhaar number', () => {
    const results = searchCustomers(mockCustomers, '9012');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Ramesh Sharma');
  });
});
