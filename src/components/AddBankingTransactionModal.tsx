import React, { useState, useEffect, useRef } from 'react';
import { useDesk } from '../context/DeskContext';
import { rupeesToPaise } from '../utils/currencyUtils';
import {
  BankingModeId,
  BANKING_MODES,
  BANKING_MODE_KEYS,
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
  const { isAddBankingOpen, setIsAddBankingOpen, addBankingTransaction, showToast, customers } = useDesk();
  const isOpen = propIsOpen !== undefined ? propIsOpen : isAddBankingOpen;
  const onClose = propOnClose || (() => setIsAddBankingOpen(false));

  // Active Mode (DMT, AEPS, UPI, UPI CASH, BILL, CREDIT, CSC)
  const [activeMode, setActiveMode] = useState<BankingModeId>('DMT');
  const modeConfig = BANKING_MODES[activeMode];

  // Form fields
  const [companyName, setCompanyName] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerMobile, setCustomerMobile] = useState<string>('');
  const [accountOrAadhaar, setAccountOrAadhaar] = useState<string>('');
  const [bankOrProvider, setBankOrProvider] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [charges, setCharges] = useState<string>('');
  const [status, setStatus] = useState<string>('SUCCESS');
  const [remark, setRemark] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showProviderSuggestions, setShowProviderSuggestions] = useState<boolean>(false);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState<boolean>(false);
  const providerWrapperRef = useRef<HTMLDivElement>(null);
  const companyWrapperRef = useRef<HTMLDivElement>(null);

  const handleCustomerNameChange = (val: string) => {
    setCustomerName(val);
    const matched = customers.find(c => c.id !== 'cust-general' && c.name.toLowerCase() === val.trim().toLowerCase());
    if (matched && matched.mobile && !customerMobile) {
      setCustomerMobile(matched.mobile);
    }
  };

  const handleCustomerMobileChange = (val: string) => {
    setCustomerMobile(val);
    const clean = val.replace(/[\s-]/g, '');
    if (clean.length === 10) {
      const matched = customers.find(c => c.id !== 'cust-general' && c.mobile && c.mobile.replace(/[\s-]/g, '') === clean);
      if (matched && (!customerName || customerName === 'Walk-in Customer')) {
        setCustomerName(matched.name);
      }
    }
  };

  // Switch mode handler
  const handleSelectMode = (newMode: BankingModeId) => {
    setActiveMode(newMode);
    setAccountOrAadhaar('');
    setBankOrProvider('');
    setShowProviderSuggestions(false);
    setShowCompanySuggestions(false);
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveMode('DMT');
      setCompanyName('');
      setCustomerName('');
      setCustomerMobile('');
      setAccountOrAadhaar('');
      setBankOrProvider('');
      setAmount('');
      setCharges('');
      setStatus('SUCCESS');
      setRemark('');
      setShowProviderSuggestions(false);
      setShowCompanySuggestions(false);
    }
  }, [isOpen]);

  // Click outside listener for bank & company suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (providerWrapperRef.current && !providerWrapperRef.current.contains(event.target as Node)) {
        setShowProviderSuggestions(false);
      }
      if (companyWrapperRef.current && !companyWrapperRef.current.contains(event.target as Node)) {
        setShowCompanySuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // Providers list (All 55 banks available in DMT, AEPS, CREDIT; specific lists for others)
  const availableProviders = modeConfig.defaultProviders.length > 0
    ? modeConfig.defaultProviders
    : getLearnedBanks();

  const filteredProviders = bankOrProvider.trim()
    ? availableProviders.filter((p) => p.toLowerCase().includes(bankOrProvider.toLowerCase()))
    : availableProviders;

  // Companies / Portals list (All 17 portals from operational ledger)
  const availableCompanies = getLearnedCompanies();
  const filteredCompanies = companyName.trim()
    ? availableCompanies.filter((c) => c.toLowerCase().includes(companyName.toLowerCase()))
    : availableCompanies;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || !isFinite(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid amount.', 'warning');
      return;
    }

    if (bankOrProvider.trim() && modeConfig.defaultProviders.length === 0) {
      saveLearnedBank(bankOrProvider.trim());
    }
    if (companyName.trim()) {
      saveLearnedCompany(companyName.trim());
    }

    const cleanCustName = customerName.trim() || 'Walk-in Customer';
    const cleanCustMobile = customerMobile.trim() || '';
    const feePaise = charges ? rupeesToPaise(Number(charges)) : 0;

    // Resolve customer profile linkage: link to real profile if customer exists
    const matchedCustomer = customers.find(c =>
      c.id !== 'cust-general' && (
        (cleanCustMobile && c.mobile && c.mobile.replace(/[\s-]/g, '') === cleanCustMobile.replace(/[\s-]/g, '')) ||
        (cleanCustName && cleanCustName !== 'Walk-in Customer' && c.name.toLowerCase() === cleanCustName.toLowerCase())
      )
    );
    const targetCustomerId = matchedCustomer ? matchedCustomer.id : 'cust-general';

    setIsSubmitting(true);
    try {
      await addBankingTransaction({
        customer_id: targetCustomerId,
        transaction_type: activeMode,
        payment_mode: activeMode === 'AEPS' ? 'AePS' : activeMode === 'UPI' || activeMode === 'UPI CASH' ? 'UPI' : 'Bank Transfer',
        amount: rupeesToPaise(numAmount),
        transaction_ref_no: accountOrAadhaar.trim() || remark.trim() || '',
        transaction_date: new Date().toISOString(),
        company_name: companyName.trim(),
        customer_name: cleanCustName,
        customer_mobile: cleanCustMobile,
        account_or_aadhaar: accountOrAadhaar.trim(),
        bank_name: bankOrProvider.trim(),
        charges: feePaise,
        commission: feePaise, // Default commission to fee
        status: status,
        remark: remark.trim(),
      });

      showToast(`Saved ${activeMode} record.`, 'success');
      onClose();
    } catch (error) {
      console.error('Failed to add transaction', error);
      showToast('Failed to save transaction record.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-scrim/40 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-xl border border-surface-container/70 p-4 sm:p-5 flex flex-col gap-3.5 my-6 animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-container/60 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">account_balance</span>
            <div>
              <h2 className="font-tagline text-base font-semibold text-on-surface">
                New Counter Transaction
              </h2>
              <p className="text-[11px] text-on-surface-variant">
                Fast walk-in banking ledger entry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Mode Selector Tabs (Clean, Horizontal Strip) */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {BANKING_MODE_KEYS.map((modeKey) => {
            const isSelected = activeMode === modeKey;
            return (
              <button
                key={modeKey}
                type="button"
                onClick={() => handleSelectMode(modeKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-xs font-bold'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {modeKey}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          
          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Customer Name */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-on-surface">
                Customer Name
              </label>
              <input
                type="text"
                list="customer-name-suggestions"
                value={customerName}
                onChange={(e) => handleCustomerNameChange(e.target.value)}
                placeholder="Walk-in Customer (or enter name)"
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <datalist id="customer-name-suggestions">
                {customers.filter(c => c.id !== 'cust-general').map(c => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>

            {/* Mobile Number */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-on-surface">
                Mobile Number
              </label>
              <input
                type="tel"
                list="customer-phone-suggestions"
                value={customerMobile}
                onChange={(e) => handleCustomerMobileChange(e.target.value)}
                placeholder="10-digit mobile"
                maxLength={10}
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs font-mono border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <datalist id="customer-phone-suggestions">
                {customers.filter(c => c.id !== 'cust-general' && c.mobile).map(c => (
                  <option key={c.id} value={c.mobile} />
                ))}
              </datalist>
            </div>

            {/* Dynamic Identifier Field (Account / Aadhaar / UPI ID) */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-on-surface">
                {modeConfig.idFieldLabel} <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type={modeConfig.idFieldType || 'text'}
                value={accountOrAadhaar}
                onChange={(e) => setAccountOrAadhaar(e.target.value)}
                placeholder={modeConfig.idFieldPlaceholder}
                required
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs font-mono border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Dynamic Provider / Bank / Board */}
            <div className="relative flex flex-col gap-1" ref={providerWrapperRef}>
              <label className="text-[11px] font-semibold text-on-surface">
                {modeConfig.providerLabel}
              </label>
              <input
                type="text"
                list="bank-provider-suggestions"
                value={bankOrProvider}
                onChange={(e) => {
                  setBankOrProvider(e.target.value);
                  setShowProviderSuggestions(true);
                }}
                onFocus={() => setShowProviderSuggestions(true)}
                placeholder={modeConfig.providerPlaceholder}
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <datalist id="bank-provider-suggestions">
                {availableProviders.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              {showProviderSuggestions && filteredProviders.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-1 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container z-30 max-h-56 overflow-y-auto">
                  <div className="px-3 py-1 bg-surface-container text-[10px] font-semibold text-outline uppercase tracking-wider sticky top-0 border-b border-surface-container/60">
                    Available Providers ({filteredProviders.length})
                  </div>
                  {filteredProviders.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setBankOrProvider(item);
                        setShowProviderSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-surface-container border-b border-surface-container/30 last:border-0 transition-colors flex items-center justify-between"
                    >
                      <span className="font-medium">{item}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Portal / Company Input - Clean Input with Fast Autocomplete */}
            <div className="relative flex flex-col gap-1 sm:col-span-2" ref={companyWrapperRef}>
              <label className="text-[11px] font-semibold text-on-surface">
                Portal / Company <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                list="portal-suggestions"
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  setShowCompanySuggestions(true);
                }}
                onFocus={() => setShowCompanySuggestions(true)}
                placeholder="Select or type portal (e.g. SAFEPAY, PAYBINGO, BOB BC)"
                required
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <datalist id="portal-suggestions">
                {availableCompanies.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              {showCompanySuggestions && filteredCompanies.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-1 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container z-30 max-h-52 overflow-y-auto">
                  <div className="px-3 py-1 bg-surface-container text-[10px] font-semibold text-outline uppercase tracking-wider sticky top-0 border-b border-surface-container/60">
                    Counter Portals ({filteredCompanies.length})
                  </div>
                  {filteredCompanies.map((portal) => (
                    <button
                      key={portal}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setCompanyName(portal);
                        setShowCompanySuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-surface-container border-b border-surface-container/30 last:border-0 transition-colors flex items-center justify-between"
                    >
                      <span className="font-medium">{portal}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Clean Financials Block: Only Amount & Customer Fee */}
          <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container/60 flex flex-col gap-2">
            {/* Quick AEPS Amount Chips */}
            {activeMode === 'AEPS' && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[10px] text-outline font-semibold">Quick:</span>
                {[500, 1000, 2000, 3000, 5000, 10000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setAmount(String(val));
                      if (val <= 1000) setCharges('10');
                      else if (val <= 2000) setCharges('20');
                      else if (val <= 3000) setCharges('30');
                      else setCharges('50');
                    }}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-surface-container hover:bg-primary hover:text-on-primary transition text-on-surface"
                  >
                    ₹{val}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 items-end">
              {/* Amount */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-on-surface">
                  Amount (₹) <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-outline font-bold text-xs">₹</span>
                  <input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full pl-6 pr-2 py-1.5 rounded-xl bg-surface-container-lowest text-on-surface font-mono font-bold text-sm border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Customer Fee */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-on-surface">
                  Customer Fee (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={charges}
                  onChange={(e) => setCharges(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-2.5 py-1.5 rounded-xl bg-surface-container-lowest text-on-surface font-mono text-xs border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Status & Remarks Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-outline font-semibold">Status:</span>
              <div className="flex items-center gap-1 bg-surface-container-low p-0.5 rounded-lg border border-surface-container/60">
                {(['SUCCESS', 'IN PROGRESS', 'FAILD'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition ${
                      status === st
                        ? st === 'SUCCESS'
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : st === 'IN PROGRESS'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-rose-500 text-white shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {st === 'IN PROGRESS' ? 'Pending' : st === 'SUCCESS' ? 'Success' : 'Failed'}
                  </button>
                ))}
              </div>
            </div>

            {/* Remark */}
            <input
              type="text"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Remark / Reference note (optional)"
              className="w-full px-3 py-1.5 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Footer Actions: Simple Cancel & Save */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-1.5 rounded-full bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-xs animate-spin">refresh</span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xs">check</span>
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
