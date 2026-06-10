# PayLink Backend Structure & Architecture Audit

**Author:** Senior Full-Stack & Payment Integration Architect  
**Date:** October 2026  
**Scope:** Complete Backend Codebase Inspection, Modular Decoupling, and Refactoring Plan  

---

## 1. Current Folder Structure and File Responsibilities

The current backend is located at `backend/src/` with accompanying tests in `backend/tests/`. Below is the complete inventory of all 38 files and their observed responsibilities in the actual codebase:

```text
backend/
├── src/
│   ├── app.js                          # Express application configuration, middleware mounting, CORS, rawBody verify
│   ├── server.js                       # Server entry point, database connection trigger, HTTP listener, graceful shutdown
│   │
│   ├── config/
│   │   └── env.js                      # Centralized environment variable loader, parser, and startup validation
│   │
│   ├── controllers/
│   │   ├── authController.js           # Merchant registration, login, and profile HTTP handling
│   │   ├── dashboardController.js      # Aggregated metrics and revenue summary HTTP handling
│   │   ├── paymentLinkController.js    # Payment link CRUD, sync, cancellation, events, and simulation HTTP handling
│   │   ├── settingsController.js       # Gateway status reporting and key-masking HTTP handling
│   │   └── webhookController.js        # Inbound webhook ingestion for Stripe, Razorpay, Cashfree, and Demo
│   │
│   ├── database/
│   │   ├── connect.js                  # Mongoose connection and disconnection lifecycle management
│   │   └── seed.js                     # Development database seeder with merchant and link records
│   │
│   ├── middlewares/
│   │   ├── auth.js                     # JWT Bearer token authentication and user verification middleware
│   │   ├── errorHandler.js             # Global Mongoose CastError, ValidationError, duplicate key 11000, and 500 handler
│   │   ├── rateLimiter.js              # Express rate limiters for auth, public APIs, link creation, and webhooks
│   │   └── validate.js                 # Express validation functions for links, registration, and login
│   │
│   ├── models/
│   │   ├── AuditLog.js                 # Immutable audit trail schema for all merchant and webhook events
│   │   ├── PaymentLink.js              # Payment link schema with compound indexes and status tracking
│   │   ├── PaymentTransaction.js       # Financial ledger schema with idempotency indexes and minor unit amounts
│   │   ├── User.js                     # Merchant user schema with bcrypt hashing and safe JSON serialization
│   │   └── WebhookEvent.js             # Webhook idempotency record schema with atomic insert-first locking
│   │
│   ├── providers/
│   │   ├── BaseProvider.js             # Abstract payment provider class defining standard interface
│   │   ├── CashfreeProvider.js         # Cashfree PG Orders v2 adapter, HMAC verification, and payload mapping
│   │   ├── DemoProvider.js             # Offline sandbox simulator with HMAC signature generation and verification
│   │   ├── ProviderFactory.js          # Factory resolving active gateway adapters or falling back to DemoProvider
│   │   ├── RazorpayProvider.js         # Razorpay Payment Links v1 adapter, deterministic event hashing, HMAC checks
│   │   └── StripeProvider.js           # Stripe Checkout Session adapter, official SDK client, webhook verification
│   │
│   ├── routes/
│   │   ├── authRoutes.js               # /api/auth endpoint declarations
│   │   ├── dashboardRoutes.js          # /api/dashboard endpoint declarations
│   │   ├── paymentLinkRoutes.js        # /api/payment-links endpoint declarations
│   │   ├── settingsRoutes.js           # /api/settings endpoint declarations
│   │   └── webhookRoutes.js            # /api/webhooks endpoint declarations
│   │
│   ├── services/
│   │   ├── authService.js              # User authentication, password verification, JWT generation
│   │   ├── dashboardService.js         # MongoDB aggregation pipeline for multi-currency metrics and conversion
│   │   ├── paymentLinkService.js       # Business logic for link lifecycle, tenant isolation, and status queries
│   │   └── webhookService.js           # Atomic idempotency locking, event routing, and ledger reconciliation
│   │
│   └── utils/
│       ├── currency.js                 # Integer minor unit arithmetic (toMinorUnits/fromMinorUnits) and currency tables
│       ├── deepLink.js                 # NPCI upi://pay URI generator, URL validator, and sensitive log sanitizer
│       ├── logger.js                   # Structured logging with secret sanitization and severity levels
│       └── signature.js                # Cryptographic timing-safe HMAC-SHA256 helpers
│
└── tests/
    ├── setup.js                        # Global Jest test database setup, teardown, and collection wiper
    ├── integration/
    │   ├── auth.test.js                # Supertest tests for registration, login, and JWT validation
    │   ├── dashboard.test.js           # Integration tests for revenue aggregation and filters
    │   ├── idor.test.js                # Multi-tenant IDOR access control enforcement tests
    │   ├── paymentLinks.test.js        # Supertest tests for link creation, listing, cancellation, and sync
    │   └── webhooks.test.js            # Supertest tests for HMAC verification, replays, and concurrent locks
    └── unit/
        ├── config.test.js              # Unit tests for configuration parsing and validation
        ├── currency.test.js            # Unit tests for floating-point precision and minor unit conversion
        ├── providers.test.js           # Unit tests for provider factory and demo provider
        └── validation.test.js          # Unit tests for input validation middleware
```

