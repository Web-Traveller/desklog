import React, { useState, useMemo } from 'react';
import { useBanking, useCustomers, useUI } from '../context/DeskContext';
import { EmptyState } from '../components/EmptyState';
import { MetricCard } from '../components/MetricCard';
import { formatDisplayDate } from '../utils/dateUtils';
import { formatRupees } from '../utils/currencyUtils';
import { WORK_TYPES } from '../constants/bankingData';

export const BankingPage: React.FC = () => {
  const { bankingTransactions, deleteBankingTransaction } = useBanking();
  const { customers } = useCustomers();
  const { showConfirm, setIsAddBankingOpen } = useUI();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  // Customer ID to Customer Map for fast O(1) lookups
  const customerMap = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach((c) => {
      map.set(c.id, c.name);
    });
    return map;
  }, [customers]);

  const getCustomerDisplayName = (tx: any) => {
    if (tx.customer_name && tx.customer_name.trim()) {
      return tx.customer_name.trim();
    }
    return customerMap.get(tx.customer_id) || 'Walk-in Counter';
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return (bankingTransactions || []).filter((tx) => {
      // Type filter
      if (filterType !== 'All' && tx.transaction_type !== filterType) {
        return false;
      }

      // Status filter
      const txStatus = tx.status || 'SUCCESS';
      if (statusFilter !== 'All' && txStatus !== statusFilter) {
        return false;
      }

      // Date filter
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
          if (txDate.getMonth() !== today.getMonth() || txDate.getFullYear() !== today.getFullYear()) {
            return false;
          }
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const custName = (tx.customer_name || customerMap.get(tx.customer_id) || '').toLowerCase();
        const mobile = (tx.customer_mobile || '').toLowerCase();
        const portal = (tx.company_name || '').toLowerCase();
        const bank = (tx.bank_name || '').toLowerCase();
        const acct = (tx.account_or_aadhaar || tx.transaction_ref_no || '').toLowerCase();
        const remark = (tx.remark || '').toLowerCase();

        return (
          custName.includes(q) ||
          mobile.includes(q) ||
          portal.includes(q) ||
          bank.includes(q) ||
          acct.includes(q) ||
          remark.includes(q)
        );
      }

      return true;
    });
  }, [bankingTransactions, filterType, statusFilter, dateFilter, searchQuery, customerMap]);

  // Aggregate Metrics
  const { totalVolume, totalTransactions, totalCharges, successfulCount } = useMemo(() => {
    let vol = 0;
    let chg = 0;
    let success = 0;

    filteredTransactions.forEach((tx) => {
      vol += tx.amount || 0;
      chg += tx.charges || 0;
      if (!tx.status || tx.status === 'SUCCESS') {
        success++;
      }
    });

    return {
      totalVolume: vol,
      totalTransactions: filteredTransactions.length,
      totalCharges: chg,
      successfulCount: success,
    };
  }, [filteredTransactions]);

  const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE) || 1;
  const safePage = Math.min(page, totalPages - 1);
  const paginatedTransactions = filteredTransactions.slice(
    safePage * PAGE_SIZE,
    (safePage + 1) * PAGE_SIZE
  );

  return (
    <div className="w-full max-w-[1400px] mx-auto px-gutter py-space-xl flex flex-col gap-space-lg animate-slideUp">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md border-b border-surface-container pb-space-xs">
        <div>
          <h1 className="font-display-md text-display-md text-on-surface tracking-tight font-semibold">
            Banking & Counter Ledger
          </h1>
          <p className="font-body text-body text-on-surface-variant">
            Counter money transfers (DMT), AePS cash withdrawals, UPI, and utility payments.
          </p>
        </div>
        <button
          onClick={() => setIsAddBankingOpen(true)}
          className="px-space-md py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-full font-button-utility text-button-utility font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm whitespace-nowrap self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Transaction
        </button>
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm">
        <MetricCard
          icon="account_balance"
          title="Total Volume"
          value={formatRupees(totalVolume)}
          subtitle="Processed volume"
        />
        <MetricCard
          icon="receipt_long"
          title="Transactions"
          value={totalTransactions}
          subtitle="Counter operations"
        />
        <MetricCard
          icon="payments"
          iconColorClass="text-secondary"
          title="Charges Collected"
          value={formatRupees(totalCharges)}
          subtitle="Counter fees earned"
        />
        <MetricCard
          icon="check_circle"
          iconColorClass="text-primary"
          title="Success Rate"
          value={totalTransactions > 0 ? `${Math.round((successfulCount / totalTransactions) * 100)}%` : '100%'}
          subtitle={`${successfulCount} Successful`}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-space-sm bg-surface-container-lowest p-space-md rounded-2xl shadow-xs border border-surface-container/60">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by customer, phone, bank, portal, account..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-space-md py-2 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none"
          />
          <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-outline text-base">
            search
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-outline hover:text-on-surface text-xs"
            >
              <span className="material-symbols-outlined text-sm">cancel</span>
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-space-xs">
          {/* Work Type Filter */}
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none text-xs"
          >
            <option value="All">All Types</option>
            {WORK_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none text-xs"
          >
            <option value="All">All Status</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILD">FAILD</option>
            <option value="IN PROGRESS">IN PROGRESS</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 bg-surface-container text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility border-none text-xs"
          >
            <option value="All Time">All Time</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
          </select>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-xs border border-surface-container/60 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto h-full p-space-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-surface-container-low/60 sticky top-0 z-10 rounded-xl">
              <tr>
                <th className="p-space-md font-semibold text-outline rounded-l-xl whitespace-nowrap">Date</th>
                <th className="p-space-md font-semibold text-outline">Type</th>
                <th className="p-space-md font-semibold text-outline">Portal / Company</th>
                <th className="p-space-md font-semibold text-outline">Customer & Phone</th>
                <th className="p-space-md font-semibold text-outline">Bank Name</th>
                <th className="p-space-md font-semibold text-outline">Account / Aadhaar</th>
                <th className="p-space-md font-semibold text-outline text-right">Amount</th>
                <th className="p-space-md font-semibold text-outline text-right">Charges</th>
                <th className="p-space-md font-semibold text-outline text-center">Status</th>
                <th className="p-space-md font-semibold text-outline text-center rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <EmptyState
                  isTableRow
                  colSpan={10}
                  icon="account_balance_wallet"
                  title="No banking records found"
                  description={
                    searchQuery || filterType !== 'All' || statusFilter !== 'All' || dateFilter !== 'All Time'
                      ? 'No transactions matched your search or filters.'
                      : 'Record your first counter banking transaction (DMT, AePS, or UPI).'
                  }
                  actionLabel="+ New Transaction"
                  onAction={() => setIsAddBankingOpen(true)}
                />
              ) : (
                paginatedTransactions.map((tx) => {
                  const txStatus = tx.status || 'SUCCESS';
                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-surface-container/40 last:border-0 hover:bg-surface-container-lowest/80 transition-colors group"
                    >
                      {/* Date */}
                      <td className="p-space-md whitespace-nowrap font-medium text-on-surface">
                        {formatDisplayDate(tx.transaction_date)}
                      </td>

                      {/* Work Type Badge */}
                      <td className="p-space-md whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            tx.transaction_type === 'DMT'
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : tx.transaction_type === 'AEPS'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : tx.transaction_type === 'UPI'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-surface-container-high text-on-surface'
                          }`}
                        >
                          {tx.transaction_type}
                        </span>
                      </td>

                      {/* Company Name */}
                      <td className="p-space-md whitespace-nowrap font-medium text-on-surface">
                        {tx.company_name || '-'}
                      </td>

                      {/* Customer & Mobile */}
                      <td className="p-space-md">
                        <div className="font-semibold text-on-surface">
                          {getCustomerDisplayName(tx)}
                        </div>
                        {tx.customer_mobile && (
                          <div className="text-[11px] text-outline font-mono">
                            {tx.customer_mobile}
                          </div>
                        )}
                      </td>

                      {/* Bank Name */}
                      <td className="p-space-md whitespace-nowrap text-on-surface-variant font-medium">
                        {tx.bank_name || '-'}
                      </td>

                      {/* Account / Aadhaar */}
                      <td className="p-space-md whitespace-nowrap font-mono text-outline">
                        {tx.account_or_aadhaar || tx.transaction_ref_no || '-'}
                      </td>

                      {/* Amount */}
                      <td className="p-space-md text-right font-bold text-on-surface font-mono text-sm">
                        {formatRupees(tx.amount)}
                      </td>

                      {/* Charges */}
                      <td className="p-space-md text-right font-mono text-secondary font-medium">
                        {tx.charges && tx.charges > 0 ? formatRupees(tx.charges) : '-'}
                      </td>

                      {/* Status Badge */}
                      <td className="p-space-md text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            txStatus === 'SUCCESS'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : txStatus === 'FAILD'
                              ? 'bg-error/15 text-error'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {txStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-space-md text-center">
                        <button
                          onClick={() => {
                            if (tx.id) {
                              showConfirm({
                                title: 'Delete Banking Transaction',
                                message: `Are you sure you want to delete this ${tx.transaction_type} transaction of ${formatRupees(
                                  tx.amount
                                )}? This action cannot be undone.`,
                                confirmText: 'Delete Record',
                                variant: 'danger',
                                onConfirm: () => deleteBankingTransaction(tx.id!),
                              });
                            }
                          }}
                          className="p-1.5 text-error hover:bg-error-container hover:text-on-error-container rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Delete Record"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredTransactions.length > PAGE_SIZE && (
          <div className="flex items-center justify-between p-space-md border-t border-surface-container/60 bg-surface-container-lowest">
            <span className="font-fine-print text-fine-print text-on-surface-variant">
              Showing {safePage * PAGE_SIZE + 1} - {Math.min((safePage + 1) * PAGE_SIZE, filteredTransactions.length)} of {filteredTransactions.length} records
            </span>
            <div className="flex items-center gap-space-xs">
              <button
                className="px-space-md py-1.5 rounded-full border border-surface-container-high text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container font-button-utility text-button-utility transition-all active:scale-95"
                disabled={safePage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </button>
              <span className="font-caption text-caption text-on-surface px-space-xs">
                {safePage + 1} / {totalPages}
              </span>
              <button
                className="px-space-md py-1.5 rounded-full border border-surface-container-high text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container font-button-utility text-button-utility transition-all active:scale-95"
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
