import React, { useState, useEffect } from 'react';
import { useDesk } from '../context/DeskContext';
import { Customer } from '../types';

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
  const { editCustomer } = useDesk();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.mobile || '');
      setNotes(customer.note || '');
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    editCustomer(customer.id, {
      name: name.trim(),
      mobile: phone.trim(),
      note: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4 animate-fadeIn">
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
            Full Name
            <input
              required
              className="px-space-md py-2 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
            Mobile Number
            <input
              required
              className="px-space-md py-2 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
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
              type="button"
            >
              Cancel
            </button>
            <button
              className="px-space-md py-1.5 rounded-full bg-primary-container text-on-primary font-button-utility text-button-utility font-medium shadow-sm hover:bg-primary transition-all"
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
