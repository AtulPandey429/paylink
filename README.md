# PayLink — Secure Multi-Gateway Payment Link Management Platform

PayLink is an enterprise-grade, production-minded payment link management platform built on the **MERN** stack (MongoDB, Express, React, Node.js). It provides a unified orchestration layer for creating, managing, tracking, and reconciling payment links across **Stripe**, **Razorpay**, and **Cashfree**, backed by a full-fidelity interactive payment simulator for local demonstration and automated testing.

---

## 1. System Architecture

```
                    ┌────────────────────────────────────────────────────────┐
                    │                   PayLink Dashboard                    │
                    │         React 18 + Vite + Lucide + Modern UI           │
                    └───────────────────────────┬────────────────────────────┘
                                                │ REST API (JWT Authenticated)
                                                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                               PayLink Node.js / Express Core                             │
│                                                                                          │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌──────────────────────────────┐  │
│  │ Security Middleware   │  │ Validation & Currency │  │ Raw-Body HMAC Capture        │  │
│  │ Helmet, CORS, RateLim │  │ Integer minor units   │  │ crypto.timingSafeEqual       │  │
│  └───────────────────────┘  └───────────────────────┘  └──────────────────────────────┘  │
│                                                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              Provider Adapter Layer                                │  │
│  │   ┌───────────────────┐    ┌───────────────────┐    ┌──────────────────────────┐   │  │
│  │   │  Stripe Adapter   │    │ Razorpay Adapter  │    │    Cashfree Adapter      │   │  │
│  │   │  (Hosted Checkout)│    │  (Links API v1)   │    │   (PG Orders/Links v2)   │   │  │
│  │   └───────────────────┘    └───────────────────┘    └──────────────────────────┘   │  │
│  │   ┌────────────────────────────────────────────────────────────────────────────┐   │  │
│  │   │              Interactive Demo Provider (Public Payment Simulator)          │   │  │
│  │   └────────────────────────────────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────┬──────────────────────────────────────────────┘
                                            │ Mongoose ODM
                                            ▼
                    ┌────────────────────────────────────────────────────────┐
                    │                   MongoDB Database                     │
                    │   User • PaymentLink • PaymentTransaction •            │
                    │           WebhookEvent • AuditLog                      │
                    └────────────────────────────────────────────────────────┘
```

---

## 2. Key Capabilities & Product Features

- **Multi-Gateway Payment Link Creation:**
  - Dynamic gateway selection: Stripe, Razorpay, or Cashfree.
  - Per-gateway currency constraints and minimum amount enforcement (e.g., USD \$0.50 for Stripe, INR ₹1.00 for Razorpay & Cashfree).
  - Client-side and server-side validation for amounts, email formats, and link expiration.
  - Real-time link preview card reflecting live user inputs.
- **Unified Operational Dashboard:**
  - Real-time financial KPI metrics: Total Volume, Active Links, Successful Collections, Conversion Rate.
  - Gateway-wise volume breakdowns and conversion metrics.
  - Date filtering (7D, 30D, 90D, All Time) and gateway isolation filters.
- **Link Management & Tracking:**
  - Search links by customer name, email, or description.
  - Filter by status (`pending`, `paid`, `failed`, `expired`, `cancelled`) and provider.
  - Pagination, column sorting, and instant copy-to-clipboard.
  - Real-time gateway status synchronization (`POST /api/payment-links/:id/sync`).
  - Safe cancellation with confirmation modal (`POST /api/payment-links/:id/cancel`).
- **Comprehensive Audit Trail & Event Timeline:**
  - Tracks complete lifecycle: `created` ➔ `webhook_received` ➔ `status_changed` ➔ `link_synced` ➔ `cancelled`.
  - Transaction attempt logs showing UTR / reference IDs, method breakdown (UPI, card, netbanking), and gateway response codes.
- **Customer Payment Experience:**
  - Direct checkout URLs for live gateways (Stripe Checkout sessions, Razorpay Links, Cashfree Links).
  - Built-in `/pay/preview/:linkId` simulator enabling full end-to-end checkout demonstrations (Simulate Success, Simulate Failure) triggering verified webhooks in real time.
- **Gateways & Security Settings:**
  - Live status cards for all three gateways with masked API keys (`sk_test_...abcd`, `rzp_test_...1234`).
  - Webhook listener endpoints with one-click copy.
  - Strict secret isolation: zero credentials leaked in responses, bundles, or logs.

