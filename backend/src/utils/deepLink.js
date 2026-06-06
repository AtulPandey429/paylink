const { URL } = require('url');

/**
 * Validates that a redirect or callback URL uses an allowed protocol (http/https)
 * and targets an authorized domain to prevent open redirect vulnerabilities.
 */
function validateRedirectUrl(targetUrl, allowedOrigins = []) {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return { isValid: false, reason: 'Empty or invalid URL type' };
  }

  const trimmed = targetUrl.trim();

  // Reject dangerous schemes immediately
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    return { isValid: false, reason: 'Disallowed URI scheme' };
  }

  try {
    const parsed = new URL(trimmed);

    // Only HTTP and HTTPS are permitted for web redirects
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, reason: `Protocol '${parsed.protocol}' is not allowed for web redirects` };
    }

    const origin = parsed.origin;

    // Check against allowed origins list
    const isExplicitlyAllowed = allowedOrigins.some(allowed => {
      try {
        return new URL(allowed).origin === origin;
      } catch {
        return false;
      }
    });

    // In development or local testing, allow localhost and private network IPs
    const isLocalhostOrLan = /^(http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?)$/.test(origin);

    if (isExplicitlyAllowed || isLocalhostOrLan) {
      return { isValid: true, origin: parsed.origin, pathname: parsed.pathname, url: parsed.toString() };
    }

    return { isValid: false, reason: `Target origin '${origin}' is not authorized` };
  } catch (err) {
    return { isValid: false, reason: `Malformed URL: ${err.message}` };
  }
}

/**
 * Generates an NPCI-compliant UPI deep-link URI for mobile phone intent testing.
 * Schema: upi://pay?pa=...&pn=...&am=...&cu=INR&tr=...
 */
function generateUpiDeepLink({ vpa, name, amount, currency = 'INR', transactionRef, note = '' }) {
  if (!vpa || !name || isNaN(Number(amount)) || Number(amount) <= 0) {
    throw new Error('Valid VPA (UPI ID), payee name, and positive amount are required for UPI deep link');
  }

  const params = new URLSearchParams();
  params.set('pa', vpa.trim());
  params.set('pn', name.trim());
  params.set('am', Number(amount).toFixed(2));
  params.set('cu', currency.toUpperCase());

  if (transactionRef) {
    params.set('tr', String(transactionRef).trim());
  }
  if (note) {
    params.set('tn', String(note).slice(0, 50).trim());
  }

  return `upi://pay?${params.toString()}`;
}

/**
 * Sanitizes sensitive parameters (e.g., session_id, token, secret, signature) from URL query strings
 * before logging to prevent credential leakage.
 */
function sanitizeUrlForLogging(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';

  try {
    const parsed = new URL(rawUrl, 'http://localhost');
    const sensitiveKeys = ['session_id', 'token', 'jwt', 'secret', 'signature', 'cf_link_id', 'key'];

    for (const key of Array.from(parsed.searchParams.keys())) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        parsed.searchParams.set(key, '[REDACTED]');
      }
    }

    return parsed.pathname + parsed.search;
  } catch {
    return '[MALFORMED_URL]';
  }
}

module.exports = {
  validateRedirectUrl,
  generateUpiDeepLink,
  sanitizeUrlForLogging
};
