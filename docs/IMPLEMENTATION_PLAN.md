# PayLink: Multi-Gateway Payment Link Management Platform
## Implementation Plan & Architectural Blueprint

### 1. Executive Summary & Objective
**PayLink** is a production-grade, secure, multi-gateway payment link management platform built on the MERN stack (MongoDB, Express, React, Node.js). It manages payment link lifecycles across three payment aggregators:
1. **Stripe** (Global: Cards, Wallets, ACH/SEPA, 135+ currencies)
2. **Razorpay** (India & Global: UPI, Cards, Netbanking, Wallets)
3. **Cashfree** (India: UPI, Cards, Netbanking, PayLater)
4. **Demo / Mock Mode** (Realistic simulation for sandbox exploration without live merchant KYC credentials)

The platform adheres to strict payment application security standards: OWASP Top 10, PCI-DSS SAQ-A compliant link delegation (zero raw card/CVV storage), cryptographic webhook signature verification with replay protection, strict tenant/user isolation (preventing IDOR), rate-limiting, and sanitized structured logging.

---

### 2. Architecture Overview

```
                                  +-----------------------------+
                                  |     React 18 + Vite SPA     |
                                  | (Dashboard, Links, Details, |
                                  |   Settings, Demo Preview)   |
                                  +--------------+--------------+
                                                 | HTTPS / JWT
                                                 v
+-----------------------------------------------------------------------------------------------+
|                                      Express.js Backend                                       |
|                                                                                               |
|  [Security Middlewares]                                                                       |
|  - Helmet (CSP, HSTS)                                                                         |
|  - Express Rate Limit (Tiered: General, Auth, Webhooks, Link Creation)                        |
|  - Strict CORS Allowlist                                                                      |
|  - Raw Body Buffer Capturing (Required for Stripe, Razorpay & Cashfree Signature Verification)|
|  - JWT Authentication & RBAC Middleware                                                       |
|                                                                                               |
|  [Controllers & Services]                                                                     |
|  - Auth Controller (Register, Login, Profile)                                                 |
|  - PaymentLink Controller (Create, List, Get, Sync, Cancel)                                   |
|  - Dashboard Controller (Aggregates, Metrics, Time Series)                                    |
|  - Webhook Controller (Provider-specific Signature Verifiers & Idempotent Event Handlers)     |
|  - Settings Controller (Safe Gateway Masked Config & Health)                                  |
|                                                                                               |
|  [Payment Provider Layer (Factory Pattern)]                                                   |
|  - BaseProvider (Common Interface: createLink, getStatus, cancelLink, verifyWebhook)          |
|  - StripeProvider (Checkout Sessions / Payment Links API, constructEvent)                     |
|  - RazorpayProvider (Payment Links API, HMAC SHA256 Signature)                                |
|  - CashfreeProvider (PG Links API v2023-08-01, Base64 HMAC Timestamp Signature)               |
|  - DemoProvider (In-memory/DB Realistic Simulated Link and Webhook Generator)                 |
+------------------------------------------------+----------------------------------------------+
                                                 | Mongoose ORM
                                                 v
+-----------------------------------------------------------------------------------------------+
|                                      MongoDB Database                                         |
|                                                                                               |
|  Collections:                                                                                 |
|  - users (id, name, email, passwordHash, role, createdAt)                                     |
|  - payment_links (userId, title, amount, currency, gateway, gatewayLinkId, status, etc.)      |
|  - payment_transactions (linkId, gatewayPaymentId, amount, status, rawData, createdAt)       |
|  - webhook_events (eventId, gateway, eventType, idempotencyKey, processed, payload)           |
|  - audit_logs (userId, linkId, action, details, ipAddress, createdAt)                         |
+-----------------------------------------------------------------------------------------------+
```

---

### 3. Payment Provider Matrix & Nuances

