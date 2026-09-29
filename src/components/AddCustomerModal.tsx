import React, { useState } from 'react';
import { useDesk } from '../context/DeskContext';

export const AddCustomerModal: React.FC = () => {
  const {
    isAddCustomerOpen,
    setIsAddCustomerOpen,
    addCustomer,
    customers,
    navigateToCustomerProfile,
    setIsAddTaskOpen,
  } = useDesk();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  if (!isAddCustomerOpen) return null;

  // Check for duplicate phone number
  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const existingCustomer = cleanPhone.length >= 7
    ? customers.find((c) => c.id !== 'cust-general' && c.phone.replace(/\s+/g, '').includes(cleanPhone))
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      isVerified: true,
      notes: notes.trim(),
    });

    setName('');
    setPhone('');
    setNotes('');
    setIsAddCustomerOpen(false);
  };

  const handleRedirectExisting = () => {
    if (existingCustomer) {
      setIsAddCustomerOpen(false);
      setName('');
      setPhone('');
      setNotes('');
      navigateToCustomerProfile(existingCustomer.id);
      setIsAddTaskOpen(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-2xl max-w-xl w-full border border-surface-container/60 flex flex-col gap-space-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-xl">person_add</span>
            <h3 className="font-tagline text-tagline font-semibold text-on-surface">
              Add New Customer
            </h3>
          </div>
          <button
            className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
            onClick={() => setIsAddCustomerOpen(false)}
            type="button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Duplicate Phone Banner Warning */}
        {existingCustomer && (
          <div className="p-3 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex flex-col gap-2 border border-tertiary/20">
            <div className="flex items-center gap-2 font-caption-strong text-caption-strong">
              <span className="material-symbols-outlined text-tertiary text-lg">warning</span>
              <span>Customer already exists!</span>
            </div>
            <p className="font-fine-print text-fine-print">
              Mobile number <strong className="font-mono">{existingCustomer.phone}</strong> is enrolled under{' '}
              <strong>{existingCustomer.name}</strong>.
            </p>
            <button
              className="mt-1 px-3 py-1.5 rounded-lg bg-tertiary text-on-tertiary font-button-utility text-button-utility font-semibold flex items-center justify-center gap-1 transition-all active:scale-95"
              onClick={handleRedirectExisting}
              type="button"
            >
              <span>View {existingCustomer.name}&apos;s Profile & Add Task →</span>
            </button>
          </div>
        )}

        <form className="flex flex-col gap-space-sm" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
            Full Name *
            <input
              required
              className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility"
              placeholder="e.g. Ramesh V. Sharma"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
            Mobile Number *
            <input
              required
              className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility"
              placeholder="e.g. +91 98200 12345"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
            Desk Notes / Remarks
            <textarea
              className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility resize-none"
              placeholder="e.g. Regular customer for document filings"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </label>

          <div className="flex items-center justify-end gap-space-sm mt-space-xs pt-space-xs border-t border-surface-container">
            <button
              className="px-space-md py-2 rounded-full text-on-surface-variant hover:bg-surface-container font-button-utility text-button-utility"
              onClick={() => setIsAddCustomerOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="px-space-md py-2 rounded-full bg-primary-container hover:bg-primary transition-all active:scale-95 text-on-primary font-button-utility text-button-utility font-medium shadow-sm"
              type="submit"
            >
              Save Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
