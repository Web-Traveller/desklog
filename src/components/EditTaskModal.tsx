import React, { useState, useEffect } from 'react';
import { useDesk } from '../context/DeskContext';
import { TaskStatus } from '../types';
import { formatRupees, rupeesToPaise, paiseToRupees } from '../utils/currencyUtils';
import { CLIENT_WORK_TYPES } from '../constants/bankingData';

export const EditTaskModal: React.FC = () => {
  const { isEditTaskOpen, setIsEditTaskOpen, selectedTaskToEdit, updateTask, payments, addPayment, showToast } = useDesk();
  const [title, setTitle] = useState('');
  const [workType, setWorkType] = useState('');
  const [trackerId, setTrackerId] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [status, setStatus] = useState<TaskStatus>('PENDING');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [billingAmount, setBillingAmount] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  
  // Computed derived state
  const taskPayments = selectedTaskToEdit ? payments.filter(p => p.task_id === selectedTaskToEdit.id) : [];
  const totalPaid = taskPayments.reduce((acc, curr) => acc + curr.amount, 0);

  useEffect(() => {
    if (selectedTaskToEdit) {
      setTitle(selectedTaskToEdit.title || '');
      setWorkType(selectedTaskToEdit.work_type || '');
      setTrackerId(selectedTaskToEdit.tracker_id || '');
      setDocumentNumber(selectedTaskToEdit.document_number || '');
      setStatus(selectedTaskToEdit.status || 'PENDING');
      setTargetDate(selectedTaskToEdit.target_date || '');
      setNotes(selectedTaskToEdit.notes || '');
      setBillingAmount(selectedTaskToEdit.billing_amount ? paiseToRupees(selectedTaskToEdit.billing_amount).toString() : '');
      setScheduleDate(selectedTaskToEdit.scheduled_date || '');
      setNewPaymentAmount('');
      setFieldErrors({});
    }
  }, [selectedTaskToEdit]);

  if (!isEditTaskOpen || !selectedTaskToEdit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors: Record<string, string> = {};
    if (!title.trim()) {
      errors.title = 'Please enter a task title.';
    }

    const numBilling = billingAmount ? Number(billingAmount) : 0;
    if (billingAmount && (isNaN(numBilling) || numBilling < 0)) {
      errors.billingAmount = 'Billing amount must be a valid positive number.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = Object.values(errors)[0];
      showToast(firstError, 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTask(selectedTaskToEdit.id, {
        title: title.trim(),
        work_type: workType.trim() || undefined,
        tracker_id: trackerId.trim() || undefined,
        document_number: documentNumber.trim() || undefined,
        status,
        target_date: targetDate || undefined,
        notes: notes.trim(),
        billing_amount: billingAmount ? rupeesToPaise(numBilling) : undefined,
        scheduled_date: scheduleDate || undefined,
      });

      setFieldErrors({});
      setIsEditTaskOpen(false);
    } catch (err) {
      console.error('Failed to update task:', err);
      showToast('Failed to update task. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPayment = async () => {
    if (!newPaymentAmount || isAddingPayment) return;
    const numPay = Number(newPaymentAmount);
    if (isNaN(numPay) || numPay <= 0) {
      setFieldErrors(prev => ({ ...prev, newPaymentAmount: 'Payment amount must be greater than zero.' }));
      showToast('Payment amount must be a valid number greater than zero.', 'warning');
      return;
    }

    const amountPaise = rupeesToPaise(numPay);
    setIsAddingPayment(true);
    try {
      await addPayment({
        task_id: selectedTaskToEdit.id,
        amount: amountPaise,
      });
      setNewPaymentAmount('');
      setFieldErrors(prev => {
        const copy = { ...prev };
        delete copy.newPaymentAmount;
        return copy;
      });
    } catch (err) {
      console.error('Failed to add payment:', err);
      showToast('Failed to record payment.', 'error');
    } finally {
      setIsAddingPayment(false);
    }
  };

  const currentBillingPaise = rupeesToPaise(billingAmount);
  const duePaise = Math.max(0, currentBillingPaise - totalPaid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-2xl max-w-2xl w-full border border-surface-container/60 flex flex-col gap-space-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-xl">edit</span>
            <h3 className="font-tagline text-tagline font-semibold text-on-surface">
              Edit Task & Work Order
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs">
            {/* Work Type */}
            <div className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
              <label>Work Type / Service Category</label>
              <input
                list="editWorkTypesList"
                className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility"
                placeholder="e.g. Domicile Income Certificate..."
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
              />
              <datalist id="editWorkTypesList">
                {CLIENT_WORK_TYPES.map((wt) => (
                  <option key={wt} value={wt} />
                ))}
              </datalist>
            </div>

            {/* Title */}
            <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
              Task Title *
              <input
                required
                className={`px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 font-button-utility text-button-utility font-semibold border ${
                  fieldErrors.title
                    ? 'border-red-500 ring-1 ring-red-500/20'
                    : 'border-transparent focus:ring-primary/20'
                }`}
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (fieldErrors.title) {
                    setFieldErrors(prev => {
                      const copy = { ...prev };
                      delete copy.title;
                      return copy;
                    });
                  }
                }}
              />
              {fieldErrors.title && (
                <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-xs">error</span>
                  {fieldErrors.title}
                </p>
              )}
            </label>
          </div>

          {/* Tracker ID and Document Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs">
            <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
              Tracker ID / Application Ack No.
              <input
                className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. 2652141921251500472375"
                type="text"
                value={trackerId}
                onChange={(e) => setTrackerId(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
              Document Number / Certificate No.
              <input
                className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. Issued Doc No. or Token No."
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
              />
            </label>
          </div>

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
                className={`px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 font-button-utility text-button-utility border ${
                  fieldErrors.billingAmount
                    ? 'border-red-500 ring-1 ring-red-500/20'
                    : 'border-transparent focus:ring-primary/20'
                }`}
                type="number"
                value={billingAmount}
                onChange={(e) => {
                  setBillingAmount(e.target.value);
                  if (fieldErrors.billingAmount) {
                    setFieldErrors(prev => {
                      const copy = { ...prev };
                      delete copy.billingAmount;
                      return copy;
                    });
                  }
                }}
              />
              {fieldErrors.billingAmount && (
                <p className="text-[10px] text-red-500 font-medium flex items-center gap-0.5 mt-0.5">
                  <span className="material-symbols-outlined text-[11px]">error</span>
                  {fieldErrors.billingAmount}
                </p>
              )}
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
            <h4 className="font-semibold text-on-surface text-sm">Payments & Balance (Udhari)</h4>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-on-surface-variant">Total Billed: {formatRupees(currentBillingPaise)}</span>
              <span className="text-secondary font-bold text-emerald-600 dark:text-emerald-400">Total Paid: {formatRupees(totalPaid)}</span>
              <span className="text-tertiary font-bold text-amber-600 dark:text-amber-400">
                Pending Due: {formatRupees(duePaise)}
              </span>
            </div>
            
            {taskPayments.map(p => (
              <div key={p.id} className="flex justify-between items-center text-xs py-1 border-t border-surface-container-high/40 text-on-surface-variant font-mono">
                <span>Payment</span>
                <span>{formatRupees(p.amount)}</span>
              </div>
            ))}

            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  placeholder="Amount (₹)"
                  className={`flex-1 px-space-md py-2 rounded-lg bg-surface-container text-on-surface focus:outline-none focus:ring-2 font-button-utility text-xs border ${
                    fieldErrors.newPaymentAmount
                      ? 'border-red-500 ring-1 ring-red-500/20'
                      : 'border-transparent focus:ring-primary/20'
                  }`}
                  value={newPaymentAmount}
                  onChange={(e) => {
                    setNewPaymentAmount(e.target.value);
                    if (fieldErrors.newPaymentAmount) {
                      setFieldErrors(prev => {
                        const copy = { ...prev };
                        delete copy.newPaymentAmount;
                        return copy;
                      });
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddPayment}
                  disabled={isAddingPayment}
                  className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-button-utility text-xs transition-all active:scale-95 shadow-sm disabled:opacity-50"
                >
                  {isAddingPayment ? 'Adding...' : 'Add Payment'}
                </button>
              </div>
              {fieldErrors.newPaymentAmount && (
                <p className="text-[10px] text-red-500 font-medium flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[11px]">error</span>
                  {fieldErrors.newPaymentAmount}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-space-sm mt-space-xs pt-space-xs border-t border-surface-container">
            <button
              className="px-space-md py-2 rounded-full text-on-surface-variant hover:bg-surface-container font-button-utility text-button-utility"
              onClick={() => setIsEditTaskOpen(false)}
              disabled={isSubmitting}
              type="button"
            >
              Cancel
            </button>
            <button
              className="px-space-md py-2 rounded-full bg-primary-container hover:bg-primary transition-all active:scale-95 text-on-primary font-button-utility text-button-utility font-medium shadow-sm disabled:opacity-50"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
