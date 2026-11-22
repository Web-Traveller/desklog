import React, { useState, useEffect, useRef } from 'react';
import { useDesk } from '../context/DeskContext';
import { rupeesToPaise } from '../utils/currencyUtils';
import { calculateAge } from '../utils/dateUtils';
import { saveTauriAccountDocument } from '../api/tauri';
import { Modal } from './Modal';
import {
  ACCOUNT_OPENING_SCHEMES,
  ACCOUNT_OPENING_VISIT_TYPES,
  ACCOUNT_OPENING_KYC_STATUSES,
  INDIAN_STATES,
} from '../constants/bankingData';

interface AddAccountOpeningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SelectedDoc {
  name: string;
  dataUrl: string;
  size: number;
}

export const AddAccountOpeningModal: React.FC<AddAccountOpeningModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { customers, addAccountOpening, addCustomer, editCustomer, showToast } = useDesk();

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
  const [aadhaarDoc, setAadhaarDoc] = useState<SelectedDoc | null>(null);
  const [panDoc, setPanDoc] = useState<SelectedDoc | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const aadhaarInputRef = useRef<HTMLInputElement>(null);
  const panInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (doc: SelectedDoc | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      showToast('File exceeds 15MB limit. Please select a smaller file.', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setter({
        name: file.name,
        dataUrl: reader.result as string,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
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
      setAadhaarDoc(null);
      setPanDoc(null);
    }
  }, [isOpen]);

  // Live Auto-fill from existing customers by Aadhaar or Mobile
  const handleAadhaarChange = (val: string) => {
    setAadhaarNumber(val);
    const clean = val.replace(/[\s-]/g, '');
    if (clean.length === 12) {
      const match = customers.find(c => c.aadhaar_number && c.aadhaar_number.replace(/[\s-]/g, '') === clean);
      if (match) {
        if (!customerName) setCustomerName(match.name);
        if (!mobileNumber && match.mobile) setMobileNumber(match.mobile);
        if (!mailingAddress && match.note) setMailingAddress(match.note);
      }
    }
  };

  const handleMobileChange = (val: string) => {
    setMobileNumber(val);
    const clean = val.replace(/[\s-]/g, '');
    if (clean.length === 10) {
      const match = customers.find(c => c.mobile && c.mobile.replace(/[\s-]/g, '') === clean);
      if (match) {
        if (!customerName) setCustomerName(match.name);
        if (!aadhaarNumber && match.aadhaar_number) setAadhaarNumber(match.aadhaar_number);
        if (!mailingAddress && match.note) setMailingAddress(match.note);
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
      if (aadhaarDoc) docCount++;
      if (panDoc) docCount++;
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
        if (aadhaarDoc) {
          await saveTauriAccountDocument(saved.id, 'aadhaar', aadhaarDoc.name, aadhaarDoc.dataUrl).catch(console.warn);
        }
        if (panDoc) {
          await saveTauriAccountDocument(saved.id, 'pan', panDoc.name, panDoc.dataUrl).catch(console.warn);
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
              {ACCOUNT_OPENING_SCHEMES.slice(0, 7).map((b) => (
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
                  {ACCOUNT_OPENING_SCHEMES.map(s => <option key={s} value={s} />)}
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-on-surface">
                  Visit / Lead Type
                </label>
                <select
                  value={visitType}
                  onChange={(e) => setVisitType(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-medium text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {ACCOUNT_OPENING_VISIT_TYPES.map(vt => (
                    <option key={vt} value={vt}>{vt}</option>
                  ))}
                </select>
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
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container/50 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">upload_file</span>
                Document & Photo Attachments (100% Local Storage)
              </span>
              <span className="text-[10px] text-outline font-medium">
                Photo, Aadhaar & PAN stays on your PC
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Slot 1: Customer Photo */}
              <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-surface-container flex flex-col items-center justify-center text-center gap-2 min-h-[110px]">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, setPhotoDoc)}
                />
                {photoDoc ? (
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    <img
                      src={photoDoc.dataUrl}
                      alt="Customer"
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary shadow-xs"
                    />
                    <span className="text-[11px] font-semibold text-on-surface truncate max-w-full">
                      {photoDoc.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPhotoDoc(null)}
                      className="text-[10px] text-red-500 hover:underline font-semibold"
                    >
                      Remove Photo
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    className="flex flex-col items-center gap-1 cursor-pointer py-2 w-full hover:bg-surface-container/30 rounded-lg transition"
                  >
                    <span className="material-symbols-outlined text-2xl text-outline">account_box</span>
                    <span className="text-[11px] font-semibold text-primary">+ Customer Photo</span>
                    <span className="text-[9px] text-outline">Passport size (JPG/PNG)</span>
                  </div>
                )}
              </div>

              {/* Slot 2: Aadhaar Document */}
              <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-surface-container flex flex-col items-center justify-center text-center gap-2 min-h-[110px]">
                <input
                  ref={aadhaarInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, setAadhaarDoc)}
                />
                {aadhaarDoc ? (
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    {aadhaarDoc.name.toLowerCase().endsWith('.pdf') ? (
                      <span className="material-symbols-outlined text-3xl text-red-500">picture_as_pdf</span>
                    ) : (
                      <img
                        src={aadhaarDoc.dataUrl}
                        alt="Aadhaar"
                        className="w-16 h-12 rounded object-cover border border-surface-container shadow-xs"
                      />
                    )}
                    <span className="text-[11px] font-semibold text-on-surface truncate max-w-full">
                      {aadhaarDoc.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAadhaarDoc(null)}
                      className="text-[10px] text-red-500 hover:underline font-semibold"
                    >
                      Remove Document
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => aadhaarInputRef.current?.click()}
                    className="flex flex-col items-center gap-1 cursor-pointer py-2 w-full hover:bg-surface-container/30 rounded-lg transition"
                  >
                    <span className="material-symbols-outlined text-2xl text-outline">fingerprint</span>
                    <span className="text-[11px] font-semibold text-primary">+ Aadhaar Card</span>
                    <span className="text-[9px] text-outline">Front & Back (Image/PDF)</span>
                  </div>
                )}
              </div>

              {/* Slot 3: PAN Card Document */}
              <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-surface-container flex flex-col items-center justify-center text-center gap-2 min-h-[110px]">
                <input
                  ref={panInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, setPanDoc)}
                />
                {panDoc ? (
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    {panDoc.name.toLowerCase().endsWith('.pdf') ? (
                      <span className="material-symbols-outlined text-3xl text-red-500">picture_as_pdf</span>
                    ) : (
                      <img
                        src={panDoc.dataUrl}
                        alt="PAN"
                        className="w-16 h-12 rounded object-cover border border-surface-container shadow-xs"
                      />
                    )}
                    <span className="text-[11px] font-semibold text-on-surface truncate max-w-full">
                      {panDoc.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPanDoc(null)}
                      className="text-[10px] text-red-500 hover:underline font-semibold"
                    >
                      Remove Document
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => panInputRef.current?.click()}
                    className="flex flex-col items-center gap-1 cursor-pointer py-2 w-full hover:bg-surface-container/30 rounded-lg transition"
                  >
                    <span className="material-symbols-outlined text-2xl text-outline">credit_card</span>
                    <span className="text-[11px] font-semibold text-primary">+ PAN Card</span>
                    <span className="text-[9px] text-outline">Card scan or Photo</span>
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
