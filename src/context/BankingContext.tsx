import React, { createContext, useContext, useState, useEffect } from 'react';
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
      console.warn('[BankingContext] Failed to load banking transactions');
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
    const saved = await saveTauriBankingTransaction(newTx);
    if (saved) {
      setBankingTransactions(prev => [saved, ...prev]);
      showToast('Banking transaction logged successfully.', 'success');
    }
  };

  const deleteBankingTransaction = async (id: number) => {
    const success = await deleteTauriBankingTransaction(id);
    if (success) {
      setBankingTransactions(prev => prev.filter(tx => tx.id !== id));
      showToast('Banking transaction removed.', 'info');
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
    throw new Error('useBanking must be used within a BankingProvider');
  }
  return context;
};
