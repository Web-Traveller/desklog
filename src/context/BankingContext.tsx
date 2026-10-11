import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { BankingTransaction } from '../types';
import {
  fetchTauriBankingTransactions,
  saveTauriBankingTransaction,
  deleteTauriBankingTransaction,
} from '../api/tauri';
import { useUI } from './UIContext';

interface BankingContextType {
  bankingTransactions: BankingTransaction[];
  addBankingTransaction: (tx: Omit<BankingTransaction, 'id' | 'is_deleted'>) => Promise<void>;
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
    } else {
      setBankingTransactions(prev => prev || []);
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
      const saved = await saveTauriBankingTransaction(newTx);
      setBankingTransactions(prev => [saved, ...prev]);
      showToast('Banking transaction logged successfully.', 'success');
    } catch (err) {
      console.error('Failed to log banking transaction:', err);
      Sentry.captureException(err, { tags: { action: 'add_banking_transaction' }, extra: { txType: newTx.transaction_type, amount: newTx.amount } });
      showToast(`Failed to log banking transaction: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const deleteBankingTransaction = async (id: number) => {
    try {
      await deleteTauriBankingTransaction(id);
      setBankingTransactions(prev => prev.filter(tx => tx.id !== id));
      showToast('Banking transaction removed.', 'info');
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
        deleteBankingTransaction,
        reloadBankingTransactions,
      }}
    >
      {children}
    </BankingContext.Provider>
  );
};

export const useBanking = () => {
  const context = useContext(BankingContext);
  if (!context) {
    console.warn('useBanking called outside BankingProvider');
    return {
      bankingTransactions: [],
      addBankingTransaction: async () => {},
      deleteBankingTransaction: async () => {},
      reloadBankingTransactions: async () => {},
    };
  }
  return context;
};
