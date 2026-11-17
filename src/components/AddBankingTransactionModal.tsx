import React, { useState, useEffect, useRef } from 'react';
import { useDesk } from '../context/DeskContext';
import { Customer } from '../types';
import { rupeesToPaise } from '../utils/currencyUtils';
import {
  WORK_TYPES,
  getLearnedBanks,
  saveLearnedBank,
  getLearnedCompanies,
  saveLearnedCompany,
} from '../constants/bankingData';

interface AddBankingTransactionModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AddBankingTransactionModal: React.FC<AddBankingTransactionModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const { isAddBankingOpen, setIsAddBankingOpen, customers, addBankingTransaction, showToast } = useDesk();
  const isOpen = propIsOpen !== undefined ? propIsOpen : isAddBankingOpen;
  const onClose = propOnClose || (() => setIsAddBankingOpen(false));

  // Form State
  const [workType, setWorkType] = useState<string>('DMT');
  const [companyName, setCompanyName] = useState<string>('SAFEPAY');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerMobile, setCustomerMobile] = useState<string>('');
  const [accountOrAadhaar, setAccountOrAadhaar] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [charges, setCharges] = useState<string>('');
  const [commission, setCommission] = useState<string>('');
  const [status, setStatus] = useState<string>('SUCCESS');
  const [remark, setRemark] = useState<string>('');

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-general');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Autocomplete UI dropdown controls
  const [showBankSuggestions, setShowBankSuggestions] = useState<boolean>(false);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState<boolean>(false);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState<boolean>(false);

  const bankWrapperRef = useRef<HTMLDivElement>(null);
  const companyWrapperRef = useRef<HTMLDivElement>(null);
  const customerWrapperRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setWorkType('DMT');
      setCompanyName('SAFEPAY');
      setCustomerName('');
      setCustomerMobile('');
      setAccountOrAadhaar('');
      setBankName('');
      setAmount('');
      setCharges('');
      setCommission('');
      setStatus('SUCCESS');
      setRemark('');
      setSelectedCustomerId('cust-general');
      setShowBankSuggestions(false);
      setShowCompanySuggestions(false);
      setShowCustomerSuggestions(false);
    }
  }, [isOpen]);

  // Close autocomplete dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bankWrapperRef.current && !bankWrapperRef.current.contains(event.target as Node)) {
        setShowBankSuggestions(false);
      }
      if (companyWrapperRef.current && !companyWrapperRef.current.contains(event.target as Node)) {
        setShowCompanySuggestions(false);
      }
      if (customerWrapperRef.current && !customerWrapperRef.current.contains(event.target as Node)) {
        setShowCustomerSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // Filtered Autocomplete Lists
  const allBanks = getLearnedBanks();
  const filteredBanks = bankName.trim()
    ? allBanks.filter((b) => b.toLowerCase().includes(bankName.toLowerCase()))
    : allBanks.slice(0, 8);

  const allCompanies = getLearnedCompanies();
  const filteredCompanies = companyName.trim()
    ? allCompanies.filter((c) => c.toLowerCase().includes(companyName.toLowerCase()))
    : allCompanies.slice(0, 8);

  const matchingCustomers = customerName.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(customerName.toLowerCase()) ||
          (c.mobile && c.mobile.includes(customerName.trim()))
      ).slice(0, 5)
    : [];

  const handleSelectCustomer = (cust: Customer) => {
    setCustomerName(cust.name);
    setCustomerMobile(cust.mobile || '');
    setSelectedCustomerId(cust.id);
    if (cust.aadhaar_number && workType === 'AEPS') {
      setAccountOrAadhaar(cust.aadhaar_number);
    }
    setShowCustomerSuggestions(false);
  };

  const getAccountLabel = () => {
    switch (workType) {
      case 'AEPS':
        return 'Customer Aadhaar Number';
      case 'DMT':
        return 'Beneficiary Account Number';
      case 'UPI':
        return 'Beneficiary UPI ID / Mobile';
      case 'BILL':
      case 'CREDIT':
        return 'Consumer / Card Number';
      default:
        return 'Account / Aadhaar / Ref Number';
    }
  };

  const getAccountPlaceholder = () => {
    switch (workType) {
      case 'AEPS':
        return '12-digit Aadhaar Number (e.g. 5482 9102 3847)';
      case 'DMT':
        return 'Bank Account Number';
      case 'UPI':
        return 'e.g. 9876543210@upi or mobile number';
      case 'BILL':
      case 'CREDIT':
        return 'Consumer Account / Credit Card No';
      default:
        return 'Account or Identification Number';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || !isFinite(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid positive amount.', 'warning');
      return;
    }

    if (bankName.trim()) {
      saveLearnedBank(bankName.trim());
    }
    if (companyName.trim()) {
      saveLearnedCompany(companyName.trim());
    }

    const cleanCustName = customerName.trim() || 'Walk-in Counter';
    const cleanCustMobile = customerMobile.trim() || '';

    setIsSubmitting(true);
    try {
      await addBankingTransaction({
        customer_id: selectedCustomerId || 'cust-general',
        transaction_type: workType,
        payment_mode: workType === 'AEPS' ? 'AePS' : workType === 'UPI' ? 'UPI' : 'Bank Transfer',
        amount: rupeesToPaise(numAmount),
        transaction_ref_no: accountOrAadhaar.trim() || remark.trim() || '',
        transaction_date: new Date().toISOString(),
        company_name: companyName.trim(),
        customer_name: cleanCustName,
        customer_mobile: cleanCustMobile,
        account_or_aadhaar: accountOrAadhaar.trim(),
        bank_name: bankName.trim(),
        charges: charges ? rupeesToPaise(Number(charges)) : 0,
        commission: commission ? rupeesToPaise(Number(commission)) : 0,
        status: status,
        remark: remark.trim(),
      });

      showToast(`Transaction of ₹${numAmount.toLocaleString('en-IN')} recorded successfully.`, 'success');
      onClose();
    } catch (error) {
      console.error('Failed to add transaction', error);
      showToast('Failed to save transaction record.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl shadow-xl border border-surface-container/60 p-space-lg flex flex-col gap-space-md my-8 animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-container pb-space-xs">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-2xl">account_balance</span>
            <div>
              <h2 className="font-tagline text-tagline font-semibold text-on-surface">
                New Counter Banking Record
              </h2>
              <p className="font-fine-print text-fine-print text-on-surface-variant">
                Direct entry for DMT, AePS, UPI, and Bill payments (Spreadsheet Ledger Mode)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Work Type Quick Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="font-fine-print text-fine-print text-outline font-semibold uppercase tracking-wider">
            Work / Service Type
          </label>
          <div className="flex flex-wrap gap-1.5">
            {WORK_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setWorkType(type)}
                className={`px-3 py-1.5 rounded-xl font-button-utility text-button-utility font-semibold transition-all active:scale-95 ${
                  workType === type
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
          
          {/* Row 1: Company/Portal & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
            {/* Company / Portal Autocomplete */}
            <div className="sm:col-span-2 relative" ref={companyWrapperRef}>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1 block">
                Company Name / Portal
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. SAFEPAY, PAYBINGO, BOB BC..."
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    setShowCompanySuggestions(true);
                  }}
                  onFocus={() => setShowCompanySuggestions(true)}
                  className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none"
                />
                <span className="absolute right-3 top-2.5 text-outline text-xs pointer-events-none material-symbols-outlined">
                  storefront
                </span>
              </div>

              {showCompanySuggestions && filteredCompanies.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-surface-container-lowest border border-surface-container rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto">
                  {filteredCompanies.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setCompanyName(c);
                        setShowCompanySuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-surface-container flex items-center justify-between"
                    >
                      <span className="font-medium">{c}</span>
                      <span className="text-[10px] text-outline font-mono">Select</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1 block">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none"
              >
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILD">FAILD</option>
                <option value="IN PROGRESS">IN PROGRESS</option>
              </select>
            </div>
          </div>

          {/* Row 2: Customer Name & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
            {/* Customer Name */}
            <div className="relative" ref={customerWrapperRef}>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1 block">
                Customer Name <span className="text-outline text-xs">(Type walk-in or pick customer)</span>
              </label>
              <input
                type="text"
                placeholder="Customer or Beneficiary Name"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setSelectedCustomerId('cust-general');
                  setShowCustomerSuggestions(true);
                }}
                onFocus={() => setShowCustomerSuggestions(true)}
                className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none"
              />

              {showCustomerSuggestions && matchingCustomers.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-surface-container-lowest border border-surface-container rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto">
                  <div className="px-3 py-1 bg-surface-container-low text-[10px] font-semibold text-outline uppercase tracking-wider">
                    Existing DeskLog Customers
                  </div>
                  {matchingCustomers.map((cust) => (
                    <button
                      key={cust.id}
                      type="button"
                      onClick={() => handleSelectCustomer(cust)}
                      className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-surface-container flex items-center justify-between border-b border-surface-container/30 last:border-0"
                    >
                      <div>
                        <div className="font-medium text-on-surface">{cust.name}</div>
                        <div className="text-[11px] text-outline font-mono">{cust.mobile || 'No Mobile'}</div>
                      </div>
                      <span className="material-symbols-outlined text-xs text-primary">arrow_forward</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Number */}
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1 block">
                Mobile Number
              </label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none font-mono"
              />
            </div>
          </div>

          {/* Row 3: Account/Aadhaar & Bank Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
            {/* Account / Aadhaar Number */}
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1 block">
                {getAccountLabel()}
              </label>
              <input
                type="text"
                placeholder={getAccountPlaceholder()}
                value={accountOrAadhaar}
                onChange={(e) => setAccountOrAadhaar(e.target.value)}
                className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none font-mono"
              />
            </div>

            {/* Bank Name with Smart Autocomplete */}
            <div className="relative" ref={bankWrapperRef}>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1 block">
                Bank Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. State Bank of India, Bank of Baroda..."
                  value={bankName}
                  onChange={(e) => {
                    setBankName(e.target.value);
                    setShowBankSuggestions(true);
                  }}
                  onFocus={() => setShowBankSuggestions(true)}
                  className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none"
                />
                <span className="absolute right-3 top-2.5 text-outline text-xs pointer-events-none material-symbols-outlined">
                  account_balance
                </span>
              </div>

              {showBankSuggestions && filteredBanks.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-surface-container-lowest border border-surface-container rounded-xl shadow-lg z-30 max-h-52 overflow-y-auto">
                  {filteredBanks.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => {
                        setBankName(b);
                        setShowBankSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-surface-container flex items-center justify-between"
                    >
                      <span className="font-medium">{b}</span>
                      <span className="text-[10px] text-outline font-mono">Fill</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 4: Amount, Charges & Commission */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm bg-surface-container-low/40 p-3 rounded-xl border border-surface-container/40">
            {/* Amount */}
            <div>
              <label className="font-fine-print text-fine-print text-on-surface font-semibold mb-1 block">
                Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-outline font-bold">₹</span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none font-bold"
                />
              </div>
            </div>

            {/* Charges */}
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1 block">
                Charges / Fee (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-outline text-xs font-bold">₹</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Optional fee"
                  value={charges}
                  onChange={(e) => setCharges(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none font-mono"
                />
              </div>
            </div>

            {/* Commission */}
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1 block">
                Commission / Margin (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-outline text-xs font-bold">₹</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Optional"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Remark */}
          <div>
            <label className="font-fine-print text-fine-print text-on-surface-variant mb-1 block">
              Remark / Note (Optional)
            </label>
            <input
              type="text"
              placeholder="UTR, transaction reference, or customer note"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-space-sm pt-2 border-t border-surface-container">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-space-md py-2.5 rounded-full border border-surface-container-high text-on-surface hover:bg-surface-container font-button-utility text-button-utility transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-space-lg py-2.5 rounded-full bg-primary hover:bg-primary-container text-on-primary font-button-utility text-button-utility font-semibold transition-all active:scale-95 shadow-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">check</span>
              {isSubmitting ? 'Saving Transaction...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
