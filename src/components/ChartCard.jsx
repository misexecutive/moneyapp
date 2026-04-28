import { motion } from 'framer-motion';

export default function ChartCard({ title, rightSlot, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-3.5"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {rightSlot}
      </div>
      {children}
    </motion.section>
  );
}

