import React, { useState } from 'react';
import { useDesk } from '../context/DeskContext';
import { TaskStatus } from '../types';
import { CustomerSearchPicker } from './CustomerSearchPicker';

export const AddTaskModal: React.FC = () => {
  const { isAddTaskOpen, setIsAddTaskOpen, customers, selectedCustomerId, addTask, services } = useDesk();
  const [activeCustId, setActiveCustId] = useState<string>(selectedCustomerId || 'cust-general');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<TaskStatus>('PENDING');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [billingAmount, setBillingAmount] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');

  if (!isAddTaskOpen) return null;

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const svcId = e.target.value;
    setSelectedServiceId(svcId);
    
    if (svcId) {
      const svc = services.find(s => s.id === svcId);
      if (svc && svc.default_price !== undefined) {
        setBillingAmount(svc.default_price.toString());
        if (!title) {
          setTitle(svc.name);
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const customer = customers.find((c) => c.id === activeCustId) ||
      customers.find((c) => c.id === 'cust-general') ||
      customers[0];

    addTask({
      customer_id: customer.id,
      service_id: selectedServiceId || undefined,
      title: title.trim(),
      status,
      target_date: targetDate || undefined,
      notes: notes.trim(),
      billing_amount: billingAmount ? Number(billingAmount) : undefined,
      scheduled_date: scheduleDate || undefined,
    });

    setTitle('');
    setStatus('PENDING');
    setSelectedServiceId('');
    setTargetDate('');
    setNotes('');
    setBillingAmount('');
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
          <CustomerSearchPicker
            customers={customers}
            label="Select Customer / Walk-in Client *"
            selectedCustomerId={activeCustId}
            onSelectCustomer={(cust) => setActiveCustId(cust.id)}
          />

          <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
            Service Type (Optional)
            <select
              className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility cursor-pointer"
              value={selectedServiceId}
              onChange={handleServiceChange}
            >
              <option value="">-- Custom / No Service --</option>
              {services.filter(s => s.is_active).map(svc => (
                <option key={svc.id} value={svc.id}>{svc.name}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
            Task Title *
            <input
              required
              className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility"
              placeholder="e.g. Caste Certificate..."
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
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="READY">Ready</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
              Target Completion Date
              <input
                className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
            Notes / Remarks
            <input
              className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility"
              placeholder="e.g. Awaiting docs"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              Schedule Date
              <input
                className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility"
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </label>
          </div>

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