| Feature / Attribute | Stripe | Razorpay | Cashfree | Demo Provider |
| :--- | :--- | :--- | :--- | :--- |
| **API Method** | Checkout Sessions / Payment Links | `/v1/payment_links` | `/pg/links` (v2023-08-01) | Internal Simulator |
| **Smallest Unit** | Cents/Pence (e.g. 1000 = $10.00) | Paise (e.g. 1000 = ₹10.00) | Decimal / Paise (e.g. 10.00) | Standard Minor Units |
| **Primary Currencies** | USD, EUR, GBP, INR, CAD, AUD | INR (Multi-currency supported) | INR | USD, EUR, INR, GBP |
| **Webhook Signature Header** | `stripe-signature` | `x-razorpay-signature` | `x-webhook-signature`, `x-webhook-timestamp` | `x-demo-signature` |
| **Signature Algorithm** | HMAC-SHA256 (t=timestamp, v1=sig) | HMAC-SHA256 (raw payload) | Base64 HMAC-SHA256 (timestamp + rawBody) | SHA256 Hash |
| **Cancellation Support** | Session expire API | `/v1/payment_links/:id/cancel` | `/pg/links/:id/cancel` | Direct Status Mutation |
| **Statuses** | `open`, `complete`, `expired` | `created`, `paid`, `cancelled`, `expired` | `ACTIVE`, `PAID`, `CANCELLED`, `EXPIRED` | `pending`, `paid`, `cancelled`, `expired` |

---

### 4. Normalized Status Model
To ensure client consistency without losing gateway fidelity, all statuses are mapped to a normalized enumeration:
- `pending`: Link active, waiting for payer action.
- `paid`: Payment successfully captured and verified.
- `failed`: Payment attempt was rejected or failed.
- `expired`: Link validity period ended without completion.
- `cancelled`: Link explicitly terminated by the merchant before payment.

Each link also stores `gatewayRawStatus` to preserve raw gateway data for diagnostics.

---

### 5. Implementation Phases & Task Tracker

- [x] **Phase A: Repository Audit, Architecture, & Security Plan**
  - [x] Inspect environment and verify prerequisites (Node v22, npm 10, MongoDB running).
  - [x] Draft `docs/IMPLEMENTATION_PLAN.md`.
  - [x] Draft `docs/SECURITY_REVIEW.md`.

- [ ] **Phase B: Backend Core Architecture & Database Models**
  - [ ] Initialize backend `package.json` with secure dependencies.
  - [ ] Implement database connection with retry & error handling (`backend/src/database/connect.js`).
  - [ ] Implement Mongoose models:
    - [ ] `User.js` (bcrypt hashing, JWT generation, strict schema)
    - [ ] `PaymentLink.js` (indexed by `userId`, `gatewayLinkId`, unique constraints)
    - [ ] `PaymentTransaction.js` (records payment attempts and captures)
    - [ ] `WebhookEvent.js` (idempotency key index, deduplication)
    - [ ] `AuditLog.js` (audit trail for status mutations and syncs)
  - [ ] Implement utility modules:
    - [ ] `currency.js` (safe integer minor unit conversion, formatting)
    - [ ] `logger.js` (sanitized logging, masking secrets and tokens)
    - [ ] `signature.js` (crypto verifiers)
  - [ ] Implement middlewares:
    - [ ] `auth.js` (JWT token verification, user context binding)
    - [ ] `validate.js` (Joi/Zod request validation schema)
    - [ ] `rateLimiter.js` (Express-rate-limit tiers)
    - [ ] `rawBody.js` (capture raw Buffer for webhook HMAC)
    - [ ] `errorHandler.js` (clean, non-leaking JSON error response)

- [ ] **Phase C: Payment Provider Integration Layer**
  - [ ] `BaseProvider.js`: Abstract provider class specifying interface contracts.
  - [ ] `StripeProvider.js`: Stripe SDK integration with Checkout Session / Payment Link, webhooks, and sync.
  - [ ] `RazorpayProvider.js`: Razorpay SDK / REST integration, HMAC signature, and cancel API.
  - [ ] `CashfreeProvider.js`: Cashfree PG v2023-08-01 REST integration, Base64 HMAC signature, and cancel API.
  - [ ] `DemoProvider.js`: Fallback / Demo provider simulating realistic payment workflows, checkout preview, and webhook simulation.
  - [ ] `ProviderFactory.js`: Factory returning the appropriate configured provider or Demo fallback.

