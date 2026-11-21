import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useBanking, useCustomers, useUI, useTasks } from '../context/DeskContext';
import { BankingTransaction } from '../types';
import { EmptyState } from '../components/EmptyState';
import { MetricCard } from '../components/MetricCard';
import { EditBankingTransactionModal } from '../components/EditBankingTransactionModal';
import { formatDisplayDate } from '../utils/dateUtils';
import { formatRupees } from '../utils/currencyUtils';
import {
  BANKING_MODE_KEYS,
  BANKING_MODES,
  BankingModeId,
} from '../constants/bankingData';

export const BankingPage: React.FC = () => {
  const { bankingTransactions, deleteBankingTransaction, updateBankingTransaction } = useBanking();
  const { customers } = useCustomers();
  const { showConfirm, setIsAddBankingOpen, showToast, highlightedBankingTxId, setHighlightedBankingTxId } = useUI();
  const { saveAppSetting, getSettingValue } = useTasks();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;
  const [showCashCalculator, setShowCashCalculator] = useState(false);
  const [selectedTxForDetails, setSelectedTxForDetails] = useState<BankingTransaction | null>(null);
  const [editingTx, setEditingTx] = useState<BankingTransaction | null>(null);

  // Cash Denominations (from Balances Dashboard)
  const [denominations, setDenominations] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem('desklog_counter_cash_notes');
      return saved ? JSON.parse(saved) : { 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0 };
    } catch {
      return { 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0 };
    }
  });

  // Top working wallets & BC accounts (from Balances Dashboard)
  const [walletBalances, setWalletBalances] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('desklog_portal_balances');
      return saved ? JSON.parse(saved) : {
        'SAFEPAY': 0,
        'PAYBINGO': 0,
        'Digikhata': 0,
        'Fino Bank BC': 0,
        'Baroda Bank BC': 0,
        'Airtel Bank BC': 0,
      };
    } catch {
      return {
        'SAFEPAY': 0,
        'PAYBINGO': 0,
        'Digikhata': 0,
        'Fino Bank BC': 0,
        'Baroda Bank BC': 0,
        'Airtel Bank BC': 0,
      };
    }
  });

  // Sync balances and notes with SQLite settings on mount
  useEffect(() => {
    const dbCash = getSettingValue('desklog_counter_cash_notes');
    if (dbCash) {
      try {
        setDenominations(JSON.parse(dbCash));
      } catch {}
    }
    const dbWallets = getSettingValue('desklog_portal_balances');
    if (dbWallets) {
      try {
        setWalletBalances(JSON.parse(dbWallets));
      } catch {}
    }
  }, [getSettingValue]);

  const totalPhysicalCash = useMemo(() => {
    return Object.entries(denominations).reduce((sum, [note, count]) => sum + (Number(note) * (count || 0)), 0);
  }, [denominations]);

  const totalWalletFunds = useMemo(() => {
    return Object.values(walletBalances).reduce((sum, bal) => sum + (bal || 0), 0);
  }, [walletBalances]);

  const totalWorkingCapital = totalPhysicalCash + totalWalletFunds;

  const updateDenomination = (note: number, countStr: string) => {
    const count = parseInt(countStr, 10) || 0;
    const updated = { ...denominations, [note]: Math.max(0, count) };
    setDenominations(updated);
    const serialized = JSON.stringify(updated);
    try {
      localStorage.setItem('desklog_counter_cash_notes', serialized);
    } catch {}
    saveAppSetting('desklog_counter_cash_notes', serialized).catch(() => {});
  };

  const updateWalletBalance = (wallet: string, amountStr: string) => {
    const amount = parseFloat(amountStr) || 0;
    const updated = { ...walletBalances, [wallet]: Math.max(0, amount) };
    setWalletBalances(updated);
    const serialized = JSON.stringify(updated);
    try {
      localStorage.setItem('desklog_portal_balances', serialized);
    } catch {}
    saveAppSetting('desklog_portal_balances', serialized).catch(() => {});
  };

  const handleClearCash = () => {
    const cleared = { 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0 };
    setDenominations(cleared);
    const serialized = JSON.stringify(cleared);
    try {
      localStorage.setItem('desklog_counter_cash_notes', serialized);
    } catch {}
    saveAppSetting('desklog_counter_cash_notes', serialized).catch(() => {});
  };

  // Customer ID to Customer Map for fast O(1) lookups
  const customerMap = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach((c) => {
      map.set(c.id, c.name);
    });
    return map;
  }, [customers]);

  // Mode counts for the tab strip
  const modeCounts = useMemo(() => {
    const counts: Record<string, number> = { All: bankingTransactions?.length || 0 };
    (bankingTransactions || []).forEach((t) => {
      counts[t.transaction_type] = (counts[t.transaction_type] || 0) + 1;
    });
    return counts;
  }, [bankingTransactions]);

  const getCustomerDisplayName = (tx: BankingTransaction): string => {
    if (tx.customer_name && tx.customer_name.trim() && tx.customer_name.trim() !== 'Walk-in Customer') {
      return tx.customer_name.trim();
    }
    const fromId = customerMap.get(tx.customer_id);
    if (fromId && fromId.trim() && fromId !== 'General / Walk-in Client' && fromId !== 'Walk-in Customer') {
      return fromId.trim();
    }
    const cleanMobile = tx.customer_mobile?.replace(/[\s-]/g, '');
    const cleanAcct = tx.account_or_aadhaar?.replace(/[\s-]/g, '');
    const matched = customers.find((c) =>
      (cleanMobile && c.mobile && c.mobile.replace(/[\s-]/g, '') === cleanMobile) ||
      (cleanAcct && c.aadhaar_number && c.aadhaar_number.replace(/[\s-]/g, '') === cleanAcct)
    );
    if (matched?.name) return matched.name;
    return 'Customer';
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

      // Universal Deep Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const cleanQ = searchQuery.replace(/[\s-]/g, '').toLowerCase();
        const custName = getCustomerDisplayName(tx).toLowerCase();
        const mobile = (tx.customer_mobile || '').replace(/[\s-]/g, '').toLowerCase();
        const portal = (tx.company_name || '').toLowerCase();
        const bank = (tx.bank_name || '').toLowerCase();
        const acct = (tx.account_or_aadhaar || tx.transaction_ref_no || '').replace(/[\s-]/g, '').toLowerCase();
        const remark = (tx.remark || '').toLowerCase();
        const mode = (tx.transaction_type || '').toLowerCase();
        const status = (tx.status || '').toLowerCase();
        const amtStr = String(Math.floor((tx.amount || 0) / 100));
        const feeStr = String(Math.floor((tx.charges || 0) / 100));
        const commStr = String(Math.floor((tx.commission || 0) / 100));
        const refStr = String(Math.floor((tx.refund || 0) / 100));

        // Also check if any customer matching query is linked by mobile or Aadhaar
        const matchedCust = customers.find((c) =>
          (mobile && c.mobile && c.mobile.replace(/[\s-]/g, '') === mobile) ||
          (acct && c.aadhaar_number && c.aadhaar_number.replace(/[\s-]/g, '') === acct) ||
          (c.id === tx.customer_id && c.id !== 'cust-general')
        );
        const custAadhaar = matchedCust?.aadhaar_number ? matchedCust.aadhaar_number.replace(/[\s-]/g, '').toLowerCase() : '';
        const matchedCustName = matchedCust?.name ? matchedCust.name.toLowerCase() : '';

        return (
          custName.includes(q) ||
          matchedCustName.includes(q) ||
          mobile.includes(cleanQ) ||
          portal.includes(q) ||
          bank.includes(q) ||
          acct.includes(cleanQ) ||
          custAadhaar.includes(cleanQ) ||
          remark.includes(q) ||
          mode.includes(q) ||
          status.includes(q) ||
          amtStr.includes(cleanQ) ||
          feeStr.includes(cleanQ) ||
          commStr.includes(cleanQ) ||
          refStr.includes(cleanQ)
        );
      }

      return true;
    });
  }, [bankingTransactions, filterType, statusFilter, dateFilter, searchQuery, customerMap, customers]);

  // Comprehensive Metrics: Volume, Transactions, Fees, Commission, Refunds, Inflow/Outflow
  const { totalVolume, totalTransactions, totalCommission, totalRefunds, sentOutflow, receivedInflow, successCount } = useMemo(() => {
    let vol = 0;
    let chg = 0;
    let comm = 0;
    let ref = 0;
    let sent = 0;
    let received = 0;
    let succ = 0;

    filteredTransactions.forEach((tx) => {
      vol += tx.amount || 0;
      chg += tx.charges || 0;
      comm += tx.commission || 0;
      ref += tx.refund || 0;
      if (tx.status === 'SUCCESS' || !tx.status) {
        succ++;
        if (tx.transaction_type === 'AEPS') {
          received += tx.amount || 0;
        } else {
          sent += tx.amount || 0;
        }
      }
    });

    return {
      totalVolume: vol,
      totalTransactions: filteredTransactions.length,
      totalCharges: chg,
      totalCommission: comm,
      totalRefunds: ref,
      sentOutflow: sent,
      receivedInflow: received,
      successCount: succ,
    };
  }, [filteredTransactions]);

  const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE) || 1;
  const safePage = Math.min(page, totalPages - 1);
  const paginatedTransactions = filteredTransactions.slice(
    safePage * PAGE_SIZE,
    (safePage + 1) * PAGE_SIZE
  );

  // Auto-scroll and highlight transaction navigated from Universal Search
  useEffect(() => {
    if (!highlightedBankingTxId) return;

    // Reset filters so the targeted transaction is visible in ledger
    setFilterType('All');
    setStatusFilter('All');
    setDateFilter('All Time');
    setSearchQuery('');

    const index = (bankingTransactions || []).findIndex((t) => t.id === highlightedBankingTxId);
    if (index !== -1) {
      const targetPage = Math.floor(index / PAGE_SIZE);
      setPage(targetPage);

      const scrollTimer = setTimeout(() => {
        const el = document.getElementById(`banking-tx-${highlightedBankingTxId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);

      const clearTimer = setTimeout(() => {
        setHighlightedBankingTxId(null);
      }, 4500);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [highlightedBankingTxId, bankingTransactions, PAGE_SIZE, setHighlightedBankingTxId]);

  const handleDelete = (id: number) => {
    showConfirm({
      title: 'Delete Transaction Record',
      message: 'Are you sure you want to remove this transaction from the ledger?',
      confirmText: 'Delete Record',
      variant: 'danger',
      onConfirm: async () => {
        await deleteBankingTransaction(id);
      },
    });
  };

  const handleCopyReceipt = (tx: BankingTransaction) => {
    const identifier = tx.account_or_aadhaar || tx.transaction_ref_no || '-';
    const text = `=== DESKLOG TRANSACTION RECEIPT ===
Date: ${formatDisplayDate(tx.transaction_date)}
Mode: ${tx.transaction_type}
Customer: ${getCustomerDisplayName(tx)} ${tx.customer_mobile ? `(${tx.customer_mobile})` : ''}
Bank / Provider: ${tx.bank_name || '-'}
Ref / Account: ${identifier}
Portal: ${tx.company_name || '-'}
Amount: ${formatRupees(tx.amount)}
Fee: ${tx.charges ? formatRupees(tx.charges) : '₹0'}
Status: ${tx.status || 'SUCCESS'}
${tx.remark ? `Remark: ${tx.remark}\n` : ''}===================================`;

    navigator.clipboard.writeText(text);
    showToast('Receipt slip copied to clipboard.', 'success');
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    await updateBankingTransaction(id, { status: newStatus });
    if (selectedTxForDetails && selectedTxForDetails.id === id) {
      setSelectedTxForDetails({ ...selectedTxForDetails, status: newStatus });
    }
  };

  const getModeBadgeClass = (mode: string) => {
    const cfg = BANKING_MODES[mode as BankingModeId];
    if (cfg?.badgeClass) return cfg.badgeClass;
    return 'bg-surface-container-high text-on-surface';
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-gutter py-space-md flex flex-col gap-4 animate-slideUp">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container">
        <div>
          <h1 className="font-display-md text-2xl text-on-surface font-semibold tracking-tight">
            Banking & Counter Ledger
          </h1>
          <p className="text-xs text-on-surface-variant">
            Counter money transfers, AePS cash, UPI, and bill payments
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowCashCalculator(!showCashCalculator)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-button-utility text-xs font-semibold transition-all border border-surface-container-high/40 shadow-xs"
          >
            <span className="material-symbols-outlined text-base text-primary">point_of_sale</span>
            <span>{showCashCalculator ? 'Hide Balances & Cash' : 'Counter Cash & Balances'}</span>
          </button>

          <button
            onClick={() => setIsAddBankingOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95 font-button-utility text-xs font-semibold shadow-sm"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>+ New Transaction</span>
          </button>
        </div>
      </div>

      {/* Collapsible Counter Cash & Wallet Balances Panel (from Balances Dashboard) */}
      {showCashCalculator && (
        <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container/60 shadow-xs flex flex-col gap-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-container/40 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">account_balance_wallet</span>
              <div>
                <h3 className="font-semibold text-xs text-on-surface">Counter Liquidity & Daily Closing</h3>
                <p className="text-[11px] text-outline">Reconcile physical cash drawer and monitor prepaid wallet balances</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1 rounded-xl bg-surface-container border border-surface-container-high/40">
              <span className="text-xs text-outline font-medium">Working Capital:</span>
              <span className="font-mono font-bold text-xs text-primary">
                ₹{totalWorkingCapital.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Cash Denomination Calculator */}
            <div className="lg:col-span-7 flex flex-col gap-2.5 p-3 rounded-xl bg-surface-container-low border border-surface-container/50">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">payments</span>
                  Physical Cash Note Counter
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    Drawer: ₹{totalPhysicalCash.toLocaleString('en-IN')}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearCash}
                    className="text-[10px] text-outline hover:text-red-500 font-medium underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {[500, 200, 100, 50, 20, 10].map((note) => {
                  const count = denominations[note] || 0;
                  const subtotal = note * count;
                  return (
                    <div key={note} className="flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest border border-surface-container/60">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-surface-container text-on-surface">
                        ₹{note}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-outline">×</span>
                        <input
                          type="number"
                          min="0"
                          value={count || ''}
                          placeholder="0"
                          onChange={(e) => updateDenomination(note, e.target.value)}
                          className="w-10 px-1 py-0.5 rounded text-center text-xs font-mono font-semibold bg-surface-container text-on-surface border border-surface-container-high/40 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <span className="font-mono text-[10px] font-bold text-outline w-12 text-right">
                          ={subtotal ? `₹${subtotal}` : '₹0'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Portal & BC Wallet Balances */}
            <div className="lg:col-span-5 flex flex-col gap-2.5 p-3 rounded-xl bg-surface-container-low border border-surface-container/50">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">account_balance</span>
                  Prepaid Portals & BC Balances
                </span>
                <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                  Total: ₹{totalWalletFunds.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {Object.entries(walletBalances).map(([portal, bal]) => (
                  <div key={portal} className="flex flex-col gap-1 p-2 rounded-lg bg-surface-container-lowest border border-surface-container/60">
                    <span className="text-[10px] font-semibold text-on-surface-variant truncate">{portal}</span>
                    <div className="relative">
                      <span className="absolute left-1.5 top-1 text-[10px] text-outline font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={bal || ''}
                        placeholder="0.00"
                        onChange={(e) => updateWalletBalance(portal, e.target.value)}
                        className="w-full pl-4 pr-1 py-0.5 rounded text-xs font-mono font-bold bg-surface-container text-on-surface border border-surface-container-high/40 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Date Scope Selector & Quick Summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container/60 shadow-xs">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-primary">calendar_today</span>
          <span className="text-xs font-semibold text-on-surface">Records:</span>
          <div className="flex items-center gap-1">
            {(['Today', 'This Week', 'This Month', 'All Time'] as const).map((df) => (
              <button
                key={df}
                type="button"
                onClick={() => { setDateFilter(df); setPage(0); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  dateFilter === df
                    ? 'bg-primary text-on-primary font-bold shadow-xs'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {df}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-on-surface-variant font-medium">
          <span>Total Records: <strong className="font-mono text-on-surface">{totalTransactions}</strong></span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            {successCount} Success
          </span>
          {totalTransactions - successCount > 0 && (
            <>
              <span>•</span>
              <span className="text-rose-500 font-semibold">
                {totalTransactions - successCount} Other
              </span>
            </>
          )}
        </div>
      </div>

      {/* Minimal Summary Metrics - 5 Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <MetricCard
          icon="account_balance"
          title="Turnover Volume"
          value={formatRupees(totalVolume)}
          subtitle={`${successCount} successful operations`}
        />
        <MetricCard
          icon="arrow_upward"
          iconColorClass="text-blue-500"
          title="Sent Outflow"
          value={formatRupees(sentOutflow)}
          subtitle="DMT & bill payments"
        />
        <MetricCard
          icon="arrow_downward"
          iconColorClass="text-emerald-500"
          title="Received Inflow"
          value={formatRupees(receivedInflow)}
          subtitle="AePS & cash withdrawals"
        />
        <MetricCard
          icon="trending_up"
          iconColorClass="text-emerald-500"
          title="Net Commission"
          value={formatRupees(totalCommission)}
          subtitle="Your counter earnings"
        />
        <MetricCard
          icon="replay"
          iconColorClass="text-amber-500"
          title="Refunds"
          value={formatRupees(totalRefunds)}
          subtitle="Customer reversals"
        />
      </div>

      {/* Mode Filter Strip (Clickable Pills) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => { setFilterType('All'); setPage(0); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filterType === 'All'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          All <span className="opacity-70 font-mono text-[10px]">({modeCounts['All'] || 0})</span>
        </button>
        {BANKING_MODE_KEYS.map((key) => {
          const isSelected = filterType === key;
          const count = modeCounts[key] || 0;
          return (
            <button
              key={key}
              onClick={() => { setFilterType(key); setPage(0); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {key} {count > 0 && <span className="opacity-70 font-mono text-[10px]">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Control Bar: Search + Status + Date Range */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-container-lowest p-3 rounded-2xl border border-surface-container/60 shadow-xs">
        <div className="relative flex items-center w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 text-outline pointer-events-none text-base">
            search
          </span>
          <input
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-surface-container text-on-surface placeholder:text-outline text-xs transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 border-none"
            placeholder="Search by customer, phone, bank, portal..."
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
          />
          {searchQuery && (
            <button
              className="absolute right-3 text-outline hover:text-on-surface text-xs"
              onClick={() => {
                setSearchQuery('');
                setPage(0);
              }}
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 justify-end">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="px-2.5 py-1.5 bg-surface-container text-on-surface rounded-xl focus:outline-none text-xs font-medium border-none"
          >
            <option value="All">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="IN PROGRESS">In Progress</option>
            <option value="FAILD">Failed</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(0);
            }}
            className="px-2.5 py-1.5 bg-surface-container text-on-surface rounded-xl focus:outline-none text-xs font-medium border-none"
          >
            <option value="All Time">All Time</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
          </select>
        </div>
      </div>

      {/* Main Ledger Table — Simple & Spacious */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-xs border border-surface-container/60 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-surface-container-low/70 border-b border-surface-container/60">
              <tr>
                <th className="py-3 px-3 font-semibold text-outline whitespace-nowrap">Date</th>
                <th className="py-3 px-2 font-semibold text-outline whitespace-nowrap">Mode</th>
                <th className="py-3 px-3 font-semibold text-outline">Customer & Ref</th>
                <th className="py-3 px-3 font-semibold text-outline">Service & Portal</th>
                <th className="py-3 px-3 font-semibold text-outline text-right">Amount</th>
                <th className="py-3 px-3 font-semibold text-outline text-right">Fee (₹)</th>
                <th className="py-3 px-3 font-semibold text-outline text-right text-amber-600 dark:text-amber-400">Refund</th>
                <th className="py-3 px-3 font-semibold text-outline text-right text-emerald-600 dark:text-emerald-400">Commission</th>
                <th className="py-3 px-2 font-semibold text-outline text-center">Status</th>
                <th className="py-3 px-2 font-semibold text-outline text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container/40">
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
                  const isSuccess = txStatus === 'SUCCESS';
                  const isFailed = txStatus === 'FAILD';
                  const identifier = tx.account_or_aadhaar || tx.transaction_ref_no || '';
                  const isHighlighted = highlightedBankingTxId === tx.id;

                  return (
                    <tr
                      key={tx.id}
                      id={`banking-tx-${tx.id}`}
                      className={`transition-all duration-500 group ${
                        isHighlighted
                          ? 'bg-primary/20 ring-2 ring-primary ring-inset font-semibold shadow-md animate-pulse'
                          : 'hover:bg-surface-container-lowest/90'
                      }`}
                    >
                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-on-surface-variant font-medium">
                        {formatDisplayDate(tx.transaction_date)}
                      </td>

                      {/* Mode Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getModeBadgeClass(tx.transaction_type)}`}
                        >
                          {tx.transaction_type}
                        </span>
                      </td>

                      {/* Customer & Identifier */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-on-surface">
                          {getCustomerDisplayName(tx)}
                        </div>
                        <div className="text-[11px] text-outline font-mono flex items-center gap-1.5 pt-0.5">
                          {identifier && <span>{identifier}</span>}
                          {identifier && tx.customer_mobile && <span>&middot;</span>}
                          {tx.customer_mobile && <span>{tx.customer_mobile}</span>}
                        </div>
                      </td>

                      {/* Bank / Biller & Portal */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-on-surface">
                          {tx.bank_name || '-'}
                        </div>
                        {tx.company_name && (
                          <div className="text-[10px] text-outline font-medium pt-0.5">
                            via {tx.company_name}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 text-right font-bold text-on-surface font-mono text-xs whitespace-nowrap">
                        {formatRupees(tx.amount)}
                      </td>

                      {/* Customer Fee */}
                      <td className="py-3 px-3 text-right font-mono text-on-surface-variant font-medium whitespace-nowrap">
                        {tx.charges && tx.charges > 0 ? formatRupees(tx.charges) : '₹0'}
                      </td>

                      {/* Refund */}
                      <td className="py-3 px-3 text-right font-mono text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap">
                        {tx.refund && tx.refund > 0 ? formatRupees(tx.refund) : '-'}
                      </td>

                      {/* Commission */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {tx.commission && tx.commission > 0 ? formatRupees(tx.commission) : '₹0'}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isSuccess
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : isFailed
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSuccess ? 'bg-emerald-500' : isFailed ? 'bg-rose-500' : 'bg-amber-500'
                            }`}
                          />
                          {isSuccess ? 'Success' : isFailed ? 'Failed' : 'Pending'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-2 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setSelectedTxForDetails(tx)}
                            className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors"
                            title="View Receipt Slip & Details"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-base">receipt_long</span>
                          </button>
                          <button
                            onClick={() => setEditingTx(tx)}
                            className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors"
                            title="Edit Transaction"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                          <button
                            onClick={() => tx.id && handleDelete(tx.id)}
                            className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error/10 transition-colors"
                            title="Delete Record"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredTransactions.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-container/40 bg-surface-container-low/20">
            <span className="text-xs text-outline">
              Showing {safePage * PAGE_SIZE + 1} to{' '}
              {Math.min((safePage + 1) * PAGE_SIZE, filteredTransactions.length)} of{' '}
              {filteredTransactions.length} records
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="px-2.5 py-1 text-xs rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface disabled:opacity-40 transition"
              >
                Previous
              </button>
              <span className="px-2 text-xs text-on-surface-variant font-mono">
                {safePage + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                className="px-2.5 py-1 text-xs rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Details & Receipt Slip Modal */}
      {selectedTxForDetails && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-2xl max-w-md w-full border border-surface-container/60 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container/60">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">receipt_long</span>
                <div>
                  <h3 className="font-semibold text-sm text-on-surface">
                    {selectedTxForDetails.transaction_type} Receipt Slip
                  </h3>
                  <span className="text-[11px] text-outline font-mono">
                    {formatDisplayDate(selectedTxForDetails.transaction_date)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTxForDetails(null)}
                className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Slip Summary Body */}
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container/60 flex flex-col gap-2.5 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-surface-container/40">
                <span className="text-outline">Customer:</span>
                <span className="font-bold text-on-surface font-sans">
                  {getCustomerDisplayName(selectedTxForDetails)}
                </span>
              </div>
              {selectedTxForDetails.customer_mobile && (
                <div className="flex justify-between items-center">
                  <span className="text-outline">Mobile:</span>
                  <span className="text-on-surface">{selectedTxForDetails.customer_mobile}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-outline">Bank / Provider:</span>
                <span className="font-semibold text-on-surface">{selectedTxForDetails.bank_name || '-'}</span>
              </div>
              {(selectedTxForDetails.account_or_aadhaar || selectedTxForDetails.transaction_ref_no) && (
                <div className="flex justify-between items-center">
                  <span className="text-outline">Ref / Account:</span>
                  <span className="text-on-surface">{selectedTxForDetails.account_or_aadhaar || selectedTxForDetails.transaction_ref_no}</span>
                </div>
              )}
              {selectedTxForDetails.company_name && (
                <div className="flex justify-between items-center">
                  <span className="text-outline">Portal:</span>
                  <span className="text-primary font-bold">{selectedTxForDetails.company_name}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-surface-container/40">
                <span className="text-outline font-sans">Amount:</span>
                <span className="font-bold text-base text-on-surface">{formatRupees(selectedTxForDetails.amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-outline font-sans">Customer Fee:</span>
                <span className="text-on-surface-variant">{selectedTxForDetails.charges ? formatRupees(selectedTxForDetails.charges) : '₹0'}</span>
              </div>
              {selectedTxForDetails.company_charge !== undefined && selectedTxForDetails.company_charge > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-outline font-sans">Company Cost:</span>
                  <span className="text-on-surface-variant font-medium">{formatRupees(selectedTxForDetails.company_charge)}</span>
                </div>
              )}
              {selectedTxForDetails.refund !== undefined && selectedTxForDetails.refund > 0 && (
                <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
                  <span className="font-sans font-bold">Refund:</span>
                  <span className="font-bold">{formatRupees(selectedTxForDetails.refund)}</span>
                </div>
              )}
              {selectedTxForDetails.commission !== undefined && selectedTxForDetails.commission > 0 && (
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                  <span className="font-sans font-bold">Net Commission:</span>
                  <span className="font-bold text-sm">{formatRupees(selectedTxForDetails.commission)}</span>
                </div>
              )}
              {selectedTxForDetails.remark && (
                <div className="pt-2 border-t border-surface-container/40 text-[11px] text-outline font-sans">
                  Note: {selectedTxForDetails.remark}
                </div>
              )}
            </div>

            {/* Quick Status Switcher */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-outline font-semibold">Change Status:</span>
              <div className="flex items-center gap-1 bg-surface-container p-0.5 rounded-lg">
                {(['SUCCESS', 'IN PROGRESS', 'FAILD'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => selectedTxForDetails.id && handleStatusUpdate(selectedTxForDetails.id, st)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                      selectedTxForDetails.status === st
                        ? st === 'SUCCESS'
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : st === 'IN PROGRESS'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-rose-500 text-white shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {st === 'IN PROGRESS' ? 'Pending' : st === 'SUCCESS' ? 'Success' : 'Failed'}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Actions: Copy Slip, Edit, Close */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-surface-container/60">
              <button
                type="button"
                onClick={() => {
                  const txToEdit = selectedTxForDetails;
                  setSelectedTxForDetails(null);
                  setEditingTx(txToEdit);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold transition"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                <span>Edit Record</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyReceipt(selectedTxForDetails)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition"
                >
                  <span className="material-symbols-outlined text-sm text-primary">content_copy</span>
                  <span>Copy Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTxForDetails(null)}
                  className="px-5 py-1.5 rounded-full bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Banking Transaction Modal */}
      <EditBankingTransactionModal
        isOpen={!!editingTx}
        transaction={editingTx}
        onClose={() => setEditingTx(null)}
      />
    </div>
  );
};
