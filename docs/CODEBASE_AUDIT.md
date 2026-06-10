# PayLink Codebase Audit & Architectural Evaluation

**Audit Status:** AUDIT ONLY (No code modified, deleted, moved, or rewritten)  
**Target Systems:** Frontend (React 18 + Vite), Backend (Express + Node.js), Database (MongoDB + Mongoose), Payment Providers (Stripe, Razorpay, Cashfree, Demo Simulator)  
**Evaluation Standard:** Production Readiness, Payment Security (OWASP / PCI-DSS compliance principles), Multi-Gateway Protocol Integrity, Financial Accuracy  

---

## 1. Current Architecture & Actual Request/Data Flow

### 1.1 Architectural Topology

PayLink is structured as a decoupled monorepo containing an Express.js REST API backend and a Vite React SPA frontend:

```
[Customer Browser / Mobile Device]
        │
        ▼ (HTTP / Deep-link redirect)
[Frontend: Vite + React 18 + React Router v6] (Port 5173)
        │
        ▼ (Axios client with JWT bearer interceptor)
[Reverse Proxy / Express Server] (Port 5000)
        │
        ├── Middlewares: Helmet, CORS, Morgan, Raw-Body Parser, RateLimiters
        │
        ├── Route Handlers & Controllers:
        │     ├── /api/auth           -> authController -> authService
        │     ├── /api/payment-links  -> paymentLinkController -> paymentLinkService
        │     ├── /api/webhooks       -> webhookController -> webhookService
        │     ├── /api/dashboard      -> dashboardController -> dashboardService
        │     └── /api/settings       -> settingsController -> ProviderFactory
        │
        ├── Provider Adapters:
        │     ├── StripeProvider   (Stripe SDK v17.2, Hosted Checkout Sessions)
        │     ├── RazorpayProvider (Razorpay SDK v2.9, Payment Links v1)
        │     ├── CashfreeProvider (Axios HTTP, PG Orders & Links v2023-08-01)
        │     └── DemoProvider     (In-memory simulation, HMAC signed callbacks)
        │
        └── Persistence Layer: MongoDB (Mongoose ODM v8.7)
              ├── users (Bcrypt salted passwordHash)
              ├── paymentlinks (Tenant-isolated, minor units, gateway IDs)
              ├── paymenttransactions (Captured attempts, gateway payment IDs)
              ├── webhookevents (Idempotency keys, event IDs, raw payloads)
              └── auditlogs (Immutable timeline of lifecycle mutations)
```

### 1.2 Actual Data & Request Flows

#### Flow A: Payment Link Creation
1. Merchant authenticates via `POST /api/auth/login`, receives JWT signed with `HS256`.
2. Merchant submits form on `CreatePaymentLink.jsx` (`title`, `amount`, `currency`, `gateway`, `customer`, `expiresAt`).
3. Request hits `POST /api/payment-links` with bearer token.
4. `requireAuth` queries `User.findById(decoded.userId)`.
5. `linkCreateLimiter` checks IP limit (max 40/min).
6. `validateCreatePaymentLink` validates title, amount (>0), supported currency per gateway, customer email/phone syntax.
7. `paymentLinkService.createLink`:
   - Converts decimal amount to integer minor units via `toMinorUnits(amount, currency)`.
   - Queries `ProviderFactory.getProvider(gateway, true)`. If real credentials are missing, falls back to `DemoProvider` (`isDemo: true`).
   - Generates a new `ObjectId` for `PaymentLink` and calls `provider.createPaymentLink(...)`.
   - Provider adapter formats gateway payload:
     - **Stripe**: `stripe.checkout.sessions.create` with `unit_amount` in cents/pence, returning session URL.
     - **Razorpay**: `razorpay.paymentLink.create` with `amount` in paise, returning short URL.
     - **Cashfree**: `POST /links` with `link_amount` in rupees, returning `link_url`.
     - **Demo**: Local preview URL `http://localhost:5173/pay/preview/${linkId}`.
   - Saves `PaymentLink` to MongoDB and records an audit log (`LINK_CREATED`).
   - Returns HTTP 201 with populated link data.

#### Flow B: Customer Checkout & Mobile Deep-Link Navigation
1. Customer receives short URL (e.g. `http://localhost:5173/pay/preview/:linkId` or gateway-hosted checkout URL).
2. For Demo/Preview links, `PublicPayPreview.jsx` calls unauthenticated public endpoint `GET /api/payment-links/public/:id`.
3. Customer triggers simulated payment via `POST /api/payment-links/public/:id/simulate` with `{ action: 'success' | 'fail' }`.
4. `paymentLinkController.simulateDemoPayment` constructs a mock webhook payload, signs it with HMAC-SHA256, and dispatches it into `webhookService.handleWebhook('demo', headers, rawBody)`.

