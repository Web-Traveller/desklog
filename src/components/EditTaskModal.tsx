import React, { useState, useEffect } from 'react';
import { useDesk } from '../context/DeskContext';
import { TaskStatus } from '../types';

export const EditTaskModal: React.FC = () => {
  const { isEditTaskOpen, setIsEditTaskOpen, selectedTaskToEdit, updateTask, payments, addPayment } = useDesk();
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<TaskStatus>('PENDING');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [billingAmount, setBillingAmount] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  
  // Computed derived state
  const taskPayments = selectedTaskToEdit ? payments.filter(p => p.task_id === selectedTaskToEdit.id) : [];
  const totalPaid = taskPayments.reduce((acc, curr) => acc + curr.amount, 0);

  useEffect(() => {
    if (selectedTaskToEdit) {
      setTitle(selectedTaskToEdit.title || '');
      setStatus(selectedTaskToEdit.status || 'PENDING');
      setTargetDate(selectedTaskToEdit.target_date || '');
      setNotes(selectedTaskToEdit.notes || '');
      setBillingAmount(selectedTaskToEdit.billing_amount ? selectedTaskToEdit.billing_amount.toString() : '');
      setScheduleDate(selectedTaskToEdit.scheduled_date || '');
      setNewPaymentAmount('');
    }
  }, [selectedTaskToEdit]);

  if (!isEditTaskOpen || !selectedTaskToEdit) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    updateTask(selectedTaskToEdit.id, {
      title: title.trim(),
      status,
      target_date: targetDate || undefined,
      notes: notes.trim(),
      billing_amount: billingAmount ? Number(billingAmount) : undefined,
      scheduled_date: scheduleDate || undefined,
    });

    setIsEditTaskOpen(false);
  };

  const handleAddPayment = async () => {
    if (!newPaymentAmount) return;
    const amount = Number(newPaymentAmount);
    if (amount <= 0) return;
    
    await addPayment({
      task_id: selectedTaskToEdit.id,
      amount,
    });
    
    setNewPaymentAmount('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-2xl max-w-2xl w-full border border-surface-container/60 flex flex-col gap-space-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-xl">edit</span>
            <h3 className="font-tagline text-tagline font-semibold text-on-surface">
              Edit Task & Payments
            </h3>
          </div>
          <button
            className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
            onClick={() => setIsEditTaskOpen(false)}
            type="button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form className="flex flex-col gap-space-sm" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
            Task Title *
            <input
              required
              className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-space-xs">
            <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
              Status
              <select
                className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility cursor-pointer"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              >
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="READY">Ready</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
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
                type="number"
                value={billingAmount}
                onChange={(e) => setBillingAmount(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
              Schedule Date & Time
              <input
                className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility"
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </label>
          </div>
          
          <div className="mt-space-sm p-space-md rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-space-xs">
            <h4 className="font-semibold text-on-surface text-sm">Payments Activity</h4>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-on-surface-variant">Total Billed: ₹{billingAmount || 0}</span>
              <span className="text-secondary font-bold">Total Paid: ₹{totalPaid.toFixed(2)}</span>
              <span className="text-tertiary font-bold">
                Due: ₹{Math.max(0, (Number(billingAmount) || 0) - totalPaid).toFixed(2)}
              </span>
            </div>
            
            {taskPayments.map(p => (
              <div key={p.id} className="flex justify-between items-center text-xs py-1 border-t border-surface-container-high/40 text-on-surface-variant">
                <span>Payment</span>
                <span>₹{p.amount.toFixed(2)}</span>
              </div>
            ))}

            <div className="flex items-center gap-2 mt-2">
              <input 
                type="number"
                placeholder="Amount (₹)"
                className="flex-1 px-space-md py-2 rounded-lg bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-xs"
                value={newPaymentAmount}
                onChange={(e) => setNewPaymentAmount(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAddPayment}
                className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-button-utility text-xs transition-all active:scale-95 shadow-sm"
              >
                Add Payment
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-space-sm mt-space-xs pt-space-xs border-t border-surface-container">
            <button
              className="px-space-md py-2 rounded-full text-on-surface-variant hover:bg-surface-container font-button-utility text-button-utility"
              onClick={() => setIsEditTaskOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="px-space-md py-2 rounded-full bg-primary-container hover:bg-primary transition-all active:scale-95 text-on-primary font-button-utility text-button-utility font-medium shadow-sm"
              type="submit"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
