const express = require('express');
const router = express.Router();
const paymentLinkController = require('../controllers/paymentLink.controller');
const { requireAuth } = require('../middleware/auth');
const { validateCreatePaymentLink } = require('../validators/paymentLink.validator');
const { linkCreateLimiter } = require('../middleware/rateLimiter');

// Public endpoints
router.get('/public/:id', paymentLinkController.getPublicLink);
router.post('/public/:id/simulate', linkCreateLimiter, paymentLinkController.simulateDemoPayment);

// Authenticated Merchant endpoints
router.use(requireAuth);

router.post('/', linkCreateLimiter, validateCreatePaymentLink, paymentLinkController.createLink);
router.get('/', paymentLinkController.listLinks);
router.get('/:id', paymentLinkController.getLinkById);
router.post('/:id/sync', paymentLinkController.syncLinkStatus);
router.post('/:id/cancel', paymentLinkController.cancelLink);
router.get('/:id/events', paymentLinkController.getLinkEvents);

module.exports = router;
