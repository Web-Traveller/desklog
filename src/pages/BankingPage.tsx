import React, { useState } from 'react';
import { useDesk } from '../context/DeskContext';
import { Header } from '../components/Header';
import { AddBankingTransactionModal } from '../components/AddBankingTransactionModal';
import { formatDisplayDate } from '../utils/dateUtils';
import { formatRupees } from '../utils/currencyUtils';
import { parseBankingMetadata, BankingTransaction } from '../types';

export const BankingPage: React.FC = () => {
  const { bankingTransactions, customers, deleteBankingTransaction } = useDesk();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [filterType, setFilterType] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Time');

  const filteredTransactions = bankingTransactions.filter(tx => {
    if (filterType !== 'All' && tx.transaction_type !== filterType) return false;
    
    if (dateFilter !== 'All Time') {
      const txDate = new Date(tx.transaction_date);
      const today = new Date();
      if (dateFilter === 'Today') {
        if (txDate.toDateString() !== today.toDateString()) return false;
      } else if (dateFilter === 'This Week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (txDate < weekAgo) return false;
      } else if (dateFilter === 'This Month') {
        if (txDate.getMonth() !== today.getMonth() || txDate.getFullYear() !== today.getFullYear()) return false;
      }
    }
    return true;
  });

  const getCustomerName = (id: string) => {
    return customers.find(c => c.id === id)?.name || 'Unknown';
  };

  const renderRefDetails = (tx: BankingTransaction) => {
    const meta = parseBankingMetadata(tx.metadata);
    if (Object.keys(meta).length === 0) return tx.transaction_ref_no || '-';

    // Return unmasked details based on type
    if (tx.transaction_type === 'Transfer') {
      if (tx.payment_mode === 'Bank Transfer') {
        return `A/C: ${meta.beneficiary_account || ''} | IFSC: ${meta.beneficiary_ifsc || ''} | Ref: ${tx.transaction_ref_no || ''}`;
      }
      if (tx.payment_mode === 'UPI') {
        return `UPI: ${meta.beneficiary_upi || ''} | Ref: ${tx.transaction_ref_no || ''}`;
      }
    }
    if (tx.transaction_type === 'Withdrawal') {
      if (tx.payment_mode.startsWith('AePS')) {
        return `Aadhaar: ${meta.customer_aadhaar_number || meta.customer_id_number || ''} | Bank: ${meta.customer_bank || ''} | Ref: ${tx.transaction_ref_no || ''}`;
      }
    }
    
    // Default fallback to show something useful
    const parts = [];
    if (meta.target_account) parts.push(`A/C: ${meta.target_account}`);
    if (meta.target_upi) parts.push(`UPI: ${meta.target_upi}`);
    if (tx.transaction_ref_no) parts.push(`Ref: ${tx.transaction_ref_no}`);
    
    return parts.join(' | ') || '-';
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-surface">
      <Header />

      <main className="flex-1 p-space-md lg:p-space-lg flex flex-col max-w-7xl mx-auto w-full gap-space-md">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-space-md bg-surface-container-lowest p-space-md lg:p-space-lg rounded-2xl shadow-xs border border-surface-container/60">
          <div className="flex flex-wrap items-center gap-space-sm">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none"
            >
              <option value="All">All Types</option>
              <option value="Transfer">Transfers</option>
              <option value="Withdrawal">Withdrawals</option>
              <option value="Deposit">Deposits</option>
            </select>
            
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-space-md py-2.5 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none"
            >
              <option value="All Time">All Time</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-space-md py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-full font-button-utility text-button-utility font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            New Transaction
          </button>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-xs border border-surface-container/60 overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto h-full p-space-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low/50 sticky top-0 z-10 rounded-xl">
                <tr>
                  <th className="p-space-md font-caption-strong text-caption-strong text-outline rounded-l-xl whitespace-nowrap">Date</th>
                  <th className="p-space-md font-caption-strong text-caption-strong text-outline">Customer</th>
                  <th className="p-space-md font-caption-strong text-caption-strong text-outline">Type</th>
                  <th className="p-space-md font-caption-strong text-caption-strong text-outline">Mode</th>
                  <th className="p-space-md font-caption-strong text-caption-strong text-outline text-right">Amount</th>
                  <th className="p-space-md font-caption-strong text-caption-strong text-outline">Ref / Details</th>
                  <th className="p-space-md font-caption-strong text-caption-strong text-outline text-center rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-space-xl text-center text-outline font-body">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-surface-container/40 last:border-0 hover:bg-surface-container-lowest/80 transition-colors group">
                      <td className="p-space-md text-sm text-on-surface whitespace-nowrap font-medium">
                        {formatDisplayDate(tx.transaction_date)}
                      </td>
                      <td className="p-space-md text-sm font-semibold text-on-surface">
                        {getCustomerName(tx.customer_id)}
                      </td>
                      <td className="p-space-md">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          tx.transaction_type === 'Transfer' ? 'bg-primary-container text-on-primary-container' :
                          tx.transaction_type === 'Withdrawal' ? 'bg-tertiary-container text-on-tertiary-container' :
                          'bg-secondary-container text-on-secondary-container'
                        }`}>
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="p-space-md text-sm text-on-surface-variant font-medium">
                        {tx.payment_mode}
                      </td>
                      <td className="p-space-md text-sm font-bold text-right text-on-surface font-mono">
                        {formatRupees(tx.amount)}
                      </td>
                      <td className="p-space-md text-sm text-outline font-mono">
                        {renderRefDetails(tx)}
                      </td>
                      <td className="p-space-md text-center">
                        <button
                          onClick={() => {
                            if(window.confirm('Are you sure you want to delete this transaction?')) {
                              if(tx.id) deleteBankingTransaction(tx.id);
                            }
                          }}
                          className="p-1.5 text-error hover:bg-error-container hover:text-on-error-container rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <AddBankingTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
