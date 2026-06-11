const webhookService = require('../services/webhook.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/**
 * Automatically detects payment gateway from request headers, query params, or payload structure.
 */
function detectGateway(req) {
  // 1. Explicit query or body override (?gateway=razorpay or ?provider=stripe)
  const explicit = req.query?.gateway || req.query?.provider || req.body?.gateway || req.body?.provider;
  if (explicit && ['razorpay', 'stripe', 'cashfree', 'demo'].includes(String(explicit).toLowerCase())) {
    return String(explicit).toLowerCase();
  }

  // 2. HTTP Header inspection (100% reliable for standard webhooks)
  const headers = req.headers || {};
  if (headers['x-razorpay-signature']) return 'razorpay';
  if (headers['stripe-signature']) return 'stripe';
  if (headers['x-webhook-signature'] || headers['x-cashfree-signature']) return 'cashfree';
  if (headers['x-demo-signature']) return 'demo';

  // 3. Payload inspection heuristic fallback
  try {
    const rawStr = Buffer.isBuffer(req.rawBody)
      ? req.rawBody.toString('utf8')
      : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));
    const payload = JSON.parse(rawStr);

    if (payload.entity === 'event' || (payload.event && Array.isArray(payload.contains))) {
      return 'razorpay';
    }
    if (payload.object === 'event' && payload.data) {
      return 'stripe';
    }
    if (payload.type && (payload.type.includes('WEBHOOK') || payload.type.includes('PAYMENT_'))) {
      return 'cashfree';
    }
    if (payload.isDemo || payload.demo) {
      return 'demo';
    }
  } catch (err) {
    // Ignore JSON parse errors
  }

  return null;
}

/**
 * Single unified webhook endpoint for all payment gateways.
 * Auto-detects the provider and delegates to the appropriate verification adapter.
 */
const handleUnifiedWebhook = asyncHandler(async (req, res) => {
  const gateway = detectGateway(req);
  if (!gateway) {
    throw new AppError(
      'Unable to identify payment gateway provider from webhook headers or payload. Ensure standard signature headers are present, or use ?gateway=razorpay|stripe|cashfree|demo',
      400
    );
  }

  const rawBody = req.rawBody || req.body;
  const result = await webhookService.handleWebhook(gateway, req.headers, rawBody);

  if (gateway === 'razorpay') {
    return res.json({ status: 'ok', gateway, ...result });
  } else if (gateway === 'stripe') {
    return res.json({ received: true, gateway, ...result });
  } else if (gateway === 'cashfree') {
    return res.json({ status: 'SUCCESS', gateway, ...result });
  }
  return res.json({ success: true, gateway, ...result });
});

const handleStripeWebhook = asyncHandler(async (req, res) => {
  const rawBody = req.rawBody || req.body;
  const result = await webhookService.handleWebhook('stripe', req.headers, rawBody);
  res.json({ received: true, ...result });
});

const handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const rawBody = req.rawBody || req.body;
  const result = await webhookService.handleWebhook('razorpay', req.headers, rawBody);
  res.json({ status: 'ok', ...result });
});

const handleCashfreeWebhook = asyncHandler(async (req, res) => {
  const rawBody = req.rawBody || req.body;
  const result = await webhookService.handleWebhook('cashfree', req.headers, rawBody);
  res.json({ status: 'SUCCESS', ...result });
});

const handleDemoWebhook = asyncHandler(async (req, res) => {
  const rawBody = req.rawBody || req.body;
  const result = await webhookService.handleWebhook('demo', req.headers, rawBody);
  res.json({ success: true, ...result });
});

module.exports = {
  detectGateway,
  handleUnifiedWebhook,
  handleStripeWebhook,
  handleRazorpayWebhook,
  handleCashfreeWebhook,
  handleDemoWebhook
};
