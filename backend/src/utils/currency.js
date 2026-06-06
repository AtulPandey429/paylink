/**
 * Currency utilities for financial accuracy.
 * Prevents floating point issues by storing integer minor units (cents, paise).
 */

const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA',
  'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
]);

const THREE_DECIMAL_CURRENCIES = new Set([
  'BHD', 'JOD', 'KWD', 'OMR', 'TND'
]);

const GATEWAY_CURRENCY_SUPPORT = {
  stripe: {
    supported: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'SGD', 'AED', 'JPY', 'CHF'],
    default: 'USD',
    minAmount: { USD: 0.50, EUR: 0.50, INR: 50.00, GBP: 0.30 }
  },
  razorpay: {
    supported: ['INR', 'USD', 'EUR', 'GBP', 'SGD', 'AED'],
    default: 'INR',
    minAmount: { INR: 1.00, USD: 1.00 }
  },
  cashfree: {
    supported: ['INR'],
    default: 'INR',
    minAmount: { INR: 1.00 }
  },
  demo: {
    supported: ['USD', 'INR', 'EUR', 'GBP'],
    default: 'USD',
    minAmount: { USD: 0.50, INR: 1.00 }
  }
};

/**
 * Converts a standard decimal amount (e.g. 10.50) into integer minor units (e.g. 1050 cents/paise).
 * Avoids 10.50 * 100 = 1050.0000000000002 floating point artifacts.
 */
function toMinorUnits(amount, currency = 'USD') {
  const curr = String(currency).toUpperCase();
  const num = Number(amount);
  if (isNaN(num) || num < 0) {
    throw new Error(`Invalid monetary amount: ${amount}`);
  }

  if (ZERO_DECIMAL_CURRENCIES.has(curr)) {
    return Math.round(num);
  }

  if (THREE_DECIMAL_CURRENCIES.has(curr)) {
    return Math.round(Math.round(num * 1000));
  }

  // Standard 2-decimal currencies (USD, INR, EUR, GBP)
  return Math.round(num * 100);
}

/**
 * Converts integer minor units back to standard decimal float (e.g. 1050 -> 10.50).
 */
function fromMinorUnits(minorUnits, currency = 'USD') {
  const curr = String(currency).toUpperCase();
  const units = Number(minorUnits);
  if (isNaN(units) || units < 0) {
    throw new Error(`Invalid minor units: ${minorUnits}`);
  }

  if (ZERO_DECIMAL_CURRENCIES.has(curr)) {
    return units;
  }

  if (THREE_DECIMAL_CURRENCIES.has(curr)) {
    return parseFloat((units / 1000).toFixed(3));
  }

  return parseFloat((units / 100).toFixed(2));
}

/**
 * Formats an amount with standard currency symbol and decimals.
 */
function formatCurrency(amount, currency = 'USD') {
  const curr = String(currency).toUpperCase();
  const num = Number(amount);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: ZERO_DECIMAL_CURRENCIES.has(curr) ? 0 : 2
    }).format(num);
  } catch {
    return `${curr} ${num.toFixed(2)}`;
  }
}

module.exports = {
  toMinorUnits,
  fromMinorUnits,
  formatCurrency,
  GATEWAY_CURRENCY_SUPPORT,
  ZERO_DECIMAL_CURRENCIES
};