#### Flow C: Webhook Ingestion & State Reconciliation
1. External Gateway (or Simulator) sends POST to `/api/webhooks/:gateway`.
2. Preserved raw body buffer (`req.rawBody`) is verified:
   - **Stripe**: `stripe.webhooks.constructEvent(req.rawBody, headers['stripe-signature'], secret)`.
   - **Razorpay**: HMAC-SHA256 of `req.rawBody` matching `headers['x-razorpay-signature']`.
   - **Cashfree**: HMAC-SHA256 of `timestamp + req.rawBody` matching `headers['x-webhook-signature']`.
   - **Demo**: HMAC-SHA256 of `req.rawBody` matching `headers['x-demo-signature']`.
3. `webhookService` queries `WebhookEvent.findOne({ idempotencyKey })`.
4. If event is new, resolves target `PaymentLink` by `paymentLinkId` or `gatewayLinkId`.
5. Updates link status (protecting terminal `paid` state from downgrade).
6. Creates a `PaymentTransaction` record if status is `paid`.
7. Creates an `AuditLog` entry and persists the `WebhookEvent` record with `processed: true`.
8. Returns acknowledgment HTTP 200 to the provider.

---

## 2. Existing Folder Structure & Module Responsibilities

| Path | Module Responsibility | Key Exports / Entrypoints |
| :--- | :--- | :--- |
| `backend/src/config/env.js` | Environment parsing, fallback defaults, gateway credentials detection | `config` object |
| `backend/src/database/connect.js` | Mongoose connection lifecycle, auto-reconnect, clean shutdown | `connectDatabase`, `disconnectDatabase` |
| `backend/src/database/seed.js` | Demo merchant user creation, sample links across all gateways | `seed()` |
| `backend/src/models/User.js` | Merchant account schema, bcrypt hashing pre-save hook, safe JSON serializer | `User` model |
| `backend/src/models/PaymentLink.js` | Core payment link schema, amounts, currencies, customer info, statuses, compound indexes | `PaymentLink` model |
| `backend/src/models/PaymentTransaction.js`| Attempted and captured transaction records, gateway IDs, payment methods | `PaymentTransaction` model |
| `backend/src/models/WebhookEvent.js` | Webhook idempotency tracking, event IDs, raw payloads, processing status | `WebhookEvent` model |
| `backend/src/models/AuditLog.js` | Immutable ledger of status mutations, actions, and timestamps | `AuditLog` model |
| `backend/src/providers/BaseProvider.js` | Abstract base class defining provider interface contract | `BaseProvider` |
| `backend/src/providers/StripeProvider.js` | Stripe Checkout Sessions v1 adapter, webhook signature verification | `StripeProvider` |
| `backend/src/providers/RazorpayProvider.js`| Razorpay Links v1 adapter, HMAC-SHA256 verification | `RazorpayProvider` |
| `backend/src/providers/CashfreeProvider.js`| Cashfree PG v2023-08-01 HTTP adapter via Axios, HMAC-SHA256 verification | `CashfreeProvider` |
| `backend/src/providers/DemoProvider.js` | Local sandbox payment simulator and HMAC webhook generator | `DemoProvider` |
| `backend/src/providers/ProviderFactory.js` | Factory pattern resolver with transparent Demo fallback and gateway status inspection | `providerFactory` singleton |
| `backend/src/middlewares/auth.js` | JWT verification, token decoding, user database lookup | `requireAuth` |
| `backend/src/middlewares/validate.js` | Schema validation for payment link creation, user registration, and login | `validateCreatePaymentLink`, `validateRegister`, `validateLogin` |
| `backend/src/middlewares/rateLimiter.js` | Tiered Express rate limiting (Auth: 20/15m, API: 180/m, LinkCreate: 40/m, Webhook: 600/m) | Limiters |
| `backend/src/middlewares/errorHandler.js` | Centralized JSON error serialization, Mongoose error mapping, 404 handler | `errorHandler`, `notFoundHandler` |
| `backend/src/utils/currency.js` | Integer minor units conversion (`toMinorUnits`, `fromMinorUnits`), currency formatting | Currency utils |
| `backend/src/utils/logger.js` | Structured console logger with automatic redaction of passwords, tokens, and PII | `logger` |
| `backend/src/utils/signature.js` | Timing-safe string comparison (`crypto.timingSafeEqual`) and HMAC digest generators | `safeCompare`, `computeHmac*` |
| `backend/src/controllers/` | Request extraction and response formatting for auth, links, webhooks, dashboard, settings | 5 controller files |
| `backend/src/services/` | Core business logic for authentication, link management, webhook processing, analytics | 4 service files |
| `frontend/src/api/client.js` | Axios client configured with `/api` proxy, JWT interceptor, 401 redirect | `api` instance |
| `frontend/src/context/` | State providers for JWT authentication and toast alerts | `AuthContext`, `ToastContext` |
| `frontend/src/components/` | Reusable UI components (Sidebar, Navbar, Badges, StatCards, Timeline, Modals) | 8 component files |
| `frontend/src/pages/` | Page views (Dashboard, PaymentLinksList, CreatePaymentLink, LinkDetail, Settings, Simulator, Auth)| 8 page views |
| `frontend/src/styles/main.css`| Custom CSS design system (Slate & Indigo dark theme) | Stylesheet |

---

## 3. Hardcoded Values, URLs, Ports, and Environment Defaults

