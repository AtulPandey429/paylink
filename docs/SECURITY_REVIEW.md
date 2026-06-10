# PayLink Security Architecture & Threat Model Review

## 1. Overview
PayLink is designed with a defense-in-depth security posture, specifically tailored to handle multi-gateway payment orchestration while mitigating critical risks including fraud, unauthorized status mutation, replay attacks, parameter tampering, and credential leakage.

---

## 2. Threat Vector Analysis & Mitigations

| Threat / Vulnerability | Vector / Scenario | PayLink Mitigation | Status |
| :--- | :--- | :--- | :--- |
| **Insecure Direct Object Reference (IDOR)** | User A crafts an API request with User B's `linkId` to view customer PII or cancel their link. | All link queries enforce `{ _id: linkId, userId: req.user._id }`. Attempts to access another user's link return a sanitized `404 Not Found`. | **Mitigated** |
| **Webhook Spoofing / Forgery** | Attacker sends a forged JSON POST to `/api/webhooks/*` stating a transaction is `PAID`. | **Cryptographic Signature Verification**: Stripe (`stripe-signature`), Razorpay (`x-razorpay-signature`), Cashfree (`x-webhook-signature`). Payloads without valid HMAC signatures are immediately rejected with `400 Bad Request`. | **Mitigated** |
| **Webhook Replay Attack** | Attacker intercepts a valid webhook and replays it multiple times. | **Idempotent Event Log**: Every incoming event ID/idempotency key is stored in the `WebhookEvent` collection with unique indexing. Replayed events return `200 OK` without re-processing state. | **Mitigated** |
| **Concurrency Race Condition (TOCTOU)** | Simultaneous duplicate webhook deliveries arrive in the same millisecond before initial database write finishes. | **Atomic Insert-First Lock**: `WebhookEvent.create()` runs up-front. MongoDB unique constraint on `idempotencyKey` throws Mongo error `11000` on concurrent duplicates, immediately locking out concurrent threads. | **Mitigated (SEC-02)** |
| **Non-Deterministic Webhook Event IDs** | Gateway payloads lacking explicit IDs fall back to timestamps or random numbers, bypassing idempotency on retries. | **Deterministic Fallback Calculation**: Razorpay, Cashfree, and Demo adapters compute deterministic SHA-256 digests over immutable payload fields (`orderId`, `paymentId`, `status`, `amount`). | **Mitigated (SEC-01)** |
| **Out-of-Order Webhook Delivery** | A `paid` event arrives *after* a manual sync, or an `expired` event arrives after a `paid` event. | **State Machine Transition Guard**: Statuses follow a strict state machine: `pending -> paid`, `pending -> cancelled`, `pending -> expired`. Terminal states (`paid`) cannot be downgraded to `pending` or `failed`. | **Mitigated** |
| **Amount Tampering (Client-Side Trust)** | Client browser tries to pass an altered amount upon completion. | **Zero Client Trust**: Link amounts are generated server-side in integer minor units (cents/paise) and verified strictly against the gateway's captured webhook payload. | **Mitigated** |
| **Client-Side Proof of Payment Spoofing** | User alters redirect URL parameters (e.g. `?status=paid`) to claim successful payment. | **Authoritative Server Verification**: `PaymentSuccess.jsx` queries the server API directly and polls the authoritative backend database status, ignoring client-side query parameters. | **Mitigated (SEC-04)** |
| **Floating-Point Arithmetic Drift** | Rounding errors in JavaScript `0.1 + 0.2 = 0.30000000000000004` resulting in fractional cent mismatch. | All financial computations are conducted using integer minor currency units (e.g. 1500 = $15.00 / ₹15.00) using the centralized `currency.js` utility. | **Mitigated** |
| **NoSQL Injection** | Attacker passes `{ "$gt": "" }` in username/link ID parameters. | Explicit schema validation (Joi/Zod), strict ObjectId casting, and sanitization before querying Mongoose. | **Mitigated** |
| **Credential / Secret Leakage** | API keys or webhook secrets leaked in frontend bundles, error stack traces, or server logs. | Gateway credentials exist exclusively in server environment variables. A dedicated logging sanitizer strips sensitive authorization headers, tokens, and keys. Client settings endpoints return strictly masked keys (e.g. `sk_test_...abcd`). | **Mitigated** |
| **Denial of Service (DoS) / Simulator Abuse** | Flooding authentication, payment link creation, or demo simulator endpoints. | Tiered rate limiting using `express-rate-limit`: Strict limiter on `/api/auth`, standard limiter on link generation, and rate limiting on `/public/:id/simulate`. | **Mitigated (SEC-03)** |
| **Open Redirect / Deep-Link Protocol Injection** | Malicious redirect parameters with `javascript:` or external phishing URLs. | Centralized `deepLink.js` sanitizes redirect URLs, rejecting non-HTTP/HTTPS protocols and unsafe external domains. | **Mitigated** |
| **PCI-DSS Scope Minimization** | Storage or handling of raw cardholder numbers (PAN) or CVV. | **SAQ-A Compliance**: PayLink NEVER touches, receives, or stores raw card data. All payments are delegated to gateway-hosted checkout pages (Stripe Checkout, Razorpay Standard Checkout, Cashfree PG). | **Mitigated** |

---

## 3. Webhook Signature Verification Specifications

### 3.1 Stripe Webhook Verification
- Header: `stripe-signature` (contains timestamp `t` and signature `v1`)
- Algorithm: HMAC-SHA256
- Critical requirement: Requires the untouched raw Buffer of the HTTP request body.
- Implementation: `stripe.webhooks.constructEvent(req.rawBody, sigHeader, endpointSecret)`

### 3.2 Razorpay Webhook Verification
- Header: `x-razorpay-signature`
- Algorithm: HMAC-SHA256
- Computation: `crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex')`
- Verification: Constant-time comparison using `crypto.timingSafeEqual`
- Deterministic event ID fallback: `sha256(paymentId + orderId + status)`

### 3.3 Cashfree Webhook Verification
- Headers: `x-webhook-signature`, `x-webhook-timestamp`
- Algorithm: HMAC-SHA256 with Base64 encoding
- Computation: `crypto.createHmac('sha256', clientSecret).update(timestamp + req.rawBody).digest('base64')`
- Verification: Constant-time comparison using `crypto.timingSafeEqual`
- Deterministic event ID fallback: `sha256(orderId + paymentId + status)`

---

## 4. Authentication & Session Strategy
- **Mechanism**: JSON Web Tokens (JWT) signed with HMAC-SHA256 using a high-entropy secret.
- **Production Secret Validation**: In production mode, server startup fails if `JWT_SECRET` is less than 32 characters or uses the insecure development fallback.
- **Payload**: Minimal claims (`{ userId, email, role }`). Expiration set to 24 hours.
- **Passwords**: Hashed using `bcryptjs` with a work factor of 12 rounds.
- **Transport**: Standard `Authorization: Bearer <token>` header over TLS/HTTPS.
