/**
 * PayLink Frontend Public Configuration Module
 * 
 * SECURITY NOTICE:
 * Only environment variables prefixed with `VITE_` are exposed to the client bundle.
 * NEVER import, configure, or expose backend gateway secrets (Stripe Secret Key,
 * Razorpay Secret, Cashfree Secret, or JWT Secret) in frontend code!
 */

const normalizeUrl = (url, fallback) => {
  const target = (url || fallback || '').trim();
  return target.endsWith('/') ? target.slice(0, -1) : target;
};

const config = {
  // Base URL for backend API requests (defaults to Vite proxy '/api')
  apiBaseUrl: normalizeUrl(import.meta.env.VITE_API_BASE_URL, '/api'),

  // Public client origin URL
  clientUrl: typeof window !== 'undefined'
    ? normalizeUrl(import.meta.env.VITE_CLIENT_URL, window.location.origin)
    : 'http://localhost:5173',

  appTitle: import.meta.env.VITE_APP_TITLE || 'PayLink',
  environment: import.meta.env.MODE || 'development',
  isDev: Boolean(import.meta.env.DEV),
  isProd: Boolean(import.meta.env.PROD),

  // Public routes for payment callbacks & customer confirmation
  routes: {
    paymentSuccess: '/payment-success',
    paymentCancelled: '/payment-cancelled'
  }
};

export default config;
