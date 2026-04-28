import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  addCategory as apiAddCategory,
  addTransaction as apiAddTransaction,
  createCsvFromTransactions,
  deleteTransaction as apiDeleteTransaction,
  exportTransactions as apiExportTransactions,
  getBootstrapData,
  isUsingMockApi,
  updateTransaction as apiUpdateTransaction,
} from '../api/client';
import { mergeCategories } from '../utils/categories';
import { useAuth } from '../auth/AuthProvider';

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const { isAuthenticated, user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({ mock: isUsingMockApi() });

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !user?.email) {
      setLoading(false);
      setTransactions([]);
      setCategories([]);
      return;
    }

    setLoading(true);
    const result = await getBootstrapData(user.email, token);

    if (!result.ok) {
      setError(result.error || 'Failed to load transactions');
      setLoading(false);
      return;
    }

    const data = result.data || {};
    setTransactions(
      [...(data.transactions || [])].sort(
        (a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp),
      ),
    );
    setCategories(mergeCategories(data.categories || []));
    setMeta({
      mock: Boolean(data.meta?.mock || isUsingMockApi()),
    });
    setError('');
    setLoading(false);
  }, [isAuthenticated, token, user?.email]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTransaction = useCallback(
    async (payload) => {
      const result = await apiAddTransaction(payload, token);
      if (!result.ok) return result;

      const created = result.data;
      setTransactions((prev) =>
        [created, ...prev].sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp)),
      );
      return result;
    },
    [token],
  );

  const updateTransaction = useCallback(
    async (payload) => {
      const result = await apiUpdateTransaction(payload, token);
      if (!result.ok) return result;

      setTransactions((prev) =>
        prev
          .map((item) => (item.transactionId === payload.transactionId ? { ...item, ...result.data } : item))
          .sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp)),
      );
      return result;
    },
    [token],
  );

  const deleteTransaction = useCallback(
    async (transactionId) => {
      const result = await apiDeleteTransaction({ transactionId }, token);
      if (!result.ok) return result;
      setTransactions((prev) => prev.filter((item) => item.transactionId !== transactionId));
      return result;
    },
    [token],
  );

  const addCategory = useCallback(
    async (payload) => {
      const result = await apiAddCategory(payload, token);
      if (!result.ok) return result;

      setCategories((prev) => mergeCategories([...prev, result.data]));
      return result;
    },
    [token],
  );

  const exportTransactions = useCallback(async () => {
    const result = await apiExportTransactions(user?.email, token);
    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
      };
    }

    const data = result.data || {};
    const csv = typeof data === 'string' ? data : data.csv;

    return {
      ok: true,
      data: {
        csv: csv || createCsvFromTransactions(transactions),
        count: data.count ?? transactions.length,
      },
    };
  }, [token, transactions, user?.email]);

  const value = useMemo(
    () => ({
      loading,
      error,
      transactions,
      categories,
      meta,
      refresh,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      exportTransactions,
    }),
    [addCategory, addTransaction, categories, deleteTransaction, error, exportTransactions, loading, meta, refresh, transactions, updateTransaction],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used inside AppDataProvider');
  }
  return context;
}

