import { useMemo, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { useAppData } from '../context/AppDataProvider';
import { PRESET_ICON_OPTIONS, TRANSACTION_TYPES, getCategoriesByType } from '../utils/categories';
import CategoryIcon from '../components/CategoryIcon';

const INITIAL_FORM = {
  name: '',
  type: TRANSACTION_TYPES.OUT,
  icon: 'circle-dollar-sign',
  subCategories: '',
};

export default function Categories() {
  const { categories, addCategory } = useAppData();
  const [form, setForm] = useState(INITIAL_FORM);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const grouped = useMemo(
    () => ({
      [TRANSACTION_TYPES.OUT]: getCategoriesByType(categories, TRANSACTION_TYPES.OUT),
      [TRANSACTION_TYPES.IN]: getCategoriesByType(categories, TRANSACTION_TYPES.IN),
    }),
    [categories],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setMessage('Category name is required.');
      return;
    }

    setSaving(true);
    const result = await addCategory({
      name: form.name.trim(),
      type: form.type,
      icon: form.icon,
      subCategories: form.subCategories
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    });
    setSaving(false);

    if (!result.ok) {
      setMessage(result.error || 'Failed to add category.');
      return;
    }

    setMessage('Category saved.');
    setForm((prev) => ({ ...INITIAL_FORM, type: prev.type }));
  };

  return (
    <div className="space-y-3">
      <section className="glass-card rounded-3xl p-3">
        <h1 className="text-sm font-semibold text-slate-900">Add New Category</h1>
        <p className="text-[11px] text-slate-500">Choose type and optional sub-categories.</p>

        <form onSubmit={handleSubmit} className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <label className="field-label">
              Category Name
              <input
                className="input-compact"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="eg. Insurance"
              />
            </label>

            <label className="field-label">
              Type
              <select
                className="input-compact"
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
              >
                <option value={TRANSACTION_TYPES.OUT}>{TRANSACTION_TYPES.OUT}</option>
                <option value={TRANSACTION_TYPES.IN}>{TRANSACTION_TYPES.IN}</option>
              </select>
            </label>

            <label className="field-label">
              Icon
              <select
                className="input-compact"
                value={form.icon}
                onChange={(event) => setForm((prev) => ({ ...prev, icon: event.target.value }))}
              >
                {PRESET_ICON_OPTIONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-label">
              Sub-categories
              <input
                className="input-compact"
                value={form.subCategories}
                onChange={(event) => setForm((prev) => ({ ...prev, subCategories: event.target.value }))}
                placeholder="comma, separated"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Plus size={14} />
            {saving ? 'Saving...' : 'Create Category'}
          </button>

          {message ? <p className="text-xs text-slate-600">{message}</p> : null}
        </form>
      </section>

      <section className="space-y-3">
        {[TRANSACTION_TYPES.OUT, TRANSACTION_TYPES.IN].map((type) => (
          <div key={type} className="glass-card rounded-3xl p-3">
            <h2 className="text-sm font-semibold text-slate-900">{type}</h2>
            <div className="mt-2 grid grid-cols-1 gap-2">
              {grouped[type].map((category) => (
                <div key={`${category.type}-${category.name}`} className="rounded-2xl bg-white/80 p-2.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <span className="rounded-xl bg-blue-100 p-1.5 text-blue-700">
                      <CategoryIcon icon={category.icon} size={13} />
                    </span>
                    {category.name}
                  </div>
                  {category.subCategories?.length ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {category.subCategories.map((sub) => (
                        <span key={sub} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                          <Check size={10} /> {sub}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-400">No sub-categories</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

