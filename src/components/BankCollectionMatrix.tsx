import React, { useState, useMemo } from 'react';
import { BankingTransaction } from '../types';
import { formatRupees } from '../utils/currencyUtils';

interface BankCollectionMatrixProps {
  bankingTransactions: BankingTransaction[];
  onOpenBankingPage: () => void;
  onNewTransaction: () => void;
}

type GroupByView = 'portal' | 'bank' | 'mode';
type DatePeriod = 'today' | 'month' | 'all';

interface AggregateEntry {
  name: string;
  count: number;
  totalVolume: number; // in paise
  sentVolume: number; // in paise
  receivedVolume: number; // in paise
  totalFees: number; // in paise
  totalCommission: number; // in paise
  totalRefunds: number; // in paise
  successCount: number;
  failedCount: number;
  pendingCount: number;
}

export const BankCollectionMatrix: React.FC<BankCollectionMatrixProps> = ({
  bankingTransactions,
  onOpenBankingPage,
  onNewTransaction,
}) => {
  const [viewMode, setViewMode] = useState<GroupByView>('portal');
  const [datePeriod, setDatePeriod] = useState<DatePeriod>('today');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Filter by Date Period (default: today)
  const filteredByDate = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return (bankingTransactions || []).filter((tx) => {
      if (tx.is_deleted) return false;
      if (!tx.transaction_date) return true;

      const txDate = new Date(tx.transaction_date);
      if (isNaN(txDate.getTime())) return true;

      const txDayStr = tx.transaction_date.slice(0, 10);

      if (datePeriod === 'today') {
        return txDayStr === todayStr || txDate.toDateString() === now.toDateString();
      }

      if (datePeriod === 'month') {
        return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
      }

      return true; // 'all'
    });
  }, [bankingTransactions, datePeriod]);

  // 2. High-level Overview Metrics for the selected date period
  const overviewMetrics = useMemo(() => {
    let volume = 0;
    let fees = 0;
    let commission = 0;
    let refunds = 0;
    let sent = 0;
    let received = 0;
    const distinctPortals = new Set<string>();
    const distinctBanks = new Set<string>();

    filteredByDate.forEach((tx) => {
      const amt = tx.amount || 0;
      volume += amt;
      fees += tx.charges || 0;
      commission += tx.commission || 0;
      refunds += tx.refund || 0;

      // Determine in vs out based on transaction mode
      const mode = (tx.transaction_type || '').toUpperCase();
      if (mode === 'AEPS' || mode === 'UPI CASH' || mode.includes('WITHDRAW')) {
        received += amt;
      } else {
        sent += amt;
      }

      if (tx.company_name?.trim()) distinctPortals.add(tx.company_name.trim());
      if (tx.bank_name?.trim()) distinctBanks.add(tx.bank_name.trim());
    });

    return {
      totalVolume: volume,
      totalFees: fees,
      totalCommission: commission,
      totalRefunds: refunds,
      totalSent: sent,
      totalReceived: received,
      totalTransactions: filteredByDate.length,
      portalsCount: distinctPortals.size,
      banksCount: distinctBanks.size,
    };
  }, [filteredByDate]);

  // 3. Grouped aggregation matrix (By Portal, By Bank, or By Service Mode)
  const groupedData = useMemo(() => {
    const map = new Map<string, AggregateEntry>();

    filteredByDate.forEach((tx) => {
      let key = '';
      if (viewMode === 'portal') {
        key = tx.company_name?.trim() || 'Direct / Shop Counter';
      } else if (viewMode === 'bank') {
        key = tx.bank_name?.trim() || 'General / Unspecified Bank';
      } else {
        key = tx.transaction_type?.trim() || 'DMT';
      }

      if (!map.has(key)) {
        map.set(key, {
          name: key,
          count: 0,
          totalVolume: 0,
          sentVolume: 0,
          receivedVolume: 0,
          totalFees: 0,
          totalCommission: 0,
          totalRefunds: 0,
          successCount: 0,
          failedCount: 0,
          pendingCount: 0,
        });
      }

      const item = map.get(key)!;
      const amt = tx.amount || 0;
      item.count += 1;
      item.totalVolume += amt;
      item.totalFees += tx.charges || 0;
      item.totalCommission += tx.commission || 0;
      item.totalRefunds += tx.refund || 0;

      const mode = (tx.transaction_type || '').toUpperCase();
      if (mode === 'AEPS' || mode === 'UPI CASH' || mode.includes('WITHDRAW')) {
        item.receivedVolume += amt;
      } else {
        item.sentVolume += amt;
      }

      const st = (tx.status || 'SUCCESS').toUpperCase();
      if (st === 'SUCCESS') item.successCount += 1;
      else if (st === 'FAILD') item.failedCount += 1;
      else item.pendingCount += 1;
    });

    let list = Array.from(map.values());

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => item.name.toLowerCase().includes(q));
    }

    // Sort by highest volume descending
    return list.sort((a, b) => b.totalVolume - a.totalVolume);
  }, [filteredByDate, viewMode, searchQuery]);

  return (
    <section className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 border border-surface-container/70 shadow-xs flex flex-col gap-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">account_balance</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display-md text-base font-semibold text-on-surface">
                Bank & Portal Settlement Ledger
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-mono font-bold">
                {overviewMetrics.totalTransactions} Txns
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Live settlement breakdown by partner bank, wallet portal, and service channel
            </p>
          </div>
        </div>

        {/* Date Filter & View Actions */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Date Range Selector */}
          <div className="flex items-center bg-surface-container-low p-0.5 rounded-xl border border-surface-container/60">
            {(['today', 'month', 'all'] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setDatePeriod(period)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  datePeriod === period
                    ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {period === 'today' ? "Today's" : period === 'month' ? 'This Month' : 'All Time'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onNewTransaction}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container text-xs font-bold transition shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>+ Entry</span>
          </button>

          <button
            type="button"
            onClick={onOpenBankingPage}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition border border-surface-container-high/40"
          >
            <span>Full Ledger</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Summary Cards for selected period */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Total Volume */}
        <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container/50 flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-outline uppercase tracking-wider">
            Total Handled Volume
          </span>
          <span className="font-mono font-bold text-base text-on-surface">
            {formatRupees(overviewMetrics.totalVolume)}
          </span>
          <span className="text-[10px] text-outline font-medium">
            Across {overviewMetrics.totalTransactions} transactions
          </span>
        </div>

        {/* Sent (Outflow) */}
        <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container/50 flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">arrow_upward</span>
            Sent / Disbursed (DMT & Bills)
          </span>
          <span className="font-mono font-bold text-base text-blue-600 dark:text-blue-400">
            {formatRupees(overviewMetrics.totalSent)}
          </span>
          <span className="text-[10px] text-outline font-medium">Outflow from portals</span>
        </div>

        {/* Received (Inflow) */}
        <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container/50 flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">arrow_downward</span>
            Received / Inflow (AePS & QR)
          </span>
          <span className="font-mono font-bold text-base text-cyan-600 dark:text-cyan-400">
            {formatRupees(overviewMetrics.totalReceived)}
          </span>
          <span className="text-[10px] text-outline font-medium">Inflow into BC / QR</span>
        </div>

        {/* Net Shop Commission */}
        <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container/50 flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">trending_up</span>
            Net Shop Commission
          </span>
          <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
            {formatRupees(overviewMetrics.totalCommission)}
          </span>
          <span className="text-[10px] text-outline font-medium">
            Fees: {formatRupees(overviewMetrics.totalFees)}
          </span>
        </div>
      </div>

      {/* Sub-header: Group View Selector (Portal vs Bank vs Mode) & Quick Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-surface-container/60">
          <button
            type="button"
            onClick={() => { setViewMode('portal'); setSearchQuery(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'portal'
                ? 'bg-primary text-on-primary shadow-xs font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm">wallet</span>
            <span>By Portal / Wallet ({overviewMetrics.portalsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => { setViewMode('bank'); setSearchQuery(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'bank'
                ? 'bg-primary text-on-primary shadow-xs font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm">account_balance</span>
            <span>By Bank / Partner ({overviewMetrics.banksCount})</span>
          </button>

          <button
            type="button"
            onClick={() => { setViewMode('mode'); setSearchQuery(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'mode'
                ? 'bg-primary text-on-primary shadow-xs font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm">category</span>
            <span>By Service Mode</span>
          </button>
        </div>

        {/* Quick Filter Input */}
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-2.5 top-2 text-outline text-sm">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Filter ${viewMode === 'portal' ? 'portal (e.g. SAFEPAY)' : viewMode === 'bank' ? 'bank (e.g. Baroda)' : 'mode'}...`}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-surface-container text-on-surface placeholder:text-outline text-xs focus:outline-none focus:ring-1 focus:ring-primary border-none"
          />
        </div>
      </div>

      {/* Aggregated Settlement Table */}
      <div className="overflow-x-auto rounded-xl border border-surface-container/60 bg-surface-container-low/30">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-surface-container/60">
              <th className="py-2.5 px-3 font-semibold text-outline">
                {viewMode === 'portal' ? 'Portal / Gateway' : viewMode === 'bank' ? 'Bank / Provider' : 'Channel Mode'}
              </th>
              <th className="py-2.5 px-2 font-semibold text-outline text-center">Txns</th>
              <th className="py-2.5 px-3 font-semibold text-outline text-right">Total Volume</th>
              <th className="py-2.5 px-3 font-semibold text-outline text-right text-blue-600 dark:text-blue-400">
                Disbursed / Sent
              </th>
              <th className="py-2.5 px-3 font-semibold text-outline text-right text-cyan-600 dark:text-cyan-400">
                Inflow / Received
              </th>
              <th className="py-2.5 px-3 font-semibold text-outline text-right">Customer Fees</th>
              <th className="py-2.5 px-3 font-semibold text-outline text-right text-emerald-600 dark:text-emerald-400">
                Net Commission
              </th>
              <th className="py-2.5 px-2 font-semibold text-outline text-center">Success Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container/40">
            {groupedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-xs text-outline">
                  No banking transactions recorded for {datePeriod === 'today' ? 'today' : datePeriod === 'month' ? 'this month' : 'the selected period'}.
                </td>
              </tr>
            ) : (
              groupedData.map((row) => {
                const successRate = row.count > 0 ? Math.round((row.successCount / row.count) * 100) : 0;
                return (
                  <tr
                    key={row.name}
                    className="hover:bg-surface-container-lowest transition-colors"
                  >
                    {/* Entity Name */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-base">
                          {viewMode === 'portal' ? 'account_balance_wallet' : viewMode === 'bank' ? 'account_balance' : 'receipt_long'}
                        </span>
                        <span className="font-semibold text-on-surface">{row.name}</span>
                      </div>
                    </td>

                    {/* Transaction Count */}
                    <td className="py-2.5 px-2 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-surface-container font-mono font-bold text-[11px] text-on-surface">
                        {row.count}
                      </span>
                    </td>

                    {/* Total Volume */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-on-surface">
                      {formatRupees(row.totalVolume)}
                    </td>

                    {/* Sent Volume */}
                    <td className="py-2.5 px-3 text-right font-mono text-blue-600 dark:text-blue-400 font-medium">
                      {row.sentVolume > 0 ? formatRupees(row.sentVolume) : '-'}
                    </td>

                    {/* Received Volume */}
                    <td className="py-2.5 px-3 text-right font-mono text-cyan-600 dark:text-cyan-400 font-medium">
                      {row.receivedVolume > 0 ? formatRupees(row.receivedVolume) : '-'}
                    </td>

                    {/* Fees Collected */}
                    <td className="py-2.5 px-3 text-right font-mono text-on-surface-variant font-medium">
                      {row.totalFees > 0 ? formatRupees(row.totalFees) : '₹0'}
                    </td>

                    {/* Net Commission */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {row.totalCommission > 0 ? formatRupees(row.totalCommission) : '₹0'}
                    </td>

                    {/* Success Rate */}
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            successRate >= 90
                              ? 'bg-emerald-500'
                              : successRate >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        <span className="font-mono text-[11px] font-bold text-on-surface">
                          {successRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
