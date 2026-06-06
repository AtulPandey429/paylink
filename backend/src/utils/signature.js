const crypto = require('crypto');

/**
 * Constant-time string/buffer comparison to prevent timing attacks.
 */
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Computes an HMAC-SHA256 hex digest.
 */
function computeHmacSha256Hex(secret, data) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Computes an HMAC-SHA256 Base64 digest (used by Cashfree).
 */
function computeHmacSha256Base64(secret, data) {
  return crypto.createHmac('sha256', secret).update(data).digest('base64');
}

module.exports = {
  safeCompare,
  computeHmacSha256Hex,
  computeHmacSha256Base64
};
