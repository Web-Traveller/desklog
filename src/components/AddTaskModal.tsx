import React, { useState } from 'react';
import { useDesk } from '../context/DeskContext';
import { TaskStatus } from '../types';
import { CustomerSearchPicker } from './CustomerSearchPicker';
import { getFormattedNow } from '../utils/dateUtils';

export const AddTaskModal: React.FC = () => {
  const { isAddTaskOpen, setIsAddTaskOpen, customers, selectedCustomerId, addTask } = useDesk();
  const [activeCustId, setActiveCustId] = useState<string>(selectedCustomerId || 'cust-general');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [targetDate, setTargetDate] = useState('');
  const [subStatus, setSubStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [billingAmount, setBillingAmount] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [billingStatus, setBillingStatus] = useState<'paid' | 'unpaid' | 'pending'>('pending');
  const [scheduleDate, setScheduleDate] = useState('');

  if (!isAddTaskOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const customer = customers.find((c) => c.id === activeCustId) ||
      customers.find((c) => c.id === 'cust-general') ||
      customers[0];

    addTask({
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      title: title.trim(),
      status,
      targetDate: targetDate || undefined,
      subStatus: subStatus || (status === 'pending' ? 'Needs document' : status === 'processing' ? 'In Review' : 'Ready'),
      notes: notes.trim(),
      billingAmount: billingAmount ? Number(billingAmount) : undefined,
      amountPaid: amountPaid ? Number(amountPaid) : undefined,
      billingStatus,
      billingDate: billingAmount ? getFormattedNow() : undefined,
      scheduleDate: scheduleDate || undefined,
    });

    setTitle('');
    setStatus('pending');
    setTargetDate('');
    setSubStatus('');
    setNotes('');
    setBillingAmount('');
    setAmountPaid('');
    setBillingStatus('pending');
    setScheduleDate('');
    setIsAddTaskOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-2xl max-w-2xl w-full border border-surface-container/60 flex flex-col gap-space-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-xl">add_task</span>
            <h3 className="font-tagline text-tagline font-semibold text-on-surface">
              Create Desk Task
            </h3>
          </div>
          <button
            className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
            onClick={() => setIsAddTaskOpen(false)}
            type="button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form className="flex flex-col gap-space-sm" onSubmit={handleSubmit}>
          {/* Searchable Customer Picker */}
          <CustomerSearchPicker
            customers={customers}
            label="Select Customer / Walk-in Client *"
            selectedCustomerId={activeCustId}
            onSelectCustomer={(cust) => setActiveCustId(cust.id)}
          />

          <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
            Task / Service Title *
            <input
              required
              className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility"
              placeholder="e.g. Caste Certificate, PAN Renewal, Gazette..."
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-space-xs">
            <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
              Initial Stage
              <select
                className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility cursor-pointer"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="done">Done / Ready</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
              Target Completion Date
              <input
                className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility"
                placeholder="e.g. 05 Nov"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
            Status Remark / Note
            <input
              className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility"
              placeholder="e.g. Awaiting customer photo copy"
              type="text"
              value={subStatus}
              onChange={(e) => setSubStatus(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-space-xs">
            <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
              Billing Amount (₹)
              <input
                className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility"
                placeholder="e.g. 500"
                type="number"
                value={billingAmount}
                onChange={(e) => setBillingAmount(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
              Amount Paid (₹)
              <input
                className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility"
                placeholder="e.g. 200"
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
              />
            </label>
          </div>

          {billingAmount ? (
            <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/60 flex items-center justify-between text-xs font-medium">
              <span className="text-on-surface-variant">Calculated Due Balance:</span>
              <span className={`font-bold font-mono ${
                (Number(billingAmount) - (Number(amountPaid) || 0)) > 0
                  ? 'text-tertiary'
                  : 'text-secondary'
              }`}>
                ₹{Math.max(0, (Number(billingAmount) || 0) - (Number(amountPaid) || 0))}
              </span>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-space-xs">
            <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
              Billing Status
              <select
                className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility cursor-pointer"
                value={billingStatus}
                onChange={(e) => setBillingStatus(e.target.value as 'paid' | 'unpaid' | 'pending')}
              >
                <option value="pending">Pending</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
            Schedule Date & Time
            <input
              className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility"
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
          </label>

          <div className="flex items-center justify-end gap-space-sm mt-space-xs pt-space-xs border-t border-surface-container">
            <button
              className="px-space-md py-2 rounded-full text-on-surface-variant hover:bg-surface-container font-button-utility text-button-utility"
              onClick={() => setIsAddTaskOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="px-space-md py-2 rounded-full bg-primary-container hover:bg-primary transition-all active:scale-95 text-on-primary font-button-utility text-button-utility font-medium shadow-sm"
              type="submit"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