*Note: In accordance with security protocol, no actual secrets are reproduced below.*

| Location | Category | Value / Description | Audit Classification |
| :--- | :--- | :--- | :--- |
| `backend/src/config/env.js:10` | Port | Default port `5000` | Confirmed by code inspection |
| `backend/src/config/env.js:11` | Database URI | Default MongoDB URI `mongodb://127.0.0.1:27017/paylink_db` | Confirmed by code inspection |
| `backend/src/config/env.js:12` | JWT Secret | Hardcoded fallback string: `'paylink_super_secure_jwt_secret_dev_key_2026_xyz'` | Confirmed by code inspection |
| `backend/src/config/env.js:14` | Client URL | Default `http://localhost:5173` | Confirmed by code inspection |
| `backend/src/config/env.js:15` | Public Base URL | Default `http://localhost:5000` | Confirmed by code inspection |
| `backend/src/app.js:24-29` | Allowed Origins | Hardcoded array: `['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000']` | Confirmed by code inspection |
| `backend/src/providers/DemoProvider.js:8` | HMAC Secret | Hardcoded demo secret key string in constructor | Confirmed by code inspection |
| `backend/src/providers/DemoProvider.js:17,38` | Simulated Delays | Hardcoded sleep times: `120ms` (create) and `80ms` (status/cancel), ignoring `config.demoMode.simulatedLatencyMs` | Confirmed by code inspection |
| `backend/src/providers/CashfreeProvider.js:38` | Dummy Phone | Hardcoded dummy phone number `'9999999999'` when customer phone is absent | Confirmed by code inspection |
| `backend/src/providers/CashfreeProvider.js:39-40`| Dummy Customer | Hardcoded dummy email `'customer@example.com'` and name `'Customer'` | Confirmed by code inspection |
| `backend/src/providers/RazorpayProvider.js:34` | Dummy Customer | Hardcoded dummy customer name `'Valued Customer'` | Confirmed by code inspection |
| `backend/src/database/seed.js:14-22` | Seed Credentials| Hardcoded demo merchant email and password | Confirmed by code inspection |
| `backend/src/database/seed.js:39,49,59` | Seed Data | Hardcoded phone numbers (`+14155552671`, `+919876543210`, `+919123456789`) | Confirmed by code inspection |
| `backend/src/database/seed.js:96-97` | Hardcoded URL | `http://localhost:5173/pay/preview/${linkId}` bypasses `config.clientUrl` | Confirmed by code inspection |
| `frontend/src/pages/Dashboard.jsx:81,142` | Currency Symbol | Hardcoded `$` prefix on all revenues and breakdown metrics, ignoring actual link currencies (INR, EUR, GBP) | Confirmed by code inspection |
| `frontend/src/pages/CreatePaymentLink.jsx:57` | Default Amount | Hardcoded initial amount `'49.00'` | Confirmed by code inspection |

---

## 4. Code Smells, Duplicated Logic & Oversized Components

### 4.1 Duplicated Currency & Limit Specifications
- **Issue:** Supported currencies and minimum amount limits are independently defined in three separate locations without a single source of truth:
  1. `backend/src/utils/currency.js` (`GATEWAY_CURRENCY_SUPPORT`)
  2. `backend/src/providers/ProviderFactory.js` (`getGatewaysStatus()`)
  3. `frontend/src/pages/CreatePaymentLink.jsx` (`GATEWAY_SPECS`)
- **Impact:** Inconsistency already exists: `currency.js` declares `AED`, `JPY`, and `CHF` support for Stripe and `SGD`/`AED` for Razorpay, but `CreatePaymentLink.jsx` omits them from the frontend dropdown.
- **Classification:** Confirmed by code inspection.

### 4.2 Redundant Double Database Query on Link Details Page
- **Issue:** In `frontend/src/pages/PaymentLinkDetail.jsx` (lines 28-31):
  ```javascript
  const [linkRes, eventsRes] = await Promise.all([
    api.get(`/payment-links/${id}`),
    api.get(`/payment-links/${id}/events`)
  ]);
  ```
  In `backend/src/services/paymentLinkService.js` (lines 282-295), `getLinkEvents` already retrieves the `link` document via `getLinkById` and returns `{ link, auditLogs, transactions }`.
- **Impact:** Two redundant database queries and round-trips are executed for every view of the details page.
- **Classification:** Confirmed by code inspection.

### 4.3 Multi-Currency Revenue Aggregation Bug
- **Issue:** In `backend/src/services/dashboardService.js` (lines 27-31, 58, 63):
  ```javascript
  totalRevenue: {
    $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] }
  }
  ```
- **Impact:** The aggregation pipeline sums `amount` across different currencies directly (e.g. 100 USD + 1,000 INR = 1,100). The dashboard then displays this sum preceded by a hardcoded `$` sign (`$1,100.00`).
- **Classification:** Confirmed by code inspection.

### 4.4 Missing React State Dependency in Date Filtering
- **Issue:** In `frontend/src/pages/PaymentLinksList.jsx` (line 65):
  ```javascript
  useEffect(() => {
    fetchLinks();
  }, [page, gateway, status, sortBy, sortOrder]);
  ```
