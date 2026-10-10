import React, { useState } from 'react';
import { useDesk } from '../context/DeskContext';
import { AddBankingTransactionModal } from '../components/AddBankingTransactionModal';
import { EmptyState } from '../components/EmptyState';
import { formatDisplayDate } from '../utils/dateUtils';
import { formatRupees } from '../utils/currencyUtils';
import { formatRefDetails } from '../utils/bankingUtils';

export const BankingPage: React.FC = () => {
  const { bankingTransactions, customers, deleteBankingTransaction, showConfirm } = useDesk();
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

  return (
    <div className="w-full max-w-[1400px] mx-auto px-gutter py-space-xl flex flex-col gap-space-lg animate-slideUp">
        
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
                  <EmptyState
                    isTableRow
                    colSpan={7}
                    icon="account_balance_wallet"
                    title="No banking transactions found"
                    description={
                      filterType !== 'All' || dateFilter !== 'All Time'
                        ? `No records matching type "${filterType}" and timeframe "${dateFilter}".`
                        : 'Record your first bank transfer, AePS withdrawal, or deposit.'
                    }
                    actionLabel="+ New Transaction"
                    onAction={() => setIsModalOpen(true)}
                  />
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
                        {formatRefDetails(tx)}
                      </td>
                      <td className="p-space-md text-center">
                        <button
                          onClick={() => {
                            if (tx.id) {
                              showConfirm({
                                title: 'Delete Banking Transaction',
                                message: 'Are you sure you want to delete this banking transaction? This action cannot be undone.',
                                confirmText: 'Delete Transaction',
                                variant: 'danger',
                                onConfirm: () => deleteBankingTransaction(tx.id!),
                              });
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

      <AddBankingTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
