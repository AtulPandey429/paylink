# PayLink — Mobile Phone Deep-Link & LAN Testing Guide

This guide details how to test PayLink on physical mobile devices (Android and iOS) over a local area network (LAN), explaining how UPI deep-linking, QR code generation, browser redirects, and webhook reconciliation operate in a development and staging environment.

---

## 1. Architecture Overview

When testing payment flows on physical smartphones, the application must handle two distinct scenarios:
1. **Delegated Hosted Checkout**: Gateway-hosted mobile checkout pages (Stripe Checkout, Razorpay Standard Checkout, Cashfree Webflow) rendered inside mobile browsers (Chrome, Safari).
2. **Native UPI Intent & Deep-Links (`upi://pay`)**: Native intent URLs invoked directly on mobile devices that launch installed payment apps (Google Pay, PhonePe, Paytm, BHIM, Navi, CRED).

```
+-------------------------------------------------------------------------+
|                              Physical Phone                             |
|  +---------------------------+            +--------------------------+  |
|  |     Mobile Browser        |            |   Native Payment App     |  |
|  |  (Chrome / Safari / PWA)  |            | (GPay / PhonePe / Paytm) |  |
|  +-------------+-------------+            +------------+-------------+  |
|                |                                       ^                |
|                | 1. Scan QR / Open Link                |                |
|                v                                       | 3. Intent URI  |
|  +-------------+-------------+                         |   (upi://pay)  |
|  |   PayLink Customer Preview| ------------------------+                |
|  |    (/pay/preview/:id)     |                                          |
|  +-------------+-------------+                                          |
+----------------|--------------------------------------------------------+
                 | 2. API Call (GET /api/payment-links/public/:id)
                 v
+-------------------------------------------------------------------------+
|                        Development Server (Host Machine)                |
|  +---------------------------+            +--------------------------+  |
|  |  Vite Frontend (Port 5173)|            | Express API (Port 5000)  |  |
|  |  Bound to 0.0.0.0 (LAN)   |            | Bound to 0.0.0.0 (LAN)   |  |
|  +---------------------------+            +--------------------------+  |
|                                                        ^                |
|                                                        | 4. Webhook     |
|                                           +------------+-------------+  |
|                                           | Webhook / Demo Simulator |  |
|                                           +--------------------------+  |
+-------------------------------------------------------------------------+
```

---

## 2. LAN Wi-Fi Configuration

For physical mobile devices connected to the same Wi-Fi network to communicate with your local development server, both the frontend and backend must bind to all network interfaces (`0.0.0.0`) and use your workstation's local private IP address.

### Step 1: Find Workstation Private LAN IP
- **Windows**: Open PowerShell and run `ipconfig`. Look for `IPv4 Address` under your active Wi-Fi adapter (typically `192.168.x.x` or `10.0.x.x`).
- **macOS / Linux**: Run `ifconfig` or `ip a` (look for `en0` or `wlan0`).

### Step 2: Configure Environment Variables
In `backend/.env`:
```env
PORT=5000
FRONTEND_URL=http://192.168.1.5:5173
PUBLIC_BASE_URL=http://192.168.1.5:5000
```

In `frontend/.env`:
```env
VITE_API_BASE_URL=http://192.168.1.5:5000/api
VITE_MERCHANT_PORTAL_URL=http://192.168.1.5:5173
```

### Step 3: Start Services with Host Binding
- **Backend**: Express binds to `0.0.0.0` or uses `process.env.PORT`.
- **Frontend (Vite)**: Run with `--host` flag:
  ```bash
  npm run dev -- --host 0.0.0.0
  ```
  Vite will display:
  ```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.5:5173/
  ```

### Step 4: Verify Firewall Configuration
Ensure Windows Defender or local OS firewalls permit incoming TCP connections on ports `5000` and `5173` from private subnets (`192.168.0.0/16` and `10.0.0.0/8`). In `backend/src/app.js`, CORS is pre-configured to allow local LAN origins automatically in development:
```javascript
const isDevLanOrigin = (origin) => {
  if (config.isProduction) return false;
  return /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin);
};
```

---

## 3. UPI Intent & Deep-Link Specification

India's Unified Payments Interface (UPI) supports direct app invocation via the `upi://pay` URI schema specified by NPCI (National Payments Corporation of India).

### Standard URI Format
```
upi://pay?pa={VPA}&pn={MerchantName}&am={Amount}&cu=INR&tn={TransactionNote}&tr={ReferenceId}
```