---

## 3. Payment Gateway Provider Differences

PayLink honors the genuine architectural differences and API mechanics of each provider instead of pretending they are identical:

| Feature / Metric | Stripe | Razorpay | Cashfree | PayLink Demo Provider |
| :--- | :--- | :--- | :--- | :--- |
| **API Mechanism** | Checkout Sessions (`stripe.checkout.sessions.create`) | Payment Links v1 (`razorpay.paymentLink.create`) | PG Orders & Payment Links API v2 | Local State Machine & Simulator |
| **Primary Currencies** | USD, EUR, GBP, INR, CAD, AUD, etc. (135+) | INR, USD, EUR, GBP | INR (Domestic Indian Rupee) | All (USD, EUR, GBP, INR) |
| **Webhook Signature Header** | `stripe-signature` (`t=...,v1=...`) | `x-razorpay-signature` | `x-webhook-signature` & `x-webhook-timestamp` | `x-demo-signature` |
| **Verification Method** | `stripe.webhooks.constructEvent` with raw buffer | HMAC-SHA256 of raw body payload | HMAC-SHA256 of `timestamp + rawBody` | Constant-time HMAC |
| **Status Mapping: Success** | `checkout.session.completed` ➔ `paid` | `payment_link.paid` ➔ `paid` | `PAYMENT_SUCCESS_WEBHOOK` ➔ `paid` | `payment.succeeded` ➔ `paid` |
| **Status Mapping: Failure** | `checkout.session.expired` ➔ `expired` | `payment_link.cancelled` ➔ `cancelled` | `PAYMENT_FAILED_WEBHOOK` ➔ `failed` | `payment.failed` ➔ `failed` |
| **UPI Handling** | Non-standard / international card focus | Native UPI, QR, VPA Reminders | Native UPI Intent, Collect, dynamic QR | Simulated UPI / Cards |

---

## 4. Mandatory Security Implementations

PayLink treats financial and application security as first-class architectural constraints:

### 1. Insecure Direct Object Reference (IDOR) Defense
- All private resource queries and mutations strictly mandate merchant ownership:
  ```js
  const link = await PaymentLink.findOne({ _id: linkId, userId: req.user._id });
  if (!link) throw new NotFoundError('Payment link not found or access denied');
  ```
- Cross-user tests verify that User B cannot view, sync, or cancel User A's payment links (returns HTTP 404).

### 2. Raw Body Preservation & HMAC Signature Verification
- Node JSON parsers normally mutate payload strings into objects, breaking cryptographic HMAC checks.
- PayLink uses an explicit body buffer capture in `backend/src/app.js`:
  ```js
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  });
  ```
- Webhook signatures are compared using `crypto.timingSafeEqual` to eliminate side-channel timing attacks.

### 3. Safe Integer Minor-Unit Arithmetic
- Financial calculations never use native floating-point numbers (`0.1 + 0.2 !== 0.3`).
- All amounts are converted to integer minor units (cents / paise) upon ingestion:
  ```js
  toMinorUnits(10.50, 'USD') // => 1050
  toMajorUnits(1050, 'USD')   // => 10.50
  ```
- Zero-decimal currencies (e.g. JPY, KRW) are safely mapped without unit multiplication.

### 4. Webhook Idempotency & Replay Attack Defense
- Webhook events are tracked in a dedicated `WebhookEvent` collection with unique compound indexes `(provider, eventId)`.
- Replay attacks or duplicate network retries from providers are safely acknowledged without double-processing or state corruption.
- Cashfree and Stripe timestamp checks enforce a 5-minute replay window tolerance.

### 5. Sensitive Data Sanitization & Logging
- Secrets, passwords, card numbers, and tokens are completely scrubbed from logs via `backend/src/utils/logger.js`.
- Error handler never leaks stack traces or database driver specifics to the client.

---

## 5. Directory Structure

