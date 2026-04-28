import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Coins,
  PiggyBank,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import { useAppData } from '../context/AppDataProvider';
import { formatCurrency, formatDate, formatMonthLabel } from '../utils/formatters';
import { getDashboardAnalytics } from '../utils/analytics';
import CategoryIcon from '../components/CategoryIcon';

const PIE_COLORS = ['#2563eb', '#0ea5e9', '#3b82f6', '#38bdf8', '#1d4ed8', '#7dd3fc'];

export default function Dashboard() {
  const { loading, error, transactions, categories } = useAppData();
  const analytics = getDashboardAnalytics(transactions);

  const categoryByName = new Map(categories.map((item) => [item.name, item]));

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array.from({ length: 5 }).keys()].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-3xl bg-white/70" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? <p className="rounded-2xl bg-rose-50 p-3 text-xs text-rose-600">{error}</p> : null}

      <section className="grid grid-cols-2 gap-2">
        <StatCard title="Total Money In" value={formatCurrency(analytics.summary.totalIn)} icon={ArrowUpCircle} tone="green" />
        <StatCard title="Total Money Out" value={formatCurrency(analytics.summary.totalOut)} icon={ArrowDownCircle} tone="red" />
        <StatCard title="Net Balance" value={formatCurrency(analytics.summary.netBalance)} icon={Coins} tone="indigo" />
        <StatCard
          title="Current Month Expense"
          value={formatCurrency(analytics.summary.currentMonthExpense)}
          icon={TrendingDown}
          tone="red"
        />
        <StatCard
          title="Current Month Income"
          value={formatCurrency(analytics.summary.currentMonthIncome)}
          icon={TrendingUp}
          tone="green"
        />
        <StatCard
          title="Savings Estimate"
          value={formatCurrency(analytics.summary.savingsEstimate)}
          icon={PiggyBank}
          tone={analytics.summary.savingsEstimate >= 0 ? 'green' : 'red'}
        />
      </section>

      <ChartCard title="Expense by Category">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={analytics.expensePie} dataKey="value" nameKey="name" innerRadius={56} outerRadius={80} paddingAngle={2}>
                {analytics.expensePie.map((entry, index) => (
                  <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Income by Category">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={analytics.incomePie} dataKey="value" nameKey="name" innerRadius={56} outerRadius={80} paddingAngle={2}>
                {analytics.incomePie.map((entry, index) => (
                  <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Daily Trend (Last 31 Days)">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(value) => formatDate(value).split(' ').slice(0, 2).join(' ')} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={(label) => formatDate(label)} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="income" fill="#16a34a" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expense" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Monthly Trend">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickFormatter={(value) => formatMonthLabel(value)} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={(label) => formatMonthLabel(label)} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Top Spending Categories">
        <div className="space-y-2">
          {analytics.topSpending.length ? (
            analytics.topSpending.map((item, index) => {
              const meta = categoryByName.get(item.name);
              return (
                <div key={item.name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <span className="text-xs font-semibold text-slate-400">#{index + 1}</span>
                    <CategoryIcon icon={meta?.icon} size={14} className="text-blue-600" />
                    {item.name}
                  </div>
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(item.value)}</span>
                </div>
              );
            })
          ) : (
            <p className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">No expense data yet.</p>
          )}
        </div>
      </ChartCard>

      <ChartCard title="Recurring Expense Detector">
        <div className="space-y-2">
          {analytics.recurringExpenses.length ? (
            analytics.recurringExpenses.map((item) => (
              <div key={`${item.category}-${item.subCategory || 'none'}`} className="rounded-2xl bg-blue-50/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{item.category}</p>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                    {item.confidence}% confidence
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-600">
                  Avg {formatCurrency(item.averageAmount)} • {item.frequency} • Interval {item.intervalMonths}m
                </p>
                <p className="mt-1 text-[11px] text-slate-500">Last paid: {formatDate(item.lastPaidDate)}</p>
              </div>
            ))
          ) : (
            <p className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">No recurring patterns detected yet.</p>
          )}
        </div>
      </ChartCard>

      <ChartCard title="Recent Transactions">
        <div className="space-y-2">
          {analytics.recentTransactions.length ? (
            analytics.recentTransactions.map((item) => (
              <div key={item.transactionId} className="flex items-center justify-between rounded-2xl bg-white/80 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{item.category}</p>
                  <p className="truncate text-[11px] text-slate-500">{item.shortDescription || 'No description'}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${item.type === 'Money In' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {item.type === 'Money In' ? '+' : '-'}{formatCurrency(item.amount).replace('?', '? ')}
                  </p>
                  <p className="text-[10px] text-slate-500">{formatDate(item.date || item.timestamp)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">No transactions yet.</p>
          )}
        </div>
      </ChartCard>
    </div>
  );
}

