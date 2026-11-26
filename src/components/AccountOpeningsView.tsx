import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useBanking, useUI } from '../context/DeskContext';
import { BankAccountOpening } from '../types';
import { AddAccountOpeningModal } from './AddAccountOpeningModal';
import { EditAccountOpeningModal } from './EditAccountOpeningModal';
import { AccountOpeningDetailsModal } from './AccountOpeningDetailsModal';
import { StatusBadge } from './StatusBadge';
import { calculateAge } from '../utils/dateUtils';
import { parseDocPaths } from '../utils/documentUtils';
import { ACCOUNT_OPENING_SCHEMES, ACCOUNT_OPENING_VISIT_TYPES, ACCOUNT_OPENING_KYC_STATUSES } from '../constants/bankingData';
import { PrintAccountForm } from './PrintAccountForm';

export const AccountOpeningsView: React.FC = () => {
  const { 
    accountOpenings, 
    deleteAccountOpening, 
    bankSchemes,
    shopName,
  } = useBanking();
  const { 
    showToast, 
    showConfirm, 
    highlightedAccountOpeningId, 
    setHighlightedAccountOpeningId,
  } = useUI();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [quickLookupQuery, setQuickLookupQuery] = useState('');
  const [schemeFilter, setSchemeFilter] = useState('All');
  const [visitTypeFilter, setVisitTypeFilter] = useState('All');
  const [kycFilter, setKycFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [page, setPage] = useState(0);
  const [showBlankPrintModal, setShowBlankPrintModal] = useState(false);
  const PAGE_SIZE = 15;

  const activeSchemeList = useMemo(() => {
    if (bankSchemes && bankSchemes.length > 0) {
      return bankSchemes.map(s => s.name);
    }
    return ACCOUNT_OPENING_SCHEMES;
  }, [bankSchemes]);

  // Instant Customer & KYC lookup (Matching Excel Dashbord sheet)
  const quickLookupResult = useMemo(() => {
    if (!quickLookupQuery.trim() || quickLookupQuery.trim().length < 3) return null;
    const cleanQ = quickLookupQuery.replace(/[\s-]/g, '').toLowerCase();
    const rawQ = quickLookupQuery.trim().toLowerCase();
    return (accountOpenings || []).find(a => 
      (a.aadhaar_number && a.aadhaar_number.replace(/[\s-]/g, '').includes(cleanQ)) ||
      (a.mobile_number && a.mobile_number.replace(/[\s-]/g, '').includes(cleanQ)) ||
      (a.account_number && a.account_number.replace(/[\s-]/g, '').includes(cleanQ)) ||
      (a.bank_customer_id && a.bank_customer_id.toLowerCase().includes(rawQ))
    ) || null;
  }, [quickLookupQuery, accountOpenings]);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccountOpening | null>(null);
  const [selectedAccountForSlip, setSelectedAccountForSlip] = useState<BankAccountOpening | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const highlightedRowRef = useRef<HTMLTableRowElement | null>(null);

  // Auto-scroll and page jump to highlighted record from search
  useEffect(() => {
    if (!highlightedAccountOpeningId) return;

    // Reset filters to guarantee the record is in view
    setSchemeFilter('All');
    setVisitTypeFilter('All');
    setKycFilter('All');
    setDateFilter('All Time');
    setSearchQuery('');

    const targetIdx = (accountOpenings || []).findIndex(
      (a) => String(a.id) === String(highlightedAccountOpeningId)
    );

    if (targetIdx !== -1) {
      const targetPage = Math.floor(targetIdx / PAGE_SIZE);
      setPage(targetPage);

      const scrollTimer = setTimeout(() => {
        const el = document.getElementById(`account-opening-${highlightedAccountOpeningId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);

      const clearTimer = setTimeout(() => {
        setHighlightedAccountOpeningId(null);
      }, 5000);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [highlightedAccountOpeningId, accountOpenings, PAGE_SIZE, setHighlightedAccountOpeningId]);

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    return (accountOpenings || []).filter((account) => {
      // Scheme filter
      if (schemeFilter !== 'All' && account.scheme !== schemeFilter) {
        return false;
      }

      // Visit Type filter
      if (visitTypeFilter !== 'All' && account.visit_type !== visitTypeFilter) {
        return false;
      }

      // KYC filter
      if (kycFilter !== 'All' && account.kyc_status !== kycFilter) {
        return false;
      }

      // Date filter
      if (dateFilter !== 'All Time' && account.account_date) {
        const itemDate = new Date(account.account_date);
        const today = new Date();
        if (dateFilter === 'Today') {
          if (itemDate.toDateString() !== today.toDateString()) return false;
        } else if (dateFilter === 'This Week') {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          if (itemDate < weekAgo) return false;
        } else if (dateFilter === 'This Month') {
          if (itemDate.getMonth() !== today.getMonth() || itemDate.getFullYear() !== today.getFullYear()) {
            return false;
          }
        }
      }

      // Universal Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const cleanQ = searchQuery.replace(/[\s-]/g, '').toLowerCase();

        const nameMatch = account.customer_name.toLowerCase().includes(q);
        const acctMatch = account.account_number.replace(/[\s-]/g, '').toLowerCase().includes(cleanQ);
        const cifMatch = (account.bank_customer_id || '').toLowerCase().includes(q);
        const passbookMatch = (account.passbook_number || '').toLowerCase().includes(q);
        const mobileMatch = (account.mobile_number || '').replace(/[\s-]/g, '').includes(cleanQ);
        const aadhaarMatch = (account.aadhaar_number || '').replace(/[\s-]/g, '').includes(cleanQ);
        const panMatch = (account.pan_number || '').toLowerCase().includes(q);
        const schemeMatch = (account.scheme || '').toLowerCase().includes(q);
        const cityMatch = (account.city || '').toLowerCase().includes(q);
        const areaMatch = (account.area || '').toLowerCase().includes(q);
        const notesMatch = (account.notes || '').toLowerCase().includes(q);

        return (
          nameMatch || acctMatch || cifMatch || passbookMatch || 
          mobileMatch || aadhaarMatch || panMatch || schemeMatch || 
          cityMatch || areaMatch || notesMatch
        );
      }

      return true;
    });
  }, [accountOpenings, schemeFilter, visitTypeFilter, kycFilter, dateFilter, searchQuery]);

  // Metrics
  const metrics = useMemo(() => {
    const total = filteredAccounts.length;
    const totalAmount = filteredAccounts.reduce((sum, a) => sum + (a.initial_deposit || 0), 0);
    const kycActive = filteredAccounts.filter(a => (a.kyc_status || '').toUpperCase() === 'VERIFIED').length;
    const kycPending = filteredAccounts.filter(a => (a.kyc_status || '').toUpperCase() !== 'VERIFIED').length;

    return {
      total,
      totalAmount,
      kycActive,
      kycPending,
    };
  }, [filteredAccounts]);

  // Pagination
  const totalPages = Math.ceil(filteredAccounts.length / PAGE_SIZE) || 1;
  const paginatedAccounts = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredAccounts.slice(start, start + PAGE_SIZE);
  }, [filteredAccounts, page]);

  const handleDelete = (account: BankAccountOpening) => {
    if (!account.id) return;
    showConfirm({
      title: 'Delete Bank Account Record?',
      message: `Are you sure you want to delete ${account.scheme} account #${account.account_number} for ${account.customer_name}? This action cannot be undone.`,
      confirmText: 'Delete Record',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteAccountOpening(account.id!);
          showToast('Account opening record deleted.', 'success');
        } catch {
          showToast('Failed to delete account record.', 'error');
        }
      }
    });
  };

  const handleExportCSV = () => {
    if (filteredAccounts.length === 0) {
      showToast('No records to export.', 'warning');
      return;
    }

    const headers = [
      'ID', 'Date', 'Visit Type', 'Customer Name', 'Bank / Scheme',
      'Account Number', 'Customer ID (CIF)', 'Passbook No', 'Mobile',
      'DOB', 'Aadhaar', 'PAN', 'Address', 'Area', 'City', 'State',
      'PIN', 'Initial Deposit / Fee', 'KYC Status', 'Notes'
    ];

    const rows = filteredAccounts.map(a => [
      `"${a.id || ''}"`,
      `"${a.account_date}"`,
      `"${a.visit_type || ''}"`,
      `"${a.customer_name.replace(/"/g, '""')}"`,
      `"${a.scheme}"`,
      `"${a.account_number}"`,
      `"${a.bank_customer_id || ''}"`,
      `"${a.passbook_number || ''}"`,
      `"${a.mobile_number || ''}"`,
      `"${a.dob || ''}"`,
      `"${a.aadhaar_number || ''}"`,
      `"${a.pan_number || ''}"`,
      `"${(a.mailing_address || '').replace(/"/g, '""')}"`,
      `"${(a.area || '').replace(/"/g, '""')}"`,
      `"${a.city || ''}"`,
      `"${a.state || ''}"`,
      `"${a.zip || ''}"`,
      ((a.initial_deposit || 0) / 100).toFixed(2),
      `"${a.kyc_status || 'Verified'}"`,
      `"${(a.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DeskLog_BankAccountOpenings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported bank account openings to CSV.', 'success');
  };

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container/60 shadow-xs">
          <div className="flex items-center justify-between text-outline text-xs">
            <span>Accounts Opened</span>
            <span className="material-symbols-outlined text-primary text-base">account_balance</span>
          </div>
          <div className="text-2xl font-bold font-mono text-on-surface mt-1">
            {metrics.total}
          </div>
          <p className="text-[11px] text-outline mt-0.5">
            Total master accounts
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container/60 shadow-xs">
          <div className="flex items-center justify-between text-outline text-xs">
            <span>Opening Amount / Fees</span>
            <span className="material-symbols-outlined text-emerald-600 text-base">payments</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{(metrics.totalAmount / 100).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-outline mt-0.5">
            Collected deposits & fees
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container/60 shadow-xs">
          <div className="flex items-center justify-between text-outline text-xs">
            <span>KYC Verified</span>
            <span className="material-symbols-outlined text-emerald-600 text-base">verified</span>
          </div>
          <div className="text-2xl font-bold font-mono text-on-surface mt-1">
            {metrics.kycActive}
          </div>
          <p className="text-[11px] text-outline mt-0.5">
            Active verified holders
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container/60 shadow-xs">
          <div className="flex items-center justify-between text-outline text-xs">
            <span>Pending Attention</span>
            <span className="material-symbols-outlined text-amber-600 text-base">pending_actions</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {metrics.kycPending}
          </div>
          <p className="text-[11px] text-outline mt-0.5">
            Pending KYC or docs
          </p>
        </div>
      </div>

      {/* Instant KYC & Document Verification Terminal (Matching Excel Dashbord sheet) */}
      <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container/60 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-surface-container/40">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-base">quick_reference_all</span>
            <span className="text-xs font-bold text-on-surface">Instant Customer & Document Verification</span>
          </div>
          <span className="text-[10px] text-outline">Search by Aadhaar (12 digits) or Mobile (10 digits) for immediate counter check</span>
        </div>

        <div className="flex items-center gap-2 mt-2.5">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-outline">fingerprint</span>
            <input
              type="text"
              value={quickLookupQuery}
              onChange={(e) => setQuickLookupQuery(e.target.value)}
              placeholder="Enter customer Aadhaar or Mobile number for instant lookup..."
              className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-surface-container/60 border border-surface-container-high text-xs font-mono font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {quickLookupQuery && (
              <button
                type="button"
                onClick={() => setQuickLookupQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface text-sm"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Quick Result Preview Card */}
        {quickLookupResult && (
          <div className="mt-3 p-3 rounded-xl bg-surface-container-low border border-primary/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center text-primary font-bold text-sm border border-surface-container-high">
                {quickLookupResult.customer_name.slice(0, 1)}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-on-surface">{quickLookupResult.customer_name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                    {quickLookupResult.scheme}
                  </span>
                  <StatusBadge status={quickLookupResult.kyc_status || 'Verified'} size="sm" />
                </div>
                <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-outline font-mono">
                  <span>A/C: {quickLookupResult.account_number}</span>
                  {quickLookupResult.bank_customer_id && <span>CIF: {quickLookupResult.bank_customer_id}</span>}
                  {quickLookupResult.mobile_number && <span>Mobile: {quickLookupResult.mobile_number}</span>}
                  {quickLookupResult.dob && <span>Age: {calculateAge(quickLookupResult.dob)} yrs</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setSelectedAccountForSlip(quickLookupResult)}
                className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">visibility</span>
                <span>View Full Details & Docs</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control & Filter Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-2xl bg-surface-container-lowest border border-surface-container/60 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-outline">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            placeholder="Search Name, Account No, CIF, Aadhaar, Mobile, City, Scheme..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-container border border-surface-container-high text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Scheme Filter */}
          <select
            value={schemeFilter}
            onChange={(e) => { setSchemeFilter(e.target.value); setPage(0); }}
            className="px-2.5 py-1.5 rounded-xl bg-surface-container border border-surface-container-high text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="All">All Banks / Schemes</option>
            {activeSchemeList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Visit Type */}
          <select
            value={visitTypeFilter}
            onChange={(e) => { setVisitTypeFilter(e.target.value); setPage(0); }}
            className="px-2.5 py-1.5 rounded-xl bg-surface-container border border-surface-container-high text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="All">All Visit Types</option>
            {ACCOUNT_OPENING_VISIT_TYPES.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          {/* KYC Status */}
          <select
            value={kycFilter}
            onChange={(e) => { setKycFilter(e.target.value); setPage(0); }}
            className="px-2.5 py-1.5 rounded-xl bg-surface-container border border-surface-container-high text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="All">All KYC Status</option>
            {ACCOUNT_OPENING_KYC_STATUSES.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>

          {/* Date Filter */}
          <div className="flex items-center gap-1 bg-surface-container p-0.5 rounded-xl">
            {(['All Time', 'This Month', 'Today'] as const).map(df => (
              <button
                key={df}
                type="button"
                onClick={() => { setDateFilter(df); setPage(0); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  dateFilter === df
                    ? 'bg-primary text-on-primary font-bold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {df}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={() => setShowBlankPrintModal(true)}
              className="p-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium transition border border-surface-container-high flex items-center gap-1 px-2.5"
              title="Print blank customer account opening application form"
            >
              <span className="material-symbols-outlined text-sm text-primary">print</span>
              <span>Blank Form</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="p-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium transition border border-surface-container-high flex items-center gap-1 px-2.5"
              title="Export filtered records to CSV"
            >
              <span className="material-symbols-outlined text-sm text-primary">download</span>
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container text-xs font-semibold shadow-xs transition active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>Open Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Accounts Ledger Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-surface-container/60 shadow-xs overflow-hidden">
        {!accountOpenings ? (
          <div className="p-12 text-center text-xs text-outline flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-base animate-spin text-primary">sync</span>
            <span>Loading bank account records...</span>
          </div>
        ) : paginatedAccounts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="p-3 bg-surface-container rounded-2xl">
              <span className="material-symbols-outlined text-3xl text-outline">account_balance</span>
            </div>
            <h3 className="text-sm font-semibold text-on-surface">No Bank Accounts Found</h3>
            <p className="text-xs text-outline max-w-sm">
              {searchQuery || schemeFilter !== 'All' 
                ? 'No account opening records matched your search filters.' 
                : 'No bank accounts have been opened yet. Open your first account or import the 47 records from Banking.xlsm.'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className="px-4 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary/90 transition-colors"
              >
                + Open New Account
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container/50 border-b border-surface-container/60 text-outline uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-2.5 px-2.5 text-center w-10 font-semibold text-outline text-[10px]">#</th>
                  <th className="py-2.5 px-3">Date & Visit</th>
                  <th className="py-2.5 px-3">Customer Details</th>
                  <th className="py-2.5 px-3">Bank & Scheme</th>
                  <th className="py-2.5 px-3">Account No & CIF</th>
                  <th className="py-2.5 px-3">Identity & KYC</th>
                  <th className="py-2.5 px-3">Documents</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3 text-right">Fee / Deposit</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/40">
                {paginatedAccounts.map((account, index) => {
                  const isHighlighted = highlightedAccountOpeningId === String(account.id);

                  return (
                    <tr
                      key={account.id}
                      id={`account-opening-${account.id}`}
                      ref={isHighlighted ? highlightedRowRef : null}
                      className={`transition-colors hover:bg-surface-container/30 ${
                        isHighlighted 
                          ? 'bg-amber-100/60 dark:bg-amber-950/40 ring-2 ring-amber-500/50' 
                          : ''
                      }`}
                    >
                      {/* Row # */}
                      <td className="py-3 px-2.5 font-mono text-[11px] text-outline text-center align-top whitespace-nowrap">
                        {(page * PAGE_SIZE) + index + 1}
                      </td>

                      {/* Date & Visit Type */}
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        <div className="font-medium text-on-surface">
                          {account.account_date || 'N/A'}
                        </div>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-surface-container text-outline mt-0.5">
                          {account.visit_type || 'Walk-in'}
                        </span>
                      </td>

                      {/* Customer Details */}
                      <td className="py-3 px-3 align-top">
                        <div className="font-semibold text-on-surface text-sm">
                          {account.customer_name}
                        </div>
                        <div className="flex items-center gap-2 text-outline text-[11px] mt-0.5">
                          {account.mobile_number && (
                            <span className="flex items-center gap-1 font-mono">
                              <span className="material-symbols-outlined text-xs">call</span>
                              {account.mobile_number}
                            </span>
                          )}
                          {account.dob && (
                            <span>• DOB: {account.dob} {calculateAge(account.dob) !== null && `(Age: ${calculateAge(account.dob)})`}</span>
                          )}
                        </div>
                      </td>

                      {/* Bank & Scheme - Clean unclogged typography */}
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        <div className="font-semibold text-xs text-on-surface">
                          {account.scheme}
                        </div>
                        {account.passbook_number && (
                          <div className="text-[10px] text-outline mt-0.5 font-mono">
                            PB: {account.passbook_number}
                          </div>
                        )}
                      </td>

                      {/* Account No & CIF */}
                      <td className="py-3 px-3 align-top">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-on-surface tracking-wide">
                            {account.account_number}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(account.account_number, `acc-${account.id}`)}
                            className="text-outline hover:text-primary transition"
                            title="Copy Account Number"
                          >
                            <span className="material-symbols-outlined text-xs">
                              {copiedId === `acc-${account.id}` ? 'check' : 'content_copy'}
                            </span>
                          </button>
                        </div>
                        {account.bank_customer_id && (
                          <div className="flex items-center gap-1 text-[11px] text-outline mt-0.5">
                            <span>CIF:</span>
                            <span className="font-mono font-medium text-on-surface-variant">
                              {account.bank_customer_id}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(account.bank_customer_id || '', `cif-${account.id}`)}
                              className="text-outline hover:text-primary transition"
                              title="Copy CIF"
                            >
                              <span className="material-symbols-outlined text-[10px]">
                                {copiedId === `cif-${account.id}` ? 'check' : 'content_copy'}
                              </span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Identity & KYC */}
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          {account.aadhaar_number ? (
                            <span className="font-mono text-[11px] text-on-surface">
                              Aadhaar: •••• {account.aadhaar_number.slice(-4)}
                            </span>
                          ) : (
                            <span className="text-[11px] text-outline">No Aadhaar</span>
                          )}
                          {account.pan_number && (
                            <span className="font-mono text-[10px] text-outline">
                              PAN: {account.pan_number}
                            </span>
                          )}
                          <span className="inline-block mt-0.5">
                            <StatusBadge status={account.kyc_status || 'Verified'} />
                          </span>
                        </div>
                      </td>

                      {/* Documents (Local) */}
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        {(() => {
                          const aadhaarCount = parseDocPaths(account.aadhaar_doc_path).length;
                          const panCount = parseDocPaths(account.pan_doc_path).length;
                          const photoCount = account.photo_path ? 1 : 0;
                          const isForm60 = (account.pan_number || '').toLowerCase().includes('form 60') || (account.pan_number || '').toLowerCase().includes('not available');
                          const totalFiles = photoCount + aadhaarCount + panCount;
                          const isComplete = photoCount > 0 && aadhaarCount > 0 && (panCount > 0 || isForm60);

                          return (
                            <div className="flex flex-col gap-1 items-start">
                              {isComplete ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  <span className="material-symbols-outlined text-[11px]">folder_check</span>
                                  <span>Complete ({totalFiles} {totalFiles === 1 ? 'file' : 'files'})</span>
                                </span>
                              ) : totalFiles > 0 ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  <span className="material-symbols-outlined text-[11px]">folder_open</span>
                                  <span>Attached ({totalFiles} {totalFiles === 1 ? 'file' : 'files'})</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-outline bg-surface-container">
                                  <span className="material-symbols-outlined text-[11px]">folder_off</span>
                                  <span>No Docs</span>
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => setSelectedAccountForSlip(account)}
                                className="text-[10px] text-primary hover:underline font-medium flex items-center gap-0.5"
                              >
                                <span>View Docs</span>
                                <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                              </button>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Location */}
                      <td className="py-3 px-3 align-top max-w-[150px] truncate">
                        <div className="font-medium text-on-surface truncate">
                          {account.city || 'N/A'}{account.state ? `, ${account.state}` : ''}
                        </div>
                        {account.area && (
                          <div className="text-[11px] text-outline truncate">
                            {account.area}
                          </div>
                        )}
                      </td>

                      {/* Fee / Deposit */}
                      <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-sm text-on-surface">
                          ₹{((account.initial_deposit || 0) / 100).toLocaleString('en-IN')}
                        </div>
                        {account.notes && (
                          <div className="text-[10px] text-outline truncate max-w-[120px] ml-auto" title={account.notes}>
                            {account.notes}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 align-top text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedAccountForSlip(account)}
                            className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface hover:text-primary transition"
                            title="View Digital Slip / WhatsApp Acknowledgement"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingAccount(account)}
                            className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface hover:text-blue-600 transition"
                            title="Edit Account Details"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(account)}
                            className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-outline hover:text-rose-600 transition"
                            title="Delete Account Record"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredAccounts.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-surface-container/30 border-t border-surface-container/60 text-xs text-outline">
            <span>
              Showing {page * PAGE_SIZE + 1} to {Math.min((page + 1) * PAGE_SIZE, filteredAccounts.length)} of {filteredAccounts.length} accounts
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-high transition"
              >
                Previous
              </button>
              <span className="px-2 font-medium text-on-surface">
                {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-high transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddAccountOpeningModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      <EditAccountOpeningModal
        isOpen={!!editingAccount}
        account={editingAccount}
        onClose={() => setEditingAccount(null)}
      />

      <AccountOpeningDetailsModal
        isOpen={!!selectedAccountForSlip}
        account={selectedAccountForSlip}
        onClose={() => setSelectedAccountForSlip(null)}
        onEdit={(acct) => {
          setSelectedAccountForSlip(null);
          setEditingAccount(acct);
        }}
      />

      <PrintAccountForm
        isOpen={showBlankPrintModal}
        onClose={() => setShowBlankPrintModal(false)}
        isBlank={true}
        shopName={shopName}
      />
    </div>
  );
};