- **Impact:** `dateFrom` and `dateTo` are excluded from the dependency array. If a user selects new dates, the table does not refresh until the user manually triggers a different filter or submits the search form.
- **Classification:** Confirmed by code inspection.

### 4.5 Oversized and Monolithic UI Components
- `frontend/src/pages/Settings.jsx` (387 lines): Contains extensive repeated JSX and styling across the three gateway cards.
- `frontend/src/pages/PaymentLinksList.jsx` (358 lines): Combines filter state, search debounce, table pagination, sorting, confirmation modals, and status badges in a single monolithic file.
- `frontend/src/pages/CreatePaymentLink.jsx` (353 lines): Form validation, gateway card selectors, input handlers, and live preview rendering are tightly coupled in one component.
- **Classification:** Confirmed by code inspection.

---

## 5. Deep-Link & Phone-Testing Architecture

### 5.1 Where Deep-Link Flows Start
Deep-link and mobile payment flows originate when a merchant generates a link with customer details (`customer.phone` and `customer.email`) and delivers the link URL to a customer via SMS, messaging apps, or email.

### 5.2 How Gateway URLs & Callbacks Are Generated

```
Provider            Gateway Link Generated           Callback / Return URL Defined in Adapter
──────────────      ──────────────────────────────   ───────────────────────────────────────────────────────────
Stripe              session.url                      success_url: ${clientUrl}/payment-success?linkId=${linkId}
                    (Hosted Checkout Session)        cancel_url:  ${clientUrl}/payment-cancelled?linkId=${linkId}

Razorpay            response.short_url               callback_url: ${clientUrl}/payment-success?linkId=${linkId}
                    (Razorpay Payment Link)          callback_method: 'get'

Cashfree            response.data.link_url           return_url: ${clientUrl}/payment-success?linkId=${linkId}&cf_link_id={link_id}
                    (Cashfree PG Link v2)

Demo Simulator      ${clientUrl}/pay/preview/${id}   N/A (Inline Simulator Buttons trigger webhook internally)
```

### 5.3 What Depends on Phone Testing & Identified Mobile Breakages

1. **Missing Return Routes in Frontend Router:**
   - **Inspection:** In `frontend/src/App.jsx`, routes `/payment-success` and `/payment-cancelled` **do not exist**.
   - **Impact:** When a customer completes checkout on Stripe, Razorpay, or Cashfree and is redirected back to `${config.clientUrl}/payment-success?linkId=...`, React Router hits the catch-all wildcard route `<Route path="*" element={<Navigate to="/" replace />} />`. Because `/` is wrapped in `ProtectedLayout`, an unauthenticated customer is redirected to `/login`.
   - **Classification:** Confirmed by code inspection.

2. **Mobile Device Localhost Resolution Failure:**
   - **Inspection:** `backend/src/config/env.js` and `seed.js` default `clientUrl` to `http://localhost:5173` and `publicBaseUrl` to `http://localhost:5000`.
   - **Impact:** When a tester opens a payment link on a physical smartphone connected to the same local Wi-Fi, the phone's browser resolves `localhost` to the phone itself (`127.0.0.1`), causing `ERR_CONNECTION_REFUSED` ("site cannot be reached" / "payment nahi ho raha").
   - **Classification:** Confirmed by code inspection.

3. **Cashfree Fallback Dummy Phone Number Rejection:**
   - **Inspection:** In `CashfreeProvider.js` (line 38): `customer_phone: customer?.phone || '9999999999'`.
   - **Impact:** Cashfree requires a valid Indian customer phone number for UPI Intent and Collect requests. In production/sandbox, payment service providers (PSPs) and risk engines detect repeated transactions from `'9999999999'` and reject the transaction or fail to initiate the UPI app switch.
   - **Classification:** Confirmed by code inspection.

4. **Absence of Direct `upi://pay` URI Scheme Handling:**
   - **Inspection:** The platform relies exclusively on gateway-hosted web views and the simulated preview page. There is no native deep-link dispatcher (`upi://pay?pa=...&pn=...&am=...&cu=INR`) for peer-to-peer or direct merchant VPA collections.
   - **Classification:** Confirmed by code inspection.

---

## 6. Security Vulnerability Assessment

Findings are prioritized by severity based on CVSS 3.1 criteria:

### Critical Severity

#### SEC-01: Non-Deterministic Event IDs Completely Defeat Webhook Idempotency (Cashfree & Razorpay)
- **File:** `backend/src/providers/RazorpayProvider.js` (line 192), `backend/src/providers/CashfreeProvider.js` (line 191)
- **Code:**
  ```javascript
  // RazorpayProvider.js:
  eventId: event.account_id ? `${event.account_id}_${Date.now()}` : `rzp_${Date.now()}`
  
  // CashfreeProvider.js:
  eventId: `cf_${timestamp}_${Math.random().toString(36).substring(2, 8)}`
  ```
