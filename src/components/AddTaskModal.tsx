import React, { useState } from 'react';
import { useDesk } from '../context/DeskContext';
import { TaskStatus } from '../types';
import { CustomerSearchPicker } from './CustomerSearchPicker';
import { rupeesToPaise, paiseToRupees } from '../utils/currencyUtils';
import { CLIENT_WORK_TYPES } from '../constants/bankingData';

export const AddTaskModal: React.FC = () => {
  const { isAddTaskOpen, setIsAddTaskOpen, customers, selectedCustomerId, addTask, services, showToast } = useDesk();
  const [activeCustId, setActiveCustId] = useState<string>(selectedCustomerId || 'cust-general');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [workType, setWorkType] = useState<string>('');
  const [title, setTitle] = useState('');
  const [trackerId, setTrackerId] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [status, setStatus] = useState<TaskStatus>('PENDING');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [pendingAmount, setPendingAmount] = useState('');
  const [billingAmount, setBillingAmount] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAddTaskOpen) return null;

  const handleWorkTypeChange = (val: string) => {
    setWorkType(val);
    if (!title || CLIENT_WORK_TYPES.includes(title)) {
      setTitle(val);
      if (fieldErrors.title) {
        setFieldErrors(prev => {
          const copy = { ...prev };
          delete copy.title;
          return copy;
        });
      }
    }
  };

  const handlePaidChange = (val: string) => {
    setPaidAmount(val);
    if (fieldErrors.paidAmount) {
      setFieldErrors(prev => {
        const copy = { ...prev };
        delete copy.paidAmount;
        return copy;
      });
    }
    const p = parseFloat(val) || 0;
    const pend = parseFloat(pendingAmount) || 0;
    if (p > 0 || pend > 0) {
      setBillingAmount(String(p + pend));
      if (fieldErrors.billingAmount) {
        setFieldErrors(prev => {
          const copy = { ...prev };
          delete copy.billingAmount;
          return copy;
        });
      }
    }
  };

  const handlePendingChange = (val: string) => {
    setPendingAmount(val);
    const p = parseFloat(paidAmount) || 0;
    const pend = parseFloat(val) || 0;
    if (p > 0 || pend > 0) {
      setBillingAmount(String(p + pend));
      if (fieldErrors.billingAmount) {
        setFieldErrors(prev => {
          const copy = { ...prev };
          delete copy.billingAmount;
          return copy;
        });
      }
    }
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const svcId = e.target.value;
    setSelectedServiceId(svcId);
    
    if (svcId) {
      const svc = services.find(s => s.id === svcId);
      if (svc && svc.default_price !== undefined) {
        const rup = paiseToRupees(svc.default_price).toString();
        setBillingAmount(rup);
        setPendingAmount(rup);
        if (fieldErrors.billingAmount) {
          setFieldErrors(prev => {
            const copy = { ...prev };
            delete copy.billingAmount;
            return copy;
          });
        }
        if (!title) {
          setTitle(svc.name);
          if (fieldErrors.title) {
            setFieldErrors(prev => {
              const copy = { ...prev };
              delete copy.title;
              return copy;
            });
          }
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors: Record<string, string> = {};
    if (!title.trim()) {
      errors.title = 'Please enter a task title or description.';
    }

    const numBilling = billingAmount ? Number(billingAmount) : 0;
    if (billingAmount && (isNaN(numBilling) || numBilling < 0)) {
      errors.billingAmount = 'Billing amount must be a valid positive number.';
    }

    const numPaid = paidAmount ? Number(paidAmount) : 0;
    if (paidAmount && (isNaN(numPaid) || numPaid < 0)) {
      errors.paidAmount = 'Paid advance amount must be a valid positive number.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = Object.values(errors)[0];
      showToast(firstError, 'warning');
      return;
    }

    const customer = customers.find((c) => c.id === activeCustId) ||
      customers.find((c) => c.id === 'cust-general') ||
      customers[0];

    const paidPaise = paidAmount ? rupeesToPaise(numPaid) : undefined;

    setIsSubmitting(true);
    try {
      const created = await addTask(
        {
          customer_id: customer.id,
          service_id: selectedServiceId || undefined,
          work_type: workType.trim() || undefined,
          tracker_id: trackerId.trim() || undefined,
          document_number: documentNumber.trim() || undefined,
          title: title.trim(),
          status,
          target_date: targetDate || undefined,
          notes: notes.trim(),
          billing_amount: billingAmount ? rupeesToPaise(numBilling) : undefined,
          scheduled_date: scheduleDate || undefined,
        },
        paidPaise
      );

      if (created) {
        setTitle('');
        setWorkType('');
        setTrackerId('');
        setDocumentNumber('');
        setStatus('PENDING');
        setSelectedServiceId('');
        setTargetDate('');
        setNotes('');
        setPaidAmount('');
        setPendingAmount('');
        setBillingAmount('');
        setScheduleDate('');
        setFieldErrors({});
        setIsAddTaskOpen(false);
      }
    } catch (err) {
      console.error('Failed to create task:', err);
      showToast('Failed to create task. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-2xl max-w-2xl w-full border border-surface-container/60 flex flex-col gap-space-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-xl">add_task</span>
            <div>
              <h3 className="font-tagline text-tagline font-semibold text-on-surface">
                Create Desk Task / Work Order
              </h3>
              <p className="text-fine-print text-outline">
                Record citizen service, application tracker, or document request
              </p>
            </div>
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
            label="Customer Name *"
            selectedCustomerId={activeCustId}
            onSelectCustomer={(cust) => setActiveCustId(cust.id)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs">
            {/* Work Type with Datalist */}
            <div className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
              <label>Work Type / Service Category</label>
              <input
                list="workTypesList"
                className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility"
                placeholder="e.g. Domicile Certificate, PAN Card..."
                value={workType}
                onChange={(e) => handleWorkTypeChange(e.target.value)}
              />
              <datalist id="workTypesList">
                {CLIENT_WORK_TYPES.map((wt) => (
                  <option key={wt} value={wt} />
                ))}
              </datalist>
            </div>

            {/* Service catalog type */}
            <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
              Linked Catalog Service (Optional)
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
          </div>

          {/* Task Title */}
          <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
            Task Title / Description *
            <input
              required
              className={`px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 font-button-utility text-button-utility font-semibold border ${
                fieldErrors.title
                  ? 'border-red-500 ring-1 ring-red-500/20'
                  : 'border-transparent focus:ring-primary/20'
              }`}
              placeholder="e.g. Domicile Income Certificate..."
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

          {/* TRAKER ID & Document Number */}
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

          {/* Paid, Pending (Udhari), and Total Split */}
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container/60 flex flex-col gap-2">
            <span className="text-fine-print font-bold text-on-surface">Payment & Balance Tracking (₹)</span>
            <div className="grid grid-cols-3 gap-2">
              <label className="flex flex-col gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Advance Paid (₹)
                <input
                  className={`px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-mono text-xs border focus:outline-none focus:ring-2 ${
                    fieldErrors.paidAmount
                      ? 'border-red-500 ring-1 ring-red-500/20'
                      : 'border-surface-container focus:ring-emerald-500/20'
                  }`}
                  placeholder="0"
                  type="number"
                  step="any"
                  value={paidAmount}
                  onChange={(e) => handlePaidChange(e.target.value)}
                />
                {fieldErrors.paidAmount && (
                  <p className="text-[10px] text-red-500 font-medium flex items-center gap-0.5 mt-0.5">
                    <span className="material-symbols-outlined text-[11px]">error</span>
                    {fieldErrors.paidAmount}
                  </p>
                )}
              </label>

              <label className="flex flex-col gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                Pending / Udhari (₹)
                <input
                  className="px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-mono text-xs border border-surface-container focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  placeholder="0"
                  type="number"
                  step="any"
                  value={pendingAmount}
                  onChange={(e) => handlePendingChange(e.target.value)}
                />
              </label>

              <label className="flex flex-col gap-1 text-[11px] font-bold text-on-surface">
                Total Billing (₹)
                <input
                  className={`px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-mono font-bold text-xs border focus:outline-none focus:ring-2 ${
                    fieldErrors.billingAmount
                      ? 'border-red-500 ring-1 ring-red-500/20'
                      : 'border-surface-container focus:ring-primary/20'
                  }`}
                  placeholder="0"
                  type="number"
                  step="any"
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
            </div>
          </div>

          <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
            Remark / Notes
            <input
              className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility"
              placeholder="e.g. All Amount Add Udhari Nitin, token note..."
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          <div className="flex items-center justify-end gap-space-sm mt-space-xs pt-space-xs border-t border-surface-container">
            <button
              className="px-space-md py-2 rounded-full text-on-surface-variant hover:bg-surface-container font-button-utility text-button-utility"
              onClick={() => setIsAddTaskOpen(false)}
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
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