### Parameters Reference
| Parameter | Name | Requirement | Description |
|:---|:---|:---|:---|
| `pa` | Payee Address (VPA) | Required | Verified merchant UPI ID (e.g., `merchant@okaxis`, `rzp.paylink@icici`) |
| `pn` | Payee Name | Required | URL-encoded legal merchant business name (e.g., `PayLink%20Merchant`) |
| `am` | Amount | Required | Transaction amount formatted to 2 decimals (e.g., `100.00`) |
| `cu` | Currency | Required | Must be `INR` (UPI only processes Indian Rupee) |
| `tn` | Transaction Note | Optional | Invoice title or description shown in customer's payment app |
| `tr` | Transaction Reference | Optional | Unique order or link reference ID for reconciliation |

### Native Intent Generation Utility
The backend includes a centralized utility (`backend/src/utils/deepLink.js`):
```javascript
const { generateUpiDeepLink } = require('../utils/deepLink');

const upiLink = generateUpiDeepLink({
  pa: 'paylink.merchant@icici',
  pn: 'PayLink Merchant',
  am: 499.00,
  tn: 'Annual Subscription Invoice #102',
  tr: 'link_6ad5df62888b'
});
// Outputs: upi://pay?pa=paylink.merchant%40icici&pn=PayLink%20Merchant&am=499.00&cu=INR&tn=Annual%20Subscription%20Invoice%20%23102&tr=link_6ad5df62888b
```

---

## 4. Physical Mobile Testing Workflow

### Step-by-Step Test Execution

#### Step 1: Open Merchant Dashboard on Laptop / Desktop
1. Sign in to PayLink (`http://localhost:5173`).
2. Navigate to **Create Link** (`/links/new`).
3. Select **Razorpay**, **Cashfree**, or **Demo Simulator**.
4. Set amount (e.g., `₹50.00`), title, and click **Generate Payment Link**.

#### Step 2: Open Customer Payment Preview on Phone
1. From the Payment Link detail page, copy the Public Preview URL (e.g., `http://192.168.1.5:5173/pay/preview/6ad5df62888b`).
2. Alternatively, scan the QR code rendered on screen using your phone's camera.
3. The phone's browser will load the customer checkout page.

#### Step 3: Trigger Payment Flow
- **If Demo / Simulator**: Click "Simulate Successful Payment".
- **If Razorpay Test Mode**: Click "Proceed to Checkout". The Razorpay standard checkout will launch in test mode supporting test UPI IDs (`success@razorpay`) and test cards.
- **If Cashfree Sandbox**: Click "Proceed to Pay". Cashfree sandbox loads with simulated UPI and card flows.

#### Step 4: Verification of Authoritative Polling
1. Upon completing payment, the customer is redirected to:
   ```
   http://192.168.1.5:5173/payment-success?linkId=6ad5df62888b
   ```
2. The page displays the **"Verifying Settlement..."** polling spinner while querying the backend.
3. Once the webhook arrives and updates the MongoDB record to `status: 'paid'`, the page immediately transitions to the green **"Payment Completed"** card.
4. If someone visits `/payment-success?linkId=...` for an unpaid link, the authoritative guard prevents showing "Payment Completed" and displays **"Payment Processing"** or **"Payment Not Completed"**.

---

## 5. Mobile Browser & Security Differences

| Feature | Desktop Browser | Mobile Browser | Mobile Native App |
|:---|:---|:---|:---|
| **Protocol Handling** | `http://` / `https://` only | Prompts to open `upi://pay` in installed apps | Intercepts intents directly via OS intent filters |
| **Cross-Origin Restrictions** | Standard CORS | Mobile browsers enforce identical CORS policies | App WebView may require SSL/HTTPS |
| **Deep Link Fallbacks** | Shows raw QR code | Click-to-pay button triggers UPI chooser | Seamless app-to-app handoff |
| **Security Context** | Full DevTools inspection | Remote USB debugging via `chrome://inspect` | Encrypted keystore / Biometric auth |

---

## 6. Troubleshooting Common Issues

### Issue 1: Phone shows "Site can't be reached" (ERR_CONNECTION_TIMED_OUT)
- **Cause**: Phone and PC are not on the same Wi-Fi subnet, or workstation firewall blocks inbound port 5173/5000.
- **Fix**: Check `ipconfig` on host. Ping your PC's IP from a mobile network tool app. Temporarily allow Node.js through the OS firewall.

### Issue 2: "CORS error / NetworkError when attempting to fetch resource"
- **Cause**: Frontend is sending requests to `http://localhost:5000` instead of the workstation's LAN IP (`http://192.168.x.x:5000`).
- **Fix**: Ensure `VITE_API_BASE_URL` in `frontend/.env` points to your machine's private LAN IP.

### Issue 3: UPI App shows "Payment declined / Invalid merchant"
- **Cause**: Testing in sandbox mode using real banking UPI apps without live VPA credentials.
- **Fix**: Real UPI apps (Google Pay, PhonePe) validate VPAs with NPCI in production. For local testing without a live NPCI merchant account, use PayLink's **Demo Simulator** or gateway test sandboxes (`success@razorpay`).
