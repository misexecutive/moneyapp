import { CalendarDays, Pencil, Trash2 } from 'lucide-react';
import CategoryIcon from './CategoryIcon';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function TransactionCard({ transaction, categoryMeta, onEdit, onDelete }) {
  const isIncome = transaction.type === 'Money In';

  return (
    <article className="glass-card rounded-2xl p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className={`mt-0.5 rounded-xl p-2 ${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            <CategoryIcon icon={categoryMeta?.icon} size={15} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{transaction.category}</p>
            <p className="truncate text-[11px] text-slate-500">{transaction.shortDescription || 'No description'}</p>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
              <CalendarDays size={11} />
              {formatDate(transaction.date || transaction.timestamp)}
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className={`text-sm font-bold ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount).replace('?', '? ')}
          </p>
          <span
            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {transaction.type}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onEdit(transaction)}
          className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          <Pencil size={12} /> Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(transaction)}
          className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </article>
  );
}

