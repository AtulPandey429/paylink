const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');
const { webhookLimiter } = require('../middleware/rateLimiter');

router.use(webhookLimiter);

router.post('/stripe', webhookController.handleStripeWebhook);
router.post('/razorpay', webhookController.handleRazorpayWebhook);
router.post('/cashfree', webhookController.handleCashfreeWebhook);
router.post('/demo', webhookController.handleDemoWebhook);

module.exports = router;
