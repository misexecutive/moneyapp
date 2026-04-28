import { safeNumber } from './formatters';

function monthKeyFromDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function average(numbers) {
  if (!numbers.length) return 0;
  return numbers.reduce((sum, item) => sum + item, 0) / numbers.length;
}

function stdDev(numbers, avg) {
  if (numbers.length < 2) return 0;
  const variance = numbers.reduce((sum, item) => sum + (item - avg) ** 2, 0) / numbers.length;
  return Math.sqrt(variance);
}

export function detectRecurringExpenses(transactions = []) {
  const expenses = transactions.filter((tx) => tx.type === 'Money Out');
  const groups = new Map();

  expenses.forEach((tx) => {
    const month = monthKeyFromDate(tx.date || tx.timestamp);
    if (!month) return;

    const key = `${tx.category}::${tx.subCategory || ''}`;
    const list = groups.get(key) || [];
    list.push({
      ...tx,
      month,
      amount: safeNumber(tx.amount),
    });
    groups.set(key, list);
  });

  const recurring = [];

  groups.forEach((items, key) => {
    if (items.length < 2) return;

    const months = [...new Set(items.map((item) => item.month))].sort();
    if (months.length < 2) return;

    const amounts = items.map((item) => item.amount);
    const avg = average(amounts);
    const deviation = stdDev(amounts, avg);
    const stability = avg === 0 ? 0 : Math.max(0, 1 - deviation / avg);

    const monthSteps = [];
    for (let i = 1; i < months.length; i += 1) {
      const [prevY, prevM] = months[i - 1].split('-').map(Number);
      const [currY, currM] = months[i].split('-').map(Number);
      monthSteps.push((currY - prevY) * 12 + (currM - prevM));
    }

    const avgInterval = monthSteps.length ? average(monthSteps) : 1;
    const intervalScore = Math.max(0, 1 - Math.abs(avgInterval - 1) * 0.5);
    const frequencyScore = Math.min(1, months.length / 6);
    const confidence = Math.round((stability * 0.45 + intervalScore * 0.35 + frequencyScore * 0.2) * 100);

    if (confidence < 35) return;

    const lastPaid = items.reduce((latest, item) => {
      const latestTime = new Date(latest.date || latest.timestamp).getTime();
      const currentTime = new Date(item.date || item.timestamp).getTime();
      return currentTime > latestTime ? item : latest;
    }, items[0]);

    const [category, subCategory] = key.split('::');

    recurring.push({
      category,
      subCategory,
      averageAmount: Math.round(avg),
      frequency: `${months.length} months`,
      intervalMonths: Number(avgInterval.toFixed(1)),
      lastPaidDate: lastPaid.date || lastPaid.timestamp,
      confidence,
    });
  });

  return recurring.sort((a, b) => b.confidence - a.confidence).slice(0, 6);
}

