import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { BankingTransaction, BankAccountOpening, BankScheme, PaymentMethod } from '../types';
import {
  fetchTauriBankingTransactions,
  saveTauriBankingTransaction,
  updateTauriBankingTransaction,
  deleteTauriBankingTransaction,
  fetchTauriBankAccountOpenings,
  saveTauriBankAccountOpening,
  updateTauriBankAccountOpening,
  deleteTauriBankAccountOpening,
  importTauriBankAccountOpenings,
  fetchTauriBankSchemes,
  addTauriBankScheme,
  updateTauriBankScheme,
  deleteTauriBankScheme,
  fetchTauriPaymentMethods,
  addTauriPaymentMethod,
  updateTauriPaymentMethod,
  deleteTauriPaymentMethod,
  saveTauriActivity,
  saveTauriSetting,
  fetchTauriSettings,
  isTauriEnv,
} from '../api/tauri';
import { createActivityEvent } from '../services/activityService';
import { formatRupees } from '../utils/currencyUtils';
import { useUI } from './UIContext';
import { ACCOUNT_OPENING_SCHEMES, COMMON_COMPANIES, BANKING_MODE_KEYS } from '../constants/bankingData';

interface BankingContextType {
  bankingTransactions: BankingTransaction[];
  addBankingTransaction: (tx: Omit<BankingTransaction, 'id' | 'is_deleted'>) => Promise<void>;
  updateBankingTransaction: (id: number, updates: Partial<BankingTransaction>) => Promise<void>;
  deleteBankingTransaction: (id: number) => Promise<void>;
  reloadBankingTransactions: () => Promise<void>;

  accountOpenings: BankAccountOpening[];
  addAccountOpening: (item: Omit<BankAccountOpening, 'id'>) => Promise<BankAccountOpening>;
  updateAccountOpening: (id: number, updates: Partial<BankAccountOpening>) => Promise<void>;
  deleteAccountOpening: (id: number) => Promise<void>;
  importAccountOpenings: (items: BankAccountOpening[]) => Promise<number>;
  reloadAccountOpenings: () => Promise<void>;

  // Bank Schemes CRUD
  bankSchemes: BankScheme[];
  addBankScheme: (name: string) => Promise<void>;
  updateBankScheme: (id: number, name: string) => Promise<void>;
  deleteBankScheme: (id: number) => Promise<void>;
  reloadBankSchemes: () => Promise<void>;

  // Payment Methods / Modes CRUD
  paymentMethods: PaymentMethod[];
  addPaymentMethod: (name: string) => Promise<void>;
  updatePaymentMethod: (id: number, name: string) => Promise<void>;
  deletePaymentMethod: (id: number) => Promise<void>;
  reloadPaymentMethods: () => Promise<void>;

  // Counter Portals CRUD
  portals: string[];
  addPortal: (name: string) => Promise<void>;
  updatePortal: (oldName: string, newName: string) => Promise<void>;
  deletePortal: (name: string) => Promise<void>;

  // Shop / Business Name
  shopName: string;
  updateShopName: (name: string) => Promise<void>;
}

const BankingContext = createContext<BankingContextType | undefined>(undefined);

