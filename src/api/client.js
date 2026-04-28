import { DEFAULT_CATEGORIES, mergeCategories } from '../utils/categories';
import { toISODate } from '../utils/formatters';

const API_BASE = import.meta.env.VITE_API_BASE;
const APPROVED_USERS = (import.meta.env.VITE_APPROVED_USERS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const STORAGE_KEYS = {
  transactions: 'mm_mock_transactions',
  categories: 'mm_mock_categories',
};

function isPlaceholderApi(url = '') {
  return !url || url.includes('YOUR_DEPLOYMENT_ID');
}

function canUseApi() {
  return Boolean(API_BASE) && !isPlaceholderApi(API_BASE);
}

function parseJson(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function getStorageItem(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  return parseJson(raw, fallback);
}

function setStorageItem(key, value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function seedMockTransactions() {
  const today = new Date();
  const day = 24 * 60 * 60 * 1000;

  return [
    {
      transactionId: crypto.randomUUID(),
      timestamp: new Date(today.getTime() - 2 * day).toISOString(),
      date: toISODate(today.getTime() - 2 * day),
      type: 'Money In',
      category: 'Salary',
      subCategory: 'Primary Salary',
      amount: 52000,
      shortDescription: 'Monthly salary credit',
      tag: 'Receivable',
      createdByEmail: 'demo@moneymanager.app',
      createdByName: 'Demo User',
      updatedAt: new Date(today.getTime() - 2 * day).toISOString(),
    },
    {
      transactionId: crypto.randomUUID(),
      timestamp: new Date(today.getTime() - day).toISOString(),
      date: toISODate(today.getTime() - day),
      type: 'Money Out',
      category: 'Grocery',
      subCategory: 'Monthly Stock',
      amount: 4200,
      shortDescription: 'Monthly grocery run',
      tag: 'Payable',
      createdByEmail: 'demo@moneymanager.app',
      createdByName: 'Demo User',
      updatedAt: new Date(today.getTime() - day).toISOString(),
    },
    {
      transactionId: crypto.randomUUID(),
      timestamp: new Date(today.getTime()).toISOString(),
      date: toISODate(today),
      type: 'Money Out',
      category: 'Subscription',
      subCategory: 'OTT',
      amount: 499,
      shortDescription: 'Streaming plan renewal',
      tag: 'Payable',
      createdByEmail: 'demo@moneymanager.app',
      createdByName: 'Demo User',
      updatedAt: new Date(today.getTime()).toISOString(),
    },
  ];
}

function getMockTransactions() {
  const existing = getStorageItem(STORAGE_KEYS.transactions, null);
  if (Array.isArray(existing)) return existing;
  const seeded = seedMockTransactions();
  setStorageItem(STORAGE_KEYS.transactions, seeded);
  return seeded;
}

function getMockCategories() {
  const existing = getStorageItem(STORAGE_KEYS.categories, null);
  if (Array.isArray(existing)) return mergeCategories(existing);
  setStorageItem(STORAGE_KEYS.categories, DEFAULT_CATEGORIES);
  return mergeCategories(DEFAULT_CATEGORIES);
}

function ensureSuccess(data) {
  return { ok: true, data };
}

async function parseApiResponse(response) {
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error('Invalid JSON response from API.');
  }

  if (!response.ok || !body?.ok) {
    throw new Error(body?.error || `Request failed with status ${response.status}`);
  }

  return body.data;
}

async function requestApi(action, { method = 'POST', payload, params = {}, token } = {}) {
  if (!canUseApi()) {
    throw new Error('API unavailable');
  }

  if (method === 'GET') {
    const query = new URLSearchParams({ action, ...params });
    const response = await fetch(`${API_BASE}?${query.toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    return parseApiResponse(response);
  }

  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      action,
      payload,
      token,
    }),
  });

  return parseApiResponse(response);
}

async function requestWithFallback(action, config, fallbackFn) {
  try {
    const data = await requestApi(action, config);
    return ensureSuccess(data);
  } catch (error) {
    if (!fallbackFn) {
      return {
        ok: false,
        error: error.message || 'Request failed',
      };
    }

    try {
      const data = await fallbackFn();
      return ensureSuccess(data);
    } catch (fallbackError) {
      return {
        ok: false,
        error: fallbackError.message || error.message || 'Request failed',
      };
    }
  }
}

function verifyAllowedEmail(email = '') {
  if (!email) return false;
  if (!APPROVED_USERS.length) return true;
  return APPROVED_USERS.includes(email.toLowerCase());
}

export async function verifyUser(payload, token) {
  return requestWithFallback(
    'verifyUser',
    {
      method: 'POST',
      payload,
      token,
    },
    async () => {
      const approved = verifyAllowedEmail(payload?.email);
      if (!approved) {
        throw new Error('Access denied. Your account is not approved.');
      }
      return {
        approved,
        email: payload?.email,
        name: payload?.name,
      };
    },
  );
}

export async function getBootstrapData(email, token) {
  return requestWithFallback(
    'getBootstrapData',
    {
      method: 'GET',
      params: {
        email,
      },
      token,
    },
    async () => ({
      transactions: getMockTransactions().filter((item) => !email || item.createdByEmail === email || item.createdByEmail === 'demo@moneymanager.app'),
      categories: getMockCategories(),
      meta: {
        mock: true,
      },
    }),
  );
}

export async function getTransactions(email) {
  return requestWithFallback(
    'getTransactions',
    {
      method: 'GET',
      params: {
        email,
      },
    },
    async () => getMockTransactions().filter((item) => !email || item.createdByEmail === email || item.createdByEmail === 'demo@moneymanager.app'),
  );
}

export async function addTransaction(payload, token) {
  return requestWithFallback(
    'addTransaction',
    {
      method: 'POST',
      payload,
      token,
    },
    async () => {
      const all = getMockTransactions();
      const created = {
        ...payload,
        transactionId: payload.transactionId || crypto.randomUUID(),
        timestamp: payload.timestamp || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      all.unshift(created);
      setStorageItem(STORAGE_KEYS.transactions, all);
      return created;
    },
  );
}

export async function updateTransaction(payload, token) {
  return requestWithFallback(
    'updateTransaction',
    {
      method: 'POST',
      payload,
      token,
    },
    async () => {
      const all = getMockTransactions();
      const updated = all.map((item) =>
        item.transactionId === payload.transactionId
          ? {
              ...item,
              ...payload,
              updatedAt: new Date().toISOString(),
            }
          : item,
      );
      setStorageItem(STORAGE_KEYS.transactions, updated);
      return updated.find((item) => item.transactionId === payload.transactionId);
    },
  );
}

export async function deleteTransaction(payload, token) {
  return requestWithFallback(
    'deleteTransaction',
    {
      method: 'POST',
      payload,
      token,
    },
    async () => {
      const all = getMockTransactions();
      const filtered = all.filter((item) => item.transactionId !== payload.transactionId);
      setStorageItem(STORAGE_KEYS.transactions, filtered);
      return {
        deleted: true,
        transactionId: payload.transactionId,
      };
    },
  );
}

export async function getCategories(email) {
  return requestWithFallback(
    'getCategories',
    {
      method: 'GET',
      params: {
        email,
      },
    },
    async () => getMockCategories(),
  );
}

export async function addCategory(payload, token) {
  return requestWithFallback(
    'addCategory',
    {
      method: 'POST',
      payload,
      token,
    },
    async () => {
      const all = getMockCategories();
      const key = `${payload.type}::${payload.name}`;
      const existing = all.find((item) => `${item.type}::${item.name}` === key);
      if (existing) {
        existing.subCategories = [...new Set([...(existing.subCategories || []), ...(payload.subCategories || [])])];
        setStorageItem(STORAGE_KEYS.categories, all);
        return existing;
      }

      const created = {
        ...payload,
        subCategories: [...new Set(payload.subCategories || [])],
      };
      all.push(created);
      setStorageItem(STORAGE_KEYS.categories, all);
      return created;
    },
  );
}

function toCsvValue(value) {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function transactionsToCsv(rows) {
  const headers = [
    'Transaction ID',
    'Date',
    'Type',
    'Tag',
    'Category',
    'Sub Category',
    'Amount',
    'Short Description',
    'Created By',
    'Timestamp',
    'Narration',
  ];

  const lines = rows.map((item) => {
    const narration = `${item.date || ''} | ${item.type || ''} | ${item.category || ''} ${item.subCategory || ''} | ${item.shortDescription || ''}`
      .replace(/\s+/g, ' ')
      .trim();

    return [
      item.transactionId,
      item.date,
      item.type,
      item.tag,
      item.category,
      item.subCategory,
      item.amount,
      item.shortDescription,
      `${item.createdByName || ''} <${item.createdByEmail || ''}>`,
      item.timestamp,
      narration,
    ]
      .map(toCsvValue)
      .join(',');
  });

  return [headers.join(','), ...lines].join('\n');
}

export async function exportTransactions(email, token) {
  return requestWithFallback(
    'exportTransactions',
    {
      method: 'POST',
      payload: {
        email,
      },
      token,
    },
    async () => {
      const rows = getMockTransactions().filter((item) => !email || item.createdByEmail === email || item.createdByEmail === 'demo@moneymanager.app');
      return {
        csv: transactionsToCsv(rows),
        count: rows.length,
      };
    },
  );
}

export function createCsvFromTransactions(rows = []) {
  return transactionsToCsv(rows);
}

export function isUsingMockApi() {
  return !canUseApi();
}

