import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useAppData } from '../context/AppDataProvider';
import { TRANSACTION_TYPES, getCategoriesByType, getSubCategories } from '../utils/categories';
import { toISODate } from '../utils/formatters';
import SuccessPopup from '../components/SuccessPopup';

const DEFAULT_FORM = {
  date: toISODate(new Date()),
  type: TRANSACTION_TYPES.OUT,
  category: '',
  subCategory: '',
  amount: '',
  shortDescription: '',
};

export default function AddEntry() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { categories, addTransaction } = useAppData();

  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [createdTx, setCreatedTx] = useState(null);

  const categoryOptions = useMemo(() => getCategoriesByType(categories, form.type), [categories, form.type]);

  const subCategoryOptions = useMemo(
    () => getSubCategories(categories, form.type, form.category),
    [categories, form.category, form.type],
  );

  useEffect(() => {
    if (!form.category && categoryOptions.length) {
      setForm((prev) => ({ ...prev, category: categoryOptions[0].name }));
    }
  }, [categoryOptions, form.category]);

  useEffect(() => {
    if (form.category && !subCategoryOptions.includes(form.subCategory)) {
      setForm((prev) => ({
        ...prev,
        subCategory: subCategoryOptions[0] || '',
      }));
    }
  }, [form.category, form.subCategory, subCategoryOptions]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.date || !form.category || !form.amount) {
      setError('Date, category and amount are required.');
      return;
    }

    const payload = {
      transactionId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      date: form.date,
      type: form.type,
      category: form.category,
      subCategory: form.subCategory,
      amount: Number(form.amount),
      shortDescription: form.shortDescription.trim(),
      tag: form.type === TRANSACTION_TYPES.IN ? 'Receivable' : 'Payable',
      createdByEmail: user?.email,
      createdByName: user?.name,
      updatedAt: new Date().toISOString(),
    };

    setSubmitting(true);
    const result = await addTransaction(payload);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error || 'Failed to add transaction.');
      return;
    }

    setError('');
    setCreatedTx(payload);
    setSuccessOpen(true);
    setForm((prev) => ({
      ...DEFAULT_FORM,
      type: prev.type,
      category: '',
      date: toISODate(new Date()),
    }));

    window.setTimeout(() => setSuccessOpen(false), 2000);
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-3"
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-slate-900">Quick Entry</h1>
            <p className="text-[11px] text-slate-500">Tiny controls, fast flow.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/categories')}
            className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700"
          >
            <Plus size={12} /> Add Category
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, type: TRANSACTION_TYPES.IN, category: '', subCategory: '' }))}
              className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                form.type === TRANSACTION_TYPES.IN
                  ? 'bg-emerald-600 text-white shadow-soft'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Money In
            </button>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, type: TRANSACTION_TYPES.OUT, category: '', subCategory: '' }))}
              className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                form.type === TRANSACTION_TYPES.OUT
                  ? 'bg-rose-600 text-white shadow-soft'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Money Out
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="field-label">
              Date
              <input
                type="date"
                className="input-compact"
                value={form.date}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              />
            </label>
            <label className="field-label">
              Amount
              <input
                type="number"
                className="input-compact"
                placeholder="0"
                value={form.amount}
                onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
              />
            </label>

            <label className="field-label">
              Category
              <select
                className="input-compact"
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              >
                {!categoryOptions.length ? <option value="">No categories</option> : null}
                {categoryOptions.map((category) => (
                  <option key={`${category.type}-${category.name}`} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Sub-category
              <select
                className="input-compact"
                value={form.subCategory}
                onChange={(event) => setForm((prev) => ({ ...prev, subCategory: event.target.value }))}
              >
                <option value="">None</option>
                {subCategoryOptions.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field-label">
            Short Description
            <input
              className="input-compact"
              maxLength={80}
              placeholder="eg. UPI payment to store"
              value={form.shortDescription}
              onChange={(event) => setForm((prev) => ({ ...prev, shortDescription: event.target.value }))}
            />
          </label>

          {error ? <p className="text-xs text-rose-600">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Sparkles size={14} />
            {submitting ? 'Saving...' : 'Save Entry'}
          </button>
        </form>
      </motion.section>

      <SuccessPopup open={successOpen} transaction={createdTx} onClose={() => setSuccessOpen(false)} />
    </>
  );
}

