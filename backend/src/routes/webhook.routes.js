const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');
const { webhookLimiter } = require('../middleware/rateLimiter');

router.use(webhookLimiter);

// Unified webhook endpoints supporting both:
// 1. Parameterized: POST /api/webhooks/:platform (e.g. /api/webhooks/razorpay, /api/webhooks/stripe, /api/webhooks/cashfree)
// 2. Query param: POST /api/webhooks?platform=razorpay
// 3. Auto-detected single endpoint: POST /api/webhooks
router.post('/', webhookController.handleUnifiedWebhook);
router.post('/:platform', webhookController.handleUnifiedWebhook);

module.exports = router;
