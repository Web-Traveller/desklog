import React, { useState } from 'react';
import { useDesk } from '../context/DeskContext';
import { CustomerCard } from '../components/CustomerCard';
import { TaskCard } from '../components/TaskCard';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/StatusBadge';

export const SearchPage: React.FC = () => {
  const {
    searchQuery,
    customers,
    tasks,
    bankingTransactions,
    accountOpenings,
    services,
    setCurrentPage,
    navigateToBankingTx,
    navigateToAccountOpening,
  } = useDesk();

  const [activeFilter, setActiveFilter] = useState<'all' | 'banking' | 'accounts' | 'customers' | 'tasks' | 'services'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'recent' | 'name'>('relevance');
  const [showAllCustomers, setShowAllCustomers] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showAllBanking, setShowAllBanking] = useState(false);
  const [showAllAccounts, setShowAllAccounts] = useState(false);

  const rawQ = searchQuery.trim().toLowerCase();
  const cleanQ = searchQuery.replace(/[\s-]/g, '').toLowerCase();

  const {
    matchingBanking,
    matchingAccountOpenings,
    matchingCustomers,
    matchingTasks,
    matchingServices,
    totalMatches,
  } = React.useMemo(() => {
    // 1. Banking Transactions Universal Deep Match
    let bts = bankingTransactions.filter((tx) => {
      if (!rawQ) return true;
      if (tx.is_deleted) return false;

      // Customer name & mobile
      if (tx.customer_name?.toLowerCase().includes(rawQ)) return true;
      if (tx.customer_mobile && tx.customer_mobile.replace(/[\s-]/g, '').includes(cleanQ)) return true;

      // Linked Customer profile lookup (Name, Mobile, Aadhaar)
      const txMobileClean = tx.customer_mobile ? tx.customer_mobile.replace(/[\s-]/g, '') : '';
      const txAcctClean = tx.account_or_aadhaar ? tx.account_or_aadhaar.replace(/[\s-]/g, '') : '';
      const linkedCust = (tx.customer_id && tx.customer_id !== 'cust-general')
        ? customers.find((c) => c.id === tx.customer_id)
        : customers.find((c) =>
            (txMobileClean && c.mobile && c.mobile.replace(/[\s-]/g, '') === txMobileClean) ||
            (txAcctClean && c.aadhaar_number && c.aadhaar_number.replace(/[\s-]/g, '') === txAcctClean) ||
            (tx.customer_name && tx.customer_name.trim() !== 'Walk-in Customer' && c.name.toLowerCase() === tx.customer_name.trim().toLowerCase())
          );

      if (linkedCust) {
        if (linkedCust.name.toLowerCase().includes(rawQ)) return true;
        if (linkedCust.mobile && linkedCust.mobile.replace(/[\s-]/g, '').includes(cleanQ)) return true;
        if (linkedCust.aadhaar_number && linkedCust.aadhaar_number.replace(/[\s-]/g, '').includes(cleanQ)) return true;
      }

      // Account / Aadhaar / Ref
      if (tx.account_or_aadhaar && tx.account_or_aadhaar.replace(/[\s-]/g, '').toLowerCase().includes(cleanQ)) return true;
      if (tx.transaction_ref_no?.toLowerCase().includes(rawQ)) return true;

      // Bank & Portal
      if (tx.bank_name?.toLowerCase().includes(rawQ)) return true;
      if (tx.company_name?.toLowerCase().includes(rawQ)) return true;

      // Mode & Type
      if (tx.transaction_type?.toLowerCase().includes(rawQ)) return true;
      if (tx.payment_mode?.toLowerCase().includes(rawQ)) return true;
      if (tx.status?.toLowerCase().includes(rawQ)) return true;

      // Remark & Notes
      if (tx.remark?.toLowerCase().includes(rawQ)) return true;

      // Financial Amounts (Paise to Rupees)
      const amtRupees = String(Math.floor((tx.amount || 0) / 100));
      if (amtRupees.includes(cleanQ)) return true;
      const feeRupees = String(Math.floor((tx.charges || 0) / 100));
      if (feeRupees.includes(cleanQ)) return true;
      const companyChargeRupees = String(Math.floor((tx.company_charge || 0) / 100));
      if (companyChargeRupees.includes(cleanQ)) return true;
      const refundRupees = String(Math.floor((tx.refund || 0) / 100));
      if (refundRupees.includes(cleanQ)) return true;
      const commissionRupees = String(Math.floor(((tx.charges || 0) - (tx.company_charge || 0)) / 100));
      if (commissionRupees.includes(cleanQ)) return true;

      return false;
    });

    // 1b. Bank Account Openings Universal Match
    let accts = (accountOpenings || []).filter((a) => {
      if (!rawQ) return true;
      if (a.customer_name?.toLowerCase().includes(rawQ)) return true;
      if (a.account_number?.replace(/[\s-]/g, '').toLowerCase().includes(cleanQ)) return true;
      if (a.bank_customer_id?.toLowerCase().includes(rawQ)) return true;
      if (a.passbook_number?.toLowerCase().includes(rawQ)) return true;
      if (a.mobile_number && a.mobile_number.replace(/[\s-]/g, '').includes(cleanQ)) return true;
      if (a.aadhaar_number && a.aadhaar_number.replace(/[\s-]/g, '').includes(cleanQ)) return true;
      if (a.pan_number?.toLowerCase().includes(rawQ)) return true;
      if (a.scheme?.toLowerCase().includes(rawQ)) return true;
      if (a.city?.toLowerCase().includes(rawQ)) return true;
      if (a.area?.toLowerCase().includes(rawQ)) return true;
      if (a.notes?.toLowerCase().includes(rawQ)) return true;
      const amtRupees = String(Math.floor((a.initial_deposit || 0) / 100));
      if (amtRupees.includes(cleanQ)) return true;
      return false;
    });

    // 2. Customers Universal Match
    let custs = customers.filter(
      (c) =>
        !rawQ ||
        c.name.toLowerCase().includes(rawQ) ||
        (c.mobile && c.mobile.replace(/[\s-]/g, '').includes(cleanQ)) ||
        (c.aadhaar_number && c.aadhaar_number.replace(/[\s-]/g, '').includes(cleanQ)) ||
        c.note?.toLowerCase().includes(rawQ) ||
        c.id.toLowerCase().includes(rawQ)
    );

    // 3. Tasks Universal Match
    let tsks = tasks.filter((t) => {
      if (!rawQ) return true;
      if (t.title.toLowerCase().includes(rawQ)) return true;
      if (t.work_type?.toLowerCase().includes(rawQ)) return true;
      if (t.tracker_id && t.tracker_id.toLowerCase().includes(rawQ)) return true;
      if (t.document_number && t.document_number.toLowerCase().includes(rawQ)) return true;
      if (t.notes?.toLowerCase().includes(rawQ)) return true;
      if (t.status.toLowerCase().includes(rawQ)) return true;
      if (t.cancellation_reason?.toLowerCase().includes(rawQ)) return true;

      // Check linked service
      const svc = services.find((s) => s.id === t.service_id);
      if (svc && svc.name.toLowerCase().includes(rawQ)) return true;

      // Check linked customer
      const cust = customers.find((c) => c.id === t.customer_id);
      if (cust) {
        if (cust.name.toLowerCase().includes(rawQ)) return true;
        if (cust.mobile && cust.mobile.replace(/[\s-]/g, '').includes(cleanQ)) return true;
        if (cust.aadhaar_number && cust.aadhaar_number.replace(/[\s-]/g, '').includes(cleanQ)) return true;
      }

      // Billing Amount
      const billRupees = String(Math.floor((t.billing_amount || 0) / 100));
      if (billRupees.includes(cleanQ)) return true;

      return false;
    });

    // 4. Services Catalog Match
    let svcs = services.filter((s) => {
      if (!rawQ) return true;
      if (s.name.toLowerCase().includes(rawQ)) return true;
      const priceRupees = String(Math.floor((s.default_price || 0) / 100));
      if (priceRupees.includes(cleanQ)) return true;
      return false;
    });

    // Sorting
    if (sortBy === 'name') {
      custs = [...custs].sort((a, b) => a.name.localeCompare(b.name));
      tsks = [...tsks].sort((a, b) => a.title.localeCompare(b.title));
      bts = [...bts].sort((a, b) => (a.customer_name || '').localeCompare(b.customer_name || ''));
      accts = [...accts].sort((a, b) => (a.customer_name || '').localeCompare(b.customer_name || ''));
      svcs = [...svcs].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'recent') {
      custs = [...custs].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      tsks = [...tsks].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      bts = [...bts].sort(
        (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      );
      accts = [...accts].sort(
        (a, b) => new Date(b.account_date || '').getTime() - new Date(a.account_date || '').getTime()
      );
    }

    const total = bts.length + accts.length + custs.length + tsks.length + svcs.length;

    return {
      matchingBanking: bts,
      matchingAccountOpenings: accts,
      matchingCustomers: custs,
      matchingTasks: tsks,
      matchingServices: svcs,
      totalMatches: total,
    };
  }, [bankingTransactions, accountOpenings, customers, tasks, services, rawQ, cleanQ, sortBy]);

  const visibleAccounts = React.useMemo(() => {
    return showAllAccounts ? matchingAccountOpenings : matchingAccountOpenings.slice(0, 10);
  }, [matchingAccountOpenings, showAllAccounts]);

  const visibleCustomers = React.useMemo(() => {
    return showAllCustomers ? matchingCustomers : matchingCustomers.slice(0, 8);
  }, [matchingCustomers, showAllCustomers]);

  const visibleTasks = React.useMemo(() => {
    return showAllTasks ? matchingTasks : matchingTasks.slice(0, 10);
  }, [matchingTasks, showAllTasks]);

  const visibleBanking = React.useMemo(() => {
    return showAllBanking ? matchingBanking : matchingBanking.slice(0, 10);
  }, [matchingBanking, showAllBanking]);

  return (
    <div className="w-full px-gutter py-space-lg max-w-[1240px] mx-auto flex flex-col gap-space-lg animate-slideUp">
      {/* Search Header Hero Tile */}
      <div className="w-full rounded-[18px] bg-surface-container-lowest p-space-xl shadow-xs border border-surface-container/60">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
          <div className="flex flex-col gap-space-xs max-w-2xl">
            <div className="flex items-center gap-space-xs">
              <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-fine-print text-fine-print font-medium">
                <span className="material-symbols-outlined text-xs">manage_search</span>
                Universal Database Search
              </span>
              <span className="font-fine-print text-fine-print text-on-surface-variant">
                Live index across all tables, rows, notes & ledger entries
              </span>
            </div>

            <h1 className="font-display-md text-display-md text-on-surface tracking-tight">
              Search Results for{' '}
              <span className="text-primary font-semibold">“{searchQuery || 'All'}”</span>
            </h1>

            <p className="font-body text-body text-on-surface-variant">
              Showing{' '}
              <strong className="text-on-surface font-semibold">{totalMatches} matching records</strong>{' '}
              across counter banking ledger, customer profiles, task notes, and services catalog.
            </p>
          </div>

          {/* Sort Controls */}
          <div className="flex flex-wrap items-center gap-space-sm">
            <div className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container text-on-surface font-button-utility text-button-utility border border-surface-container-high/50">
              <span className="material-symbols-outlined text-sm text-outline">sort</span>
              <span className="text-on-surface-variant">Sort:</span>
              <select
                className="bg-transparent font-medium text-on-surface focus:outline-none cursor-pointer text-xs"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'relevance' | 'recent' | 'name')}
              >
                <option value="relevance">Highest Relevance</option>
                <option value="recent">Most Recent Date</option>
                <option value="name">Name / Title (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Segment Filter Pills */}
        <div className="mt-space-lg pt-space-md flex items-center gap-space-xs overflow-x-auto pb-1 border-t border-surface-container/40">
          <button
            className={`filter-pill flex items-center gap-space-xs px-space-md py-space-xs rounded-full font-button-utility text-button-utility whitespace-nowrap transition-all ${
              activeFilter === 'all'
                ? 'bg-primary text-on-primary font-semibold shadow-xs'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
            }`}
            onClick={() => setActiveFilter('all')}
            type="button"
          >
            <span>All Results</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[11px] font-semibold">
              {totalMatches}
            </span>
          </button>

          <button
            className={`filter-pill flex items-center gap-space-xs px-space-md py-space-xs rounded-full font-button-utility text-button-utility whitespace-nowrap transition-all ${
              activeFilter === 'banking'
                ? 'bg-primary text-on-primary font-semibold shadow-xs'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
            }`}
            onClick={() => setActiveFilter('banking')}
            type="button"
          >
            <span className="material-symbols-outlined text-sm">account_balance</span>
            <span>Counter Transfers</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-on-surface-variant text-[11px] font-semibold">
              {matchingBanking.length}
            </span>
          </button>

          <button
            className={`filter-pill flex items-center gap-space-xs px-space-md py-space-xs rounded-full font-button-utility text-button-utility whitespace-nowrap transition-all ${
              activeFilter === 'accounts'
                ? 'bg-primary text-on-primary font-semibold shadow-xs'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
            }`}
            onClick={() => setActiveFilter('accounts')}
            type="button"
          >
            <span className="material-symbols-outlined text-sm">badge</span>
            <span>Bank Accounts</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-on-surface-variant text-[11px] font-semibold">
              {matchingAccountOpenings.length}
            </span>
          </button>

          <button
            className={`filter-pill flex items-center gap-space-xs px-space-md py-space-xs rounded-full font-button-utility text-button-utility whitespace-nowrap transition-all ${
              activeFilter === 'customers'
                ? 'bg-primary text-on-primary font-semibold shadow-xs'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
            }`}
            onClick={() => setActiveFilter('customers')}
            type="button"
          >
            <span className="material-symbols-outlined text-sm">group</span>
            <span>Customers</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-on-surface-variant text-[11px] font-semibold">
              {matchingCustomers.length}
            </span>
          </button>

          <button
            className={`filter-pill flex items-center gap-space-xs px-space-md py-space-xs rounded-full font-button-utility text-button-utility whitespace-nowrap transition-all ${
              activeFilter === 'tasks'
                ? 'bg-primary text-on-primary font-semibold shadow-xs'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
            }`}
            onClick={() => setActiveFilter('tasks')}
            type="button"
          >
            <span className="material-symbols-outlined text-sm">assignment</span>
            <span>Tasks Register</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-on-surface-variant text-[11px] font-semibold">
              {matchingTasks.length}
            </span>
          </button>

          <button
            className={`filter-pill flex items-center gap-space-xs px-space-md py-space-xs rounded-full font-button-utility text-button-utility whitespace-nowrap transition-all ${
              activeFilter === 'services'
                ? 'bg-primary text-on-primary font-semibold shadow-xs'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
            }`}
            onClick={() => setActiveFilter('services')}
            type="button"
          >
            <span className="material-symbols-outlined text-sm">design_services</span>
            <span>Services Catalog</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-on-surface-variant text-[11px] font-semibold">
              {matchingServices.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Results Column */}
      {totalMatches === 0 ? (
        <EmptyState
          icon="search_off"
          title="No records found"
          description={`No customer profile, banking transaction, remark, phone number, or task matching "${searchQuery}".`}
        />
      ) : (
        <div className="flex flex-col gap-space-xl">
          {/* 1. Banking Ledger Results */}
          {(activeFilter === 'all' || activeFilter === 'banking') && matchingBanking.length > 0 && (
            <section className="flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-xl">account_balance</span>
                  <h2 className="font-tagline text-tagline text-on-surface font-semibold">
                    Banking & Counter Ledger Records
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-fine-print text-fine-print font-medium">
                    {matchingBanking.length} matches
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentPage('banking')}
                  className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                >
                  <span>Open Banking Ledger</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {visibleBanking.map((tx) => {
                  const txMobileClean = tx.customer_mobile ? tx.customer_mobile.replace(/[\s-]/g, '') : '';
                  const txAcctClean = tx.account_or_aadhaar ? tx.account_or_aadhaar.replace(/[\s-]/g, '') : '';
                  const linkedCust = (tx.customer_id && tx.customer_id !== 'cust-general')
                    ? customers.find((c) => c.id === tx.customer_id)
                    : customers.find((c) =>
                        (txMobileClean && c.mobile && c.mobile.replace(/[\s-]/g, '') === txMobileClean) ||
                        (txAcctClean && c.aadhaar_number && c.aadhaar_number.replace(/[\s-]/g, '') === txAcctClean) ||
                        (tx.customer_name && tx.customer_name.trim() !== 'Walk-in Customer' && c.name.toLowerCase() === tx.customer_name.trim().toLowerCase())
                      );
                  const displayName = (tx.customer_name && tx.customer_name.trim() && tx.customer_name.trim() !== 'Walk-in Customer')
                    ? tx.customer_name.trim()
                    : (linkedCust?.name || 'Customer');
                  const displayMobile = tx.customer_mobile || linkedCust?.mobile || '';

                  return (
                    <div
                      key={tx.id || Math.random()}
                      onClick={() => tx.id && navigateToBankingTx(tx.id)}
                      className="p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container/60 hover:border-primary/40 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-primary text-xl">
                            {tx.transaction_type === 'AEPS' ? 'fingerprint' :
                             tx.transaction_type === 'UPI' || tx.transaction_type === 'UPI CASH' ? 'qr_code_2' :
                             tx.transaction_type === 'BILL' ? 'receipt_long' :
                             tx.transaction_type === 'CREDIT' ? 'credit_card' : 'send_money'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                              {tx.transaction_type}
                            </span>
                            <span className="font-semibold text-xs text-on-surface">
                              {displayName}
                            </span>
                            {displayMobile && (
                              <span className="font-mono text-xs text-outline">
                                {displayMobile}
                              </span>
                            )}
                            <span className="text-[11px] text-outline">
                              · {new Date(tx.transaction_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-on-surface-variant flex-wrap">
                            {tx.bank_name && (
                              <span className="font-medium text-on-surface">
                                {tx.bank_name}
                              </span>
                            )}
                            {tx.account_or_aadhaar && (
                              <span className="font-mono text-[11px] text-outline">
                                Ref: {tx.account_or_aadhaar}
                              </span>
                            )}
                            {tx.company_name && (
                              <span className="px-1.5 py-0.5 rounded bg-surface-container text-[10px] font-semibold text-outline">
                                {tx.company_name}
                              </span>
                            )}
                          </div>
                          {tx.remark && (
                            <p className="text-[11px] text-outline italic mt-0.5">
                              "{tx.remark}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <div className="flex flex-col items-end">
                          <span className="font-mono font-bold text-sm text-on-surface">
                            ₹{((tx.amount || 0) / 100).toLocaleString('en-IN')}
                          </span>
                          {tx.charges ? (
                            <span className="text-[11px] font-mono text-outline">
                              Fee: ₹{((tx.charges || 0) / 100).toLocaleString('en-IN')}
                            </span>
                          ) : null}
                          {tx.refund ? (
                            <span className="text-[10px] font-mono text-error font-medium">
                              Refund: ₹{((tx.refund || 0) / 100).toLocaleString('en-IN')}
                            </span>
                          ) : null}
                          {tx.company_charge !== undefined && tx.charges !== undefined ? (
                            <span className="text-[10px] font-mono text-emerald-600 font-medium">
                              Comm: ₹{Math.max(0, Math.floor(((tx.charges || 0) - (tx.company_charge || 0)) / 100)).toLocaleString('en-IN')}
                            </span>
                          ) : null}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-600' :
                          tx.status === 'FAILD' ? 'bg-red-500/10 text-red-600' :
                          'bg-amber-500/10 text-amber-600'
                        }`}>
                          {tx.status || 'SUCCESS'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const identifier = tx.account_or_aadhaar || tx.transaction_ref_no || '-';
                            const text = `=== DESKLOG TRANSACTION RECEIPT ===\nDate: ${tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString() : ''}\nMode: ${tx.transaction_type}\nCustomer: ${displayName} ${displayMobile ? `(${displayMobile})` : ''}\nBank: ${tx.bank_name || '-'}\nRef/Account: ${identifier}\nPortal: ${tx.company_name || '-'}\nAmount: ₹${Math.floor((tx.amount || 0) / 100)}\nFee: ₹${Math.floor((tx.charges || 0) / 100)}\nStatus: ${tx.status || 'SUCCESS'}\n===================================`;
                            navigator.clipboard.writeText(text);
                          }}
                          title="Copy Quick Slip"
                          className="p-1 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">content_copy</span>
                        </button>
                        <span className="material-symbols-outlined text-outline text-base">chevron_right</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {matchingBanking.length > 10 && (
                <button
                  type="button"
                  onClick={() => setShowAllBanking((v) => !v)}
                  className="self-center mt-2 px-4 py-2 rounded-full border border-surface-container-high text-xs font-semibold text-primary hover:bg-surface-container transition-all"
                >
                  {showAllBanking ? 'Show Fewer Banking Records' : `Show All ${matchingBanking.length} Banking Records`}
                </button>
              )}
            </section>
          )}

          {/* 1b. Bank Account Openings Results */}
          {(activeFilter === 'all' || activeFilter === 'accounts') && matchingAccountOpenings.length > 0 && (
            <section className="flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-xl">badge</span>
                  <h2 className="font-tagline text-tagline text-on-surface font-semibold">
                    Bank Account Openings
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-fine-print text-fine-print font-medium">
                    {matchingAccountOpenings.length} accounts
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {visibleAccounts.map((account) => {
                  return (
                    <div
                      key={account.id}
                      onClick={() => account.id ? navigateToAccountOpening(String(account.id)) : null}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container/60 border border-surface-container/70 shadow-xs cursor-pointer transition-all hover:scale-[1.002] active:scale-[0.998]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                          <span className="material-symbols-outlined text-xl">account_balance</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-on-surface">
                              {account.customer_name}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-container text-primary border border-surface-container-high">
                              {account.scheme}
                            </span>
                            <span className="text-[10px] text-outline font-medium">
                              {account.visit_type || 'Walk-in'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-outline font-mono">
                            <span>A/C: <strong className="text-on-surface">{account.account_number}</strong></span>
                            {account.bank_customer_id && (
                              <span>CIF: <strong className="text-on-surface-variant">{account.bank_customer_id}</strong></span>
                            )}
                            {account.mobile_number && (
                              <span>Ph: {account.mobile_number}</span>
                            )}
                            {account.aadhaar_number && (
                              <span>Aadhaar: •••• {account.aadhaar_number.slice(-4)}</span>
                            )}
                          </div>

                          {account.city && (
                            <p className="text-[11px] text-outline mt-0.5">
                              Location: {[account.area, account.city, account.state].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <div className="flex flex-col items-end">
                          <span className="font-mono font-bold text-sm text-on-surface">
                            ₹{(((account.initial_deposit || 0)) / 100).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-outline">
                            {account.account_date || 'N/A'}
                          </span>
                        </div>

                        <StatusBadge status={account.kyc_status || 'Verified'} />

                        <span className="material-symbols-outlined text-outline text-base group-hover:text-primary transition-colors">
                          chevron_right
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {matchingAccountOpenings.length > 10 && (
                <button
                  type="button"
                  onClick={() => setShowAllAccounts((v) => !v)}
                  className="self-center mt-2 px-4 py-2 rounded-full border border-surface-container-high text-xs font-semibold text-primary hover:bg-surface-container transition-all"
                >
                  {showAllAccounts ? 'Show Fewer Accounts' : `Show All ${matchingAccountOpenings.length} Accounts`}
                </button>
              )}
            </section>
          )}

          {/* 2. Customer Profiles Results */}
          {(activeFilter === 'all' || activeFilter === 'customers') && matchingCustomers.length > 0 && (
            <section className="flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-xl">person_pin</span>
                  <h2 className="font-tagline text-tagline text-on-surface font-semibold">
                    Customer Profiles
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-fine-print text-fine-print font-medium">
                    {matchingCustomers.length} matches
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-space-md">
                {visibleCustomers.map((cust) => {
                  const custTasks = tasks.filter((t) => t.customer_id === cust.id);
                  const activeCount = custTasks.filter((t) => t.status !== 'DELIVERED').length;
                  const completedCount = custTasks.filter((t) => t.status === 'DELIVERED').length;
                  const ongoingTask = custTasks.find((t) => t.status !== 'DELIVERED')?.title;

                  return (
                    <CustomerCard
                      key={cust.id}
                      activeTasksCount={activeCount}
                      completedTasksCount={completedCount}
                      customer={cust}
                      highlightQuery={searchQuery}
                      ongoingTaskTitle={ongoingTask}
                    />
                  );
                })}
              </div>

              {matchingCustomers.length > 8 && (
                <button
                  type="button"
                  onClick={() => setShowAllCustomers((v) => !v)}
                  className="self-center mt-2 px-4 py-2 rounded-full border border-surface-container-high text-xs font-semibold text-primary hover:bg-surface-container transition-all"
                >
                  {showAllCustomers ? 'Show Fewer Customers' : `Show All ${matchingCustomers.length} Customers`}
                </button>
              )}
            </section>
          )}

          {/* 3. Tasks & Service Operations */}
          {(activeFilter === 'all' || activeFilter === 'tasks') && matchingTasks.length > 0 && (
            <section className="flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-xl">checklist</span>
                  <h2 className="font-tagline text-tagline text-on-surface font-semibold">
                    Task & Citizen Service Records
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-fine-print text-fine-print font-medium">
                    {matchingTasks.length} matches
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-space-xs">
                {visibleTasks.map((task) => (
                  <TaskCard key={task.id} layout="list" task={task} />
                ))}
              </div>

              {matchingTasks.length > 10 && (
                <button
                  type="button"
                  onClick={() => setShowAllTasks((v) => !v)}
                  className="self-center mt-2 px-4 py-2 rounded-full border border-surface-container-high text-xs font-semibold text-primary hover:bg-surface-container transition-all"
                >
                  {showAllTasks ? 'Show Fewer Tasks' : `Show All ${matchingTasks.length} Tasks`}
                </button>
              )}
            </section>
          )}

          {/* 4. Services Catalog Results */}
          {(activeFilter === 'all' || activeFilter === 'services') && matchingServices.length > 0 && (
            <section className="flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-xl">design_services</span>
                  <h2 className="font-tagline text-tagline text-on-surface font-semibold">
                    Services Catalog
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-fine-print text-fine-print font-medium">
                    {matchingServices.length} matches
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentPage('services')}
                  className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                >
                  <span>Open Catalog</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {matchingServices.map((svc) => (
                  <div
                    key={svc.id}
                    onClick={() => setCurrentPage('services')}
                    className="p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container/60 hover:border-primary/40 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-base">design_services</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-on-surface line-clamp-1">{svc.name}</span>
                        <span className="text-[10px] text-outline">Counter Service</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-xs text-on-surface shrink-0">
                      ₹{((svc.default_price || 0) / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
