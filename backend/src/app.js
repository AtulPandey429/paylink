const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFound');

const app = express();

// Enable trust proxy for Render / Vercel load balancers (fixes X-Forwarded-For rate limit error)
app.set('trust proxy', 1);

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration supporting configured origins, Vercel/Render hosts, and local LAN development
function isAllowedOrigin(origin) {
  if (!origin) return true; // Non-browser clients (Postman, cURL, webhooks)
  if (config.cors.allowedOrigins.includes(origin)) return true;

  // Allow Vercel deployments and preview URLs (*.vercel.app)
  if (/^https:\/\/[a-zA-Z0-9-_.]+\.vercel\.app$/.test(origin)) return true;
  if (/^https:\/\/[a-zA-Z0-9-_.]+\.onrender\.com$/.test(origin)) return true;

  // In development, allow private local network origins for phone/mobile deep-link testing
  if (config.isDevelopment) {
    const isLanOrigin = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);
    if (isLanOrigin) return true;
  }

  return false;
}

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'stripe-signature',
    'x-razorpay-signature',
    'x-webhook-signature',
    'x-webhook-timestamp',
    'x-demo-signature'
  ]
}));

// Request logger (in non-test environments)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Crucial: Body parser with raw body buffer preservation for HMAC signatures
app.use(express.json({
  limit: '2mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({
  extended: true,
  limit: '2mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Root status endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'PayLink API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api',
    health: '/health'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: config.env
  });
});

// Mount Central API Routes (/api)
app.use('/api', apiRoutes);

// Fallback handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