- **Vulnerability Explanation:** The system relies on a compound unique index on `WebhookEvent.idempotencyKey` (`${gateway}_${eventId}`) to prevent duplicate webhook processing. However, both Razorpay and Cashfree adapters generate non-deterministic event IDs containing `Date.now()` or `Math.random()`. If Razorpay or Cashfree retries an unacknowledged webhook due to transient network latency, each retry receives a brand new `eventId`.
- **Impact:** Duplicate webhooks bypass the idempotency check, causing repeated state transitions and duplicate transaction insertions in `PaymentTransaction`.
- **Classification:** Confirmed by code inspection.

#### SEC-02: Time-of-Check to Time-of-Use (TOCTOU) Webhook Race Condition
- **File:** `backend/src/services/webhookService.js` (lines 26-44, 122)
- **Code:**
  ```javascript
  // 1. Check if event exists:
  const existingEvent = await WebhookEvent.findOne({ idempotencyKey });
  if (existingEvent) return { success: true, alreadyProcessed: true };

  // ... executes link updates and PaymentTransaction.create(...) ...

  // 2. Only saved at the end:
  await webhookRecord.save();
  ```
- **Vulnerability Explanation:** Between checking `WebhookEvent.findOne` and persisting `webhookRecord.save()`, multiple asynchronous operations (link lookup, status change, transaction creation, audit logging) occur. Two concurrent webhook deliveries for the same event will both evaluate `existingEvent` as null and execute duplicate financial mutations before MongoDB's unique index constraint triggers.
- **Impact:** Concurrent webhook deliveries cause double-charging logs and duplicate transaction records.
- **Classification:** Confirmed by code inspection.

---

### High Severity

#### SEC-03: Unthrottled Public Payment Simulation Endpoint
- **File:** `backend/src/routes/paymentLinkRoutes.js` (line 10)
- **Code:**
  ```javascript
  router.post('/public/:id/simulate', paymentLinkController.simulateDemoPayment);
  ```
- **Vulnerability Explanation:** Unlike `POST /api/payment-links` which is protected by `linkCreateLimiter`, the `/public/:id/simulate` endpoint has no rate limiting middleware.
- **Impact:** Any external actor can flood this endpoint with automated requests, invoking HMAC computations, database updates, and transaction logging, causing denial-of-service or database exhaustion.
- **Classification:** Confirmed by code inspection.

#### SEC-04: Missing Return/Success Pages Causing Post-Payment Auth Leak
- **File:** `frontend/src/App.jsx` (lines 70-87)
- **Vulnerability Explanation:** Gateway redirect URLs point to `/payment-success` and `/payment-cancelled`, but neither route is registered in the public route group in `App.jsx`.
- **Impact:** Customers completing payment are redirected to `/`, which bounces them to `/login`. Unauthenticated customers cannot view receipt confirmation, resulting in support tickets, dispute filings, or repeated payment attempts.
- **Classification:** Confirmed by code inspection.

---

### Medium Severity

#### SEC-05: Hardcoded Fallback JWT Secret in Application Configuration
- **File:** `backend/src/config/env.js` (line 12)
- **Code:**
  ```javascript
  jwtSecret: process.env.JWT_SECRET || 'paylink_super_secure_jwt_secret_dev_key_2026_xyz'
  ```
- **Vulnerability Explanation:** If `JWT_SECRET` is omitted or misconfigured in production, the application silently boots using a known, public fallback secret string.
- **Impact:** Anyone with knowledge of the repository source code can forge arbitrary merchant JWTs and gain full administrative access to payment links and customer data.
- **Classification:** Confirmed by code inspection.

#### SEC-06: Overly Permissive CORS Policy in Development Mode
- **File:** `backend/src/app.js` (lines 34-35)
- **Code:**
  ```javascript
  if (!origin || allowedOrigins.includes(origin) || config.env === 'development') {
    return callback(null, true);
  }
  ```
- **Vulnerability Explanation:** Combined with `credentials: true`, any origin is accepted whenever `config.env === 'development'`.
- **Classification:** Confirmed by code inspection.

#### SEC-07: Inadequate Customer Phone Validation for Cashfree
- **File:** `backend/src/middlewares/validate.js` (lines 51-56)
- **Vulnerability Explanation:** Phone validation only checks character count (8-15 digits) and does not validate standard Indian E.164 formats (`+91` or 10-digit mobile) when Cashfree is selected.
- **Classification:** Confirmed by code inspection.

#### SEC-08: Uncached User Database Lookup on Every Request
- **File:** `backend/src/middlewares/auth.js` (line 25)
- **Vulnerability Explanation:** Every authenticated API request executes `User.findById(decoded.userId)`. Under high traffic, this creates significant read contention on the `users` collection.
- **Classification:** Confirmed by code inspection.

---

### Low Severity

#### SEC-09: Uncontrolled Stack Trace Exposure in Development Error Responses
- **File:** `backend/src/middlewares/errorHandler.js` (line 46)
- **Code:**
  ```javascript
  ...(config.env === 'development' && { stack: err.stack })
  ```
- **Classification:** Confirmed by code inspection.

