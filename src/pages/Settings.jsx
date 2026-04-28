import { LogOut, ShieldCheck, UserCircle2, Wifi } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { useAppData } from '../context/AppDataProvider';

export default function Settings() {
  const { user, logout } = useAuth();
  const { meta } = useAppData();

  return (
    <div className="space-y-3">
      <section className="glass-card rounded-3xl p-4">
        <h1 className="text-base font-semibold text-slate-900">Settings</h1>

        <div className="mt-3 space-y-2">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <UserCircle2 size={12} /> Account
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{user?.name || '--'}</p>
            <p className="text-xs text-slate-600">{user?.email || '--'}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Wifi size={12} /> Data Source
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{meta.mock ? 'Mock fallback mode' : 'Google Apps Script API'}</p>
            <p className="text-xs text-slate-600">{meta.mock ? 'Set VITE_API_BASE to your Apps Script URL to use live data.' : 'Live backend connected.'}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <ShieldCheck size={12} /> Security
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Session is persisted in localStorage and re-verified against your backend on app load.
            </p>
          </div>
        </div>

        <button type="button" onClick={logout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          <LogOut size={13} /> Logout
        </button>
      </section>
    </div>
  );
}

