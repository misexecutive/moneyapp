import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function StatCard({ title, value, subtitle, icon: Icon, tone = 'blue' }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'glass-card rounded-3xl p-3.5',
        tone === 'green' && 'bg-gradient-to-br from-emerald-50/90 to-white',
        tone === 'red' && 'bg-gradient-to-br from-red-50/90 to-white',
        tone === 'indigo' && 'bg-gradient-to-br from-indigo-50/90 to-white',
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
        {Icon ? (
          <span className="inline-flex rounded-xl bg-white/80 p-1.5 text-blue-600 shadow-sm">
            <Icon size={14} />
          </span>
        ) : null}
      </div>
      <h3 className="truncate text-lg font-bold tracking-tight text-slate-900">{value}</h3>
      {subtitle ? <p className="mt-1 text-[11px] text-slate-500">{subtitle}</p> : null}
    </motion.article>
  );
}

