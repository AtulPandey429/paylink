const webhookService = require('../services/webhook.service');
const asyncHandler = require('../utils/asyncHandler');

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
  handleStripeWebhook,
  handleRazorpayWebhook,
  handleCashfreeWebhook,
  handleDemoWebhook
};
