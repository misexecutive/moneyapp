const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const DATE_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const MONTH_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  month: 'short',
  year: '2-digit',
});

export function formatCurrency(value = 0) {
  return INR.format(Number(value) || 0);
}

export function formatDate(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return DATE_FORMATTER.format(date);
}

export function formatMonthLabel(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return MONTH_FORMATTER.format(date);
}

export function toISODate(value = new Date()) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatAmountSigned(amount, type) {
  const numeric = Number(amount) || 0;
  return `${type === 'Money Out' ? '-' : '+'}${formatCurrency(Math.abs(numeric)).replace('?', '? ')}`;
}

export function formatNarration(transaction = {}) {
  const date = formatDate(transaction.date || transaction.timestamp);
  const category = transaction.subCategory
    ? `${transaction.category} / ${transaction.subCategory}`
    : transaction.category;
  return `${date} - ${transaction.type} - ${category} - ${transaction.shortDescription || 'No description'}`;
}

export function safeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

