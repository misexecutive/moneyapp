export const TRANSACTION_TYPES = {
  IN: 'Money In',
  OUT: 'Money Out',
};

export const DEFAULT_CATEGORIES = [
  {
    type: TRANSACTION_TYPES.OUT,
    name: 'Electricity',
    icon: 'bolt',
    subCategories: ['Home Bill', 'Commercial Bill'],
  },
  {
    type: TRANSACTION_TYPES.OUT,
    name: 'LPG',
    icon: 'flame',
    subCategories: ['Cylinder', 'Refill'],
  },
  {
    type: TRANSACTION_TYPES.OUT,
    name: 'Grocery',
    icon: 'shopping-cart',
    subCategories: ['Daily Needs', 'Monthly Stock'],
  },
  {
    type: TRANSACTION_TYPES.OUT,
    name: 'Food & Snacks',
    icon: 'utensils',
    subCategories: ['Dining Out', 'Delivery', 'Snacks'],
  },
  {
    type: TRANSACTION_TYPES.OUT,
    name: 'Mobile Recharge',
    icon: 'smartphone',
    subCategories: ['Prepaid', 'Postpaid', 'Data Pack'],
  },
  {
    type: TRANSACTION_TYPES.OUT,
    name: 'Shopping',
    icon: 'shopping-bag',
    subCategories: ['Fashion', 'Electronics', 'Home'],
  },
  {
    type: TRANSACTION_TYPES.OUT,
    name: 'Travel',
    icon: 'plane',
    subCategories: ['Cab', 'Bus', 'Train', 'Flight'],
  },
  {
    type: TRANSACTION_TYPES.OUT,
    name: 'Fuel',
    icon: 'fuel',
    subCategories: ['Petrol', 'Diesel', 'CNG'],
  },
  {
    type: TRANSACTION_TYPES.OUT,
    name: 'Health',
    icon: 'heart-pulse',
    subCategories: ['Medicines', 'Clinic', 'Insurance'],
  },
  {
    type: TRANSACTION_TYPES.OUT,
    name: 'Family',
    icon: 'users',
    subCategories: ['Parents', 'Kids', 'Support'],
  },
  {
    type: TRANSACTION_TYPES.OUT,
    name: 'Personal',
    icon: 'user',
    subCategories: ['Grooming', 'Learning', 'Hobbies'],
  },
  {
    type: TRANSACTION_TYPES.OUT,
    name: 'Rent',
    icon: 'house',
    subCategories: ['Home Rent', 'Office Rent'],
  },
  {
    type: TRANSACTION_TYPES.OUT,
    name: 'EMI / Loan',
    icon: 'landmark',
    subCategories: ['Home Loan', 'Vehicle EMI', 'Personal Loan'],
  },
  {
    type: TRANSACTION_TYPES.OUT,
    name: 'Subscription',
    icon: 'badge-indian-rupee',
    subCategories: ['OTT', 'Software', 'Membership'],
  },
  {
    type: TRANSACTION_TYPES.OUT,
    name: 'Investment',
    icon: 'line-chart',
    subCategories: ['Stocks', 'Mutual Funds', 'Gold'],
  },
  {
    type: TRANSACTION_TYPES.OUT,
    name: 'Savings Transfer',
    icon: 'piggy-bank',
    subCategories: ['RD', 'FD', 'Savings Account'],
  },
  {
    type: TRANSACTION_TYPES.OUT,
    name: 'Other',
    icon: 'circle-ellipsis',
    subCategories: [],
  },
  {
    type: TRANSACTION_TYPES.IN,
    name: 'Salary',
    icon: 'wallet',
    subCategories: ['Primary Salary', 'Bonus'],
  },
  {
    type: TRANSACTION_TYPES.IN,
    name: 'Business Income',
    icon: 'briefcase-business',
    subCategories: ['Client Payment', 'Commission'],
  },
  {
    type: TRANSACTION_TYPES.IN,
    name: 'Refund',
    icon: 'rotate-ccw',
    subCategories: ['Product Refund', 'Bill Reversal'],
  },
  {
    type: TRANSACTION_TYPES.IN,
    name: 'Cashback',
    icon: 'gift',
    subCategories: ['Card Cashback', 'Offer Cashback'],
  },
  {
    type: TRANSACTION_TYPES.IN,
    name: 'Family Received',
    icon: 'users',
    subCategories: ['Parents', 'Siblings'],
  },
  {
    type: TRANSACTION_TYPES.IN,
    name: 'Friend Received',
    icon: 'handshake',
    subCategories: ['Split Bill', 'Returned Cash'],
  },
  {
    type: TRANSACTION_TYPES.IN,
    name: 'Loan Received',
    icon: 'banknote-arrow-down',
    subCategories: ['Personal Loan', 'Advance'],
  },
  {
    type: TRANSACTION_TYPES.IN,
    name: 'Savings Withdrawal',
    icon: 'wallet-cards',
    subCategories: ['FD Closure', 'Savings Transfer'],
  },
  {
    type: TRANSACTION_TYPES.IN,
    name: 'Other Income',
    icon: 'circle-ellipsis',
    subCategories: [],
  },
];

export const PRESET_ICON_OPTIONS = [
  'bolt',
  'flame',
  'shopping-cart',
  'utensils',
  'smartphone',
  'shopping-bag',
  'plane',
  'fuel',
  'heart-pulse',
  'users',
  'user',
  'house',
  'landmark',
  'badge-indian-rupee',
  'line-chart',
  'piggy-bank',
  'wallet',
  'briefcase-business',
  'rotate-ccw',
  'gift',
  'handshake',
  'banknote-arrow-down',
  'wallet-cards',
  'circle-ellipsis',
  'circle-dollar-sign',
];

export function normalizeType(type) {
  return type === TRANSACTION_TYPES.IN ? TRANSACTION_TYPES.IN : TRANSACTION_TYPES.OUT;
}

export function getCategoriesByType(categories, type) {
  const normalized = normalizeType(type);
  return categories.filter((category) => category.type === normalized);
}

export function getSubCategories(categories, type, categoryName) {
  const item = categories.find(
    (category) => category.type === normalizeType(type) && category.name === categoryName,
  );
  return item?.subCategories ?? [];
}

export function mergeCategories(serverCategories = []) {
  const map = new Map();
  [...DEFAULT_CATEGORIES, ...serverCategories].forEach((entry) => {
    const key = `${entry.type}::${entry.name}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        ...entry,
        subCategories: [...new Set(entry.subCategories ?? [])],
      });
      return;
    }
    const mergedSubCategories = [...new Set([...(existing.subCategories ?? []), ...(entry.subCategories ?? [])])];
    map.set(key, {
      ...existing,
      ...entry,
      subCategories: mergedSubCategories,
    });
  });

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