export const BankingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bankingTransactions, setBankingTransactions] = useState<BankingTransaction[]>([]);
  const [accountOpenings, setAccountOpenings] = useState<BankAccountOpening[]>([]);
  const [bankSchemes, setBankSchemes] = useState<BankScheme[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [portals, setPortals] = useState<string[]>([]);
  const [shopName, setShopName] = useState<string>('IRSHAD COMMUNICATION');
  const { showToast } = useUI();

  const reloadBankingTransactions = async () => {
    const dbBanking = await fetchTauriBankingTransactions();
    if (dbBanking) {
      setBankingTransactions(dbBanking);
    } else if (!isTauriEnv()) {
      try {
        const cached = localStorage.getItem('desklog_banking_records');
        if (cached) {
          setBankingTransactions(JSON.parse(cached));
        } else {
          setBankingTransactions([]);
        }
      } catch {
        setBankingTransactions([]);
      }
    } else {
      setBankingTransactions([]);
    }
  };

  const reloadAccountOpenings = async () => {
    try {
      let list = await fetchTauriBankAccountOpenings();
      if (list && list.length > 0) {
        setAccountOpenings(list);
      } else if (list && list.length === 0) {
        setAccountOpenings([]);
      } else {
        try {
          const cached = localStorage.getItem('desklog_account_openings');
          if (cached) {
            setAccountOpenings(JSON.parse(cached));
          } else {
            setAccountOpenings([]);
          }
        } catch {
          setAccountOpenings([]);
        }
      }
    } catch (err) {
      console.warn('Failed to load bank account openings:', err);
    }
  };

  const reloadBankSchemes = async () => {
    try {
      const schemes = await fetchTauriBankSchemes();
      if (schemes && schemes.length > 0) {
        setBankSchemes(schemes);
      } else {
        // Fallback to default schemes list
        try {
          const cached = localStorage.getItem('desklog_bank_schemes');
          if (cached) {
            setBankSchemes(JSON.parse(cached));
          } else {
            const defaults = ACCOUNT_OPENING_SCHEMES.map((name, idx) => ({
              id: idx + 1,
              name,
              is_active: true,
            }));
            setBankSchemes(defaults);
          }
        } catch {
          setBankSchemes(
            ACCOUNT_OPENING_SCHEMES.map((name, idx) => ({ id: idx + 1, name, is_active: true }))
          );
        }
      }
    } catch (err) {
      console.warn('Failed to load bank schemes:', err);
    }
  };

  const reloadPaymentMethods = async () => {
    try {
      const methods = await fetchTauriPaymentMethods();
      if (methods && methods.length > 0) {
        setPaymentMethods(methods);
      } else {
        try {
          const cached = localStorage.getItem('desklog_payment_methods');
          if (cached) {
            setPaymentMethods(JSON.parse(cached));
          } else {
            const defaults = BANKING_MODE_KEYS.map((name, idx) => ({
              id: idx + 1,
              name,
              is_active: true,
            }));
            setPaymentMethods(defaults);
          }
        } catch {
          setPaymentMethods(
            BANKING_MODE_KEYS.map((name, idx) => ({ id: idx + 1, name, is_active: true }))
          );
        }
      }
    } catch (err) {
      console.warn('Failed to load payment methods:', err);
    }
  };

  const reloadPortalsAndShop = async () => {
    try {
      // Load Shop Name
      const savedShop = localStorage.getItem('desklog_shop_name');
      if (savedShop) {
        setShopName(savedShop);
      } else {
        const settings = await fetchTauriSettings();
        const shopSetting = settings?.find(s => s.key === 'shop_name' || s.key === 'company_name');
        if (shopSetting?.value) {
          setShopName(shopSetting.value);
        }
      }

      // Load Portals
      const savedPortals = localStorage.getItem('desklog_portals');
      if (savedPortals) {
        setPortals(JSON.parse(savedPortals));
      } else {
        const settings = await fetchTauriSettings();
        const portalSetting = settings?.find(s => s.key === 'counter_portals');
        if (portalSetting?.value) {
          try {
            setPortals(JSON.parse(portalSetting.value));
          } catch {
            setPortals(COMMON_COMPANIES);
          }
        } else {
          setPortals(COMMON_COMPANIES);
        }
      }
    } catch (err) {
      console.warn('Failed to load portals or shop settings:', err);
    }
  };

  useEffect(() => {
    reloadBankingTransactions();
    reloadAccountOpenings();
    reloadBankSchemes();
    reloadPaymentMethods();
    reloadPortalsAndShop();
  }, []);

  // Bank Schemes CRUD
  const addBankScheme = async (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    try {
      if (isTauriEnv()) {
        const created = await addTauriBankScheme(clean);
        if (created) {
          setBankSchemes(prev => [...prev, created]);
        } else {
          await reloadBankSchemes();
        }
      } else {
        const newScheme: BankScheme = { id: Date.now(), name: clean, is_active: true };
        setBankSchemes(prev => {
          const next = [...prev, newScheme];
          localStorage.setItem('desklog_bank_schemes', JSON.stringify(next));
          return next;
        });
      }
      showToast(`Added bank scheme: ${clean}`, 'success');
    } catch (err) {
      console.error('Failed to add bank scheme:', err);
      showToast('Failed to add bank scheme.', 'error');
    }
  };

  const updateBankScheme = async (id: number, name: string) => {
    const clean = name.trim();
    if (!clean) return;
    try {
      if (isTauriEnv()) {
        await updateTauriBankScheme(id, clean);
      }
      setBankSchemes(prev => {
        const next = prev.map(s => (s.id === id ? { ...s, name: clean } : s));
        if (!isTauriEnv()) {
          localStorage.setItem('desklog_bank_schemes', JSON.stringify(next));
        }
        return next;
      });
      showToast(`Updated scheme to ${clean}`, 'success');
    } catch (err) {
      console.error('Failed to update bank scheme:', err);
      showToast('Failed to update bank scheme.', 'error');
    }
  };

  const deleteBankScheme = async (id: number) => {
    try {
      if (isTauriEnv()) {
        await deleteTauriBankScheme(id);
      }
      setBankSchemes(prev => {
        const next = prev.filter(s => s.id !== id);
        if (!isTauriEnv()) {
          localStorage.setItem('desklog_bank_schemes', JSON.stringify(next));
        }
        return next;
      });
      showToast('Bank scheme removed.', 'info');
    } catch (err) {
      console.error('Failed to delete bank scheme:', err);
      showToast('Failed to delete bank scheme.', 'error');
    }
  };

  // Payment Methods / Modes CRUD
  const addPaymentMethod = async (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    try {
      if (isTauriEnv()) {
        const created = await addTauriPaymentMethod(clean);
        if (created) {
          setPaymentMethods(prev => [...prev, created]);
        } else {
          await reloadPaymentMethods();
        }
      } else {
        const newMethod: PaymentMethod = { id: Date.now(), name: clean, is_active: true };
        setPaymentMethods(prev => {
          const next = [...prev, newMethod];
          localStorage.setItem('desklog_payment_methods', JSON.stringify(next));
          return next;
        });
      }
      showToast(`Added payment method: ${clean}`, 'success');
    } catch (err) {
      console.error('Failed to add payment method:', err);
      showToast('Failed to add payment method.', 'error');
    }
  };

  const updatePaymentMethod = async (id: number, name: string) => {
    const clean = name.trim();
    if (!clean) return;
    try {
      if (isTauriEnv()) {
        await updateTauriPaymentMethod(id, clean);
      }
      setPaymentMethods(prev => {
        const next = prev.map(m => (m.id === id ? { ...m, name: clean } : m));
        if (!isTauriEnv()) {
          localStorage.setItem('desklog_payment_methods', JSON.stringify(next));
        }
        return next;
      });
      showToast(`Updated payment method to ${clean}`, 'success');
    } catch (err) {
      console.error('Failed to update payment method:', err);
      showToast('Failed to update payment method.', 'error');
    }
  };

  const deletePaymentMethod = async (id: number) => {
    try {
      if (isTauriEnv()) {
        await deleteTauriPaymentMethod(id);
      }
      setPaymentMethods(prev => {
        const next = prev.filter(m => m.id !== id);
        if (!isTauriEnv()) {
          localStorage.setItem('desklog_payment_methods', JSON.stringify(next));
        }
        return next;
      });
      showToast('Payment method removed.', 'info');
    } catch (err) {
      console.error('Failed to delete payment method:', err);
      showToast('Failed to delete payment method.', 'error');
    }
  };

  // Portals CRUD
  const addPortal = async (name: string) => {
    const clean = name.trim().toUpperCase();
    if (!clean || portals.includes(clean)) return;
    const next = [...portals, clean];
    setPortals(next);
    try {
      localStorage.setItem('desklog_portals', JSON.stringify(next));
      await saveTauriSetting('counter_portals', JSON.stringify(next));
      showToast(`Added portal: ${clean}`, 'success');
    } catch (err) {
      console.warn('Failed to save portal setting:', err);
    }
  };

  const updatePortal = async (oldName: string, newName: string) => {
    const cleanNew = newName.trim().toUpperCase();
    if (!cleanNew) return;
    const next = portals.map(p => (p === oldName ? cleanNew : p));
    setPortals(next);
    try {
      localStorage.setItem('desklog_portals', JSON.stringify(next));
      await saveTauriSetting('counter_portals', JSON.stringify(next));
      showToast(`Updated portal to ${cleanNew}`, 'success');
    } catch (err) {
      console.warn('Failed to save portal update:', err);
    }
  };

  const deletePortal = async (name: string) => {
    const next = portals.filter(p => p !== name);
    setPortals(next);
    try {
      localStorage.setItem('desklog_portals', JSON.stringify(next));
      await saveTauriSetting('counter_portals', JSON.stringify(next));
      showToast(`Removed portal: ${name}`, 'info');
    } catch (err) {
      console.warn('Failed to delete portal:', err);
    }
  };

  // Shop Name
  const updateShopName = async (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setShopName(clean);
    try {
      localStorage.setItem('desklog_shop_name', clean);
      await saveTauriSetting('shop_name', clean);
      showToast(`Shop name set to: ${clean}`, 'success');
    } catch (err) {
      console.warn('Failed to save shop name:', err);
    }
  };

  const addBankingTransaction = async (txData: Omit<BankingTransaction, 'id' | 'is_deleted'>) => {
    const newTx: BankingTransaction = {
      ...txData,
      is_deleted: false,
      transaction_date: txData.transaction_date || new Date().toISOString(),
    };
    try {
      let saved = await saveTauriBankingTransaction(newTx);
      if (!isTauriEnv()) {
        saved = { ...newTx, id: Date.now() };
        const updated = [saved, ...bankingTransactions];
        try {
          localStorage.setItem('desklog_banking_records', JSON.stringify(updated));
        } catch {}
      }
      setBankingTransactions(prev => [saved, ...prev]);
      showToast('Banking transaction saved.', 'success');

      // Audit trail: log every new banking transaction
      const activityEvent = createActivityEvent({
        type: 'banking_transaction_added',
        title: `New ${newTx.transaction_type} transaction recorded`,
        description: `Amount: ${formatRupees(newTx.amount)} | Customer: ${newTx.customer_name || 'Walk-in'} | Portal: ${newTx.company_name || '-'}`,
        customerId: newTx.customer_id !== 'cust-general' ? newTx.customer_id : undefined,
        customerName: newTx.customer_name,
        customerPhone: newTx.customer_mobile,
      });
      await saveTauriActivity(activityEvent);
    } catch (err) {
      console.error('Failed to log banking transaction:', err);
      Sentry.captureException(err);
      showToast('Failed to record banking transaction.', 'error');
    }
  };

  const updateBankingTransaction = async (id: number, updates: Partial<BankingTransaction>) => {
    try {
      const existing = bankingTransactions.find(t => t.id === id);
      if (existing) {
        const merged: BankingTransaction = { ...existing, ...updates, id };
        if (isTauriEnv()) {
          await updateTauriBankingTransaction(merged);
        }
      }
      setBankingTransactions(prev => {
        const updated = prev.map(t => (t.id === id ? { ...t, ...updates } : t));
        if (!isTauriEnv()) {
          try {
            localStorage.setItem('desklog_banking_records', JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });
      showToast('Transaction updated successfully.', 'success');
    } catch (err) {
      console.error('Failed to update transaction:', err);
      showToast('Failed to update transaction record.', 'error');
    }
  };

  const deleteBankingTransaction = async (id: number) => {
    try {
      if (isTauriEnv()) {
        await deleteTauriBankingTransaction(id);
      }
      setBankingTransactions(prev => {
        const filtered = prev.filter(t => t.id !== id);
        if (!isTauriEnv()) {
          try {
            localStorage.setItem('desklog_banking_records', JSON.stringify(filtered));
          } catch {}
        }
        return filtered;
      });
      showToast('Transaction record deleted.', 'info');
    } catch (err) {
      console.error('Failed to delete banking transaction:', err);
      showToast('Failed to delete transaction record.', 'error');
    }
  };

  const addAccountOpening = async (itemData: Omit<BankAccountOpening, 'id'>): Promise<BankAccountOpening> => {
    const newItem: BankAccountOpening = {
      ...itemData,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      let saved: BankAccountOpening;
      if (isTauriEnv()) {
        saved = await saveTauriBankAccountOpening(newItem);
      } else {
        saved = { ...newItem, id: Date.now() };
      }
      setAccountOpenings(prev => [saved, ...prev]);
      if (!isTauriEnv()) {
        try {
          localStorage.setItem('desklog_account_openings', JSON.stringify([saved, ...accountOpenings]));
        } catch {}
      }
      showToast(`Bank account opened for ${saved.customer_name} (${saved.scheme})`, 'success');

      // Audit trail
      const activityEvent = createActivityEvent({
        type: 'banking_transaction_added',
        title: `Bank Account Opened: ${saved.scheme}`,
        description: `Account: ${saved.account_number} | Customer: ${saved.customer_name} | CIF: ${saved.bank_customer_id || '-'}`,
        customerId: saved.customer_id,
        customerName: saved.customer_name,
        customerPhone: saved.mobile_number,
      });
      await saveTauriActivity(activityEvent);
      return saved;
    } catch (err) {
      console.error('Failed to save bank account opening:', err);
      showToast(`Failed to open account: ${err instanceof Error ? err.message : String(err)}`, 'error');
      throw err;
    }
  };

  const updateAccountOpening = async (id: number, updates: Partial<BankAccountOpening>) => {
    try {
      const existing = accountOpenings.find(a => a.id === id);
      if (existing) {
        const merged: BankAccountOpening = { ...existing, ...updates, id, updated_at: new Date().toISOString() };
        if (isTauriEnv()) {
          await updateTauriBankAccountOpening(merged);
        }
      }
      setAccountOpenings(prev => {
        const updated = prev.map(a => (a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a));
        if (!isTauriEnv()) {
          try {
            localStorage.setItem('desklog_account_openings', JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });
      showToast('Account record updated successfully.', 'success');
    } catch (err) {
      console.error('Failed to update bank account opening:', err);
      showToast('Failed to update account record.', 'error');
    }
  };

  const deleteAccountOpening = async (id: number) => {
    try {
      if (isTauriEnv()) {
        await deleteTauriBankAccountOpening(id);
      }
      setAccountOpenings(prev => {
        const filtered = prev.filter(a => a.id !== id);
        if (!isTauriEnv()) {
          try {
            localStorage.setItem('desklog_account_openings', JSON.stringify(filtered));
          } catch {}
        }
        return filtered;
      });
      showToast('Account record deleted.', 'info');
    } catch (err) {
      console.error('Failed to delete bank account opening:', err);
      showToast('Failed to delete account record.', 'error');
    }
  };

  const importAccountOpenings = async (items: BankAccountOpening[]): Promise<number> => {
    try {
      let count = 0;
      if (isTauriEnv()) {
        count = await importTauriBankAccountOpenings(items);
        await reloadAccountOpenings();
      } else {
        const existingAccts = new Set(accountOpenings.map(a => a.account_number));
        const newItems = items.filter(i => !existingAccts.has(i.account_number));
        count = newItems.length;
        const merged = [...accountOpenings, ...newItems];
        setAccountOpenings(merged);
        try {
          localStorage.setItem('desklog_account_openings', JSON.stringify(merged));
        } catch {}
      }
      showToast(`Imported ${count} bank account records from Excel.`, 'success');
      return count;
    } catch (err) {
      console.error('Failed to import bank accounts:', err);
      showToast('Failed to import accounts from Excel.', 'error');
      return 0;
    }
  };

  return (
    <BankingContext.Provider
      value={{
        bankingTransactions,
        addBankingTransaction,
        updateBankingTransaction,
        deleteBankingTransaction,
        reloadBankingTransactions,
        accountOpenings,
        addAccountOpening,
        updateAccountOpening,
        deleteAccountOpening,
        importAccountOpenings,
        reloadAccountOpenings,
        bankSchemes,
        addBankScheme,
        updateBankScheme,
        deleteBankScheme,
        reloadBankSchemes,
        paymentMethods,
        addPaymentMethod,
        updatePaymentMethod,
        deletePaymentMethod,
        reloadPaymentMethods,
        portals,
        addPortal,
        updatePortal,
        deletePortal,
        shopName,
        updateShopName,
      }}
    >
      {children}
    </BankingContext.Provider>
  );
};

export const useBanking = (): BankingContextType => {
  const context = useContext(BankingContext);
  if (!context) {
    console.warn('useBanking called outside BankingProvider');
    return {
      bankingTransactions: [],
      addBankingTransaction: async () => {},
      updateBankingTransaction: async () => {},
      deleteBankingTransaction: async () => {},
      reloadBankingTransactions: async () => {},
      accountOpenings: [],
      addAccountOpening: async () => ({} as BankAccountOpening),
      updateAccountOpening: async () => {},
      deleteAccountOpening: async () => {},
      importAccountOpenings: async () => 0,
      reloadAccountOpenings: async () => {},
      bankSchemes: [],
      addBankScheme: async () => {},
      updateBankScheme: async () => {},
      deleteBankScheme: async () => {},
      reloadBankSchemes: async () => {},
      paymentMethods: [],
      addPaymentMethod: async () => {},
      updatePaymentMethod: async () => {},
      deletePaymentMethod: async () => {},
      reloadPaymentMethods: async () => {},
      portals: [],
      addPortal: async () => {},
      updatePortal: async () => {},
      deletePortal: async () => {},
      shopName: 'IRSHAD COMMUNICATION',
      updateShopName: async () => {},
    };
  }
  return context;
};