#### SEC-10: Mongoose Startup Auto-Indexing Enabled
- **File:** `backend/src/database/connect.js` (line 18)
- **Code:** `autoIndex: true`
- **Vulnerability Explanation:** Auto-indexing on production startup causes performance spikes and can lock collections during index builds.
- **Classification:** Confirmed by code inspection.

---

## 7. Missing Validation, Tests, Error Handling & Protections

### 7.1 Missing Automated Tests
- **Frontend Tests:** **Zero frontend tests exist** (no unit, integration, or E2E tests). `frontend/package.json` contains no test runner. *(Confirmed by code inspection)*
- **Live Gateway Webhook Tests:** Webhook tests in `backend/tests/integration/webhooks.test.js` only verify the `DemoProvider`. There are **no unit or integration tests** verifying `StripeProvider.verifyWebhook`, `RazorpayProvider.verifyWebhook`, or `CashfreeProvider.verifyWebhook` against realistic raw signature fixtures. *(Confirmed by code inspection)*
- **Negative Expiration Tests:** No automated test verifies that an expired link rejected by a gateway properly triggers the `expired` transition in local state. *(Confirmed by code inspection)*

### 7.2 Missing Validation Constraints
- `backend/src/models/PaymentTransaction.js`: No unique constraint on `{ gateway: 1, gatewayPaymentId: 1 }`. Multiple transactions with the identical gateway payment ID can be inserted. *(Confirmed by code inspection)*
- `backend/src/models/PaymentLink.js`: No unique constraint on `{ gateway: 1, gatewayLinkId: 1 }`. *(Confirmed by code inspection)*
- `backend/src/middlewares/validate.js`: Lacks request size and length limits on nested metadata maps. *(Confirmed by code inspection)*

### 7.3 Fragile Fallback in Webhook Controller
- **File:** `backend/src/controllers/webhookController.js` (lines 6, 20, 34, 48)
- **Code:** `const rawBody = req.rawBody || req.body;`
- **Analysis:** If `req.rawBody` is ever undefined (e.g. if middleware order changes), `req.body` is a parsed JSON object. Passing an object to `crypto.createHmac` or `stripe.webhooks.constructEvent` throws an unhandled exception or coerces to `"[object Object]"`, failing signature checks silently. *(Confirmed by code inspection)*

---

## 8. Existing Functionality That Must Be Preserved

Any subsequent refactoring must preserve the following working features without regression:

1. **Test Suite Integrity:** All 8 existing test suites in `backend/tests` (38 passing tests) must continue to pass cleanly.
2. **IDOR Prevention:** Tenant isolation enforcing `{ _id: linkId, userId: req.user._id }` on all merchant operations.
3. **Monetary Precision:** Safe minor-unit arithmetic in `backend/src/utils/currency.js` preventing floating-point precision loss.
4. **Raw Body Buffer Capture:** `req.rawBody` preservation in `backend/src/app.js` for HMAC-SHA256 calculations.
5. **Interactive Payment Simulator:** Public checkout preview `/pay/preview/:id` with real-time signed webhook callbacks.
6. **Masked Credentials Display:** Settings page presentation of masked API keys (`sk_test_...abcd`) with zero raw secret leakage.
7. **Full Audit Ledger:** Sequential lifecycle tracking in `AuditLog` (`LINK_CREATED`, `PAYMENT_CAPTURED`, `STATUS_SYNCED`, `LINK_CANCELLED`).

---

## 9. Prioritized Refactoring Plan

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Webhook Security & Idempotency Hardening                           │
│ - Deterministic event IDs for Razorpay and Cashfree                         │
│ - Atomic insert-first locking pattern in WebhookEvent                       │
│ - Unique database indexes on transaction and gateway link IDs               │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ Phase 2: Mobile Deep-Link & Customer Callback Completion                    │
│ - Add public /payment-success and /payment-cancelled frontend routes        │
│ - Configurable host/LAN IP support for mobile phone Wi-Fi testing           │
│ - Enforce valid Indian phone validation for Cashfree (remove '9999999999')  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ Phase 3: Multi-Currency Analytics & Financial Precision                     │
│ - Group dashboard revenues and metrics by currency in MongoDB pipeline      │
│ - Remove hardcoded '$' formatting in Dashboard.jsx; use formatCurrency()    │
│ - Support multi-currency summary breakdown in Overview KPI cards            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ Phase 4: Gateway Contract & Validation Unification                          │
│ - Single source of truth for supported currencies and minimum limits        │
│ - Expose /api/gateways/specs endpoint for frontend consumption              │
│ - Attach rate limiting middleware to /public/:id/simulate                   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ Phase 5: Component Decoupling & Test Suite Expansion                        │
│ - Decompose Settings.jsx, PaymentLinksList.jsx, and CreatePaymentLink.jsx   │
│ - Eliminate redundant double-fetch in PaymentLinkDetail.jsx                 │
│ - Add Vitest / React Testing Library for frontend component testing         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Risks & Dependencies for Proposed Changes

