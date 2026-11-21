import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { BankingTransaction } from '../types';
import {
  fetchTauriBankingTransactions,
  saveTauriBankingTransaction,
  updateTauriBankingTransaction,
  deleteTauriBankingTransaction,
  saveTauriActivity,
  isTauriEnv,
} from '../api/tauri';
import { createActivityEvent } from '../services/activityService';
import { formatRupees } from '../utils/currencyUtils';
import { useUI } from './UIContext';

interface BankingContextType {
  bankingTransactions: BankingTransaction[];
  addBankingTransaction: (tx: Omit<BankingTransaction, 'id' | 'is_deleted'>) => Promise<void>;
  updateBankingTransaction: (id: number, updates: Partial<BankingTransaction>) => Promise<void>;
  deleteBankingTransaction: (id: number) => Promise<void>;
  reloadBankingTransactions: () => Promise<void>;
}

const BankingContext = createContext<BankingContextType | undefined>(undefined);

export const BankingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bankingTransactions, setBankingTransactions] = useState<BankingTransaction[]>([]);
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

  useEffect(() => {
    reloadBankingTransactions();
  }, []);

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
      Sentry.captureException(err, { tags: { action: 'add_banking_transaction' }, extra: { txType: newTx.transaction_type, amount: newTx.amount } });
      showToast(`Failed to log transaction: ${err instanceof Error ? err.message : String(err)}`, 'error');
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
        const updated = prev.map(tx => (tx.id === id ? { ...tx, ...updates } : tx));
        if (!isTauriEnv()) {
          try {
            localStorage.setItem('desklog_banking_records', JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });
      showToast('Transaction updated successfully.', 'success');

      // Audit trail: log every banking transaction update
      if (existing) {
        const activityEvent = createActivityEvent({
          type: 'banking_transaction_updated',
          title: `${existing.transaction_type} transaction #${id} updated`,
          description: `Customer: ${existing.customer_name || 'Walk-in'} | Amount: ${formatRupees(updates.amount ?? existing.amount)}`,
          customerId: (updates.customer_id ?? existing.customer_id) !== 'cust-general'
            ? (updates.customer_id ?? existing.customer_id)
            : undefined,
          customerName: updates.customer_name ?? existing.customer_name,
          customerPhone: updates.customer_mobile ?? existing.customer_mobile,
        });
        await saveTauriActivity(activityEvent);
      }
    } catch (err) {
      console.error('Failed to update banking transaction:', err);
      showToast('Failed to update transaction.', 'error');
    }
  };

  const deleteBankingTransaction = async (id: number) => {
    const target = bankingTransactions.find(tx => tx.id === id);
    try {
      await deleteTauriBankingTransaction(id);
      setBankingTransactions(prev => {
        const filtered = prev.filter(tx => tx.id !== id);
        if (!isTauriEnv()) {
          try {
            localStorage.setItem('desklog_banking_records', JSON.stringify(filtered));
          } catch {}
        }
        return filtered;
      });
      showToast('Transaction removed.', 'info');

      // Audit trail: log every banking transaction deletion
      if (target) {
        const activityEvent = createActivityEvent({
          type: 'banking_transaction_deleted',
          title: `${target.transaction_type} transaction #${id} deleted`,
          description: `Customer: ${target.customer_name || 'Walk-in'} | Amount: ${formatRupees(target.amount)} | Portal: ${target.company_name || '-'}`,
          customerId: target.customer_id !== 'cust-general' ? target.customer_id : undefined,
          customerName: target.customer_name,
          customerPhone: target.customer_mobile,
        });
        await saveTauriActivity(activityEvent);
      }
    } catch (err) {
      console.error('Failed to delete banking transaction:', err);
      Sentry.captureException(err, { tags: { action: 'delete_banking_transaction' }, extra: { transactionId: id } });
      showToast(`Failed to delete transaction: ${err instanceof Error ? err.message : String(err)}`, 'error');
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
    };
  }
  return context;
};