```
upi_payment/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment configuration & gateway status
│   │   ├── controllers/     # Route controllers (Auth, PaymentLink, Webhook, Dashboard, Settings)
│   │   ├── database/        # Mongoose connection & sample seed script
│   │   ├── middleware/      # Auth (JWT), IDOR, validation, rateLimiter, errorHandler
│   │   ├── models/          # User, PaymentLink, PaymentTransaction, WebhookEvent, AuditLog
│   │   ├── providers/       # Gateway Adapter Factory (Stripe, Razorpay, Cashfree, Demo)
│   │   ├── routes/          # Express route declarations
│   │   ├── services/        # Business logic & payment reconciliation
│   │   ├── utils/           # Currency conversions, sanitized logger, crypto signatures
│   │   ├── app.js           # Express app setup with rawBody verification
│   │   └── server.js        # Server listener
│   └── tests/               # 8 Automated Test Suites (Unit + Integration)
│       ├── unit/            # currency, providers, validation tests
│       └── integration/     # auth, paymentLinks, idor, webhooks, dashboard tests
├── docs/
│   ├── IMPLEMENTATION_PLAN.md
│   └── SECURITY_REVIEW.md
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client with JWT interceptor
│   │   ├── components/      # Badges, StatCards, Timeline, Modals, Navbar, Sidebar
│   │   ├── context/         # AuthContext & ToastContext
│   │   ├── pages/           # Dashboard, Links, CreateLink, LinkDetail, Settings, PublicPayPreview, Auth
│   │   └── styles/          # Modern SaaS Slate & Indigo design system
│   ├── index.html
│   └── vite.config.js
├── .env.example             # Documented environment template
├── package.json             # Root monorepo orchestration
└── README.md                # Project documentation
```

---

## 6. API Reference

### Authentication
- `POST /api/auth/register` — Create merchant account (`name`, `email`, `password`)
- `POST /api/auth/login` — Sign in and obtain JWT
- `GET /api/auth/me` — Retrieve active merchant profile

### Payment Links
- `POST /api/payment-links` — Create a new multi-gateway payment link
- `GET /api/payment-links` — List links with search, status/gateway/date filters, and pagination
- `GET /api/payment-links/:id` — Get single payment link with customer and attempt metadata
- `POST /api/payment-links/:id/sync` — Synchronize status with external gateway
- `POST /api/payment-links/:id/cancel` — Cancel active payment link
- `GET /api/payment-links/:id/events` — Fetch complete audit history and transaction attempts

### Webhooks (Raw Body HMAC Verified)
- `POST /api/webhooks/stripe` — Stripe Checkout webhook handler (`stripe-signature`)
- `POST /api/webhooks/razorpay` — Razorpay webhook handler (`x-razorpay-signature`)
- `POST /api/webhooks/cashfree` — Cashfree webhook handler (`x-webhook-signature`, `x-webhook-timestamp`)
- `POST /api/webhooks/demo` — Simulator webhook for instant local test triggers

### Dashboard & Settings
- `GET /api/dashboard/summary` — KPI metrics, conversion rates, and gateway breakdowns
- `GET /api/settings` — Gateway health, masked API keys, and webhook endpoints

---

## 7. Setup & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or MongoDB Atlas URI

### Step 1: Install Dependencies
```bash
# Install both backend and frontend dependencies
npm run install:all
```

### Step 2: Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default values work out-of-the-box with Demo Mode fallback enabled. To connect live gateway sandboxes, add your Stripe test keys, Razorpay key/secret, or Cashfree App ID/Secret.

### Step 3: Seed Sample Demo Data
```bash
npm run seed
```
Creates default demo merchant account:
- **Email:** `merchant@paylink.dev`
- **Password:** `Password123!`
- Generates sample payment links across Stripe, Razorpay, Cashfree, and Demo provider with complete transaction histories.

### Step 4: Run Applications
Open two terminals or run monorepo scripts:

```bash
# Terminal 1: Start Backend (Port 5000)
npm run dev:backend

# Terminal 2: Start Frontend (Port 5173)
npm run dev:frontend
```

Access the dashboard at [http://localhost:5173](http://localhost:5173).

---

## 8. Automated Testing

PayLink includes 8 automated test suites covering unit logic and end-to-end integration flows:

```bash
npm test
```

### Test Coverage Highlights:
1. `currency.test.js`: Integer minor unit conversions and zero-decimal currencies.
2. `providers.test.js`: Stripe, Razorpay, Cashfree, and Demo adapter contracts.
3. `validation.test.js`: Amount minimums, currency rules, and email formatting.
4. `auth.test.js`: Registration, login, invalid passwords, and token verification.
5. `paymentLinks.test.js`: Link creation, pagination, sync, and cancellation.
6. `idor.test.js`: Strict tenant isolation; cross-user link access prevention.
7. `webhooks.test.js`: HMAC signature verification, raw body integrity, idempotency, and replay protection.
8. `dashboard.test.js`: Financial summary aggregation and date/gateway filtering.
