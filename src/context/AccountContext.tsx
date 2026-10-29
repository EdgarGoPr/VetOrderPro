import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { db } from '../services/db';
import type { Account } from '../types';
import { useAuth } from './AuthContext';

interface AccountContextType {
  accounts: Account[];
  activeAccount: Account | null;
  loading: boolean;
  setActiveAccount: (account: Account) => void;
  refreshAccounts: () => Promise<void>;
  createAccount: (data: Omit<Account, 'id' | 'createdAt'>) => Promise<Account>;
  updateAccount: (id: string, data: Partial<Account>) => Promise<Account>;
  deleteAccount: (id: string) => Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccount, setActiveAccountState] = useState<Account | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadAccounts = useCallback(async () => {
    if (!user) {
      setAccounts([]);
      setActiveAccountState(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const visible = await api.accounts.getVisibleAccounts(user);
      setAccounts(visible);

      // Check stored active account
      const savedId = db.getActiveAccountId();
      const matched = visible.find(a => a.id === savedId);

      if (matched) {
        setActiveAccountState(matched);
      } else if (visible.length > 0) {
        // Fallback to first available account
        setActiveAccountState(visible[0]);
        db.setActiveAccountId(visible[0].id);
      } else {
        setActiveAccountState(null);
      }
    } catch (err) {
      console.error('Error loading accounts:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const setActiveAccount = (account: Account) => {
    setActiveAccountState(account);
    db.setActiveAccountId(account.id);
  };

  const refreshAccounts = async () => {
    await loadAccounts();
  };

  const createAccount = async (data: Omit<Account, 'id' | 'createdAt'>): Promise<Account> => {
    const created = await api.accounts.create(data);
    await loadAccounts();
    setActiveAccount(created);
    return created;
  };

  const updateAccount = async (id: string, data: Partial<Account>): Promise<Account> => {
    const updated = await api.accounts.update(id, data);
    await loadAccounts();
    if (activeAccount?.id === id) {
      setActiveAccount(updated);
    }
    return updated;
  };

  const deleteAccount = async (id: string): Promise<void> => {
    await api.accounts.delete(id);
    await loadAccounts();
  };

  const value: AccountContextType = {
    accounts,
    activeAccount,
    loading,
    setActiveAccount,
    refreshAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  };

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
};

export const useAccount = (): AccountContextType => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
};