---

## 2. Structural Problems Found with Real File Paths

1. **Folder Naming & Architecture Conventions (`src/middlewares/` vs `src/middleware/`):**
   - The plural `src/middlewares/` contradicts modern Node/Express conventions where standard infrastructure directories are singular (`src/middleware/`, `src/config/`).
2. **Database Module Isolation (`src/database/connect.js` vs `src/config/database.js`):**
   - `src/database/connect.js` creates an extra directory purely for a single connection utility. Database connection options, pooling, and lifecycle configuration naturally belong in `src/config/database.js` alongside `src/config/env.js`.
3. **Route Mounting Sprawl in `src/app.js`:**
   - In `src/app.js` (lines 93–102), five separate route files are individually imported and mounted onto Express. This clutters the application configuration. A centralized `src/routes/index.js` should bundle and export the API router.
4. **Inconsistent File Naming Conventions:**
   - Routes: `authRoutes.js`, `paymentLinkRoutes.js` (CamelCase with `Routes` suffix).
   - Controllers: `authController.js`, `paymentLinkController.js` (CamelCase with `Controller` suffix).
   - Services: `authService.js`, `paymentLinkService.js` (CamelCase with `Service` suffix).
   - Providers: `BaseProvider.js`, `RazorpayProvider.js` (PascalCase).
   - Target convention: Dot-separated classification (`paymentLink.routes.js`, `paymentLink.controller.js`, `paymentLink.service.js`, `razorpay.provider.js`), which makes files instantly distinguishable in IDE tabs and searches.
5. **Validation Coupling in `src/middlewares/validate.js`:**
   - `validate.js` blends validation rule logic for payment links, user registration, and login into a single monolithic file. Separating schema rules into `src/validators/paymentLink.validator.js` and `src/validators/auth.validator.js` isolates external contract requirements.
6. **Repetitive Controller Boilerplate (`try / catch / next(error)`):**
   - Every single method in `src/controllers/*.js` contains identical 4-line `try { ... } catch (error) { next(error); }` blocks. Introducing `src/utils/asyncHandler.js` eliminates this duplication completely.
7. **Lack of Standardized Operational Error Class (`AppError`):**
   - Services currently instantiate generic `new Error('...')` and manually attach `error.statusCode = 404`. Introducing `src/utils/AppError.js` provides a standardized operational error abstraction with status codes and operational flags.
8. **Leaked Business Logic in `src/controllers/paymentLinkController.js`:**
   - Lines 95–138 of `paymentLinkController.js` instantiate `new DemoProvider()`, synthesize simulated payloads, calculate signatures, and call `webhookService` directly inside the controller. This orchestration logic belongs in `paymentLinkService.simulatePayment()`.
9. **Provider Factory Export Pattern:**
   - `src/providers/ProviderFactory.js` is imported as an arbitrary file path instead of using standard index export (`src/providers/index.js`), which should expose the clean provider resolution interface.

---

## 3. Existing Functionality & Dependencies That Must Be Preserved

1. **Security & Financial Integrity:**
   - Integer minor units (`toMinorUnits` / `fromMinorUnits`) preventing floating-point precision loss.
   - Strict merchant ownership checks (`{ _id: id, userId: req.user._id }`) preventing IDOR on all queries and mutations.
   - Atomic insert-first TOCTOU lock (`WebhookEvent.create()` with unique compound index) preventing concurrent double-crediting.
   - Constant-time HMAC-SHA256 signature verification (`crypto.timingSafeEqual`) on all webhooks.
   - `req.rawBody` buffer capture in `app.js` required for webhook signature calculation.
