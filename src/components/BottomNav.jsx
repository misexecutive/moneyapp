import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ListOrdered, PlusCircle } from 'lucide-react';
import clsx from 'clsx';

const ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/add-entry',
    label: 'Add Entry',
    icon: PlusCircle,
  },
  {
    to: '/transactions',
    label: 'Transactions',
    icon: ListOrdered,
  },
];

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-3xl border-t border-blue-100/70 bg-white/90 px-4 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pt-2 backdrop-blur-xl">
      <div className="mx-auto grid max-w-xl grid-cols-3 gap-2">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[10px] font-semibold transition',
                  isActive
                    ? 'bg-blue-600 text-white shadow-soft'
                    : 'bg-blue-50/70 text-blue-700 hover:bg-blue-100/80',
                )
              }
            >
              <Icon size={16} className="mb-1" />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

