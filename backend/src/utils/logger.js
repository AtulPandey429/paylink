/**
 * Sanitized structured logger for PayLink.
 * Redacts secrets, tokens, cardholder data, and PII from application logs.
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'jwt',
  'secret',
  'secretkey',
  'keysecret',
  'authorization',
  'stripe_secret_key',
  'razorpay_key_secret',
  'cashfree_secret_key',
  'cardnumber',
  'pan',
  'cvv',
  'cvc',
  'pin',
  'signature'
]);

function sanitizeValue(key, value) {
  if (value === null || value === undefined) return value;
  const lowerKey = String(key).toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const sensitive of SENSITIVE_KEYS) {
    if (lowerKey.includes(sensitive)) {
      if (typeof value === 'string' && value.length > 8) {
        return `${value.slice(0, 4)}...[REDACTED]...${value.slice(-4)}`;
      }
      return '[REDACTED]';
    }
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return sanitizeObject(value);
  }

  if (Array.isArray(value)) {
    return value.map((item, idx) => sanitizeValue(idx, item));
  }

  return value;
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const cleaned = {};
  for (const [k, v] of Object.entries(obj)) {
    cleaned[k] = sanitizeValue(k, v);
  }
  return cleaned;
}

const logger = {
  info: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`, Object.keys(meta).length ? JSON.stringify(sanitizeObject(meta)) : '');
  },
  warn: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${message}`, Object.keys(meta).length ? JSON.stringify(sanitizeObject(meta)) : '');
  },
  error: (message, error = null, meta = {}) => {
    const timestamp = new Date().toISOString();
    const errorDetails = error ? {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    } : null;
    console.error(`[${timestamp}] [ERROR] ${message}`, JSON.stringify(sanitizeObject({ ...meta, error: errorDetails })));
  },
  sanitize: sanitizeObject
};

module.exports = logger;
