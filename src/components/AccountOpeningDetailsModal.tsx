import React, { useState } from 'react';
import { BankAccountOpening } from '../types';
import { Modal } from './Modal';
import { StatusBadge } from './StatusBadge';

interface AccountOpeningDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: BankAccountOpening | null;
  onEdit?: (account: BankAccountOpening) => void;
}

export const AccountOpeningDetailsModal: React.FC<AccountOpeningDetailsModalProps> = ({
  isOpen,
  onClose,
  account,
  onEdit,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!account) return null;

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Format Aadhaar in 4-4-4 spacing
  const formatFullAadhaar = (num?: string) => {
    if (!num) return 'Not Linked';
    const clean = num.replace(/\D/g, '');
    if (clean.length === 12) {
      return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)}`;
    }
    return num;
  };

  const fullAddress = [
    account.mailing_address,
    account.area,
    account.city,
    account.state,
    account.zip,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon="account_balance"
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2">
          <span>{account.customer_name}</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-surface-container text-on-surface">
            {account.scheme}
          </span>
        </div>
      }
      subtitle={`Account #${account.account_number} • Opened on ${account.account_date || 'N/A'}`}
      headerRight={
        <StatusBadge status={account.kyc_status || 'Verified'} size="sm" />
      }
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(account);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              <span>Edit Account</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-outline hover:text-on-surface rounded-xl transition"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Key Banking Identifiers Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-outline">
              Bank Account Number
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-mono font-bold text-on-surface tracking-wider">
                {account.account_number}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(account.account_number, 'acc')}
                className="p-1 text-outline hover:text-primary transition"
                title="Copy Account Number"
              >
                <span className="material-symbols-outlined text-sm">
                  {copiedField === 'acc' ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-outline">
              Bank Customer ID (CIF)
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-base font-mono font-semibold text-on-surface">
                {account.bank_customer_id || 'Not Provided'}
              </span>
              {account.bank_customer_id && (
                <button
                  type="button"
                  onClick={() => handleCopy(account.bank_customer_id || '', 'cif')}
                  className="p-1 text-outline hover:text-primary transition"
                  title="Copy CIF"
                >
                  <span className="material-symbols-outlined text-sm">
                    {copiedField === 'cif' ? 'check' : 'content_copy'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {account.passbook_number && (
            <div className="sm:col-span-2 pt-2 border-t border-surface-container/50 flex items-center justify-between text-xs">
              <span className="text-outline">Passbook / Issued Kit No:</span>
              <span className="font-mono font-semibold text-on-surface">
                {account.passbook_number}
              </span>
            </div>
          )}
        </div>

        {/* Customer & Personal Information */}
        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container/70 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
            <span className="material-symbols-outlined text-sm text-primary">person</span>
            <span>Customer Profile</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-outline block text-[11px]">Full Name</span>
              <span className="font-semibold text-on-surface mt-0.5 block">
                {account.customer_name}
              </span>
            </div>

            <div>
              <span className="text-outline block text-[11px]">Mobile Number</span>
              <span className="font-mono font-medium text-on-surface mt-0.5 block">
                {account.mobile_number || 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-outline block text-[11px]">Date of Birth</span>
              <span className="text-on-surface mt-0.5 block">
                {account.dob || 'Not Recorded'}
              </span>
            </div>
          </div>
        </div>

        {/* Identity Verification Section */}
        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container/70 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
            <span className="material-symbols-outlined text-sm text-emerald-600">verified_user</span>
            <span>Identity Verification</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Aadhaar Card Number */}
            <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container/60">
              <span className="text-outline block text-[11px]">Aadhaar Number</span>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono font-bold text-sm text-on-surface tracking-wider">
                  {formatFullAadhaar(account.aadhaar_number)}
                </span>
                {account.aadhaar_number && (
                  <button
                    type="button"
                    onClick={() => handleCopy(account.aadhaar_number || '', 'aadhaar')}
                    className="p-1 text-outline hover:text-primary transition"
                    title="Copy Aadhaar"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {copiedField === 'aadhaar' ? 'check' : 'content_copy'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* PAN Card */}
            <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container/60">
              <span className="text-outline block text-[11px]">PAN Card</span>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono font-bold text-sm text-on-surface tracking-wider">
                  {account.pan_number || 'Not Submitted'}
                </span>
                {account.pan_number && (
                  <button
                    type="button"
                    onClick={() => handleCopy(account.pan_number || '', 'pan')}
                    className="p-1 text-outline hover:text-primary transition"
                    title="Copy PAN"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {copiedField === 'pan' ? 'check' : 'content_copy'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Address & Geographic Location */}
        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container/70 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
            <span className="material-symbols-outlined text-sm text-rose-500">location_on</span>
            <span>Mailing Address</span>
          </div>
          <p className="text-xs text-on-surface font-medium leading-relaxed">
            {fullAddress || 'No address provided'}
          </p>
        </div>

        {/* Financial Deposit & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container/60">
            <span className="text-outline text-[11px] block">Opening Deposit / Fee</span>
            <span className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              ₹{(((account.initial_deposit || 0)) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container/60">
            <span className="text-outline text-[11px] block">Visit / Notes</span>
            <span className="text-on-surface mt-0.5 block">
              {account.visit_type || 'Walk-in'} {account.notes ? `• ${account.notes}` : ''}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
