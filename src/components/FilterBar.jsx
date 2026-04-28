import { Search } from 'lucide-react';

const QUICK_RANGES = [
  { value: '', label: 'Custom' },
  { value: 'current-month', label: 'Current Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'last-3-months', label: 'Last 3 Months' },
];

export default function FilterBar({ filters, onChange, categories = [] }) {
  return (
    <section className="glass-card space-y-2 rounded-3xl p-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="field-label">
          Quick range
          <select
            className="input-compact"
            value={filters.quickRange}
            onChange={(event) => onChange({ quickRange: event.target.value })}
          >
            {QUICK_RANGES.map((item) => (
              <option key={item.value || 'custom'} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field-label">
          Type
          <select
            className="input-compact"
            value={filters.type}
            onChange={(event) => onChange({ type: event.target.value })}
          >
            <option value="All">All</option>
            <option value="Money In">Money In</option>
            <option value="Money Out">Money Out</option>
          </select>
        </label>

        <label className="field-label">
          From
          <input
            type="date"
            className="input-compact"
            value={filters.dateFrom}
            onChange={(event) => onChange({ dateFrom: event.target.value, quickRange: '' })}
          />
        </label>

        <label className="field-label">
          To
          <input
            type="date"
            className="input-compact"
            value={filters.dateTo}
            onChange={(event) => onChange({ dateTo: event.target.value, quickRange: '' })}
          />
        </label>

        <label className="field-label">
          Category
          <select
            className="input-compact"
            value={filters.category}
            onChange={(event) => onChange({ category: event.target.value })}
          >
            <option value="All">All categories</option>
            {categories.map((category) => (
              <option key={`${category.type}-${category.name}`} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field-label">
          Min amount
          <input
            type="number"
            className="input-compact"
            value={filters.minAmount}
            onChange={(event) => onChange({ minAmount: event.target.value })}
            placeholder="0"
          />
        </label>

        <label className="field-label">
          Max amount
          <input
            type="number"
            className="input-compact"
            value={filters.maxAmount}
            onChange={(event) => onChange({ maxAmount: event.target.value })}
            placeholder="100000"
          />
        </label>

        <label className="field-label col-span-2">
          Search description
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="search"
              className="input-compact pl-8"
              value={filters.search}
              onChange={(event) => onChange({ search: event.target.value })}
              placeholder="Search by notes/category"
            />
          </div>
        </label>
      </div>
    </section>
  );
}

