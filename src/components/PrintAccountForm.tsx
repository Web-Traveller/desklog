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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/90 flex flex-col items-center print:p-0 print:bg-white print:static print:overflow-visible">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm 12mm 10mm 12mm;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
          }
          body * {
            visibility: hidden;
          }
          #printable-bank-form, #printable-bank-form * {
            visibility: visible;
          }
          #printable-bank-form {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
            font-size: 13px !important;
            line-height: 1.4 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Floating Action Header Bar (Hidden on print) */}
      <div className="no-print sticky top-0 z-30 w-full bg-slate-900/95 backdrop-blur-md px-6 py-3.5 border-b border-slate-700/80 flex items-center justify-between text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-xl text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">print</span>
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <span>{isFilled ? 'Customer Account Application Slip' : 'Blank Account Opening Application Form'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-primary/20 text-primary uppercase">
                {isFilled ? 'Filled Profile' : 'Blank A4 Form'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
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
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary/90 transition shadow-md active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span>Print Form (Ctrl+P)</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>

      {/* Full Sheet Document Container */}
      <div className="w-full flex justify-center py-6 px-3 sm:px-8 flex-1 print:p-0 print:m-0 print:w-full">
        <div
          id="printable-bank-form"
          className="bg-white text-gray-950 w-full max-w-4xl min-h-[297mm] p-8 sm:p-12 shadow-2xl rounded-sm print:rounded-none print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none text-[13px] leading-normal font-sans border border-gray-200 print:border-none flex flex-col justify-between"
        >
          <div>
            {/* Header Section */}
            <div className="border-b-2 border-black pb-3 mb-5">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <span className="text-[11px] tracking-widest uppercase font-bold text-gray-600 block mb-1">
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
                <div className="w-32 h-36 border-2 border-dashed border-black rounded flex flex-col items-center justify-center text-center p-2 bg-gray-50 flex-shrink-0">
                  <span className="text-[10px] font-bold text-gray-700 leading-snug">
                    AFFIX RECENT PASSPORT PHOTO
                  </span>
                  <span className="text-[9px] text-gray-500 mt-1">
                    (Cross signed across photograph)
                  </span>
                </div>
              </div>

              {/* Subheader info without Visit Type */}
              <div className="flex items-center justify-between text-xs font-semibold text-gray-800 mt-3 pt-2.5 border-t border-gray-300">
                <span>Date: <strong>{isFilled ? account?.account_date || todayStr : '___ / ___ / 202___'}</strong></span>
                <span>Bank / Scheme: <strong>{isFilled ? account?.scheme || '____________________' : '________________________________________'}</strong></span>
              </div>
            </div>

            {/* Section 1: Customer Personal Details (without Father/Spouse) */}
            <div className="mb-5">
              <div className="bg-gray-100 px-3 py-1.5 border border-black font-bold text-xs uppercase tracking-wide flex items-center justify-between">
                <span>1. Customer Personal & KYC Details</span>
                <span className="text-[10px] font-normal normal-case text-gray-600">(Fill in BLOCK letters)</span>
              </div>

              <table className="w-full border-collapse border border-black text-xs mt-1">
                <tbody>
                  <tr className="border-b border-gray-400">
                    <td className="w-44 bg-gray-50 p-2.5 font-bold border-r border-gray-400">Customer Full Name:</td>
                    <td className="p-2.5 font-black uppercase tracking-wide text-sm" colSpan={3}>
                      {isFilled ? account?.customer_name : ''}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <td className="bg-gray-50 p-2.5 font-bold border-r border-gray-400">Date of Birth (DOB):</td>
                    <td className="p-2.5 border-r border-gray-400 w-52 font-semibold">
                      {isFilled ? account?.dob || '___ / ___ / ______' : 'DD / MM / YYYY'}
                    </td>
                    <td className="w-36 bg-gray-50 p-2.5 font-bold border-r border-gray-400">Gender:</td>
                    <td className="p-2.5 font-medium">
                      [ &nbsp; ] Male &nbsp;&nbsp;&nbsp; [ &nbsp; ] Female &nbsp;&nbsp;&nbsp; [ &nbsp; ] Other
                    </td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <td className="bg-gray-50 p-2.5 font-bold border-r border-gray-400">Mobile Number:</td>
                    <td className="p-2.5 font-mono font-bold text-sm" colSpan={3}>
                      {isFilled ? account?.mobile_number || '' : '+91 ________________________'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <td className="bg-gray-50 p-2.5 font-bold border-r border-gray-400">Aadhaar Number:</td>
                    <td className="p-2.5 border-r border-gray-400 font-mono font-bold tracking-widest text-sm w-52">
                      {isFilled ? account?.aadhaar_number || '' : '____  ____  ____'}
                    </td>
                    <td className="bg-gray-50 p-2.5 font-bold border-r border-gray-400">PAN Number:</td>
                    <td className="p-2.5 font-mono font-bold">
                      {isFilled ? account?.pan_number || 'Form 60 Attached' : '_____________________'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 2: Address Details */}
            <div className="mb-5">
              <div className="bg-gray-100 px-3 py-1.5 border border-black font-bold text-xs uppercase tracking-wide">
                2. Communication & Residential Address
              </div>

              <table className="w-full border-collapse border border-black text-xs mt-1">
                <tbody>
                  <tr className="border-b border-gray-400">
                    <td className="w-44 bg-gray-50 p-2.5 font-bold border-r border-gray-400">House / Village / Street:</td>
                    <td className="p-2.5" colSpan={3}>
                      {isFilled ? account?.mailing_address || '' : ''}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <td className="bg-gray-50 p-2.5 font-bold border-r border-gray-400">Area / Landmark:</td>
                    <td className="p-2.5 border-r border-gray-400 w-52">
                      {isFilled ? account?.area || '' : ''}
                    </td>
                    <td className="w-36 bg-gray-50 p-2.5 font-bold border-r border-gray-400">City / Tehsil:</td>
                    <td className="p-2.5">
                      {isFilled ? account?.city || '' : ''}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <td className="bg-gray-50 p-2.5 font-bold border-r border-gray-400">State:</td>
                    <td className="p-2.5 border-r border-gray-400">
                      {isFilled ? account?.state || 'Maharashtra' : ''}
                    </td>
                    <td className="bg-gray-50 p-2.5 font-bold border-r border-gray-400">PIN Code:</td>
                    <td className="p-2.5 font-mono font-bold">
                      {isFilled ? account?.zip || '' : '______'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 3: Bank Account & Initial Deposit */}
            <div className="mb-5">
              <div className="bg-gray-100 px-3 py-1.5 border border-black font-bold text-xs uppercase tracking-wide">
                3. Bank Scheme & Deposit Particulars
              </div>

              <table className="w-full border-collapse border border-black text-xs mt-1">
                <tbody>
                  <tr className="border-b border-gray-400">
                    <td className="w-44 bg-gray-50 p-2.5 font-bold border-r border-gray-400">Selected Scheme:</td>
                    <td className="p-2.5 border-r border-gray-400 font-bold w-52">
                      {isFilled ? account?.scheme : ''}
                    </td>
                    <td className="w-36 bg-gray-50 p-2.5 font-bold border-r border-gray-400">Initial Deposit:</td>
                    <td className="p-2.5 font-mono font-black text-sm">
                      {isFilled
                        ? account?.initial_deposit
                          ? `₹ ${Math.floor(account.initial_deposit / 100).toLocaleString('en-IN')}`
                          : '₹ 0.00'
                        : '₹ ____________'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <td className="bg-gray-50 p-2.5 font-bold border-r border-gray-400">Account Type:</td>
                    <td className="p-2.5 border-r border-gray-400">
                      [ &nbsp; ] Savings &nbsp;&nbsp;&nbsp; [ &nbsp; ] PMJDY / Zero Bal
                    </td>
                    <td className="bg-gray-50 p-2.5 font-bold border-r border-gray-400">Nominee Name:</td>
                    <td className="p-2.5">___________________________</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 4: For Office / Kiosk Use Only */}
            <div className="mb-5">
              <div className="bg-gray-100 px-3 py-1.5 border border-black font-bold text-xs uppercase tracking-wide flex items-center justify-between">
                <span>4. For Office / Counter Operator Use Only</span>
                <span className="text-[10px] font-bold text-gray-700">Official Allocation Record</span>
              </div>

              <table className="w-full border-collapse border border-black text-xs mt-1">
                <tbody>
                  <tr className="border-b border-gray-400">
                    <td className="w-44 bg-gray-50 p-2.5 font-bold border-r border-gray-400">Assigned Account No:</td>
                    <td className="p-2.5 border-r border-gray-400 font-mono font-black text-sm w-52">
                      {isFilled ? account?.account_number || 'Pending' : '________________________'}
                    </td>
                    <td className="w-36 bg-gray-50 p-2.5 font-bold border-r border-gray-400">Customer CIF / ID:</td>
                    <td className="p-2.5 font-mono font-bold">
                      {isFilled ? account?.bank_customer_id || 'Pending' : '________________________'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <td className="bg-gray-50 p-2.5 font-bold border-r border-gray-400">Passbook / Kit No:</td>
                    <td className="p-2.5 border-r border-gray-400 font-mono">
                      {isFilled ? account?.passbook_number || '-' : '________________________'}
                    </td>
                    <td className="bg-gray-50 p-2.5 font-bold border-r border-gray-400">KYC Status:</td>
                    <td className="p-2.5 font-bold">
                      {isFilled ? account?.kyc_status || 'Verified' : '[ &nbsp; ] Verified &nbsp;&nbsp; [ &nbsp; ] Pending'}
                    </td>
                  </tr>
                  {isFilled && account?.notes && (
                    <tr>
                      <td className="bg-gray-50 p-2.5 font-bold border-r border-gray-400">Remarks / Notes:</td>
                      <td className="p-2.5" colSpan={3}>{account.notes}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Checklist & Declarations */}
            <div className="mb-6 border border-black p-3 bg-gray-50 text-[11px]">
              <p className="font-bold uppercase text-[11px] mb-1">Applicant Declaration & KYC Consent:</p>
              <p className="text-gray-700 leading-relaxed">
                I hereby apply for opening a bank savings/kiosk account. I declare that the particulars furnished above are true and correct to the best of my knowledge. I authorize the counter operator to utilize my Aadhaar and biometric credentials for identity verification and account linkage in accordance with UIDAI and RBI guidelines.
              </p>
              <div className="mt-2.5 flex items-center gap-6 text-gray-800 font-semibold text-xs">
                <span>Attached Proofs:</span>
                <span>[ &nbsp; ] Aadhaar Copy</span>
                <span>[ &nbsp; ] PAN / Form 60</span>
                <span>[ &nbsp; ] Passport Photo</span>
                <span>[ &nbsp; ] Biometric e-KYC</span>
              </div>
            </div>

            {/* Signature Boxes */}
            <div className="grid grid-cols-2 gap-8 pt-4">
              <div className="border border-black p-3.5 h-28 flex flex-col justify-between text-center bg-white">
                <span className="text-[10px] text-gray-600 uppercase tracking-wider font-bold">
                  Signature / Left Thumb Impression of Customer
                </span>
                <div className="border-t border-dashed border-gray-400 pt-1.5 font-bold text-xs">
                  {isFilled ? account?.customer_name : 'Customer Signature'}
                </div>
              </div>

              <div className="border border-black p-3.5 h-28 flex flex-col justify-between text-center bg-white">
                <span className="text-[10px] text-gray-600 uppercase tracking-wider font-bold">
                  Authorized CSP Operator Sign & Center Stamp
                </span>
                <div className="border-t border-dashed border-gray-400 pt-1.5 font-bold text-xs">
                  Authorized Signatory & Date
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[10px] text-gray-500 mt-6 pt-2 border-t border-gray-300">
            DeskLog Kiosk Management System &middot; Local Database Record &middot; Form Generated: {todayStr}
          </div>
        </div>
      </div>
    </div>
  );
};
