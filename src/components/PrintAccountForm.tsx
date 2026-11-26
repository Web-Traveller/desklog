import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BankAccountOpening } from '../types';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface PrintAccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  account?: BankAccountOpening | null;
  shopName?: string;
  isBlank?: boolean;
}

export const PrintAccountForm: React.FC<PrintAccountFormProps> = ({
  isOpen,
  onClose,
  account,
  shopName = 'CUSTOMER SERVICE POINT (CSP) / BANKING COUNTER',
  isBlank = false,
}) => {
  // Lock background body scroll while preview is active
  useBodyScrollLock(isOpen);

  // ESC key listener to close preview
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isFilled = !isBlank && !!account;
  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div
      className="print-portal-overlay fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-md flex flex-col items-center animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm 12mm 10mm 12mm;
        }
        @media print {
          /* 1. Hide the entire application DOM tree & other non-print elements */
          #root,
          body > *:not(.print-portal-overlay) {
            display: none !important;
          }

          /* 2. Reset html and body layout */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* 3. Hide floating action bar & non-printable UI */
          .no-print {
            display: none !important;
          }

          /* 4. Portal overlay container in print */
          .print-portal-overlay {
            position: static !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            display: block !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }

          /* 5. Clean centered A4 printable page */
          #printable-bank-form {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11.5px !important;
            line-height: 1.35 !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
          }

          /* High contrast crisp borders for thermal & laser printers */
          table, th, td {
            border-color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Action Header Bar using core Material 3 design tokens */}
      <div className="no-print sticky top-0 z-30 w-full bg-surface-container-lowest/95 backdrop-blur-md px-6 py-3 border-b border-surface-container shadow-md flex items-center justify-between text-on-surface">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">print</span>
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-on-surface flex items-center gap-2">
              <span>{isFilled ? 'Customer Account Application Slip' : 'Blank Account Opening Application Form'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-primary/10 text-primary font-semibold uppercase">
                {isFilled ? 'Filled Profile' : 'Blank A4 Form'}
              </span>
            </h3>
            <p className="text-xs text-on-surface-variant">
              {isFilled
                ? `Customer: ${account?.customer_name || 'Customer'} • Scheme: ${account?.scheme || 'Bank'}`
                : 'Customer application form ready to print for manual pen filling'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary/90 transition shadow-sm active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span>Print Form (Ctrl+P)</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface border border-surface-container-highest rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>

      {/* A4 Sheet Preview Container */}
      <div className="w-full flex justify-center py-6 px-3 sm:px-6 flex-1">
        <div
          id="printable-bank-form"
          className="bg-white text-gray-950 w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-10 shadow-2xl rounded-sm text-[12px] leading-normal font-sans border border-surface-container flex flex-col justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            {/* Header Section */}
            <div className="border-b-2 border-black pb-3 mb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <span className="text-[10px] tracking-widest uppercase font-bold text-gray-600 block mb-0.5">
                    CUSTOMER SERVICE POINT &middot; BANKING FACILITATOR
                  </span>
                  <h1 className="text-2xl font-black uppercase tracking-tight text-black leading-tight">
                    {shopName}
                  </h1>
                  <p className="text-xs font-semibold text-gray-800 mt-1">
                    Customer Savings Account Opening & Biometric KYC Application Form
                  </p>
                </div>

                {/* Passport Photo Box */}
                <div className="w-28 h-32 border-2 border-dashed border-black rounded flex flex-col items-center justify-center text-center p-1.5 bg-gray-50 flex-shrink-0">
                  <span className="text-[9px] font-bold text-gray-700 leading-tight">
                    AFFIX RECENT PASSPORT PHOTO
                  </span>
                  <span className="text-[8px] text-gray-500 mt-1">
                    (Cross sign across photo)
                  </span>
                </div>
              </div>

              {/* Subheader info without Visit Type */}
              <div className="flex items-center justify-between text-xs font-semibold text-gray-800 mt-2.5 pt-2 border-t border-gray-300">
                <span>Date: <strong>{isFilled ? account?.account_date || todayStr : '___ / ___ / 202___'}</strong></span>
                <span>Bank / Scheme: <strong>{isFilled ? account?.scheme || '____________________' : '________________________________________'}</strong></span>
              </div>
            </div>

            {/* Section 1: Customer Personal Details (without Father/Spouse) */}
            <div className="mb-4">
              <div className="bg-gray-100 px-3 py-1 border border-black font-bold text-xs uppercase tracking-wide flex items-center justify-between">
                <span>1. Customer Personal & KYC Details</span>
                <span className="text-[10px] font-normal normal-case text-gray-600">(Fill in BLOCK letters)</span>
              </div>

              <table className="w-full table-fixed border-collapse border border-black text-xs mt-1">
                <tbody>
                  <tr className="border-b border-gray-400">
                    <td className="w-[24%] bg-gray-50 p-2 font-bold border-r border-gray-400">Customer Full Name:</td>
                    <td className="w-[76%] p-2 font-black uppercase tracking-wide text-sm" colSpan={3}>
                      {isFilled ? account?.customer_name : ''}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <td className="w-[24%] bg-gray-50 p-2 font-bold border-r border-gray-400">Date of Birth (DOB):</td>
                    <td className="w-[26%] p-2 border-r border-gray-400 font-semibold">
                      {isFilled ? account?.dob || '___ / ___ / ______' : 'DD / MM / YYYY'}
                    </td>
                    <td className="w-[22%] bg-gray-50 p-2 font-bold border-r border-gray-400">Gender:</td>
                    <td className="w-[28%] p-2 font-medium">
                      [ &nbsp; ] Male &nbsp;&nbsp; [ &nbsp; ] Female &nbsp;&nbsp; [ &nbsp; ] Other
                    </td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <td className="w-[24%] bg-gray-50 p-2 font-bold border-r border-gray-400">Mobile Number:</td>
                    <td className="w-[76%] p-2 font-mono font-bold text-sm" colSpan={3}>
                      {isFilled ? account?.mobile_number || '' : '+91 ________________________'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <td className="w-[24%] bg-gray-50 p-2 font-bold border-r border-gray-400">Aadhaar Number:</td>
                    <td className="w-[26%] p-2 border-r border-gray-400 font-mono font-bold tracking-widest text-sm">
                      {isFilled ? account?.aadhaar_number || '' : '____  ____  ____'}
                    </td>
                    <td className="w-[22%] bg-gray-50 p-2 font-bold border-r border-gray-400">PAN Number:</td>
                    <td className="w-[28%] p-2 font-mono font-bold">
                      {isFilled ? account?.pan_number || 'Form 60 Attached' : '_____________________'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 2: Address Details */}
            <div className="mb-4">
              <div className="bg-gray-100 px-3 py-1 border border-black font-bold text-xs uppercase tracking-wide">
                2. Communication & Residential Address
              </div>

              <table className="w-full table-fixed border-collapse border border-black text-xs mt-1">
                <tbody>
                  <tr className="border-b border-gray-400">
                    <td className="w-[24%] bg-gray-50 p-2 font-bold border-r border-gray-400">House / Village / Street:</td>
                    <td className="w-[76%] p-2" colSpan={3}>
                      {isFilled ? account?.mailing_address || '' : ''}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <td className="w-[24%] bg-gray-50 p-2 font-bold border-r border-gray-400">Area / Landmark:</td>
                    <td className="w-[26%] p-2 border-r border-gray-400">
                      {isFilled ? account?.area || '' : ''}
                    </td>
                    <td className="w-[22%] bg-gray-50 p-2 font-bold border-r border-gray-400">City / Tehsil:</td>
                    <td className="w-[28%] p-2">
                      {isFilled ? account?.city || '' : ''}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <td className="w-[24%] bg-gray-50 p-2 font-bold border-r border-gray-400">State:</td>
                    <td className="w-[26%] p-2 border-r border-gray-400">
                      {isFilled ? account?.state || 'Maharashtra' : ''}
                    </td>
                    <td className="w-[22%] bg-gray-50 p-2 font-bold border-r border-gray-400">PIN Code:</td>
                    <td className="w-[28%] p-2 font-mono font-bold">
                      {isFilled ? account?.zip || '' : '______'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 3: Bank Account & Initial Deposit */}
            <div className="mb-4">
              <div className="bg-gray-100 px-3 py-1 border border-black font-bold text-xs uppercase tracking-wide">
                3. Bank Scheme & Deposit Particulars
              </div>

              <table className="w-full table-fixed border-collapse border border-black text-xs mt-1">
                <tbody>
                  <tr className="border-b border-gray-400">
                    <td className="w-[24%] bg-gray-50 p-2 font-bold border-r border-gray-400">Selected Scheme:</td>
                    <td className="w-[26%] p-2 border-r border-gray-400 font-bold">
                      {isFilled ? account?.scheme : ''}
                    </td>
                    <td className="w-[22%] bg-gray-50 p-2 font-bold border-r border-gray-400">Initial Deposit:</td>
                    <td className="w-[28%] p-2 font-mono font-black text-sm">
                      {isFilled
                        ? account?.initial_deposit
                          ? `₹ ${Math.floor(account.initial_deposit / 100).toLocaleString('en-IN')}`
                          : '₹ 0.00'
                        : '₹ ____________'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <td className="w-[24%] bg-gray-50 p-2 font-bold border-r border-gray-400">Account Type:</td>
                    <td className="w-[26%] p-2 border-r border-gray-400">
                      [ &nbsp; ] Savings &nbsp;&nbsp; [ &nbsp; ] PMJDY
                    </td>
                    <td className="w-[22%] bg-gray-50 p-2 font-bold border-r border-gray-400">Nominee Name:</td>
                    <td className="w-[28%] p-2">___________________________</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 4: For Office / Kiosk Use Only */}
            <div className="mb-4">
              <div className="bg-gray-100 px-3 py-1 border border-black font-bold text-xs uppercase tracking-wide flex items-center justify-between">
                <span>4. For Office / Counter Operator Use Only</span>
                <span className="text-[10px] font-bold text-gray-700">Official Allocation Record</span>
              </div>

              <table className="w-full table-fixed border-collapse border border-black text-xs mt-1">
                <tbody>
                  <tr className="border-b border-gray-400">
                    <td className="w-[24%] bg-gray-50 p-2 font-bold border-r border-gray-400">Assigned Account No:</td>
                    <td className="w-[26%] p-2 border-r border-gray-400 font-mono font-black text-sm">
                      {isFilled ? account?.account_number || 'Pending' : '________________________'}
                    </td>
                    <td className="w-[22%] bg-gray-50 p-2 font-bold border-r border-gray-400">Customer CIF / ID:</td>
                    <td className="w-[28%] p-2 font-mono font-bold">
                      {isFilled ? account?.bank_customer_id || 'Pending' : '________________________'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <td className="w-[24%] bg-gray-50 p-2 font-bold border-r border-gray-400">Passbook / Kit No:</td>
                    <td className="w-[26%] p-2 border-r border-gray-400 font-mono">
                      {isFilled ? account?.passbook_number || '-' : '________________________'}
                    </td>
                    <td className="w-[22%] bg-gray-50 p-2 font-bold border-r border-gray-400">KYC Status:</td>
                    <td className="w-[28%] p-2 font-bold">
                      {isFilled ? account?.kyc_status || 'Verified' : '[ &nbsp; ] Verified &nbsp;&nbsp; [ &nbsp; ] Pending'}
                    </td>
                  </tr>
                  {isFilled && account?.notes && (
                    <tr>
                      <td className="w-[24%] bg-gray-50 p-2 font-bold border-r border-gray-400">Remarks / Notes:</td>
                      <td className="w-[76%] p-2" colSpan={3}>{account.notes}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Checklist & Declarations */}
            <div className="mb-4 border border-black p-2.5 bg-gray-50 text-[10.5px]">
              <p className="font-bold uppercase text-[10.5px] mb-0.5">Applicant Declaration & KYC Consent:</p>
              <p className="text-gray-700 leading-relaxed">
                I hereby apply for opening a bank savings/kiosk account. I declare that the particulars furnished above are true and correct to the best of my knowledge. I authorize the counter operator to utilize my Aadhaar and biometric credentials for identity verification and account linkage in accordance with UIDAI and RBI guidelines.
              </p>
              <div className="mt-2 flex items-center gap-5 text-gray-800 font-semibold text-xs">
                <span>Attached Proofs:</span>
                <span>[ &nbsp; ] Aadhaar Copy</span>
                <span>[ &nbsp; ] PAN / Form 60</span>
                <span>[ &nbsp; ] Passport Photo</span>
                <span>[ &nbsp; ] Biometric e-KYC</span>
              </div>
            </div>

            {/* Signature Boxes */}
            <div className="grid grid-cols-2 gap-6 pt-2">
              <div className="border border-black p-3 h-24 flex flex-col justify-between text-center bg-white">
                <span className="text-[9.5px] text-gray-600 uppercase tracking-wider font-bold">
                  Signature / Left Thumb Impression of Customer
                </span>
                <div className="border-t border-dashed border-gray-400 pt-1 font-bold text-xs">
                  {isFilled ? account?.customer_name : 'Customer Signature'}
                </div>
              </div>

              <div className="border border-black p-3 h-24 flex flex-col justify-between text-center bg-white">
                <span className="text-[9.5px] text-gray-600 uppercase tracking-wider font-bold">
                  Authorized CSP Operator Sign & Center Stamp
                </span>
                <div className="border-t border-dashed border-gray-400 pt-1 font-bold text-xs">
                  Authorized Signatory & Date
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[9.5px] text-gray-500 mt-4 pt-1.5 border-t border-gray-300">
            DeskLog Kiosk Management System &middot; Local Database Record &middot; Form Generated: {todayStr}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
