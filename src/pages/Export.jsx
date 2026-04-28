import { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { useAppData } from '../context/AppDataProvider';
import { useAuth } from '../auth/AuthProvider';

export default function Export() {
  const { user } = useAuth();
  const { exportTransactions, transactions } = useAppData();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    setStatus('Preparing CSV...');

    const result = await exportTransactions();
    setBusy(false);

    if (!result.ok) {
      setStatus(result.error || 'Failed to export');
      return;
    }

    const csv = result.data.csv;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `money-manager-transactions-${today}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setStatus(`Exported ${result.data.count || transactions.length} rows.`);
  };

  return (
    <div className="space-y-3">
      <section className="glass-card rounded-3xl p-4">
        <div className="inline-flex rounded-2xl bg-blue-100 p-2 text-blue-700">
          <FileSpreadsheet size={18} />
        </div>
        <h1 className="mt-3 text-lg font-semibold text-slate-900">Export All Transactions</h1>
        <p className="mt-1 text-xs text-slate-600">
          Download your full ledger as CSV with ID, date, type, tag, category, sub-category, amount, description, creator and timestamp.
        </p>

        <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-[11px] text-slate-600">
          <p><span className="font-semibold">User:</span> {user?.email || '--'}</p>
          <p className="mt-1"><span className="font-semibold">Rows ready:</span> {transactions.length}</p>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={handleExport}
          className="btn-primary mt-4 w-full justify-center disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Download size={14} />
          {busy ? 'Exporting...' : 'Export All Transactions'}
        </button>

        {status ? <p className="mt-3 text-xs text-slate-600">{status}</p> : null}
      </section>
    </div>
  );
}

