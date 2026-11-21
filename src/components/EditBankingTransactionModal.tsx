import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDesk } from '../context/DeskContext';
import { BankingTransaction } from '../types';
import { rupeesToPaise, paiseToRupees } from '../utils/currencyUtils';
import {
  validateMobileNumber,
  validateTransactionAmountRupees,
  validateCompanyChargeAgainstFee,
} from '../utils/validationUtils';
import {
  BankingModeId,
  BANKING_MODES,
  BANKING_MODE_KEYS,
  getLearnedBanks,
  saveLearnedBank,
  getLearnedCompanies,
  saveLearnedCompany,
} from '../constants/bankingData';

interface EditBankingTransactionModalProps {
  isOpen: boolean;
  transaction: BankingTransaction | null;
  onClose: () => void;
}

export const EditBankingTransactionModal: React.FC<EditBankingTransactionModalProps> = ({
  isOpen,
  transaction,
  onClose,
}) => {
  const { updateBankingTransaction, showToast, customers } = useDesk();

  const [activeMode, setActiveMode] = useState<BankingModeId>('DMT');
  const [transactionDate, setTransactionDate] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerMobile, setCustomerMobile] = useState<string>('');
  const [accountOrAadhaar, setAccountOrAadhaar] = useState<string>('');
  const [bankOrProvider, setBankOrProvider] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [charges, setCharges] = useState<string>('');
  const [companyCharge, setCompanyCharge] = useState<string>('');
  const [refund, setRefund] = useState<string>('');
  const [commission, setCommission] = useState<string>('');
  const [status, setStatus] = useState<string>('SUCCESS');
  const [remark, setRemark] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showProviderSuggestions, setShowProviderSuggestions] = useState<boolean>(false);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState<boolean>(false);
  const providerWrapperRef = useRef<HTMLDivElement>(null);
  const companyWrapperRef = useRef<HTMLDivElement>(null);

  const modeConfig = BANKING_MODES[activeMode] || BANKING_MODES.DMT;

  useEffect(() => {
    if (transaction && isOpen) {
      const mode = (BANKING_MODE_KEYS.includes(transaction.transaction_type as BankingModeId)
        ? transaction.transaction_type
        : 'DMT') as BankingModeId;
      setActiveMode(mode);

      // format date for datetime-local or text
      let dateVal = transaction.transaction_date || '';
      if (dateVal.length >= 16) {
        try {
          const d = new Date(dateVal);
          if (!isNaN(d.getTime())) {
            // YYYY-MM-DDTHH:mm format
            const pad = (n: number) => String(n).padStart(2, '0');
            dateVal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          }
        } catch {}
      }
      setTransactionDate(dateVal);
      setCompanyName(transaction.company_name || '');
      const matched = customers.find(c =>
        (c.id === transaction.customer_id && c.id !== 'cust-general') ||
        (transaction.customer_mobile && c.mobile && c.mobile.replace(/[\s-]/g, '') === transaction.customer_mobile.replace(/[\s-]/g, '')) ||
        (transaction.account_or_aadhaar && c.aadhaar_number && c.aadhaar_number.replace(/[\s-]/g, '') === transaction.account_or_aadhaar.replace(/[\s-]/g, ''))
      );
      const initialName = (transaction.customer_name && transaction.customer_name !== 'Walk-in Customer')
        ? transaction.customer_name
        : (matched?.name || '');
      setCustomerName(initialName);
      setCustomerMobile(transaction.customer_mobile || matched?.mobile || '');
      setAccountOrAadhaar(transaction.account_or_aadhaar || transaction.transaction_ref_no || '');
      setBankName(transaction.bank_name || '');
      setAmount(transaction.amount ? String(paiseToRupees(transaction.amount)) : '');
      setCharges(transaction.charges ? String(paiseToRupees(transaction.charges)) : '0');
      setCompanyCharge(transaction.company_charge ? String(paiseToRupees(transaction.company_charge)) : '0');
      setRefund(transaction.refund ? String(paiseToRupees(transaction.refund)) : '0');
      setCommission(transaction.commission ? String(paiseToRupees(transaction.commission)) : '0');
      setStatus(transaction.status || 'SUCCESS');
      setRemark(transaction.remark || '');
      setFieldErrors({});
    }
  }, [transaction, isOpen]);

  const setBankName = (val: string) => setBankOrProvider(val);

  // Auto-compute commission when charges or companyCharge change
  const handleChargesChange = (val: string) => {
    setCharges(val);
    const c = parseFloat(val) || 0;
    const comp = parseFloat(companyCharge) || 0;
    setCommission(String(Math.max(0, c - comp)));
    if (fieldErrors.companyCharge) {
      setFieldErrors(prev => {
        const copy = { ...prev };
        delete copy.companyCharge;
        return copy;
      });
    }
  };

  const handleCompanyChargeChange = (val: string) => {
    setCompanyCharge(val);
    const c = parseFloat(charges) || 0;
    const comp = parseFloat(val) || 0;
    setCommission(String(Math.max(0, c - comp)));
    if (fieldErrors.companyCharge) {
      setFieldErrors(prev => {
        const copy = { ...prev };
        delete copy.companyCharge;
        return copy;
      });
    }
  };

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

  if (!isOpen || !transaction) return null;

  const availableProviders = modeConfig.defaultProviders.length > 0
    ? modeConfig.defaultProviders
    : getLearnedBanks();

  const filteredProviders = bankOrProvider.trim()
    ? availableProviders.filter((p) => p.toLowerCase().includes(bankOrProvider.toLowerCase()))
    : availableProviders;

  const availableCompanies = getLearnedCompanies();
  const filteredCompanies = companyName.trim()
    ? availableCompanies.filter((c) => c.toLowerCase().includes(companyName.toLowerCase()))
    : availableCompanies;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction?.id) return;

    // --- Enterprise Input Validation ---
    const errors: Record<string, string> = {};

    const numAmount = Number(amount);
    const amountValidation = validateTransactionAmountRupees(numAmount);
    if (!amountValidation.valid) {
      errors.amount = amountValidation.error!;
    }

    const mobileValidation = validateMobileNumber(customerMobile);
    if (!mobileValidation.valid) {
      errors.customerMobile = mobileValidation.error!;
    }

    const numCharges = parseFloat(charges) || 0;
    const numCompanyCharge = parseFloat(companyCharge) || 0;
    const companyChargeValidation = validateCompanyChargeAgainstFee(numCharges, numCompanyCharge);
    if (!companyChargeValidation.valid) {
      errors.companyCharge = companyChargeValidation.error!;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = Object.values(errors)[0];
      showToast(firstError, 'warning');
      return;
    }
    // --- End Validation ---

    if (bankOrProvider.trim() && modeConfig.defaultProviders.length === 0) {
      saveLearnedBank(bankOrProvider.trim());
    }
    if (companyName.trim()) {
      saveLearnedCompany(companyName.trim());
    }

    const cleanAcct = accountOrAadhaar.trim().replace(/[\s-]/g, '');
    const cleanCustMobile = customerMobile.trim();
    const rawCustName = customerName.trim();
    const feePaise = charges ? rupeesToPaise(numCharges) : 0;
    const compChargePaise = companyCharge ? rupeesToPaise(numCompanyCharge) : 0;
    const refundPaise = refund ? rupeesToPaise(Number(refund)) : 0;
    const commPaise = commission ? rupeesToPaise(Number(commission)) : Math.max(0, feePaise - compChargePaise);

    // Resolve customer profile linkage
    const matchedCustomer = customers.find(c =>
      c.id !== 'cust-general' && (
        (cleanCustMobile && c.mobile && c.mobile.replace(/[\s-]/g, '') === cleanCustMobile.replace(/[\s-]/g, '')) ||
        (cleanAcct && c.aadhaar_number && c.aadhaar_number.replace(/[\s-]/g, '') === cleanAcct) ||
        (rawCustName && rawCustName !== 'Walk-in Customer' && c.name.toLowerCase() === rawCustName.toLowerCase())
      )
    );
    const targetCustomerId = matchedCustomer ? matchedCustomer.id : (transaction.customer_id || 'cust-general');
    const cleanCustName = rawCustName || matchedCustomer?.name || 'Customer';
    const resolvedMobile = cleanCustMobile || matchedCustomer?.mobile || '';

    setIsSubmitting(true);
    try {
      await updateBankingTransaction(transaction.id, {
        customer_id: targetCustomerId,
        transaction_type: activeMode,
        payment_mode: activeMode === 'AEPS' ? 'AePS' : activeMode === 'UPI' || activeMode === 'UPI CASH' ? 'UPI' : 'Bank Transfer',
        amount: rupeesToPaise(numAmount),
        transaction_ref_no: accountOrAadhaar.trim() || remark.trim() || '',
        transaction_date: transactionDate ? new Date(transactionDate).toISOString() : transaction.transaction_date,
        company_name: companyName.trim(),
        customer_name: cleanCustName,
        customer_mobile: resolvedMobile,
        account_or_aadhaar: accountOrAadhaar.trim(),
        bank_name: bankOrProvider.trim(),
        charges: feePaise,
        company_charge: compChargePaise,
        refund: refundPaise,
        commission: commPaise,
        status: status,
        remark: remark.trim(),
      });

      showToast(`Updated transaction #${transaction.id}.`, 'success');
      onClose();
    } catch (error) {
      console.error('Failed to update transaction', error);
      showToast('Failed to update transaction record.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-scrim/40 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-surface-container-lowest w-full max-w-xl rounded-2xl shadow-xl border border-surface-container/70 p-4 sm:p-5 flex flex-col gap-3.5 my-6 animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-container/60 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">edit_document</span>
            <div>
              <h3 className="font-tagline font-bold text-sm text-on-surface">
                Edit Banking Transaction #{transaction.id}
              </h3>
              <p className="text-[11px] text-outline">
                Modify transaction details, charges, refund, or commission
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          
          {/* Mode Pill Strip */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-outline uppercase tracking-wider">
              Transaction Mode
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-9 gap-1 bg-surface-container-low p-1 rounded-xl border border-surface-container/50">
              {BANKING_MODE_KEYS.map((modeKey) => {
                const isSelected = activeMode === modeKey;
                return (
                  <button
                    key={modeKey}
                    type="button"
                    onClick={() => setActiveMode(modeKey)}
                    className={`py-1.5 px-1 rounded-lg text-[11px] font-bold text-center transition-all truncate ${
                      isSelected
                        ? 'bg-surface-container-lowest text-primary shadow-xs border border-surface-container'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {modeKey}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-outline">
                Transaction Date & Time
              </label>
              <input
                type="datetime-local"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-surface-container text-on-surface text-xs border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-outline">
                Payment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-surface-container text-on-surface text-xs font-semibold border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILD">FAILD</option>
                <option value="IN PROGRESS">IN PROGRESS</option>
              </select>
            </div>
          </div>

          {/* Customer & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-outline">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer Name"
                className="w-full px-2.5 py-1.5 rounded-xl bg-surface-container text-on-surface text-xs border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-outline">
                Mobile Number
              </label>
              <input
                type="tel"
                maxLength={10}
                value={customerMobile}
                onChange={(e) => {
                  setCustomerMobile(e.target.value);
                  if (fieldErrors.customerMobile) {
                    setFieldErrors(prev => {
                      const copy = { ...prev };
                      delete copy.customerMobile;
                      return copy;
                    });
                  }
                }}
                placeholder="10-digit mobile"
                className={`w-full px-2.5 py-1.5 rounded-xl bg-surface-container text-on-surface font-mono text-xs border focus:outline-none focus:ring-2 ${
                  fieldErrors.customerMobile
                    ? 'border-red-500 ring-1 ring-red-500/20'
                    : 'border-surface-container focus:ring-primary/20'
                }`}
              />
              {fieldErrors.customerMobile && (
                <p className="text-[10px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[12px]">error</span>
                  {fieldErrors.customerMobile}
                </p>
              )}
            </div>
          </div>

          {/* Mode-specific ID Field (Account / Aadhaar / UPI / Doc) */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-outline">
              {modeConfig.idFieldLabel}
            </label>
            <input
              type="text"
              value={accountOrAadhaar}
              onChange={(e) => setAccountOrAadhaar(e.target.value)}
              placeholder={modeConfig.idFieldPlaceholder}
              className="w-full px-2.5 py-1.5 rounded-xl bg-surface-container text-on-surface font-mono text-xs border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Bank/Provider & Company/Portal suggestions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative flex flex-col gap-1" ref={providerWrapperRef}>
              <label className="text-[11px] font-semibold text-outline">
                {modeConfig.providerLabel}
              </label>
              <input
                type="text"
                value={bankOrProvider}
                onChange={(e) => {
                  setBankOrProvider(e.target.value);
                  setShowProviderSuggestions(true);
                }}
                onFocus={() => setShowProviderSuggestions(true)}
                placeholder={modeConfig.providerPlaceholder}
                className="w-full px-2.5 py-1.5 rounded-xl bg-surface-container text-on-surface text-xs border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {showProviderSuggestions && filteredProviders.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-1 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container z-30 max-h-48 overflow-y-auto">
                  {filteredProviders.slice(0, 15).map((prov) => (
                    <button
                      key={prov}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setBankOrProvider(prov);
                        setShowProviderSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container border-b border-surface-container/20 last:border-0"
                    >
                      {prov}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative flex flex-col gap-1" ref={companyWrapperRef}>
              <label className="text-[11px] font-semibold text-outline">
                Company / Portal
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  setShowCompanySuggestions(true);
                }}
                onFocus={() => setShowCompanySuggestions(true)}
                placeholder="e.g. SAFEPAY, PAYBINGO"
                className="w-full px-2.5 py-1.5 rounded-xl bg-surface-container text-on-surface font-semibold text-xs border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {showCompanySuggestions && filteredCompanies.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-1 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container z-30 max-h-48 overflow-y-auto">
                  {filteredCompanies.map((portal) => (
                    <button
                      key={portal}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setCompanyName(portal);
                        setShowCompanySuggestions(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container border-b border-surface-container/20 last:border-0"
                    >
                      {portal}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Financial Breakdown: Amount, Charges, Company Charge, Refund, Commission */}
          <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container/60 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-on-surface">Financial Accounting (₹)</span>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
              {/* Amount */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] font-bold text-on-surface">Amount *</label>
                <div className="relative">
                  <span className="absolute left-2 top-1.5 text-outline text-[11px]">₹</span>
                  <input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (fieldErrors.amount) {
                        setFieldErrors(prev => {
                          const copy = { ...prev };
                          delete copy.amount;
                          return copy;
                        });
                      }
                    }}
                    required
                    className={`w-full pl-5 pr-1.5 py-1 rounded-lg bg-surface-container-lowest text-on-surface font-mono font-bold text-xs border focus:outline-none focus:ring-2 ${
                      fieldErrors.amount
                        ? 'border-red-500 ring-1 ring-red-500/20'
                        : 'border-surface-container focus:ring-primary/20'
                    }`}
                  />
                </div>
                {fieldErrors.amount && (
                  <p className="text-[10px] text-red-500 font-medium flex items-center gap-0.5 mt-0.5">
                    <span className="material-symbols-outlined text-[11px]">error</span>
                    {fieldErrors.amount}
                  </p>
                )}
              </div>

              {/* Customer Fee */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] font-semibold text-outline">Customer Fee</label>
                <input
                  type="number"
                  step="any"
                  value={charges}
                  onChange={(e) => handleChargesChange(e.target.value)}
                  placeholder="0"
                  className="w-full px-2 py-1 rounded-lg bg-surface-container-lowest text-on-surface font-mono text-xs border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Company Charge */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] font-semibold text-outline">Company Cost</label>
                <input
                  type="number"
                  step="any"
                  value={companyCharge}
                  onChange={(e) => handleCompanyChargeChange(e.target.value)}
                  placeholder="0"
                  className={`w-full px-2 py-1 rounded-lg bg-surface-container-lowest text-on-surface font-mono text-xs border focus:outline-none focus:ring-2 ${
                    fieldErrors.companyCharge
                      ? 'border-red-500 ring-1 ring-red-500/20'
                      : 'border-surface-container focus:ring-primary/20'
                  }`}
                />
                {fieldErrors.companyCharge && (
                  <p className="text-[10px] text-red-500 font-medium flex items-center gap-0.5 mt-0.5">
                    <span className="material-symbols-outlined text-[11px]">error</span>
                    {fieldErrors.companyCharge}
                  </p>
                )}
              </div>

              {/* Refund */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] font-semibold text-outline text-amber-600 dark:text-amber-400">Refund</label>
                <input
                  type="number"
                  step="any"
                  value={refund}
                  onChange={(e) => setRefund(e.target.value)}
                  placeholder="0"
                  className="w-full px-2 py-1 rounded-lg bg-surface-container-lowest text-amber-600 dark:text-amber-400 font-mono text-xs border border-surface-container"
                />
              </div>

              {/* Commission */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 font-bold">Commission</label>
                <input
                  type="number"
                  step="any"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  placeholder="0"
                  className="w-full px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs border border-emerald-500/30"
                />
              </div>
            </div>
          </div>

          {/* Remark */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-outline">
              Remark / Notes
            </label>
            <input
              type="text"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="e.g. IMPS UTR, token or customer note"
              className="w-full px-2.5 py-1.5 rounded-xl bg-surface-container text-on-surface text-xs border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-primary/90 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