2. **Multi-Gateway Abstraction & Fallbacks:**
   - Stripe Checkout Sessions integration.
   - Razorpay Payment Links v1 integration with deterministic SHA-256 event ID generation.
   - Cashfree PG Orders v2 integration.
   - `DemoProvider` fallback when remote gateway credentials are not configured.
3. **Mobile Deep-Linking & Public Checkout:**
   - NPCI `upi://pay` URI schema generation.
   - Public link retrieval (`/api/payment-links/public/:id`) without merchant authentication.
   - Authoritative polling status verification on `/payment-success`.
4. **Test Suite Integrity:**
   - All 9 test suites and 46 tests across `tests/unit/` and `tests/integration/` must pass without modifications to their testing expectations.

---

## 4. Proposed Clean, Modern Architecture

```text
backend/
├── src/
│   ├── app.js                          # Express app configuration & middleware
│   ├── server.js                       # Server bootstrap & graceful shutdown
│   │
│   ├── config/
│   │   ├── env.js                      # Centralized environment configuration & validation
│   │   └── database.js                 # Mongoose connection & disconnection management
│   │
│   ├── routes/
│   │   ├── index.js                    # Central API router combining all sub-routes
│   │   ├── auth.routes.js              # /api/auth routes
│   │   ├── paymentLink.routes.js       # /api/payment-links routes
│   │   ├── webhook.routes.js           # /api/webhooks routes
│   │   ├── dashboard.routes.js         # /api/dashboard routes
│   │   └── settings.routes.js          # /api/settings routes
│   │
│   ├── controllers/
│   │   ├── auth.controller.js          # Auth HTTP controller (using asyncHandler)
│   │   ├── paymentLink.controller.js   # PaymentLink HTTP controller (using asyncHandler)
│   │   ├── webhook.controller.js       # Webhook HTTP controller
│   │   ├── dashboard.controller.js     # Dashboard HTTP controller
│   │   └── settings.controller.js      # Settings HTTP controller
│   │
│   ├── services/
│   │   ├── auth.service.js             # Merchant authentication & JWT service
│   │   ├── paymentLink.service.js      # Payment link business rules & simulation orchestration
│   │   ├── webhook.service.js          # Idempotent webhook processing & ledger reconciliation
│   │   └── dashboard.service.js        # Aggregation & metrics calculation service
│   │
│   ├── providers/
│   │   ├── index.js                    # Factory & provider registry export
│   │   ├── base.provider.js            # BaseProvider abstract class
│   │   ├── stripe.provider.js          # Stripe SDK adapter
│   │   ├── razorpay.provider.js        # Razorpay SDK adapter
│   │   ├── cashfree.provider.js        # Cashfree REST API adapter
│   │   └── demo.provider.js            # Sandbox simulator adapter
│   │
│   ├── models/
│   │   ├── AuditLog.js                 # Audit trail schema
│   │   ├── PaymentLink.js              # Payment link schema
│   │   ├── PaymentTransaction.js       # Transaction ledger schema
│   │   ├── User.js                     # Merchant user schema
│   │   └── WebhookEvent.js             # Webhook event schema
│   │
│   ├── middleware/
│   │   ├── auth.js                     # JWT authorization middleware
│   │   ├── errorHandler.js             # Global error handler with AppError support
│   │   ├── notFound.js                 # 404 handler
│   │   ├── rateLimiter.js              # Express rate limiters
│   │   └── validateRequest.js          # Middleware executing validator schemas
│   │
│   ├── validators/
│   │   ├── auth.validator.js           # Register & login validation schemas
│   │   └── paymentLink.validator.js    # Create payment link validation schema
│   │
│   ├── utils/
│   │   ├── AppError.js                 # Standard operational error class
│   │   ├── asyncHandler.js             # Async controller wrapper removing try/catch
│   │   ├── currency.js                 # Minor unit conversion utilities
│   │   ├── deepLink.js                 # UPI deep link & safe logging utilities
│   │   ├── logger.js                   # Central structured logger
│   │   └── signature.js                # HMAC signature verification utilities
│   │
│   └── database/
│       └── seed.js                     # Database seeding script (kept for npm run seed)
│
└── tests/
    ├── setup.js
    ├── integration/
    └── unit/
```

