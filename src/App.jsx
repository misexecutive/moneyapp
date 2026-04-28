import { useMemo, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Menu, RefreshCcw } from 'lucide-react';
import ProtectedRoute from './auth/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddEntry from './pages/AddEntry';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import Export from './pages/Export';
import Settings from './pages/Settings';
import BottomNav from './components/BottomNav';
import SideDrawer from './components/SideDrawer';
import { useAuth } from './auth/AuthProvider';
import { AppDataProvider, useAppData } from './context/AppDataProvider';

function getTitle(pathname) {
  if (pathname.startsWith('/add-entry')) return 'Add Entry';
  if (pathname.startsWith('/transactions')) return 'Transactions';
  if (pathname.startsWith('/categories')) return 'Categories';
  if (pathname.startsWith('/export')) return 'Export';
  if (pathname.startsWith('/settings')) return 'Settings';
  return 'Dashboard';
}

function AppShell() {
  const location = useLocation();
  const auth = useAuth();
  const { refresh, loading, meta } = useAppData();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const title = useMemo(() => getTitle(location.pathname), [location.pathname]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-app">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(37,99,235,0.18),transparent_40%),radial-gradient(circle_at_90%_0%,rgba(14,165,233,0.14),transparent_35%),linear-gradient(180deg,#f6faff,#eef4ff)]" />

      <header className="sticky top-0 z-20 border-b border-blue-100/70 bg-white/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="rounded-xl bg-blue-50 p-2 text-blue-700"
          >
            <Menu size={16} />
          </button>
          <div className="min-w-0 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-500">Money Manager</p>
            <h1 className="truncate text-sm font-bold text-slate-900">{title}</h1>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={refresh}
            className="rounded-xl bg-blue-50 p-2 text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Refresh data"
          >
            <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-3 pb-24 pt-3">
        {meta.mock ? (
          <div className="mb-3 rounded-2xl bg-amber-50 px-3 py-2 text-center text-[11px] font-medium text-amber-700">
            Mock mode active. Configure `VITE_API_BASE` for live Google Sheets data.
          </div>
        ) : null}
        <Outlet />
      </main>

      <BottomNav />
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogout={auth.logout}
        user={auth.user}
      />
    </div>
  );
}

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppDataProvider>
        <AppShell />
      </AppDataProvider>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="add-entry" element={<AddEntry />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="categories" element={<Categories />} />
        <Route path="export" element={<Export />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