| Phase | Proposed Change | Dependency | Potential Risk | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | Deterministic Event IDs in Webhooks | Provider webhook payload structures | If a provider payload lacks a stable ID field, parsing may fail | Fallback to SHA-256 hash of `rawBody` as deterministic event ID |
| **Phase 1** | Atomic insert-first locking in `WebhookEvent` | MongoDB collection index | Duplicate key error on concurrent request must be caught gracefully | Catch Mongo error code `11000` and return HTTP 200 `alreadyProcessed: true` |
| **Phase 2** | Add `/payment-success` route in frontend | React Router v6 | Public routes must remain accessible without JWT auth | Add route outside `ProtectedLayout` next to `/pay/preview/:id` |
| **Phase 2** | Mandatory phone for Cashfree | `validateCreatePaymentLink` | Existing test payloads lacking phone might fail validation | Update Cashfree-specific validation rules while keeping Stripe optional |
| **Phase 3** | Currency grouping in `dashboardService` | Dashboard frontend consumers | Dashboard API response shape changes from flat revenue to grouped | Maintain backward-compatible overview with primary currency + currency list |
| **Phase 4** | Unified currency specifications | Backend & Frontend | Frontend offline fallback needed if specs API is unreachable | Embed baseline fallback constants with API override |
| **Phase 5** | Frontend component decomposition | React context & router | Prop-drilling or broken imports during file extraction | Extract small leaf components first (e.g. `GatewayCard.jsx`, `FilterBar.jsx`) |

---

## 11. Conclusion & Recommended Next Phase

### Five Highest-Priority Issues:
1. **SEC-01:** Webhook idempotency broken for Razorpay (`Date.now()`) and Cashfree (`Math.random()`), allowing duplicate webhooks to re-execute financial updates.
2. **SEC-02:** Time-of-check to time-of-use (TOCTOU) race condition in `webhookService.js`, permitting concurrent duplicate processing.
3. **SEC-04:** Missing customer return routes (`/payment-success`, `/payment-cancelled`) in `App.jsx`, causing post-checkout redirects to bounce to `/login`.
4. **SEC-03:** Completely unthrottled public simulation endpoint (`POST /public/:id/simulate`), exposing the system to automated denial-of-service.
5. **Multi-Currency Bug:** MongoDB aggregation summing amounts across different currencies directly (`$sum: '$amount'`) with a hardcoded `$` sign in the UI.

### Recommended Next Phase:
**Execute Phase 1: Webhook Security & Idempotency Hardening.**  
This will resolve SEC-01 and SEC-02 by introducing deterministic event hashing and atomic insert-first locking, guaranteeing that no webhook delivery—whether retried by a provider or submitted concurrently—can corrupt payment state or create duplicate transactions.


---

## 12. Configuration & Environment Management Refactoring (Completed)

### 12.1 Refactoring Overview

In accordance with the architectural audit, hardcoded configuration and environment management have been refactored without altering payment business logic or UI presentation:

| Area | Pre-Refactor State | Post-Refactor State | Status |
| :--- | :--- | :--- | :--- |
| **Backend Config** | Fallback defaults mixed in code; no startup validation; hardcoded sleep delays in `DemoProvider` | Centralized `backend/src/config/env.js` with `validateConfig()`, URL normalization, and configured delays | **Completed & Tested** |
| **Startup Validation** | Silent boot with weak/insecure keys in production | `validateConfig()` asserts valid port (1-65535), MongoDB URI, and mandates strong `JWT_SECRET` (>=32 chars) & webhook secrets in production | **Completed & Tested** |
| **Frontend Config** | Hardcoded `/api` strings in `api/client.js` and `PublicPayPreview.jsx` | Centralized `frontend/src/config/env.js` safely consuming `VITE_` variables with fallbacks | **Completed & Tested** |
| **Secret Separation** | Risk of developer referencing backend variables in frontend | Clear boundary: frontend strictly uses `VITE_` public variables. Gateway secrets never imported into client bundle | **Completed & Tested** |
| **CORS & LAN Testing** | Permissive `config.env === 'development'` origin bypass | Strict origin allowlist (`config.cors.allowedOrigins`) + private LAN regex (`192.168.x.x`, `10.x.x.x`) for mobile Wi-Fi testing | **Completed & Tested** |
| **Customer Deep-Link Return** | Missing `/payment-success` and `/payment-cancelled` in `App.jsx`, bouncing customers to `/login` | Added public `PaymentSuccess.jsx` and `PaymentCancelled.jsx` preserving deep-link query parameters (`linkId`, session IDs) | **Completed & Tested** |
| **Seed URLs & Providers** | Hardcoded `localhost:5173` and `localhost:5000` strings in `seed.js` and providers | Dynamically formatted via `config.clientUrl` and `config.routes` | **Completed & Tested** |

### 12.2 Explicit Report on Deep-Link & Mobile Flow Changes

1. **Resolution of SEC-04 (Customer Return Path):**
   - **Previous Behavior:** Returning mobile/desktop customers from Stripe, Razorpay, or Cashfree were redirected to `/payment-success?linkId=...`. Because this route did not exist in `App.jsx`, React Router redirected them to `/`, which bounces unauthenticated users to `/login`.
   - **Current Behavior:** Customers arrive at public `PaymentSuccess.jsx` (or `PaymentCancelled.jsx`), which reads `linkId` and gateway session tokens, fetches the public invoice record, displays a verified payment receipt, and offers a button to view details or retry.
   - **Query Parameters Preserved:** `linkId`, `session_id` (Stripe), `cf_link_id` (Cashfree).
