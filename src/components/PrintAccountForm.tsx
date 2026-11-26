import React from 'react';
import { BankAccountOpening } from '../types';

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-bank-form, #printable-bank-form * {
            visibility: visible;
          }
          #printable-bank-form {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 12mm 15mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Container */}
      <div className="relative bg-white text-gray-900 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Floating Action Bar (Hidden on print) */}
        <div className="no-print sticky top-0 z-20 bg-surface-container-low/95 backdrop-blur-md px-6 py-3 border-b border-surface-container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">print</span>
            <div>
              <h3 className="text-sm font-bold text-on-surface">
                {isFilled ? 'Customer Account Profile Form' : 'Blank Account Opening Application Form'}
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                {isFilled
                  ? `Pre-filled form for ${account?.customer_name || 'Customer'}`
                  : 'Ready to print for walk-in customer manual pen filling'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary/90 transition shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span>Print Form</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable Paper Area (A4 style) */}
        <div
          id="printable-bank-form"
          className="p-8 sm:p-10 font-sans text-xs leading-relaxed text-black bg-white"
        >
          {/* Header */}
          <div className="border-b-2 border-black pb-3 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="text-[10px] tracking-wider uppercase font-semibold text-gray-600 block">
                  CUSTOMER SERVICE POINT &middot; BANKING FACILITATOR
                </span>
                <h1 className="text-xl font-black uppercase tracking-tight text-black">
                  {shopName}
                </h1>
                <p className="text-[11px] font-medium text-gray-700">
                  Customer Savings Account Opening & Biometric KYC Application Form
                </p>
              </div>

              {/* Passport Photo Box */}
              <div className="w-28 h-32 border-2 border-dashed border-black rounded flex flex-col items-center justify-center text-center p-1 bg-gray-50 flex-shrink-0">
                <span className="text-[9px] font-semibold text-gray-600 leading-tight">
                  AFFIX RECENT PASSPORT PHOTO
                </span>
                <span className="text-[8px] text-gray-500 mt-1">
                  (Cross-signed by applicant)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-medium text-gray-600 mt-2 pt-2 border-t border-gray-300">
              <span>Date: <strong>{isFilled ? account?.account_date || todayStr : '___ / ___ / 202___'}</strong></span>
              <span>Scheme / Partner Bank: <strong>{isFilled ? account?.scheme || '_______________' : '______________________________'}</strong></span>
              <span>Visit Type: <strong>{isFilled ? account?.visit_type || 'Walk-in' : 'Walk-in / Camp'}</strong></span>
            </div>
          </div>

          {/* Section 1: Customer Personal Details */}
          <div className="mb-4">
            <div className="bg-gray-100 px-2 py-1 border border-black font-bold text-[11px] uppercase tracking-wide flex items-center justify-between">
              <span>1. Customer Personal & KYC Details</span>
              <span className="text-[9px] font-normal normal-case">(Fill in BLOCK letters)</span>
            </div>

            <table className="w-full border-collapse border border-black text-[11px] mt-1">
              <tbody>
                <tr className="border-b border-gray-400">
                  <td className="w-36 bg-gray-50 p-2 font-semibold border-r border-gray-400">Customer Full Name:</td>
                  <td className="p-2 font-bold uppercase tracking-wide" colSpan={3}>
                    {isFilled ? account?.customer_name : ''}
                  </td>
                </tr>
                <tr className="border-b border-gray-400">
                  <td className="bg-gray-50 p-2 font-semibold border-r border-gray-400">Date of Birth (DOB):</td>
                  <td className="p-2 border-r border-gray-400 w-44">
                    {isFilled ? account?.dob || '___ / ___ / ______' : 'DD / MM / YYYY'}
                  </td>
                  <td className="w-32 bg-gray-50 p-2 font-semibold border-r border-gray-400">Gender:</td>
                  <td className="p-2">
                    [ &nbsp; ] Male &nbsp;&nbsp;&nbsp; [ &nbsp; ] Female &nbsp;&nbsp;&nbsp; [ &nbsp; ] Other
                  </td>
                </tr>
                <tr className="border-b border-gray-400">
                  <td className="bg-gray-50 p-2 font-semibold border-r border-gray-400">Mobile Number:</td>
                  <td className="p-2 border-r border-gray-400 font-mono font-semibold">
                    {isFilled ? account?.mobile_number || '' : '+91 __________________'}
                  </td>
                  <td className="bg-gray-50 p-2 font-semibold border-r border-gray-400">Father / Spouse:</td>
                  <td className="p-2">___________________________</td>
                </tr>
                <tr className="border-b border-gray-400">
                  <td className="bg-gray-50 p-2 font-semibold border-r border-gray-400">Aadhaar Number:</td>
                  <td className="p-2 border-r border-gray-400 font-mono font-bold tracking-widest">
                    {isFilled ? account?.aadhaar_number || '' : '____  ____  ____'}
                  </td>
                  <td className="bg-gray-50 p-2 font-semibold border-r border-gray-400">PAN Number:</td>
                  <td className="p-2 font-mono font-semibold">
                    {isFilled ? account?.pan_number || 'Form 60 Attached' : '_____________________'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Address Details */}
          <div className="mb-4">
            <div className="bg-gray-100 px-2 py-1 border border-black font-bold text-[11px] uppercase tracking-wide">
              2. Communication & Residential Address
            </div>

            <table className="w-full border-collapse border border-black text-[11px] mt-1">
              <tbody>
                <tr className="border-b border-gray-400">
                  <td className="w-36 bg-gray-50 p-2 font-semibold border-r border-gray-400">House / Village / Street:</td>
                  <td className="p-2" colSpan={3}>
                    {isFilled ? account?.mailing_address || '' : ''}
                  </td>
                </tr>
                <tr className="border-b border-gray-400">
                  <td className="bg-gray-50 p-2 font-semibold border-r border-gray-400">Area / Landmark:</td>
                  <td className="p-2 border-r border-gray-400 w-44">
                    {isFilled ? account?.area || '' : ''}
                  </td>
                  <td className="w-32 bg-gray-50 p-2 font-semibold border-r border-gray-400">City / Tehsil:</td>
                  <td className="p-2">
                    {isFilled ? account?.city || '' : ''}
                  </td>
                </tr>
                <tr className="border-b border-gray-400">
                  <td className="bg-gray-50 p-2 font-semibold border-r border-gray-400">State:</td>
                  <td className="p-2 border-r border-gray-400">
                    {isFilled ? account?.state || 'Maharashtra' : ''}
                  </td>
                  <td className="bg-gray-50 p-2 font-semibold border-r border-gray-400">PIN Code:</td>
                  <td className="p-2 font-mono font-semibold">
                    {isFilled ? account?.zip || '' : '______'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3: Bank Account & Initial Deposit */}
          <div className="mb-4">
            <div className="bg-gray-100 px-2 py-1 border border-black font-bold text-[11px] uppercase tracking-wide">
              3. Bank Scheme & Deposit Particulars
            </div>

            <table className="w-full border-collapse border border-black text-[11px] mt-1">
              <tbody>
                <tr className="border-b border-gray-400">
                  <td className="w-36 bg-gray-50 p-2 font-semibold border-r border-gray-400">Selected Scheme:</td>
                  <td className="p-2 border-r border-gray-400 font-semibold w-44">
                    {isFilled ? account?.scheme : ''}
                  </td>
                  <td className="w-32 bg-gray-50 p-2 font-semibold border-r border-gray-400">Initial Deposit:</td>
                  <td className="p-2 font-mono font-bold text-sm">
                    {isFilled
                      ? account?.initial_deposit
                        ? `₹ ${Math.floor(account.initial_deposit / 100).toLocaleString('en-IN')}`
                        : '₹ 0.00'
                      : '₹ ____________'}
                  </td>
                </tr>
                <tr className="border-b border-gray-400">
                  <td className="bg-gray-50 p-2 font-semibold border-r border-gray-400">Account Type:</td>
                  <td className="p-2 border-r border-gray-400">
                    [ &nbsp; ] Savings &nbsp;&nbsp;&nbsp; [ &nbsp; ] PMJDY / Zero Bal
                  </td>
                  <td className="bg-gray-50 p-2 font-semibold border-r border-gray-400">Nominee Name:</td>
                  <td className="p-2">___________________________</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 4: For Office / Kiosk Use Only */}
          <div className="mb-4">
            <div className="bg-gray-100 px-2 py-1 border border-black font-bold text-[11px] uppercase tracking-wide flex items-center justify-between">
              <span>4. For Office / Counter Operator Use Only</span>
              <span className="text-[9px] font-semibold text-gray-700">Official Allocation Record</span>
            </div>

            <table className="w-full border-collapse border border-black text-[11px] mt-1">
              <tbody>
                <tr className="border-b border-gray-400">
                  <td className="w-36 bg-gray-50 p-2 font-semibold border-r border-gray-400">Assigned Account No:</td>
                  <td className="p-2 border-r border-gray-400 font-mono font-bold text-sm w-44">
                    {isFilled ? account?.account_number || 'Pending' : '________________________'}
                  </td>
                  <td className="w-32 bg-gray-50 p-2 font-semibold border-r border-gray-400">Customer CIF / ID:</td>
                  <td className="p-2 font-mono font-semibold">
                    {isFilled ? account?.bank_customer_id || 'Pending' : '________________________'}
                  </td>
                </tr>
                <tr className="border-b border-gray-400">
                  <td className="bg-gray-50 p-2 font-semibold border-r border-gray-400">Passbook / Kit No:</td>
                  <td className="p-2 border-r border-gray-400 font-mono">
                    {isFilled ? account?.passbook_number || '-' : '________________________'}
                  </td>
                  <td className="bg-gray-50 p-2 font-semibold border-r border-gray-400">KYC Status:</td>
                  <td className="p-2 font-semibold">
                    {isFilled ? account?.kyc_status || 'Verified' : '[ &nbsp; ] Verified &nbsp;&nbsp; [ &nbsp; ] Pending'}
                  </td>
                </tr>
                {isFilled && account?.notes && (
                  <tr>
                    <td className="bg-gray-50 p-2 font-semibold border-r border-gray-400">Remarks / Notes:</td>
                    <td className="p-2" colSpan={3}>{account.notes}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Checklist & Declarations */}
          <div className="mb-6 border border-black p-2.5 bg-gray-50 text-[10px]">
            <p className="font-bold uppercase text-[10px] mb-1">Applicant Declaration & KYC Consent:</p>
            <p className="text-gray-700 leading-snug">
              I hereby apply for opening a bank savings/kiosk account. I declare that the particulars furnished above are true and correct to the best of my knowledge. I authorize the counter operator to utilize my Aadhaar and biometric credentials for identity verification and account linkage in accordance with UIDAI and RBI guidelines.
            </p>
            <div className="mt-2 flex items-center gap-4 text-gray-800 font-medium">
              <span>Attached Proofs:</span>
              <span>[ &nbsp; ] Aadhaar Copy</span>
              <span>[ &nbsp; ] PAN / Form 60</span>
              <span>[ &nbsp; ] Passport Photo</span>
              <span>[ &nbsp; ] Biometric e-KYC</span>
            </div>
          </div>

          {/* Signature Boxes */}
          <div className="grid grid-cols-2 gap-8 pt-4">
            <div className="border border-black p-3 h-24 flex flex-col justify-between text-center bg-white">
              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">
                Signature / Left Thumb Impression of Customer
              </span>
              <div className="border-t border-dashed border-gray-400 pt-1 font-bold text-[10px]">
                {isFilled ? account?.customer_name : 'Customer Signature'}
              </div>
            </div>

            <div className="border border-black p-3 h-24 flex flex-col justify-between text-center bg-white">
              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">
                Authorized CSP Operator Sign & Center Stamp
              </span>
              <div className="border-t border-dashed border-gray-400 pt-1 font-bold text-[10px]">
                Authorized Signatory & Date
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[9px] text-gray-500 mt-6 pt-2 border-t border-gray-300">
            DeskLog Kiosk Management System &middot; Local Desktop Database Record &middot; Form Generated: {todayStr}
          </div>
        </div>
      </div>
    </div>
  );
};
