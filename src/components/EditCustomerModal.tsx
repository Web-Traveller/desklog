import React, { useState, useEffect } from 'react';
import { useDesk } from '../context/DeskContext';
import { Customer } from '../types';
import { validateMobileNumber, validateAadhaarNumber } from '../utils/validationUtils';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface EditCustomerModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  customer,
  isOpen,
  onClose,
}) => {
  const { editCustomer, showToast } = useDesk();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [notes, setNotes] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.mobile || '');
      setAadhaar(customer.aadhaar_number || '');
      setNotes(customer.note || '');
      setFieldErrors({});
    }
  }, [customer]);

  useBodyScrollLock(isOpen);

  if (!isOpen || !customer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors: Record<string, string> = {};
    if (!name.trim()) {
      errors.name = 'Customer name is required.';
    }

    // Mobile validation
    const phoneValidation = validateMobileNumber(phone);
    if (!phoneValidation.valid) {
      errors.phone = phoneValidation.error!;
    }

    // Aadhaar validation
    if (aadhaar.trim()) {
      const aadhaarValidation = validateAadhaarNumber(aadhaar);
      if (!aadhaarValidation.valid) {
        errors.aadhaar = aadhaarValidation.error!;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = Object.values(errors)[0];
      showToast(firstError, 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await editCustomer(customer.id, {
        name: name.trim(),
        mobile: phone.trim(),
        aadhaar_number: aadhaar.trim(),
        note: notes.trim(),
      });
      setFieldErrors({});
      onClose();
    } catch (err) {
      console.error('Failed to update customer:', err);
      showToast('Failed to update customer profile. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4 animate-fadeIn overscroll-contain">
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-2xl max-w-xl w-full border border-surface-container/60 flex flex-col gap-space-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
          <h3 className="font-tagline text-tagline font-semibold text-on-surface">
            Edit Customer Details
          </h3>
          <button
            className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form className="flex flex-col gap-space-sm" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
            Full Name *
            <input
              required
              className={`px-space-md py-2 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 font-button-utility text-button-utility border ${
                fieldErrors.name
                  ? 'border-red-500 ring-1 ring-red-500/20'
                  : 'border-transparent focus:ring-primary/20'
              }`}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) {
                  setFieldErrors(prev => {
                    const copy = { ...prev };
                    delete copy.name;
                    return copy;
                  });
                }
              }}
            />
            {fieldErrors.name && (
              <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-xs">error</span>
                {fieldErrors.name}
              </p>
            )}
          </label>

          <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
            Mobile Number *
            <input
              required
              maxLength={10}
              className={`px-space-md py-2 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 font-button-utility text-button-utility font-mono border ${
                fieldErrors.phone
                  ? 'border-red-500 ring-1 ring-red-500/20'
                  : 'border-transparent focus:ring-primary/20'
              }`}
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (fieldErrors.phone) {
                  setFieldErrors(prev => {
                    const copy = { ...prev };
                    delete copy.phone;
                    return copy;
                  });
                }
              }}
            />
            {fieldErrors.phone && (
              <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-xs">error</span>
                {fieldErrors.phone}
              </p>
            )}
          </label>

          <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
            Aadhaar Number
            <input
              maxLength={14}
              className={`px-space-md py-2 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 font-button-utility text-button-utility font-mono border ${
                fieldErrors.aadhaar
                  ? 'border-red-500 ring-1 ring-red-500/20'
                  : 'border-transparent focus:ring-primary/20'
              }`}
              placeholder="12-digit Aadhaar"
              type="text"
              value={aadhaar}
              onChange={(e) => {
                setAadhaar(e.target.value);
                if (fieldErrors.aadhaar) {
                  setFieldErrors(prev => {
                    const copy = { ...prev };
                    delete copy.aadhaar;
                    return copy;
                  });
                }
              }}
            />
            {fieldErrors.aadhaar && (
              <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-xs">error</span>
                {fieldErrors.aadhaar}
              </p>
            )}
          </label>

          <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
            Desk Note / Remarks
            <textarea
              className="px-space-md py-2 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility resize-none"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          <div className="flex items-center justify-end gap-space-sm mt-space-xs pt-space-xs border-t border-surface-container">
            <button
              className="px-space-md py-1.5 rounded-full text-on-surface-variant hover:bg-surface-container font-button-utility text-button-utility"
              onClick={onClose}
              disabled={isSubmitting}
              type="button"
            >
              Cancel
            </button>
            <button
              className="px-space-md py-1.5 rounded-full bg-primary-container text-on-primary font-button-utility text-button-utility font-medium shadow-sm hover:bg-primary transition-all disabled:opacity-50"
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
