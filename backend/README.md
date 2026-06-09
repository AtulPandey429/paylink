# PayLink Backend API

A clean, modern, modular MERN backend architecture orchestrating payment links across **Stripe**, **Razorpay**, and **Cashfree** with a built-in interactive payment simulator.

---

## 1. Clean Architecture Overview

```text
backend/
├── src/
│   ├── app.js                          # Express app configuration & middleware
│   ├── server.js                       # Server bootstrap & graceful shutdown
│   │
│   ├── config/
│   │   ├── env.js                      # Environment parsing & startup validation
│   │   └── database.js                 # MongoDB connection & disconnection lifecycle
│   │
│   ├── routes/
│   │   ├── index.js                    # Central API router (/api)
│   │   ├── auth.routes.js              # /api/auth endpoints
│   │   ├── paymentLink.routes.js       # /api/payment-links endpoints
│   │   ├── webhook.routes.js           # /api/webhooks endpoints
│   │   ├── dashboard.routes.js         # /api/dashboard endpoints
│   │   └── settings.routes.js          # /api/settings endpoints
│   │
│   ├── controllers/
│   │   ├── auth.controller.js          # Auth HTTP controller (using asyncHandler)
│   │   ├── paymentLink.controller.js   # PaymentLink HTTP controller (using asyncHandler)
│   │   ├── webhook.controller.js       # Inbound webhook controller
│   │   ├── dashboard.controller.js     # Dashboard metrics controller
│   │   └── settings.controller.js      # Gateway status controller
│   │
│   ├── services/
│   │   ├── auth.service.js             # Merchant authentication & JWT tokens
│   │   ├── paymentLink.service.js      # Link business rules, tenant isolation & simulation
│   │   ├── webhook.service.js          # Atomic idempotency locks & ledger reconciliation
│   │   └── dashboard.service.js        # Multi-currency aggregation pipelines
│   │
│   ├── providers/
│   │   ├── index.js                    # ProviderFactory instance & provider exports
│   │   ├── base.provider.js            # BaseProvider abstract contract
│   │   ├── stripe.provider.js          # Stripe SDK adapter
│   │   ├── razorpay.provider.js        # Razorpay SDK adapter
│   │   ├── cashfree.provider.js        # Cashfree REST API adapter
│   │   └── demo.provider.js            # Sandbox simulator adapter
│   │
│   ├── models/
│   │   ├── AuditLog.js                 # Immutable audit trail
│   │   ├── PaymentLink.js              # Payment link schema
│   │   ├── PaymentTransaction.js       # Financial ledger schema (minor unit integer)
│   │   ├── User.js                     # Merchant schema with bcrypt
│   │   └── WebhookEvent.js             # Webhook idempotency record schema
│   │
│   ├── middleware/
│   │   ├── auth.js                     # JWT authorization middleware
│   │   ├── errorHandler.js             # Global operational error handler
│   │   ├── notFound.js                 # 404 handler for unmatched routes
│   │   ├── rateLimiter.js              # Express rate limiters
│   │   └── validateRequest.js          # Validation middleware runner
│   │
│   ├── validators/
│   │   ├── auth.validator.js           # Register & login validation schemas
│   │   ├── paymentLink.validator.js    # Link creation schema & currency limits
│   │   └── index.js                    # Validator exports
│   │
│   ├── utils/
│   │   ├── AppError.js                 # Operational error class
│   │   ├── asyncHandler.js             # Async controller wrapper removing try/catch
│   │   ├── currency.js                 # Minor unit conversions (cents/paise)
│   │   ├── deepLink.js                 # NPCI upi://pay URI generator
│   │   ├── logger.js                   # Structured logger with secret sanitization
│   │   └── signature.js                # Constant-time HMAC-SHA256 helpers
│   │
│   └── database/
│       └── seed.js                     # Initial merchant & links database seeder
│
├── tests/
│   ├── setup.js                        # Test database lifecycle
│   ├── integration/                    # Supertest HTTP integration suites
│   └── unit/                           # Isolated unit tests
│
├── .env.example
├── package.json
└── README.md
```

---

## 2. Environment Configuration

Copy the example file:
```bash
cp .env.example .env
```

Key environment variables:
- `PORT`: Server port (defaults to `5000`)
- `NODE_ENV`: `development` or `production`
- `MONGODB_URI`: MongoDB connection string (`mongodb://127.0.0.1:27017/paylink_db`)
- `JWT_SECRET`: Secret key for merchant auth tokens (min 32 chars in production)
- `ENABLE_DEMO_MODE`: `true` to enable automatic simulation when gateway keys are empty
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`: Razorpay API test credentials
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`: Stripe API credentials
- `CASHFREE_APP_ID` / `CASHFREE_SECRET_KEY`: Cashfree API credentials

---

## 3. Starting the Backend

```bash
# Seed initial merchant & demo data (Optional)
npm run seed

# Start development server with auto-reload (port 5000)
npm run dev

# Start production server
npm start
```

---

## 4. Running Tests

```bash
# Run all 9 test suites (46 tests)
npm test

# Run tests in watch mode
npm run test:watch
```

---

## 5. Security & Idempotency Guarantees

1. **Atomic TOCTOU Locking:** Webhook events are locked with pre-insert unique compound indexes (`gateway`, `eventId`).
2. **Double-Capture Defense:** Financial transactions are recorded in integer minor units (`amountMinor`) with unique compound indexes (`gateway`, `gatewayPaymentId`).
3. **IDOR Defense:** All merchant endpoints strictly verify ownership (`{ _id: linkId, userId: req.user._id }`).
4. **Constant-Time Verification:** Webhook signatures are verified using `crypto.timingSafeEqual` over unparsed `req.rawBody`.