---

## 5. File-Move and Refactoring Migration Plan

| Step | Action | Source File | Target File | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Create | - | `src/utils/AppError.js` | Operational error class with statusCode. |
| **2** | Create | - | `src/utils/asyncHandler.js` | Eliminates try/catch boilerplate across controllers. |
| **3** | Move | `src/database/connect.js` | `src/config/database.js` | Unifies configuration and database connection lifecycle. |
| **4** | Move | `src/middlewares/` | `src/middleware/` | Standardizes directory naming to singular form. |
| **5** | Extract | From `validate.js` | `src/validators/paymentLink.validator.js` | Isolates link payload validation schema. |
| **6** | Extract | From `validate.js` | `src/validators/auth.validator.js` | Isolates user authentication validation schema. |
| **7** | Create | - | `src/middleware/validateRequest.js` | Generic schema runner middleware. |
| **8** | Split | `src/middlewares/errorHandler.js` | `src/middleware/errorHandler.js` & `notFound.js` | Clean separation of 404 route handling from 500 error interception. |
| **9** | Rename | `src/providers/*.js` | `*.provider.js` & `index.js` | Standardizes provider naming; exports factory from `providers/index.js`. |
| **10** | Rename | `src/services/*Service.js` | `*.service.js` | Consistent dot-separated naming convention. |
| **11** | Rename | `src/controllers/*Controller.js` | `*.controller.js` | Consistent dot-separated naming convention; wraps with `asyncHandler`. |
| **12** | Refactor | `simulateDemoPayment` | `src/services/paymentLink.service.js` | Relocates simulation orchestration from controller into service. |
| **13** | Rename | `src/routes/*Routes.js` | `*.routes.js` | Consistent dot-separated naming convention. |
| **14** | Create | - | `src/routes/index.js` | Central router aggregation for `/api`. |
| **15** | Update | `src/app.js` & `src/server.js` | - | Mounts centralized router and updated middleware paths. |
| **16** | Update | Tests & Seed script | - | Updates all relative import references across test suites. |

---

## 6. Risks, Mitigation, and Verification Steps

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Broken Relative Imports** | App fails to boot (`MODULE_NOT_FOUND`) | Step-by-step migration; update imports immediately and verify with `node src/server.js` test boot. |
| **Webhook Buffer Parsing Alteration** | HMAC signatures fail (`Invalid signature`) | Maintain exact `verify: (req, res, buf) => { req.rawBody = buf; }` in `app.js`. |
| **Test Suite Breakage** | CI/CD failures | Run `npm test` after each phase; provide backwards-compatible proxy shims if needed. |
| **Route Path Mutation** | Frontend API breaks | Strict adherence to existing URL contracts (`/api/auth`, `/api/payment-links`, `/api/webhooks`, `/api/dashboard`, `/api/settings`). |
| **Double-Counting Webhooks** | Financial balance corruption | Atomic TOCTOU compound unique index on `WebhookEvent (gateway, eventId)` preserved identically. |

---

## 7. Refactoring Execution & Verification Results

All 16 steps of the refactoring migration plan have been completed and verified:

1. **Architecture & Modularization:**
   - Database connection management moved to `src/config/database.js`.
   - Global router aggregated under `src/routes/index.js`.
   - Provider factory exported from `src/providers/index.js`.
   - Controllers simplified using `asyncHandler` with 0 try/catch boilerplate.
   - Simulation business logic moved into `src/services/paymentLink.service.js`.
   - Validation schemas extracted to `src/validators/`.
   - Middleware unified under `src/middleware/`.
2. **Automated Test Results:**
   - Command: `npm test`
   - Test Suites: 9 passed, 9 total (100%)
   - Tests: 46 passed, 46 total (100%)
3. **Database Seeding Execution:**
   - Command: `npm run seed`
   - Result: Connected, seeded demo merchant & sample records, and disconnected cleanly with 0 errors.
4. **Server Startup Boot Test:**
   - Command: `node -e "..."`
   - Result: Successful boot on port 5005, DB connection established, clean shutdown.
5. **Frontend Compatibility:**
   - Command: `npm run build`
   - Result: Vite production build succeeded in 3.63s with 0 errors.

