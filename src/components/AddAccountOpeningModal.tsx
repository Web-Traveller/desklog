import React, { useState, useEffect, useRef } from 'react';
import { useDesk } from '../context/DeskContext';
import { rupeesToPaise } from '../utils/currencyUtils';
import { calculateAge } from '../utils/dateUtils';
import { saveTauriAccountDocument } from '../api/tauri';
import { Modal } from './Modal';
import { lookupCustomerDetails } from '../utils/autofillLookup';
import {
  ACCOUNT_OPENING_SCHEMES,
  ACCOUNT_OPENING_KYC_STATUSES,
  INDIAN_STATES,
} from '../constants/bankingData';

interface AddAccountOpeningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SelectedDoc {
  id: string;
  name: string;
  dataUrl: string;
  size?: number;
  path?: string;
  isExisting?: boolean;
}

export const AddAccountOpeningModal: React.FC<AddAccountOpeningModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    customers,
    accountOpenings,
    bankingTransactions,
    bankSchemes,
    addAccountOpening,
    addCustomer,
    editCustomer,
    showToast,
  } = useDesk();

  const activeSchemeList = React.useMemo(() => {
    if (bankSchemes && bankSchemes.length > 0) {
      return bankSchemes.map(s => s.name);
    }
    return ACCOUNT_OPENING_SCHEMES;
  }, [bankSchemes]);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [dob, setDob] = useState('');

  const [scheme, setScheme] = useState('FINO');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCustomerId, setBankCustomerId] = useState('');
  const [passbookNumber, setPassbookNumber] = useState('');
  const [accountDate, setAccountDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [visitType, setVisitType] = useState('Walk-in');

  const [mailingAddress, setMailingAddress] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [zip, setZip] = useState('');

  const [initialDepositRupees, setInitialDepositRupees] = useState('1000');
  const [kycStatus, setKycStatus] = useState('Verified');
  const [notes, setNotes] = useState('1000/- Account');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Document Uploads & Finder Flags
  const [noPanAvailable, setNoPanAvailable] = useState(false);
  const [photoDoc, setPhotoDoc] = useState<SelectedDoc | null>(null);
  const [aadhaarDocs, setAadhaarDocs] = useState<SelectedDoc[]>([]);
  const [panDocs, setPanDocs] = useState<SelectedDoc[]>([]);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const aadhaarInputRef = useRef<HTMLInputElement>(null);
  const panInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      showToast('Photo exceeds 15MB limit. Please select a smaller image.', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDoc({
        id: `photo_${Date.now()}`,
        name: file.name,
        dataUrl: reader.result as string,
        size: file.size,
        isExisting: false,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleMultipleFilesChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<SelectedDoc[]>>
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const readPromises = files.map(file => {
      return new Promise<SelectedDoc | null>((resolve) => {
        if (file.size > 15 * 1024 * 1024) {
          showToast(`"${file.name}" exceeds 15MB limit. Please select a smaller file.`, 'warning');
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            name: file.name,
            dataUrl: reader.result as string,
            size: file.size,
            isExisting: false,
          });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    });

    const newDocs = (await Promise.all(readPromises)).filter((d): d is SelectedDoc => d !== null);
    if (newDocs.length > 0) {
      setter(prev => [...prev, ...newDocs]);
    }
    e.target.value = '';
  };

  const removeAadhaarDoc = (docId: string) => {
    setAadhaarDocs(prev => prev.filter(d => d.id !== docId));
  };

  const removePanDoc = (docId: string) => {
    setPanDocs(prev => prev.filter(d => d.id !== docId));
  };

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setCustomerName('');
      setMobileNumber('');
      setAadhaarNumber('');
      setPanNumber('');
      setNoPanAvailable(false);
      setDob('');
      setScheme('FINO');
      setAccountNumber('');
      setBankCustomerId('');
      setPassbookNumber('');
      setAccountDate(new Date().toISOString().slice(0, 10));
      setVisitType('Walk-in');
      setMailingAddress('');
      setArea('');
      setCity('');
      setState('Maharashtra');
      setZip('');
      setInitialDepositRupees('1000');
      setKycStatus('Verified');
      setNotes('1000/- Account');
      setPhotoDoc(null);
      setAadhaarDocs([]);
      setPanDocs([]);
    }
  }, [isOpen]);

  // Live Auto-fill from existing records by full Aadhaar (12 digits) or Mobile (10 digits)
  const handleAadhaarChange = (val: string) => {
    setAadhaarNumber(val);
    const clean = val.replace(/[\s-]/g, '');
    if (clean.length === 12) {
      const match = lookupCustomerDetails(clean, { customers, accountOpenings, bankingTransactions });
      if (match) {
        if (!customerName && match.customer_name) setCustomerName(match.customer_name);
        if (!mobileNumber && match.mobile_number) setMobileNumber(match.mobile_number);
        if (!panNumber && match.pan_number) setPanNumber(match.pan_number);
        if (!dob && match.dob) setDob(match.dob);
        if (!mailingAddress && match.mailing_address) setMailingAddress(match.mailing_address);
        if (!area && match.area) setArea(match.area);
        if (!city && match.city) setCity(match.city);
        if (!state && match.state) setState(match.state);
        if (!zip && match.zip) setZip(match.zip);
        showToast('Auto-filled customer details from recent records', 'info');
      }
    }
  };

  const handleMobileChange = (val: string) => {
    setMobileNumber(val);
    const clean = val.replace(/[\s-]/g, '');
    if (clean.length === 10) {
      const match = lookupCustomerDetails(clean, { customers, accountOpenings, bankingTransactions });
      if (match) {
        if (!customerName && match.customer_name) setCustomerName(match.customer_name);
        if (!aadhaarNumber && match.aadhaar_number) setAadhaarNumber(match.aadhaar_number);
        if (!panNumber && match.pan_number) setPanNumber(match.pan_number);
        if (!dob && match.dob) setDob(match.dob);
        if (!mailingAddress && match.mailing_address) setMailingAddress(match.mailing_address);
        if (!area && match.area) setArea(match.area);
        if (!city && match.city) setCity(match.city);
        if (!state && match.state) setState(match.state);
        if (!zip && match.zip) setZip(match.zip);
        showToast('Auto-filled customer details from recent records', 'info');
      }
    }
  };

  const handleSchemeSelect = (bank: string) => {
    setScheme(bank);
    // Autofill typical scheme default deposit notes
    if (bank === 'FINO') {
      setInitialDepositRupees('1000');
      setNotes('1000/- Account');
    } else if (bank === 'BARODA') {
      setInitialDepositRupees('300');
      setNotes('300/- Account');
    } else if (bank === 'Airtel Bank') {
      setInitialDepositRupees('500');
      setNotes('500/- Account');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!customerName.trim()) {
      errors.customerName = 'Customer full name is required.';
    }
    if (!accountNumber.trim()) {
      errors.accountNumber = 'Account number is required.';
    }
    if (!scheme.trim()) {
      errors.scheme = 'Bank / Scheme name is required.';
    }

    if (Object.keys(errors).length > 0) {
      showToast(Object.values(errors)[0], 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanMobile = mobileNumber.replace(/[\s-]/g, '').trim();
      const cleanAadhaar = aadhaarNumber.replace(/[\s-]/g, '').trim();

      // Resolve or auto-sync Customer Profile
      let matchedCust = customers.find(c =>
        c.id !== 'cust-general' && (
          (cleanMobile && c.mobile && c.mobile.replace(/[\s-]/g, '') === cleanMobile) ||
          (cleanAadhaar && c.aadhaar_number && c.aadhaar_number.replace(/[\s-]/g, '') === cleanAadhaar) ||
          (c.name.toLowerCase() === customerName.trim().toLowerCase())
        )
      );

      let targetCustomerId = matchedCust?.id;

      if (!matchedCust) {
        // Auto-create customer profile
        try {
          const created = await addCustomer({
            name: customerName.trim(),
            mobile: cleanMobile || undefined,
            aadhaar_number: cleanAadhaar || undefined,
            note: mailingAddress.trim() ? `${mailingAddress.trim()}, ${city || ''} ${state || ''}`.trim() : undefined,
          });
          targetCustomerId = created.id;
        } catch {
          targetCustomerId = 'cust-general';
        }
      } else if (matchedCust && (!matchedCust.aadhaar_number && cleanAadhaar)) {
        // Enrich customer with Aadhaar if missing
        editCustomer(matchedCust.id, { aadhaar_number: cleanAadhaar }).catch(() => {});
      }

      const depositPaise = initialDepositRupees ? rupeesToPaise(Number(initialDepositRupees)) : 0;

      // Compute attached documents status
      let docCount = 0;
      if (photoDoc) docCount++;
      if (aadhaarDocs.length > 0) docCount++;
      if (panDocs.length > 0 || noPanAvailable) docCount++;
      const computedDocStatus = docCount === 3 ? 'Attached (3/3)' : docCount > 0 ? `Partial (${docCount}/3)` : 'No Docs';
      const finalPan = noPanAvailable ? 'Form 60 (No PAN)' : panNumber.trim().toUpperCase() || undefined;

      const saved = await addAccountOpening({
        customer_id: targetCustomerId,
        visit_type: visitType,
        account_date: accountDate || new Date().toISOString().slice(0, 10),
        passbook_number: passbookNumber.trim() || undefined,
        bank_customer_id: bankCustomerId.trim() || undefined,
        account_number: accountNumber.trim(),
        customer_name: customerName.trim(),
        dob: dob.trim() || undefined,
        aadhaar_number: cleanAadhaar || undefined,
        pan_number: finalPan,
        scheme: scheme.trim(),
        mobile_number: cleanMobile || undefined,
        mailing_address: mailingAddress.trim() || undefined,
        area: area.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zip: zip.trim() || undefined,
        initial_deposit: depositPaise,
        kyc_status: kycStatus,
        notes: notes.trim() || undefined,
        document_status: computedDocStatus,
      });

      // Securely store documents locally on the user's computer
      if (saved?.id) {
        if (photoDoc) {
          await saveTauriAccountDocument(saved.id, 'photo', photoDoc.name, photoDoc.dataUrl).catch(console.warn);
        }
        for (const doc of aadhaarDocs) {
          await saveTauriAccountDocument(saved.id, 'aadhaar', doc.name, doc.dataUrl).catch(console.warn);
        }
        for (const doc of panDocs) {
          await saveTauriAccountDocument(saved.id, 'pan', doc.name, doc.dataUrl).catch(console.warn);
        }
      }

      onClose();
    } catch (err) {
      console.error('Failed to open account', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Bank Account Opening"
      subtitle="Record new bank account opening service with CIF, Passbook & KYC details"
      icon="account_balance"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Quick Bank / Scheme Selector Pills */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-outline">
              Select Bank / Scheme <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {activeSchemeList.slice(0, 8).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => handleSchemeSelect(b)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    scheme.toLowerCase() === b.toLowerCase()
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: Bank & Account Details */}
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container/50 flex flex-col gap-2.5">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">account_balance</span>
              Bank & Account Information
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-on-surface">
                  Bank / Scheme <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  list="scheme-options"
                  value={scheme}
                  onChange={(e) => setScheme(e.target.value)}
                  placeholder="e.g. FINO, BARODA, KOTAK"
                  required
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-semibold text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <datalist id="scheme-options">
                  {activeSchemeList.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-on-surface">
                  Account Number <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 20369762133"
                  required
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-mono font-bold text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-on-surface">
                  Customer ID / CIF
                </label>
                <input
                  type="text"
                  value={bankCustomerId}
                  onChange={(e) => setBankCustomerId(e.target.value)}
                  placeholder="e.g. IQ0068531 or 162387859"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-mono text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-on-surface">
                  Passbook Number
                </label>
                <input
                  type="text"
                  value={passbookNumber}
                  onChange={(e) => setPassbookNumber(e.target.value)}
                  placeholder="e.g. 11000593193"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-mono text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-on-surface">
                  Opening Date
                </label>
                <input
                  type="date"
                  value={accountDate}
                  onChange={(e) => setAccountDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-xs text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Customer Personal Details */}
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container/50 flex flex-col gap-2.5">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">person</span>
              Customer Personal & Identification Details
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-on-surface">
                  Customer Full Name <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Nanda Parmeshwar Kshirsagar"
                  required
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-semibold text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-on-surface">
                  Mobile Number (10 Digits)
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => handleMobileChange(e.target.value)}
                  placeholder="e.g. 8446747077"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-mono text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-on-surface">
                  Aadhaar Number (12 Digits)
                </label>
                <input
                  type="text"
                  maxLength={14}
                  value={aadhaarNumber}
                  onChange={(e) => handleAadhaarChange(e.target.value)}
                  placeholder="e.g. 4829 8736 3841"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-mono text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-on-surface">
                    PAN Card Number
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={noPanAvailable}
                      onChange={(e) => setNoPanAvailable(e.target.checked)}
                      className="rounded text-primary focus:ring-0 text-[10px]"
                    />
                    <span className="text-[10px] text-outline font-medium">Form 60 (No PAN)</span>
                  </label>
                </div>
                <input
                  type="text"
                  maxLength={10}
                  disabled={noPanAvailable}
                  value={noPanAvailable ? 'Form 60 (No PAN)' : panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  placeholder={noPanAvailable ? 'No PAN (Form 60 declared)' : 'e.g. CSYPK9715N'}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-mono uppercase text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-on-surface">
                    Date of Birth
                  </label>
                  {calculateAge(dob) !== null && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      Age: {calculateAge(dob)} yrs
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-xs text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Residential Address */}
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container/50 flex flex-col gap-2.5">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">home_pin</span>
              Residential & Postal Address
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-on-surface">
                  Mailing Address
                </label>
                <input
                  type="text"
                  value={mailingAddress}
                  onChange={(e) => setMailingAddress(e.target.value)}
                  placeholder="Street / House No / Landmark"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-xs text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-on-surface">
                  Area / Locality
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Thergaon, Pimpri, Kalewadi"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-xs text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-on-surface">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Pune"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-xs text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-on-surface">
                  State
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-xs text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {INDIAN_STATES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-on-surface">
                  Pincode / ZIP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="e.g. 411033"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-mono text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Financials & KYC Status */}
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container/50 flex flex-col gap-2.5">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">verified_user</span>
              Deposit & KYC Status
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-on-surface">
                  Initial Deposit / Fee (₹)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-outline text-xs font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={initialDepositRupees}
                    onChange={(e) => setInitialDepositRupees(e.target.value)}
                    placeholder="1000"
                    className="w-full pl-7 pr-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-mono font-bold text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-on-surface">
                  KYC Verification Status
                </label>
                <select
                  value={kycStatus}
                  onChange={(e) => setKycStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-medium text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {ACCOUNT_OPENING_KYC_STATUSES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-on-surface">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 1000/- Account"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-xs text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Document & Photo Attachments (Offline Local Storage) */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-surface-container/50">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">upload_file</span>
                Document & Photo Attachments (100% Local Storage)
              </span>
              <span className="text-[10px] text-outline font-medium">
                Photo, Aadhaar & PAN files stay securely on your local PC
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Slot 1: Customer Photo (Passport size) - 3 cols */}
              <div className="md:col-span-3 p-3 rounded-xl bg-surface-container-lowest border border-surface-container flex flex-col items-center justify-center text-center gap-2 min-h-[140px]">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                {photoDoc ? (
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    <img
                      src={photoDoc.dataUrl}
                      alt="Customer"
                      className="w-20 h-20 rounded-xl object-cover border-2 border-primary shadow-xs"
                    />
                    <span className="text-[11px] font-semibold text-on-surface truncate max-w-full" title={photoDoc.name}>
                      {photoDoc.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPhotoDoc(null)}
                      className="text-[10px] text-red-500 hover:text-red-700 hover:underline font-semibold flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-xs">delete</span>
                      <span>Remove Photo</span>
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    className="flex flex-col items-center gap-1.5 cursor-pointer py-3 w-full hover:bg-surface-container/30 rounded-xl transition"
                  >
                    <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-outline">
                      <span className="material-symbols-outlined text-2xl">account_box</span>
                    </div>
                    <span className="text-xs font-bold text-primary">+ Customer Photo</span>
                    <span className="text-[10px] text-outline">Passport size (JPG/PNG)</span>
                  </div>
                )}
              </div>

              {/* Slot 2: Aadhaar Card Documents (Multiple Images / PDFs) - 5 cols */}
              <div className="md:col-span-5 p-3 rounded-xl bg-surface-container-lowest border border-surface-container flex flex-col justify-between gap-2 min-h-[140px]">
                <input
                  ref={aadhaarInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleMultipleFilesChange(e, setAadhaarDocs)}
                />
                <div className="flex items-center justify-between pb-1.5 border-b border-surface-container/50">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">fingerprint</span>
                    <span className="text-xs font-bold text-on-surface">Aadhaar Card</span>
                    {aadhaarDocs.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-primary/10 text-primary">
                        {aadhaarDocs.length} {aadhaarDocs.length === 1 ? 'file' : 'files'}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => aadhaarInputRef.current?.click()}
                    className="text-[11px] text-primary hover:underline font-bold flex items-center gap-0.5"
                  >
                    <span className="material-symbols-outlined text-xs">add_photo_alternate</span>
                    <span>+ Add Image / PDF</span>
                  </button>
                </div>

                {aadhaarDocs.length > 0 ? (
                  <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {aadhaarDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-surface-container/60 border border-surface-container-high transition hover:bg-surface-container"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {doc.name.toLowerCase().endsWith('.pdf') ? (
                            <span className="material-symbols-outlined text-xl text-red-500 flex-shrink-0">picture_as_pdf</span>
                          ) : (
                            <img
                              src={doc.dataUrl}
                              alt={doc.name}
                              className="w-8 h-8 rounded object-cover border border-surface-container flex-shrink-0"
                            />
                          )}
                          <span className="text-xs text-on-surface font-medium truncate" title={doc.name}>
                            {doc.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAadhaarDoc(doc.id)}
                          className="p-1 text-outline hover:text-red-500 rounded hover:bg-red-500/10 transition flex-shrink-0"
                          title="Remove this image/file"
                        >
                          <span className="material-symbols-outlined text-sm block">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    onClick={() => aadhaarInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-1 cursor-pointer py-4 hover:bg-surface-container/30 rounded-xl transition border border-dashed border-surface-container-high"
                  >
                    <span className="material-symbols-outlined text-2xl text-outline">add_circle_outline</span>
                    <span className="text-xs font-semibold text-primary">+ Attach Aadhaar Images</span>
                    <span className="text-[10px] text-outline">Upload Front & Back images or PDF</span>
                  </div>
                )}
              </div>

              {/* Slot 3: PAN / Form 60 Documents (Multiple Images / PDFs) - 4 cols */}
              <div className="md:col-span-4 p-3 rounded-xl bg-surface-container-lowest border border-surface-container flex flex-col justify-between gap-2 min-h-[140px]">
                <input
                  ref={panInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleMultipleFilesChange(e, setPanDocs)}
                />
                <div className="flex items-center justify-between pb-1.5 border-b border-surface-container/50">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">credit_card</span>
                    <span className="text-xs font-bold text-on-surface">PAN / Form 60</span>
                    {panDocs.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-primary/10 text-primary">
                        {panDocs.length} {panDocs.length === 1 ? 'file' : 'files'}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => panInputRef.current?.click()}
                    className="text-[11px] text-primary hover:underline font-bold flex items-center gap-0.5"
                  >
                    <span className="material-symbols-outlined text-xs">add_photo_alternate</span>
                    <span>+ Add Image / PDF</span>
                  </button>
                </div>

                {panDocs.length > 0 ? (
                  <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {panDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-surface-container/60 border border-surface-container-high transition hover:bg-surface-container"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {doc.name.toLowerCase().endsWith('.pdf') ? (
                            <span className="material-symbols-outlined text-xl text-red-500 flex-shrink-0">picture_as_pdf</span>
                          ) : (
                            <img
                              src={doc.dataUrl}
                              alt={doc.name}
                              className="w-8 h-8 rounded object-cover border border-surface-container flex-shrink-0"
                            />
                          )}
                          <span className="text-xs text-on-surface font-medium truncate" title={doc.name}>
                            {doc.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePanDoc(doc.id)}
                          className="p-1 text-outline hover:text-red-500 rounded hover:bg-red-500/10 transition flex-shrink-0"
                          title="Remove this image/file"
                        >
                          <span className="material-symbols-outlined text-sm block">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    onClick={() => panInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-1 cursor-pointer py-4 hover:bg-surface-container/30 rounded-xl transition border border-dashed border-surface-container-high"
                  >
                    <span className="material-symbols-outlined text-2xl text-outline">add_circle_outline</span>
                    <span className="text-xs font-semibold text-primary">+ Attach PAN / Form 60</span>
                    <span className="text-[10px] text-outline">Upload Card or Form 60 sheets</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-full text-xs font-semibold text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-full bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-xs animate-spin">refresh</span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xs">how_to_reg</span>
                  <span>Save Account Opening</span>
                </>
              )}
            </button>
          </div>
        </form>
    </Modal>
  );
};
