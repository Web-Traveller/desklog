import React, { useState, useEffect, useRef } from 'react';
import { useDesk } from '../context/DeskContext';
import { BankAccountOpening } from '../types';
import { Modal } from './Modal';
import { rupeesToPaise, paiseToRupees } from '../utils/currencyUtils';
import { calculateAge } from '../utils/dateUtils';
import { parseDocPaths, formatDocPathsForStorage, extractFileName } from '../utils/documentUtils';
import { saveTauriAccountDocument, getTauriDocumentDataUrl } from '../api/tauri';
import { lookupCustomerDetails } from '../utils/autofillLookup';
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
  id: string;
  name: string;
  dataUrl: string;
  size?: number;
  path?: string;
  isExisting?: boolean;
}

export const EditAccountOpeningModal: React.FC<EditAccountOpeningModalProps> = ({
  isOpen,
  account,
  onClose,
}) => {
  const {
    updateAccountOpening,
    showToast,
    bankSchemes,
    customers,
    accountOpenings,
    bankingTransactions,
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
  const [aadhaarDocs, setAadhaarDocs] = useState<SelectedDoc[]>([]);
  const [panDocs, setPanDocs] = useState<SelectedDoc[]>([]);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const aadhaarInputRef = useRef<HTMLInputElement>(null);
  const panInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      showToast('Photo exceeds 15MB limit. Please select a smaller file.', 'warning');
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
      setAadhaarDocs([]);
      setPanDocs([]);

      if (account.photo_path) {
        getTauriDocumentDataUrl(account.photo_path).then(dataUrl => {
          if (dataUrl) {
            setPhotoDoc({
              id: `existing_photo_${account.id}`,
              name: extractFileName(account.photo_path, 'Customer Photo'),
              dataUrl,
              path: account.photo_path,
              isExisting: true,
            });
          }
        });
      }

      // Preload Aadhaar docs in exact order
      const aadhaarPaths = parseDocPaths(account.aadhaar_doc_path);
      if (aadhaarPaths.length > 0) {
        Promise.all(
          aadhaarPaths.map(async (path, idx): Promise<SelectedDoc | null> => {
            const dataUrl = await getTauriDocumentDataUrl(path).catch(() => null);
            if (!dataUrl) return null;
            return {
              id: `existing_aadhaar_${idx}_${path}`,
              name: extractFileName(path, `Aadhaar Document ${idx + 1}`),
              dataUrl,
              path,
              isExisting: true,
            };
          })
        ).then(loaded => {
          const valid: SelectedDoc[] = loaded.filter((d): d is SelectedDoc => d !== null);
          setAadhaarDocs(valid);
        });
      }

      // Preload PAN docs in exact order
      const panPaths = parseDocPaths(account.pan_doc_path);
      if (panPaths.length > 0) {
        Promise.all(
          panPaths.map(async (path, idx): Promise<SelectedDoc | null> => {
            const dataUrl = await getTauriDocumentDataUrl(path).catch(() => null);
            if (!dataUrl) return null;
            return {
              id: `existing_pan_${idx}_${path}`,
              name: extractFileName(path, `PAN Document ${idx + 1}`),
              dataUrl,
              path,
              isExisting: true,
            };
          })
        ).then(loaded => {
          const valid: SelectedDoc[] = loaded.filter((d): d is SelectedDoc => d !== null);
          setPanDocs(valid);
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
      if (aadhaarDocs.length > 0) docCount++;
      if (panDocs.length > 0 || noPanAvailable) docCount++;
      const computedDocStatus = docCount === 3 ? 'Attached (3/3)' : docCount > 0 ? `Partial (${docCount}/3)` : 'No Docs';
      const finalPan = noPanAvailable ? 'Form 60 (No PAN)' : panNumber.trim().toUpperCase() || undefined;

      // Handle photo
      let newPhotoPath: string | undefined = undefined;
      if (photoDoc) {
        if (photoDoc.isExisting && photoDoc.path) {
          newPhotoPath = photoDoc.path;
        } else if (!photoDoc.isExisting && photoDoc.dataUrl) {
          newPhotoPath = await saveTauriAccountDocument(account.id, 'photo', photoDoc.name, photoDoc.dataUrl).catch(() => undefined);
        }
      }

      // Handle multiple Aadhaar docs
      const savedAadhaarPaths: string[] = [];
      for (const doc of aadhaarDocs) {
        if (doc.isExisting && doc.path) {
          savedAadhaarPaths.push(doc.path);
        } else if (!doc.isExisting && doc.dataUrl) {
          const savedP = await saveTauriAccountDocument(account.id, 'aadhaar', doc.name, doc.dataUrl).catch(() => null);
          if (savedP) savedAadhaarPaths.push(savedP);
        }
      }

      // Handle multiple PAN docs
      const savedPanPaths: string[] = [];
      for (const doc of panDocs) {
        if (doc.isExisting && doc.path) {
          savedPanPaths.push(doc.path);
        } else if (!doc.isExisting && doc.dataUrl) {
          const savedP = await saveTauriAccountDocument(account.id, 'pan', doc.name, doc.dataUrl).catch(() => null);
          if (savedP) savedPanPaths.push(savedP);
        }
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
        aadhaar_doc_path: formatDocPathsForStorage(savedAadhaarPaths),
        pan_doc_path: formatDocPathsForStorage(savedPanPaths),
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
                  onChange={(e) => handleMobileChange(e.target.value)}
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
                  onChange={(e) => handleAadhaarChange(e.target.value)}
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
