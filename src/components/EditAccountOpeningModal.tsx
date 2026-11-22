import React, { useState, useEffect, useRef } from 'react';
import { useDesk } from '../context/DeskContext';
import { BankAccountOpening } from '../types';
import { Modal } from './Modal';
import { rupeesToPaise, paiseToRupees } from '../utils/currencyUtils';
import { calculateAge } from '../utils/dateUtils';
import { saveTauriAccountDocument, getTauriDocumentDataUrl } from '../api/tauri';
import {
  ACCOUNT_OPENING_SCHEMES,
  ACCOUNT_OPENING_VISIT_TYPES,
  ACCOUNT_OPENING_KYC_STATUSES,
  INDIAN_STATES,
} from '../constants/bankingData';

interface EditAccountOpeningModalProps {
  isOpen: boolean;
  account: BankAccountOpening | null;
  onClose: () => void;
}

interface SelectedDoc {
  name: string;
  dataUrl: string;
  isExisting?: boolean;
}

export const EditAccountOpeningModal: React.FC<EditAccountOpeningModalProps> = ({
  isOpen,
  account,
  onClose,
}) => {
  const { updateAccountOpening, showToast } = useDesk();

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
  const [accountDate, setAccountDate] = useState('');
  const [visitType, setVisitType] = useState('Walk-in');

  const [mailingAddress, setMailingAddress] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [zip, setZip] = useState('');

  const [initialDepositRupees, setInitialDepositRupees] = useState('');
  const [kycStatus, setKycStatus] = useState('Verified');
  const [notes, setNotes] = useState('');
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
        isExisting: false,
      });
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (account && isOpen) {
      setCustomerName(account.customer_name || '');
      setMobileNumber(account.mobile_number || '');
      setAadhaarNumber(account.aadhaar_number || '');
      const isForm60 = (account.pan_number || '').toLowerCase().includes('form 60') || (account.pan_number || '').toLowerCase().includes('not available');
      setNoPanAvailable(isForm60);
      setPanNumber(isForm60 ? 'Form 60 (No PAN)' : (account.pan_number || ''));
      setDob(account.dob || '');
      setScheme(account.scheme || 'FINO');
      setAccountNumber(account.account_number || '');
      setBankCustomerId(account.bank_customer_id || '');
      setPassbookNumber(account.passbook_number || '');
      setAccountDate(account.account_date || new Date().toISOString().slice(0, 10));
      setVisitType(account.visit_type || 'Walk-in');
      setMailingAddress(account.mailing_address || '');
      setArea(account.area || '');
      setCity(account.city || '');
      setState(account.state || 'Maharashtra');
      setZip(account.zip || '');
      setInitialDepositRupees(account.initial_deposit ? String(paiseToRupees(account.initial_deposit)) : '0');
      setKycStatus(account.kyc_status || 'Verified');
      setNotes(account.notes || '');

      // Preload documents from disk if available
      setPhotoDoc(null);
      setAadhaarDoc(null);
      setPanDoc(null);

      if (account.photo_path) {
        getTauriDocumentDataUrl(account.photo_path).then(dataUrl => {
          if (dataUrl) setPhotoDoc({ name: 'Saved Customer Photo', dataUrl, isExisting: true });
        });
      }
      if (account.aadhaar_doc_path) {
        getTauriDocumentDataUrl(account.aadhaar_doc_path).then(dataUrl => {
          if (dataUrl) setAadhaarDoc({ name: 'Saved Aadhaar Document', dataUrl, isExisting: true });
        });
      }
      if (account.pan_doc_path) {
        getTauriDocumentDataUrl(account.pan_doc_path).then(dataUrl => {
          if (dataUrl) setPanDoc({ name: 'Saved PAN Document', dataUrl, isExisting: true });
        });
      }
    }
  }, [account, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account?.id) return;

    if (!customerName.trim() || !accountNumber.trim()) {
      showToast('Name and Account Number are required.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const depositPaise = initialDepositRupees ? rupeesToPaise(Number(initialDepositRupees)) : 0;

      // Count attached docs
      let docCount = 0;
      if (photoDoc) docCount++;
      if (aadhaarDoc) docCount++;
      if (panDoc) docCount++;
      const computedDocStatus = docCount === 3 ? 'Attached (3/3)' : docCount > 0 ? `Partial (${docCount}/3)` : 'No Docs';
      const finalPan = noPanAvailable ? 'Form 60 (No PAN)' : panNumber.trim().toUpperCase() || undefined;

      // Save new files locally if selected
      let newPhotoPath = account.photo_path;
      let newAadhaarPath = account.aadhaar_doc_path;
      let newPanPath = account.pan_doc_path;

      if (photoDoc && !photoDoc.isExisting) {
        newPhotoPath = await saveTauriAccountDocument(account.id, 'photo', photoDoc.name, photoDoc.dataUrl).catch(() => newPhotoPath);
      } else if (!photoDoc) {
        newPhotoPath = undefined;
      }

      if (aadhaarDoc && !aadhaarDoc.isExisting) {
        newAadhaarPath = await saveTauriAccountDocument(account.id, 'aadhaar', aadhaarDoc.name, aadhaarDoc.dataUrl).catch(() => newAadhaarPath);
      } else if (!aadhaarDoc) {
        newAadhaarPath = undefined;
      }

      if (panDoc && !panDoc.isExisting) {
        newPanPath = await saveTauriAccountDocument(account.id, 'pan', panDoc.name, panDoc.dataUrl).catch(() => newPanPath);
      } else if (!panDoc) {
        newPanPath = undefined;
      }

      await updateAccountOpening(account.id, {
        visit_type: visitType,
        account_date: accountDate,
        passbook_number: passbookNumber.trim() || undefined,
        bank_customer_id: bankCustomerId.trim() || undefined,
        account_number: accountNumber.trim(),
        customer_name: customerName.trim(),
        dob: dob.trim() || undefined,
        aadhaar_number: aadhaarNumber.replace(/[\s-]/g, '').trim() || undefined,
        pan_number: finalPan,
        scheme: scheme.trim(),
        mobile_number: mobileNumber.replace(/[\s-]/g, '').trim() || undefined,
        mailing_address: mailingAddress.trim() || undefined,
        area: area.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zip: zip.trim() || undefined,
        initial_deposit: depositPaise,
        kyc_status: kycStatus,
        notes: notes.trim() || undefined,
        document_status: computedDocStatus,
        photo_path: newPhotoPath,
        aadhaar_doc_path: newAadhaarPath,
        pan_doc_path: newPanPath,
      });

      onClose();
    } catch (err) {
      console.error('Failed to update bank account opening', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !account) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Bank Account Record"
      subtitle={`Account #${account.account_number} · ${account.scheme}`}
      icon="edit_document"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
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
                  list="edit-scheme-options"
                  value={scheme}
                  onChange={(e) => setScheme(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-semibold text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <datalist id="edit-scheme-options">
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
                  required
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-semibold text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-on-surface">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-mono text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-on-surface">
                  Aadhaar Number
                </label>
                <input
                  type="text"
                  maxLength={14}
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
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
                  <span className="material-symbols-outlined text-xs">save</span>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
    </Modal>
  );
};