- [ ] **Phase D: Business Services & API Routes**
  - [ ] `authService.js` & `authController.js` (Register, Login, Profile)
  - [ ] `paymentLinkService.js` & `paymentLinkController.js` (Create, List with pagination/search/filtering, GetById, SyncStatus, CancelLink)
  - [ ] `webhookService.js` & `webhookController.js` (Stripe, Razorpay, Cashfree, Demo webhook handlers with idempotency)
  - [ ] `dashboardService.js` & `dashboardController.js` (Metrics: total volume, success rate, gateway breakdown, recent transactions)
  - [ ] `settingsController.js` (Healthcheck, masked gateway credentials status, active environment)

- [ ] **Phase E: Modern Frontend Dashboard (React + Vite + Tailwind/Modern Design)**
  - [ ] Scaffold Vite React application with responsive layout and clean component hierarchy.
  - [ ] Authentication Context & Protected Route wrappers.
  - [ ] Navigation header, sidebar, user profile indicator, and environment badge.
  - [ ] Overview Dashboard:
    - [ ] KPI Stat Cards (Total Revenue, Total Links, Paid Conversion Rate, Pending)
    - [ ] Gateway Distribution & Performance Breakdown
    - [ ] Recent Payment Links Activity Table
  - [ ] Payment Link Creation:
    - [ ] Gateway selector (Stripe, Razorpay, Cashfree) with gateway-specific limits & currency helper
    - [ ] Amount, Currency, Description, Customer Name, Email, Phone, Expiry
    - [ ] Validation feedback & real-time preview card
  - [ ] Payment Link List View:
    - [ ] Search by Title, Customer, Gateway ID
    - [ ] Filters: Gateway (All, Stripe, Razorpay, Cashfree), Status (All, Pending, Paid, Cancelled, Expired), Date Range
    - [ ] Sorting & Pagination controls
  - [ ] Payment Link Details View:
    - [ ] Shareable link with one-click Copy button and external link launcher
    - [ ] Payment details & metadata cards
    - [ ] Interactive "Sync Status" button (queries gateway in real-time)
    - [ ] "Cancel Link" confirmation modal
    - [ ] Comprehensive Audit Log & Event Timeline
  - [ ] Public / Demo Payment Simulator View:
    - [ ] Realistic checkout page preview for created links
    - [ ] "Simulate Successful Payment" and "Simulate Failed Payment" action buttons that trigger real backend webhooks
  - [ ] Settings Page:
    - [ ] Gateway connection status cards (Stripe, Razorpay, Cashfree) with masked key preview (`sk_test_...XXXX`)
    - [ ] Webhook URL helper with one-click copy
    - [ ] Demo Mode indicator and toggle

- [ ] **Phase F: Automated Testing & Security Verification**
  - [ ] Unit tests for currency conversion, provider factory, and validation logic.
  - [ ] Integration tests for Auth endpoints (Register, Login, Bad Credentials).
  - [ ] Integration tests for Payment Link creation, listing, sorting, pagination.
  - [ ] Tenant isolation & IDOR tests (User A cannot access or cancel User B's link).
  - [ ] Webhook signature verification tests (valid signature accepted, invalid rejected with 400).
  - [ ] Webhook idempotency test (duplicate webhook delivers 200 without double-counting).
  - [ ] Run test suite with Jest / Supertest.

- [ ] **Phase G: Documentation, Production Build & Packaging**
  - [ ] Root `package.json` with unified build and dev commands.
  - [ ] Root `.env.example` with detailed annotations.
  - [ ] Comprehensive `README.md` containing architecture, gateway guides, setup instructions, security controls, and screenshots/API docs.
  - [ ] Verification of production builds (`npm run build`).
