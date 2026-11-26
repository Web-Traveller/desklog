import React, { useState, useEffect } from 'react';
import { BankAccountOpening } from '../types';
import { Modal } from './Modal';
import { StatusBadge } from './StatusBadge';
import { calculateAge } from '../utils/dateUtils';
import { parseDocPaths, extractFileName } from '../utils/documentUtils';
import { getTauriDocumentDataUrl, openTauriDocument } from '../api/tauri';
import { PrintAccountForm } from './PrintAccountForm';
import { useBanking } from '../context/BankingContext';

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
  const { shopName } = useBanking();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [aadhaarDocs, setAadhaarDocs] = useState<{ path: string; dataUrl: string }[]>([]);
  const [panDocs, setPanDocs] = useState<{ path: string; dataUrl: string }[]>([]);
  const [zoomDoc, setZoomDoc] = useState<{ title: string; url: string; path?: string } | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    if (account && isOpen) {
      setPhotoUrl(null);
      setAadhaarDocs([]);
      setPanDocs([]);
      setZoomDoc(null);

      if (account.photo_path) {
        getTauriDocumentDataUrl(account.photo_path).then(setPhotoUrl);
      }

      const aadhaarPaths = parseDocPaths(account.aadhaar_doc_path);
      if (aadhaarPaths.length > 0) {
        Promise.all(
          aadhaarPaths.map(async (path) => {
            const dataUrl = await getTauriDocumentDataUrl(path).catch(() => null);
            return dataUrl ? { path, dataUrl } : null;
          })
        ).then(loaded => {
          setAadhaarDocs(loaded.filter((d): d is { path: string; dataUrl: string } => d !== null));
        });
      }

      const panPaths = parseDocPaths(account.pan_doc_path);
      if (panPaths.length > 0) {
        Promise.all(
          panPaths.map(async (path) => {
            const dataUrl = await getTauriDocumentDataUrl(path).catch(() => null);
            return dataUrl ? { path, dataUrl } : null;
          })
        ).then(loaded => {
          setPanDocs(loaded.filter((d): d is { path: string; dataUrl: string } => d !== null));
        });
      }
    }
  }, [account, isOpen]);

  if (!account) return null;

  const age = calculateAge(account.dob);

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
    <>
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
          <div className="flex items-center gap-2">
            {account.document_status && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                account.document_status.includes('3/3') || account.document_status.toLowerCase().includes('done')
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
              }`}>
                {account.document_status}
              </span>
            )}
            <StatusBadge status={account.kyc_status || 'Verified'} size="sm" />
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl transition border border-surface-container-high/60"
              title="Print customer application form filled with account details"
            >
              <span className="material-symbols-outlined text-sm text-primary">print</span>
              <span>Print Form</span>
            </button>
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

          {/* Customer & Personal Information (with Passport Photo if available) */}
          <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container/70 flex flex-col sm:flex-row items-start gap-4">
            {photoUrl ? (
              <div className="relative group cursor-pointer flex-shrink-0" onClick={() => setZoomDoc({ title: `${account.customer_name} (Photo)`, url: photoUrl, path: account.photo_path })}>
                <img
                  src={photoUrl}
                  alt={account.customer_name}
                  className="w-20 h-24 rounded-lg object-cover border-2 border-primary/40 shadow-xs group-hover:opacity-90 transition"
                />
                <span className="absolute bottom-1 right-1 bg-black/60 text-white rounded p-0.5">
                  <span className="material-symbols-outlined text-[12px] block">zoom_in</span>
                </span>
              </div>
            ) : (
              <div className="w-16 h-20 rounded-lg bg-surface-container flex flex-col items-center justify-center text-outline flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">account_box</span>
                <span className="text-[9px] mt-0.5">No Photo</span>
              </div>
            )}

            <div className="flex-1 w-full space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                  <span className="material-symbols-outlined text-sm text-primary">person</span>
                  <span>Customer Profile</span>
                </div>
                {age !== null && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary">
                    Age: {age} yrs
                  </span>
                )}
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
                    {account.pan_number || 'Form 60 (No PAN)'}
                  </span>
                  {account.pan_number && !account.pan_number.toLowerCase().includes('form 60') && (
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

          {/* Attached Local Documents Gallery */}
          <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container/70 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-on-surface">
                <span className="material-symbols-outlined text-sm text-primary">folder_open</span>
                <span>Attached Identity Documents (Local Storage)</span>
              </div>
              <span className="text-[10px] text-outline">Stored on this workstation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Photo Slot */}
              <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container/60 flex flex-col items-center justify-between text-center min-h-[120px]">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Customer Photo</span>
                {photoUrl ? (
                  <div className="flex flex-col items-center gap-1.5 my-1">
                    <img
                      src={photoUrl}
                      alt="Customer"
                      onClick={() => setZoomDoc({ title: 'Customer Photo', url: photoUrl, path: account.photo_path })}
                      className="w-14 h-14 rounded-full object-cover border border-primary cursor-pointer hover:scale-105 transition"
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setZoomDoc({ title: 'Customer Photo', url: photoUrl, path: account.photo_path })}
                        className="text-[10px] text-primary hover:underline font-semibold"
                      >
                        Preview
                      </button>
                      {account.photo_path && (
                        <button
                          type="button"
                          onClick={() => openTauriDocument(account.photo_path!)}
                          className="text-[10px] text-outline hover:text-on-surface font-semibold"
                          title="Open with default Windows viewer"
                        >
                          Open File
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 my-2 text-outline">
                    <span className="material-symbols-outlined text-xl">no_photography</span>
                    <span className="text-[10px]">Not Attached</span>
                  </div>
                )}
              </div>

              {/* Aadhaar Slot (Multiple Files Support) */}
              <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container/60 flex flex-col items-center justify-between text-center min-h-[120px]">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">
                  Aadhaar Card {aadhaarDocs.length > 0 && `(${aadhaarDocs.length})`}
                </span>
                {aadhaarDocs.length > 0 ? (
                  <div className="flex flex-col gap-2 my-1 w-full items-center">
                    {aadhaarDocs.map((doc, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1 w-full pb-1.5 border-b border-surface-container/40 last:border-b-0">
                        {doc.dataUrl.startsWith('data:application/pdf') ? (
                          <span className="material-symbols-outlined text-2xl text-red-500">picture_as_pdf</span>
                        ) : (
                          <img
                            src={doc.dataUrl}
                            alt={extractFileName(doc.path, `Aadhaar ${idx + 1}`)}
                            onClick={() => setZoomDoc({ title: `Aadhaar: ${extractFileName(doc.path, `Doc ${idx + 1}`)}`, url: doc.dataUrl, path: doc.path })}
                            className="w-16 h-12 rounded object-cover border border-surface-container cursor-pointer hover:scale-105 transition"
                          />
                        )}
                        <span className="text-[10px] text-on-surface truncate max-w-[120px]" title={extractFileName(doc.path)}>
                          {extractFileName(doc.path, `Doc #${idx + 1}`)}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <button
                            type="button"
                            onClick={() => setZoomDoc({ title: `Aadhaar: ${extractFileName(doc.path, `Doc ${idx + 1}`)}`, url: doc.dataUrl, path: doc.path })}
                            className="text-[10px] text-primary hover:underline font-semibold"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => openTauriDocument(doc.path)}
                            className="text-[10px] text-outline hover:text-on-surface font-semibold"
                            title="Open with default Windows viewer"
                          >
                            Open File
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 my-2 text-outline">
                    <span className="material-symbols-outlined text-xl">fingerprint</span>
                    <span className="text-[10px]">Not Attached</span>
                  </div>
                )}
              </div>

              {/* PAN Slot (Multiple Files Support) */}
              <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container/60 flex flex-col items-center justify-between text-center min-h-[120px]">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">
                  PAN Card {panDocs.length > 0 && `(${panDocs.length})`}
                </span>
                {panDocs.length > 0 ? (
                  <div className="flex flex-col gap-2 my-1 w-full items-center">
                    {panDocs.map((doc, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1 w-full pb-1.5 border-b border-surface-container/40 last:border-b-0">
                        {doc.dataUrl.startsWith('data:application/pdf') ? (
                          <span className="material-symbols-outlined text-2xl text-red-500">picture_as_pdf</span>
                        ) : (
                          <img
                            src={doc.dataUrl}
                            alt={extractFileName(doc.path, `PAN ${idx + 1}`)}
                            onClick={() => setZoomDoc({ title: `PAN: ${extractFileName(doc.path, `Doc ${idx + 1}`)}`, url: doc.dataUrl, path: doc.path })}
                            className="w-16 h-12 rounded object-cover border border-surface-container cursor-pointer hover:scale-105 transition"
                          />
                        )}
                        <span className="text-[10px] text-on-surface truncate max-w-[120px]" title={extractFileName(doc.path)}>
                          {extractFileName(doc.path, `Doc #${idx + 1}`)}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <button
                            type="button"
                            onClick={() => setZoomDoc({ title: `PAN: ${extractFileName(doc.path, `Doc ${idx + 1}`)}`, url: doc.dataUrl, path: doc.path })}
                            className="text-[10px] text-primary hover:underline font-semibold"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => openTauriDocument(doc.path)}
                            className="text-[10px] text-outline hover:text-on-surface font-semibold"
                            title="Open with default Windows viewer"
                          >
                            Open File
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 my-2 text-outline">
                    <span className="material-symbols-outlined text-xl">credit_card</span>
                    <span className="text-[10px]">Not Attached</span>
                  </div>
                )}
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

      {/* Document Zoom / High-Res Preview Lightbox Modal */}
      {zoomDoc && (
        <Modal
          isOpen={true}
          onClose={() => setZoomDoc(null)}
          title={zoomDoc.title}
          subtitle="Document preview stored on local system"
          icon="visibility"
          maxWidth="3xl"
          footer={
            <div className="flex items-center justify-between w-full">
              {zoomDoc.path && (
                <button
                  type="button"
                  onClick={() => openTauriDocument(zoomDoc.path!)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-xs font-semibold text-on-surface transition"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  <span>Open in Windows</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setZoomDoc(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-primary text-on-primary rounded-xl"
              >
                Done
              </button>
            </div>
          }
        >
          <div className="flex flex-col items-center justify-center p-2 min-h-[350px] bg-slate-950/40 rounded-xl overflow-hidden">
            {zoomDoc.url.startsWith('data:application/pdf') ? (
              <iframe
                src={zoomDoc.url}
                title={zoomDoc.title}
                className="w-full h-[500px] border-0 rounded-lg"
              />
            ) : (
              <img
                src={zoomDoc.url}
                alt={zoomDoc.title}
                className="max-h-[550px] max-w-full object-contain rounded-lg shadow-lg"
              />
            )}
          </div>
        </Modal>
      )}

      <PrintAccountForm
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        account={account}
        shopName={shopName}
        isBlank={false}
      />
    </>
  );
};
