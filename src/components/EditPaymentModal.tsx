import React, { useState, useEffect } from 'react';
import { useDesk } from '../context/DeskContext';
import { Payment, Task, Customer } from '../types';
import { formatRupees, rupeesToPaise, paiseToRupees } from '../utils/currencyUtils';
import { Modal } from './Modal';

interface EditPaymentModalProps {
  payment: Payment | null;
  task?: Task;
  customer?: Customer;
  isOpen: boolean;
  onClose: () => void;
}

export const EditPaymentModal: React.FC<EditPaymentModalProps> = ({
  payment,
  task,
  customer,
  isOpen,
  onClose,
}) => {
  const { editPayment, deletePayment, showToast, showConfirm } = useDesk();
  const [amountRupees, setAmountRupees] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (payment && isOpen) {
      setAmountRupees(paiseToRupees(payment.amount).toString());

      // Format datetime-local input
      let dateVal = payment.created_at || '';
      if (dateVal.length >= 16) {
        try {
          const d = new Date(dateVal);
          if (!isNaN(d.getTime())) {
            const pad = (n: number) => String(n).padStart(2, '0');
            dateVal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          }
        } catch {}
      }
      setCreatedAt(dateVal);
    }
  }, [payment, isOpen]);

  if (!isOpen || !payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amountRupees);
    if (!amountRupees || isNaN(numAmount) || numAmount <= 0) {
      showToast('Payment amount must be a positive number greater than zero.', 'warning');
      return;
    }

    if (numAmount > 1000000) {
      showToast('Payment amount exceeds single-transaction ceiling of ₹10,00,000.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await editPayment(payment.id, {
        amount: rupeesToPaise(numAmount),
        created_at: createdAt ? new Date(createdAt).toISOString() : payment.created_at,
      });
      onClose();
    } catch (err) {
      console.error('Failed to update payment:', err);
      showToast('Failed to update payment record.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    showConfirm({
      title: 'Delete Payment Record',
      message: `Are you sure you want to void this payment of ${formatRupees(payment.amount)}? The task's outstanding balance (udhari) will increase accordingly.`,
      confirmText: 'Void Payment',
      variant: 'danger',
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          await deletePayment(payment.id);
          onClose();
        } catch (err) {
          console.error('Failed to delete payment:', err);
          showToast('Failed to delete payment record.', 'error');
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Payment Record"
      icon="payments"
      maxWidth="lg"
    >
      <div className="flex flex-col gap-space-md">
        {/* Linked Details Card */}
        <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container/60 flex flex-col gap-1.5 text-xs font-mono">
          <div className="flex justify-between items-center text-on-surface">
            <span className="text-outline font-sans">Customer:</span>
            <span className="font-bold font-sans">{customer?.name || 'Walk-in Client'}</span>
          </div>
          {customer?.mobile && (
            <div className="flex justify-between items-center text-on-surface-variant">
              <span className="text-outline font-sans">Mobile:</span>
              <span>{customer.mobile}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-on-surface">
            <span className="text-outline font-sans">Task / Service:</span>
            <span className="font-medium font-sans truncate max-w-[280px]">{task?.title || 'Desk Work Order'}</span>
          </div>
          {task?.billing_amount !== undefined && (
            <div className="flex justify-between items-center text-on-surface-variant pt-1 border-t border-surface-container/40">
              <span className="text-outline font-sans">Total Task Billing:</span>
              <span>{formatRupees(task.billing_amount)}</span>
            </div>
          )}
        </div>

        <form className="flex flex-col gap-space-sm" onSubmit={handleSubmit}>
          {/* Amount Input */}
          <div className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
            <label className="font-semibold text-on-surface">Payment Amount (₹) *</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-outline text-xs">₹</span>
              <input
                required
                type="number"
                step="any"
                min="0.01"
                placeholder="0.00"
                className="w-full pl-7 pr-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility font-bold text-sm"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
            <label className="font-semibold text-on-surface">Payment Date & Time</label>
            <input
              type="datetime-local"
              className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility text-xs"
              value={createdAt}
              onChange={(e) => setCreatedAt(e.target.value)}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-space-sm mt-space-xs pt-space-xs border-t border-surface-container">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-error hover:bg-error/10 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              <span>Void / Delete</span>
            </button>

            <div className="flex items-center gap-space-xs">
              <button
                className="px-space-md py-1.5 rounded-full text-on-surface-variant hover:bg-surface-container font-button-utility text-button-utility"
                onClick={onClose}
                disabled={isSubmitting}
                type="button"
              >
                Cancel
              </button>
              <button
                className="px-space-md py-1.5 rounded-full bg-primary text-on-primary font-button-utility text-button-utility font-medium shadow-sm hover:bg-primary-container transition-all disabled:opacity-50"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
