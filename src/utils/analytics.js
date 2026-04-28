import { detectRecurringExpenses } from './recurringDetector';
import { safeNumber, toISODate } from './formatters';

function isBetween(dateValue, start, end) {
  if (!dateValue) return false;
  const time = new Date(dateValue).getTime();
  if (Number.isNaN(time)) return false;
  if (start && time < new Date(start).getTime()) return false;
  if (end && time > new Date(end).getTime()) return false;
  return true;
}

export function applyTransactionFilters(transactions = [], filters = {}) {
  const {
    dateFrom,
    dateTo,
    quickRange,
    type,
    category,
    search,
    minAmount,
    maxAmount,
  } = filters;

  const now = new Date();
  let computedFrom = dateFrom;
  let computedTo = dateTo;

  if (quickRange) {
    if (quickRange === 'current-month') {
      computedFrom = toISODate(new Date(now.getFullYear(), now.getMonth(), 1));
      computedTo = toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    }
    if (quickRange === 'last-month') {
      computedFrom = toISODate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      computedTo = toISODate(new Date(now.getFullYear(), now.getMonth(), 0));
    }
    if (quickRange === 'last-3-months') {
      computedFrom = toISODate(new Date(now.getFullYear(), now.getMonth() - 2, 1));
      computedTo = toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    }
  }

  return transactions.filter((tx) => {
    const txDate = tx.date || tx.timestamp;
    const amount = safeNumber(tx.amount);

    if (!isBetween(txDate, computedFrom, computedTo)) return false;
    if (type && type !== 'All' && tx.type !== type) return false;
    if (category && category !== 'All' && tx.category !== category) return false;
    if (minAmount && amount < safeNumber(minAmount)) return false;
    if (maxAmount && amount > safeNumber(maxAmount)) return false;

    if (search?.trim()) {
      const haystack = `${tx.shortDescription || ''} ${tx.category || ''} ${tx.subCategory || ''}`.toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }

    return true;
  });
}

export function buildSummary(transactions = []) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  return transactions.reduce(
    (summary, tx) => {
      const amount = safeNumber(tx.amount);
      const txDate = new Date(tx.date || tx.timestamp);
      const isCurrentMonth = txDate.getMonth() === month && txDate.getFullYear() === year;

      if (tx.type === 'Money In') {
        summary.totalIn += amount;
        if (isCurrentMonth) summary.currentMonthIncome += amount;
      } else {
        summary.totalOut += amount;
        if (isCurrentMonth) summary.currentMonthExpense += amount;
      }

      return summary;
    },
    {
      totalIn: 0,
      totalOut: 0,
      currentMonthIncome: 0,
      currentMonthExpense: 0,
    },
  );
}

export function buildPieData(transactions = [], type) {
  const map = new Map();
  transactions
    .filter((tx) => tx.type === type)
    .forEach((tx) => {
      map.set(tx.category, (map.get(tx.category) || 0) + safeNumber(tx.amount));
    });

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function buildDailyTrend(transactions = []) {
  const map = new Map();
  transactions.forEach((tx) => {
    const date = tx.date || tx.timestamp;
    if (!date) return;
    const key = toISODate(date);
    const current = map.get(key) || { date: key, income: 0, expense: 0 };
    if (tx.type === 'Money In') {
      current.income += safeNumber(tx.amount);
    } else {
      current.expense += safeNumber(tx.amount);
    }
    map.set(key, current);
  });

  return Array.from(map.values()).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-31);
}

export function buildMonthlyTrend(transactions = []) {
  const map = new Map();
  transactions.forEach((tx) => {
    const date = new Date(tx.date || tx.timestamp);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
    const current = map.get(key) || { month: key, income: 0, expense: 0 };
    if (tx.type === 'Money In') {
      current.income += safeNumber(tx.amount);
    } else {
      current.expense += safeNumber(tx.amount);
    }
    map.set(key, current);
  });

  return Array.from(map.values()).sort((a, b) => new Date(a.month) - new Date(b.month));
}

export function topSpendingCategories(transactions = []) {
  return buildPieData(transactions, 'Money Out').slice(0, 5);
}

export function getDashboardAnalytics(transactions = []) {
  const summary = buildSummary(transactions);
  const netBalance = summary.totalIn - summary.totalOut;
  const savingsEstimate = summary.currentMonthIncome - summary.currentMonthExpense;

  return {
    summary: {
      ...summary,
      netBalance,
      savingsEstimate,
    },
    expensePie: buildPieData(transactions, 'Money Out'),
    incomePie: buildPieData(transactions, 'Money In'),
    dailyTrend: buildDailyTrend(transactions),
    monthlyTrend: buildMonthlyTrend(transactions),
    topSpending: topSpendingCategories(transactions),
    recurringExpenses: detectRecurringExpenses(transactions),
    recentTransactions: [...transactions]
      .sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp))
      .slice(0, 8),
  };
}

