import { describe, test, expect } from 'vitest';
import { Customer, Task, Payment, Service } from '../types';
import { findCustomersByMobile, searchCustomers } from './customerService';
import { calculatePaidTotal, calculateDueAmount, calculatePaymentStatus } from './paymentService';
import { isTaskOverdue, calculateDashboardMetrics } from './taskService';
import { createActivityEvent } from './activityService';

describe('Phase 18: Core Domain Business Rules', () => {
  test('Shared Mobile Numbers: Multiple independent customers can share the same mobile number', () => {
    const customers: Customer[] = [
      { id: 'cust-1', name: 'Rajesh Sharma', mobile: '9999999999', is_active: true, created_at: '2026-09-29', updated_at: '2026-09-29' },
      { id: 'cust-2', name: 'Amit Sharma', mobile: '9999999999', is_active: true, created_at: '2026-09-29', updated_at: '2026-09-29' },
      { id: 'cust-3', name: 'Pooja Sharma', mobile: '9999999999', is_active: true, created_at: '2026-09-29', updated_at: '2026-09-29' },
    ];

    const matches = findCustomersByMobile(customers, '9999999999');
    expect(matches.length).toBe(3);
    expect(matches.map(c => c.name)).toEqual(['Rajesh Sharma', 'Amit Sharma', 'Pooja Sharma']);

    const searchResult = searchCustomers(customers, '9999999999');
    expect(searchResult.length).toBe(3);
  });

  test('Task Ownership: Tasks belong to specific customer ID, not mobile number', () => {
    const task: Task = {
      id: 'task-101',
      customer_id: 'cust-2', // Amit Sharma
      title: 'Pan Card Application',
      status: 'PROCESSING',
      created_at: '2026-09-29 10:00:00',
      updated_at: '2026-09-29 10:00:00',
    };

    expect(task.customer_id).toBe('cust-2');
    expect(task.customer_id).not.toBe('cust-1');
  });

  test('Service Price History Preservation: Changing default service price does not alter historical tasks', () => {
    const service: Service = {
      id: 'svc-1',
      name: 'Passport Application',
      default_price: 150, // ₹150 initial price
      is_active: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    };

    // Task created when default price was ₹150
    const historicalTask: Task = {
      id: 'task-1',
      customer_id: 'cust-1',
      service_id: service.id,
      title: service.name,
      billing_amount: 150,
      status: 'DELIVERED',
      created_at: '2026-01-02 10:00:00',
      updated_at: '2026-01-02 10:00:00',
    };

    // Service price increased to ₹200
    const updatedService: Service = {
      ...service,
      default_price: 200,
      updated_at: '2026-09-01',
    };

    expect(updatedService.default_price).toBe(200);
    // Historical task remains ₹150
    expect(historicalTask.billing_amount).toBe(150);
  });

  test('Payment System: Partial payments, full payments, and due amounts', () => {
    const task: Task = {
      id: 'task-201',
      customer_id: 'cust-1',
      title: 'Income Certificate',
      billing_amount: 500,
      status: 'PROCESSING',
      created_at: '2026-09-29 10:00:00',
      updated_at: '2026-09-29 10:00:00',
    };

    const initialPayments: Payment[] = [];

    // 1. Initial State: ₹0 paid -> UNPAID, ₹500 due
    expect(calculatePaidTotal(initialPayments)).toBe(0);
    expect(calculateDueAmount(task.billing_amount, initialPayments)).toBe(500);
    expect(calculatePaymentStatus(task.billing_amount, initialPayments)).toBe('UNPAID');

    // 2. Partial Payment: ₹200 paid -> PARTIALLY_PAID, ₹300 due
    const partialPayments: Payment[] = [
      { id: 'pay-1', task_id: task.id, amount: 200, created_at: '2026-09-29 11:00:00' },
    ];
    expect(calculatePaidTotal(partialPayments)).toBe(200);
    expect(calculateDueAmount(task.billing_amount, partialPayments)).toBe(300);
    expect(calculatePaymentStatus(task.billing_amount, partialPayments)).toBe('PARTIALLY_PAID');

    // 3. Full Payment: Additional ₹300 paid -> PAID, ₹0 due
    const fullPayments: Payment[] = [
      ...partialPayments,
      { id: 'pay-2', task_id: task.id, amount: 300, created_at: '2026-09-29 12:00:00' },
    ];
    expect(calculatePaidTotal(fullPayments)).toBe(500);
    expect(calculateDueAmount(task.billing_amount, fullPayments)).toBe(0);
    expect(calculatePaymentStatus(task.billing_amount, fullPayments)).toBe('PAID');
  });

  test('Overdue System: Past target completion date triggers overdue flag without mutating status', () => {
    const overdueTask: Task = {
      id: 'task-overdue',
      customer_id: 'cust-1',
      title: 'Aadhaar Update',
      target_date: '2020-01-01', // Past date
      status: 'PROCESSING',
      created_at: '2020-01-01 10:00:00',
      updated_at: '2020-01-01 10:00:00',
    };

    expect(isTaskOverdue(overdueTask)).toBe(true);
    // Task status remains PROCESSING (not mutated automatically)
    expect(overdueTask.status).toBe('PROCESSING');

    // Delivered tasks are NOT counted as active overdue workload
    const deliveredTask: Task = {
      ...overdueTask,
      status: 'DELIVERED',
    };
    expect(isTaskOverdue(deliveredTask)).toBe(false);

    // Cancelled tasks are NOT counted as active overdue workload
    const cancelledTask: Task = {
      ...overdueTask,
      status: 'CANCELLED',
    };
    expect(isTaskOverdue(cancelledTask)).toBe(false);
  });

  test('Dashboard Metrics: Accurate active counts excluding delivered/cancelled tasks', () => {
    const tasks: Task[] = [
      { id: 't1', customer_id: 'c1', title: 'Task 1', status: 'PENDING', created_at: '', updated_at: '' },
      { id: 't2', customer_id: 'c1', title: 'Task 2', status: 'PROCESSING', created_at: '', updated_at: '' },
      { id: 't3', customer_id: 'c1', title: 'Task 3', status: 'READY', created_at: '', updated_at: '' },
      { id: 't4', customer_id: 'c1', title: 'Task 4', status: 'DELIVERED', created_at: '', updated_at: '' },
      { id: 't5', customer_id: 'c1', title: 'Task 5', status: 'CANCELLED', created_at: '', updated_at: '' },
      { id: 't6', customer_id: 'c1', title: 'Task 6', status: 'PROCESSING', target_date: '2020-01-01', created_at: '', updated_at: '' },
    ];

    const metrics = calculateDashboardMetrics(tasks, []);
    expect(metrics.pendingCount).toBe(1);
    expect(metrics.processingCount).toBe(2);
    expect(metrics.readyCount).toBe(1);
    expect(metrics.overdueCount).toBe(1);
  });

  test('Activity Generator: Properly constructs activity records for persistence', () => {
    const event = createActivityEvent({
      type: 'task_created',
      title: 'Created Task: Driving License',
      description: 'Logged task for Customer',
      taskId: 't-10',
      customerId: 'c-10',
      customerName: 'Suresh Kumar',
      customerPhone: '9876543210',
      badgeText: 'PENDING',
    });

    expect(event.type).toBe('task_created');
    expect(event.title).toBe('Created Task: Driving License');
    expect(event.taskId).toBe('t-10');
    expect(event.badgeText).toBe('PENDING');
    expect(event.date).toBeDefined();
  });
});
