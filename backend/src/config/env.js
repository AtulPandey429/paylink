const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from repo root or backend directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DEV_FALLBACK_JWT_SECRET = 'paylink_super_secure_jwt_secret_dev_key_2026_xyz';

function normalizeUrl(url, defaultUrl) {
  const target = (url || defaultUrl || '').trim();
  return target.endsWith('/') ? target.slice(0, -1) : target;
}

function parseAllowedOrigins(originsString, clientUrl) {
  const defaults = [
    clientUrl,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];

  if (!originsString || typeof originsString !== 'string') {
    return Array.from(new Set(defaults.filter(Boolean)));
  }

  const userOrigins = originsString
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  return Array.from(new Set([...defaults, ...userOrigins].filter(Boolean)));
}

const nodeEnv = process.env.NODE_ENV || 'development';
const port = parseInt(process.env.PORT || '5000', 10);
const clientUrl = normalizeUrl(process.env.CLIENT_URL, 'http://localhost:5173');
const publicBaseUrl = normalizeUrl(process.env.PUBLIC_BASE_URL, `http://localhost:${port}`);
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/paylink_db';

const config = {
  env: nodeEnv,
  isProduction: nodeEnv === 'production',
  isDevelopment: nodeEnv === 'development',
  isTest: nodeEnv === 'test',

  port,
  publicBaseUrl,
  clientUrl,

  mongoUri,

  jwtSecret: process.env.JWT_SECRET || DEV_FALLBACK_JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

  cors: {
    allowedOrigins: parseAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS, clientUrl)
  },

  routes: {
    paymentSuccessPath: process.env.PAYMENT_SUCCESS_PATH || '/payment-success',
    paymentCancelledPath: process.env.PAYMENT_CANCELLED_PATH || '/payment-cancelled'
  },

  // Payment Gateway Configurations
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    isConfigured: Boolean(
      process.env.STRIPE_SECRET_KEY &&
      !process.env.STRIPE_SECRET_KEY.includes('placeholder') &&
      process.env.STRIPE_SECRET_KEY.startsWith('sk_')
    )
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    isConfigured: Boolean(
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      !process.env.RAZORPAY_KEY_ID.includes('placeholder') &&
      process.env.RAZORPAY_KEY_ID.startsWith('rzp_')
    )
  },

  cashfree: {
    appId: process.env.CASHFREE_APP_ID || '',
    secretKey: process.env.CASHFREE_SECRET_KEY || '',
    apiVersion: process.env.CASHFREE_API_VERSION || '2023-08-01',
    environment: (process.env.CASHFREE_ENV || 'TEST').toUpperCase(),
    baseUrl: (process.env.CASHFREE_ENV || 'TEST').toUpperCase() === 'PROD'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg',
    defaultCustomerPhone: process.env.CASHFREE_DEFAULT_CUSTOMER_PHONE || '9999999999',
    isConfigured: Boolean(
      process.env.CASHFREE_APP_ID &&
      process.env.CASHFREE_SECRET_KEY &&
      !process.env.CASHFREE_APP_ID.includes('placeholder')
    )
  },

  demoMode: {
    enabled: process.env.ENABLE_DEMO_MODE !== 'false',
    webhookSecret: process.env.DEMO_WEBHOOK_SECRET || 'demo_mode_secret_key_2026',
    simulatedLatencyMs: Math.max(50, parseInt(process.env.DEMO_SIMULATED_LATENCY_MS || '300', 10))
  }
};

/**
 * Validates required configuration at startup.
 * Throws actionable errors without leaking secret values.
 */
function validateConfig(cfg = config) {
  const errors = [];

  if (isNaN(cfg.port) || cfg.port < 1 || cfg.port > 65535) {
    errors.push(`Invalid PORT '${process.env.PORT}'. Must be an integer between 1 and 65535.`);
  }

  if (!cfg.mongoUri || typeof cfg.mongoUri !== 'string') {
    errors.push('Missing MONGODB_URI configuration.');
  }

  if (cfg.isProduction) {
    if (!process.env.JWT_SECRET || cfg.jwtSecret === DEV_FALLBACK_JWT_SECRET) {
      errors.push('CRITICAL: Production deployment requires a secure JWT_SECRET environment variable (minimum 32 characters). Fallback development key is rejected.');
    } else if (cfg.jwtSecret.length < 32) {
      errors.push('CRITICAL: JWT_SECRET must be at least 32 characters long in production.');
    }

    if (cfg.stripe.isConfigured && !cfg.stripe.webhookSecret) {
      errors.push('STRIPE_WEBHOOK_SECRET is required when Stripe is configured in production.');
    }

    if (cfg.razorpay.isConfigured && !cfg.razorpay.webhookSecret) {
      errors.push('RAZORPAY_WEBHOOK_SECRET is required when Razorpay is configured in production.');
    }

    if (cfg.cashfree.isConfigured && !cfg.cashfree.secretKey) {
      errors.push('CASHFREE_SECRET_KEY is required when Cashfree is configured in production.');
    }
  }

  if (errors.length > 0) {
    const errorMsg = `Configuration validation failed at application startup:\n- ${errors.join('\n- ')}`;
    throw new Error(errorMsg);
  }
}

// Automatically validate in non-test runtime
if (nodeEnv !== 'test') {
  validateConfig();
}

config.validateConfig = validateConfig;
module.exports = config;
