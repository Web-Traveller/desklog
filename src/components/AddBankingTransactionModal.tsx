import React, { useState, useEffect } from 'react';
import { useDesk } from '../context/DeskContext';
import { Customer } from '../types';
import { CustomerSearchPicker } from './CustomerSearchPicker';
import { rupeesToPaise } from '../utils/currencyUtils';

interface AddBankingTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddBankingTransactionModal: React.FC<AddBankingTransactionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { customers, addBankingTransaction } = useDesk();
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [transactionType, setTransactionType] = useState('Transfer');
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [amount, setAmount] = useState('');
  
  // Dynamic fields
  const [metadata, setMetadata] = useState<Record<string, string>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCustomer(null);
      setTransactionType('Transfer');
      setPaymentMode('Bank Transfer');
      setAmount('');
      setMetadata({});
    }
  }, [isOpen]);

  // Reset dynamic fields when type or mode changes
  useEffect(() => {
    setMetadata({});
  }, [transactionType, paymentMode]);

  const handleMetadataChange = (key: string, value: string) => {
    setMetadata(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || !isFinite(numAmount) || numAmount <= 0) {
      alert("Please enter a valid positive amount.");
      return;
    }

    let finalMetadata = { ...metadata };
    if (paymentMode.startsWith('AePS')) {
      const aadhaarVal = metadata['customer_aadhaar_number'] || metadata['customer_id_number'] || selectedCustomer.aadhaar_number || '';
      finalMetadata['customer_aadhaar_number'] = aadhaarVal;
      finalMetadata['customer_id_number'] = aadhaarVal;
    }
    if (paymentMode === 'Bank Transfer' && !finalMetadata['from_account'] && selectedCustomer.name) {
      finalMetadata['from_account'] = selectedCustomer.name;
    }
    if (paymentMode === 'Cash to Bank Account' && !finalMetadata['depositor_info'] && selectedCustomer) {
      finalMetadata['depositor_info'] = `${selectedCustomer.name} (${selectedCustomer.mobile || 'N/A'})`;
    }

    let refNo = finalMetadata['transaction_ref_no'] || finalMetadata['upi_transaction_id'] || finalMetadata['terminal_rrn'] || finalMetadata['approval_code'];

    addBankingTransaction({
      customer_id: selectedCustomer.id,
      transaction_type: transactionType,
      payment_mode: paymentMode,
      amount: rupeesToPaise(amount),
      transaction_ref_no: refNo || '',
      metadata: JSON.stringify(finalMetadata),
      transaction_date: new Date().toISOString(),
    });

    onClose();
  };

  const paymentModesMap: Record<string, string[]> = {
    'Transfer': ['Bank Transfer', 'UPI'],
    'Withdrawal': ['AePS (Aadhaar Enabled Payment System)', 'Debit Card / Mini ATM', 'UPI Cash-out'],
    'Deposit': ['Cash to Bank Account', 'Cash to UPI']
  };

  const renderDynamicFields = () => {
    if (transactionType === 'Transfer') {
      if (paymentMode === 'Bank Transfer') {
        return (
          <>
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">From Account (Sender Name)</label>
              <input type="text" className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none" 
                placeholder={selectedCustomer ? `Default: ${selectedCustomer.name}` : 'Sender Name'}
                value={metadata['from_account'] || selectedCustomer?.name || ''} onChange={e => handleMetadataChange('from_account', e.target.value)} required />
            </div>
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">Beneficiary Bank Name</label>
              <input type="text" className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none" 
                value={metadata['beneficiary_bank'] || ''} onChange={e => handleMetadataChange('beneficiary_bank', e.target.value)} required />
            </div>
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">Beneficiary Account Number</label>
              <input type="text" className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none" 
                value={metadata['beneficiary_account'] || ''} onChange={e => handleMetadataChange('beneficiary_account', e.target.value)} required />
            </div>
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">Beneficiary IFSC Code</label>
              <input type="text" className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none" 
                value={metadata['beneficiary_ifsc'] || ''} onChange={e => handleMetadataChange('beneficiary_ifsc', e.target.value)} required />
            </div>
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">UTR / Transaction Ref No</label>
              <input type="text" className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none" 
                value={metadata['transaction_ref_no'] || ''} onChange={e => handleMetadataChange('transaction_ref_no', e.target.value)} />
            </div>
          </>
        );
      } else if (paymentMode === 'UPI') {
        return (
          <>
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">Sender Info</label>
              <input type="text" className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none" 
                placeholder={selectedCustomer ? `Default: ${selectedCustomer.name}` : 'Sender Info'}
                value={metadata['sender_info'] || selectedCustomer?.name || ''} onChange={e => handleMetadataChange('sender_info', e.target.value)} />
            </div>
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">Beneficiary UPI ID (VPA)</label>
              <input type="text" className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none" 
                value={metadata['beneficiary_upi'] || ''} onChange={e => handleMetadataChange('beneficiary_upi', e.target.value)} required />
            </div>
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">UPI Transaction ID</label>
              <input type="text" className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none" 
                value={metadata['upi_transaction_id'] || ''} onChange={e => handleMetadataChange('upi_transaction_id', e.target.value)} />
            </div>
          </>
        );
      }
    } else if (transactionType === 'Withdrawal') {
      if (paymentMode.startsWith('AePS')) {
        return (
          <>
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">Customer Aadhaar Number</label>
              <input type="text" className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none" 
                placeholder={selectedCustomer?.aadhaar_number ? `Default: ${selectedCustomer.aadhaar_number}` : 'e.g. 5482 9102 3847'}
                value={metadata['customer_aadhaar_number'] || metadata['customer_id_number'] || selectedCustomer?.aadhaar_number || ''} 
                onChange={e => {
                  handleMetadataChange('customer_aadhaar_number', e.target.value);
                  handleMetadataChange('customer_id_number', e.target.value);
                }} required />
            </div>
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">Customer Bank Name</label>
              <input type="text" className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none" 
                value={metadata['customer_bank'] || ''} onChange={e => handleMetadataChange('customer_bank', e.target.value)} required />
            </div>
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">System / Terminal RRN</label>
              <input type="text" className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none" 
                value={metadata['terminal_rrn'] || ''} onChange={e => handleMetadataChange('terminal_rrn', e.target.value)} />
            </div>
          </>
        );
      } else if (paymentMode === 'Debit Card / Mini ATM') {
        return (
          <>
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">Card Type / Bank Name</label>
              <input type="text" className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none" 
                value={metadata['card_type'] || ''} onChange={e => handleMetadataChange('card_type', e.target.value)} required />
            </div>
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">Terminal Authorization / Approval Code</label>
              <input type="text" className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none" 
                value={metadata['approval_code'] || ''} onChange={e => handleMetadataChange('approval_code', e.target.value)} />
            </div>
          </>
        );
      } else if (paymentMode === 'UPI Cash-out') {
        return (
          <>
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">Customer UPI ID / Phone</label>
              <input type="text" className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none" 
                placeholder={selectedCustomer?.mobile ? `Default: ${selectedCustomer.mobile}` : 'Customer UPI ID / Phone'}
                value={metadata['customer_upi'] || selectedCustomer?.mobile || ''} onChange={e => handleMetadataChange('customer_upi', e.target.value)} required />
            </div>
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">UPI Transaction Ref No</label>
              <input type="text" className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none" 
                value={metadata['transaction_ref_no'] || ''} onChange={e => handleMetadataChange('transaction_ref_no', e.target.value)} />
            </div>
          </>
        );
      }
    } else if (transactionType === 'Deposit') {
      if (paymentMode === 'Cash to Bank Account') {
        return (
          <>
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">Target Bank Name</label>
              <input type="text" className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none" 
                value={metadata['target_bank'] || ''} onChange={e => handleMetadataChange('target_bank', e.target.value)} required />
            </div>
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">Target Account Number</label>
              <input type="text" className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none" 
                value={metadata['target_account'] || ''} onChange={e => handleMetadataChange('target_account', e.target.value)} required />
            </div>
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">Target IFSC Code</label>
              <input type="text" className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none" 
                value={metadata['target_ifsc'] || ''} onChange={e => handleMetadataChange('target_ifsc', e.target.value)} required />
            </div>
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">Depositor Info (Optional - If different from client)</label>
              <input type="text" className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none" 
                placeholder={selectedCustomer ? `Default: ${selectedCustomer.name} (${selectedCustomer.mobile || 'No Mobile'})` : 'Depositor name & phone if different'}
                value={metadata['depositor_info'] || ''} onChange={e => handleMetadataChange('depositor_info', e.target.value)} />
            </div>
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">Bank Deposit Slip / Ref No</label>
              <input type="text" className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none" 
                value={metadata['transaction_ref_no'] || ''} onChange={e => handleMetadataChange('transaction_ref_no', e.target.value)} />
            </div>
          </>
        );
      } else if (paymentMode === 'Cash to UPI') {
        return (
          <>
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">Target UPI ID</label>
              <input type="text" className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none" 
                value={metadata['target_upi'] || ''} onChange={e => handleMetadataChange('target_upi', e.target.value)} required />
            </div>
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">Transaction ID</label>
              <input type="text" className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none" 
                value={metadata['transaction_ref_no'] || ''} onChange={e => handleMetadataChange('transaction_ref_no', e.target.value)} />
            </div>
          </>
        );
      }
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-2xl max-w-2xl w-full border border-surface-container/60 flex flex-col gap-space-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-xl">
              account_balance
            </span>
            <h3 className="font-tagline text-tagline font-semibold text-on-surface">
              New Banking Transaction
            </h3>
          </div>
          <button
            className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-on-surface-variant">Customer Profile</label>
            <CustomerSearchPicker 
              customers={customers}
              selectedCustomerId={selectedCustomer?.id || ''} 
              onSelectCustomer={setSelectedCustomer} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">Transaction Type</label>
              <select
                value={transactionType}
                onChange={(e) => {
                  setTransactionType(e.target.value);
                  setPaymentMode(paymentModesMap[e.target.value][0]);
                }}
                className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none"
              >
                <option value="Transfer">Transfer</option>
                <option value="Withdrawal">Withdrawal</option>
                <option value="Deposit">Deposit</option>
              </select>
            </div>
            
            <div>
              <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none"
              >
                {paymentModesMap[transactionType]?.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-surface-variant pt-4 mt-2">
            <h3 className="font-medium text-on-surface mb-4">Transaction Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-fine-print text-fine-print text-on-surface-variant mb-1">Amount (₹)</label>
                <input 
                  type="number" 
                  className="w-full px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  required 
                  min="1"
                />
              </div>
              {renderDynamicFields()}
            </div>
          </div>

          <div className="flex items-center justify-end gap-space-sm mt-space-xs pt-space-xs border-t border-surface-container">
            <button type="button" onClick={onClose} className="px-space-md py-2 rounded-full text-on-surface-variant hover:bg-surface-container font-button-utility text-button-utility">
              Cancel
            </button>
            <button type="submit" disabled={!selectedCustomer || !amount} className="px-space-md py-2 rounded-full bg-primary-container hover:bg-primary transition-all active:scale-95 text-on-primary font-button-utility text-button-utility font-medium shadow-sm disabled:opacity-50">
              Save Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