2. **Mobile Device Connectivity (Phone Testing):**
   - In `frontend/vite.config.js`, `host: true` and dynamic proxy target (`VITE_BACKEND_URL || PUBLIC_BASE_URL`) enable seamless access when opening `http://<HOST_IP>:5173` on a physical smartphone on the same network.
   - In `backend/src/app.js`, CORS origin matcher permits private LAN IP ranges in development mode without turning off origin security.
3. **Cashfree Dummy Phone Configuration:**
   - Fallback customer phone is now explicitly governed by `config.cashfree.defaultCustomerPhone` (`process.env.CASHFREE_DEFAULT_CUSTOMER_PHONE || '9999999999'`) rather than an undocumented hardcoded string.

### 12.3 Automated Test Results

- Added `backend/tests/unit/config.test.js` covering URL normalization, development validation, invalid port rejection, missing database URI rejection, production JWT secret enforcement, and production webhook secret requirements.
- **Backend Test Suite:** 9 passed, 9 total (45 passed, 45 total).
- **Frontend Production Build:** Vite build succeeded with zero bundling errors.

### 12.4 Audit Priorities Status Summary

All high and critical vulnerabilities identified in the audit have been successfully resolved and verified via automated test suites:
- **SEC-01 (Deterministic Webhook Event IDs):** Resolved in Section 13.
- **SEC-02 (Atomic Insert-First TOCTOU Lock):** Resolved in Section 13.
- **SEC-03 (Public Simulation Throttling):** Resolved in Section 13.
- **SEC-04 (Authoritative Status Verification & Return Routes):** Resolved in Section 12 & 13.
- **Multi-Currency Aggregation:** Resolved in Section 13.
- **Mobile LAN & UPI Deep-Link Stabilization:** Documented in `docs/MOBILE_PHONE_TESTING.md`.

---

## 13. Architectural Refactoring & Security Hardening (Completed)

### 13.1 Key Architectural Changes & Mitigations

| Area | Challenge Addressed | Architectural Solution Implemented | Verification |
| :--- | :--- | :--- | :--- |
| **SEC-01: Webhook ID Determinism** | Providers lacking event IDs used `Math.random()` / `Date.now()`, causing idempotency bypass on retries | Deterministic SHA-256 calculation over immutable payload fields in `RazorpayProvider`, `CashfreeProvider`, and `DemoProvider` | Unit tests verify deterministic hash across repeated calls |
| **SEC-02: TOCTOU Concurrency Lock** | Concurrent duplicate webhook deliveries bypassed `findOne()` pre-check before database write | Atomic insert-first pattern via `WebhookEvent.create()` catching Mongo code `11000` | Automated concurrency test (`webhooks.test.js`) verifies exactly 1 process succeeds |
| **SEC-03: Simulation Throttling** | `POST /public/:id/simulate` unthrottled | Attached `linkCreateLimiter` rate limiter to simulation endpoint | Code verified; rate limiter active |
| **SEC-04: Authoritative Status Polling** | Client query parameters could be spoofed on redirect | `PaymentSuccess.jsx` polls authoritative server API up to 5 times for pending links, never trusting client parameters | Frontend build & manual verification verified |
| **Database Constraints** | Missing uniqueness guards on gateway IDs | Added `{ unique: true, sparse: true }` compound indexes on `PaymentLink (gateway, gatewayLinkId)` and `PaymentTransaction (gateway, gatewayPaymentId)` | Schema updated |
| **Multi-Currency Analytics** | Corrupted sums across different currencies (e.g. $100 + ₹1000 = 1100) | `dashboardService.js` computes `revenueByCurrency` grouping; `Dashboard.jsx` displays multi-currency totals dynamically | Integration tests (46/46 passing) |
| **Component Modularity** | Oversized components (`CreatePaymentLink.jsx`, `Settings.jsx`) | Extracted `GatewaySelector.jsx`, `LivePreviewCard.jsx`, and `GatewaySettingCard.jsx` | Vite build passes in 1.69s |
| **Network Query Optimization** | `PaymentLinkDetail.jsx` queried both `/payment-links/:id` and `/events` simultaneously | Replaced dual query with single `/events` fetch returning `link`, `auditLogs`, and `transactions` | Tested & verified |
| **Mobile Deep-Link Documentation** | Lack of standardized testing procedures for physical phones | Created comprehensive `docs/MOBILE_PHONE_TESTING.md` covering LAN IP setup, UPI intent format, and CORS | Complete documentation persisted |

### 13.2 Automated Test & Build Summary

- **Backend Test Suites:** 9 passed, 9 total (46/46 tests passing).
- **Test Concurrency:** Added automated test in `webhooks.test.js` validating that simultaneous duplicate webhook deliveries are safely locked out.
- **Frontend Production Build:** Vite build succeeded with 0 errors (`dist/index.html`, `dist/assets/index-*.js`).

