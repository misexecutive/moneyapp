import { AnimatePresence, motion } from 'framer-motion';
import {
  Download,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  PlusCircle,
  Settings,
  Shapes,
  X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

const ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/add-entry', label: 'Add Entry', icon: PlusCircle },
  { to: '/transactions', label: 'Transactions', icon: ListOrdered },
  { to: '/categories', label: 'Categories', icon: Shapes },
  { to: '/export', label: 'Export', icon: Download },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function SideDrawer({ open, onClose, onLogout, user }) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/35"
          />
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="fixed left-0 top-0 z-50 h-full w-[84%] max-w-xs border-r border-blue-100 bg-white/95 p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-blue-500">Money Manager</p>
                <h3 className="text-base font-bold text-slate-900">Quick Navigation</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-6 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 p-4 text-white shadow-soft">
              <p className="truncate text-sm font-semibold">{user?.name || 'Secure user'}</p>
              <p className="truncate text-[11px] text-blue-100">{user?.email || 'No email'}</p>
            </div>

            <nav className="space-y-2">
              {ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition',
                        isActive ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-blue-50',
                      )
                    }
                  >
                    <Icon size={16} />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
            >
              <LogOut size={16} />
              Logout
            </button>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

