import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function SuccessPopup({ open, onClose, transaction }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.86, y: 22 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="w-full max-w-xs rounded-3xl bg-white p-5 text-center shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 18 }}
              className="mx-auto mb-3 inline-flex rounded-full bg-emerald-100 p-2 text-emerald-600"
            >
              <CheckCircle2 size={34} />
            </motion.div>
            <h3 className="text-lg font-bold text-slate-900">Entry Added</h3>
            <p className="mt-1 text-xl font-extrabold text-blue-700">{formatCurrency(transaction?.amount || 0)}</p>
            <p className="mt-1 text-sm font-medium text-slate-600">{transaction?.category || '-'}</p>
            <span
              className={`mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                transaction?.type === 'Money In' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {transaction?.type || '--'}
            </span>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

