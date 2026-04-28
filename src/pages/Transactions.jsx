import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleAlert } from 'lucide-react';
import { useAppData } from '../context/AppDataProvider';
import { applyTransactionFilters } from '../utils/analytics';
import FilterBar from '../components/FilterBar';
import TransactionCard from '../components/TransactionCard';
import { getCategoriesByType, getSubCategories } from '../utils/categories';

const INITIAL_FILTERS = {
  quickRange: 'current-month',
  dateFrom: '',
  dateTo: '',
  type: 'All',
  category: 'All',
  search: '',
  minAmount: '',
  maxAmount: '',
};

export default function Transactions() {
  const { transactions, categories, updateTransaction, deleteTransaction } = useAppData();
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const categoryMap = useMemo(() => new Map(categories.map((item) => [item.name, item])), [categories]);

  const filteredTransactions = useMemo(
    () => applyTransactionFilters(transactions, filters),
    [filters, transactions],
  );

  const editCategories = useMemo(
    () => getCategoriesByType(categories, editing?.type || 'Money Out'),
    [categories, editing?.type],
  );

  const editSubCategories = useMemo(
    () => getSubCategories(categories, editing?.type || 'Money Out', editing?.category),
    [categories, editing?.category, editing?.type],
  );

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editing) return;

    setProcessing(true);
    const result = await updateTransaction({
      ...editing,
      amount: Number(editing.amount),
      updatedAt: new Date().toISOString(),
    });
    setProcessing(false);

    if (!result.ok) {
      setError(result.error || 'Failed to update transaction');
      return;
    }

    setEditing(null);
    setError('');
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setProcessing(true);
    const result = await deleteTransaction(deleting.transactionId);
    setProcessing(false);

    if (!result.ok) {
      setError(result.error || 'Failed to delete transaction');
      return;
    }

    setDeleting(null);
    setError('');
  };

  return (
    <div className="space-y-3">
      <FilterBar filters={filters} onChange={(changes) => setFilters((prev) => ({ ...prev, ...changes }))} categories={categories} />

      {error ? <p className="rounded-2xl bg-rose-50 p-3 text-xs text-rose-600">{error}</p> : null}

      <section className="space-y-2">
        {filteredTransactions.length ? (
          filteredTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.transactionId}
              transaction={transaction}
              categoryMeta={categoryMap.get(transaction.category)}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          ))
        ) : (
          <div className="rounded-3xl bg-white/70 p-5 text-center text-sm text-slate-500">
            No transactions match your filters.
          </div>
        )}
      </section>

      <AnimatePresence>
        {editing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/30 p-4"
          >
            <motion.form
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              onSubmit={handleUpdate}
              className="mx-auto mt-20 w-full max-w-md rounded-3xl bg-white p-4 shadow-2xl"
            >
              <h3 className="text-base font-semibold text-slate-900">Edit Transaction</h3>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="field-label">
                  Date
                  <input
                    type="date"
                    className="input-compact"
                    value={editing.date}
                    onChange={(event) => setEditing((prev) => ({ ...prev, date: event.target.value }))}
                  />
                </label>

                <label className="field-label">
                  Type
                  <select
                    className="input-compact"
                    value={editing.type}
                    onChange={(event) =>
                      setEditing((prev) => ({
                        ...prev,
                        type: event.target.value,
                        category: '',
                        subCategory: '',
                      }))
                    }
                  >
                    <option value="Money In">Money In</option>
                    <option value="Money Out">Money Out</option>
                  </select>
                </label>

                <label className="field-label">
                  Category
                  <select
                    className="input-compact"
                    value={editing.category}
                    onChange={(event) => setEditing((prev) => ({ ...prev, category: event.target.value, subCategory: '' }))}
                  >
                    {editCategories.map((item) => (
                      <option key={`${item.type}-${item.name}`} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field-label">
                  Sub-category
                  <select
                    className="input-compact"
                    value={editing.subCategory || ''}
                    onChange={(event) => setEditing((prev) => ({ ...prev, subCategory: event.target.value }))}
                  >
                    <option value="">None</option>
                    {editSubCategories.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field-label">
                  Amount
                  <input
                    type="number"
                    className="input-compact"
                    value={editing.amount}
                    onChange={(event) => setEditing((prev) => ({ ...prev, amount: event.target.value }))}
                  />
                </label>

                <label className="field-label col-span-2">
                  Description
                  <input
                    className="input-compact"
                    value={editing.shortDescription || ''}
                    onChange={(event) => setEditing((prev) => ({ ...prev, shortDescription: event.target.value }))}
                  />
                </label>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="rounded-2xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
                >
                  {processing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {deleting ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-xs rounded-3xl bg-white p-4 shadow-2xl"
            >
              <div className="mb-2 inline-flex rounded-full bg-rose-100 p-2 text-rose-700">
                <CircleAlert size={18} />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Delete transaction?</h3>
              <p className="mt-1 text-xs text-slate-500">This action cannot be undone.</p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeleting(null)}
                  className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={processing}
                  className="rounded-2xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white"
                >
                  {processing ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

