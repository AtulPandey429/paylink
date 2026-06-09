const express = require('express');
const router = express.Router();
const { apiLimiter } = require('../middleware/rateLimiter');

const webhookRoutes = require('./webhook.routes');
const authRoutes = require('./auth.routes');
const paymentLinkRoutes = require('./paymentLink.routes');
const dashboardRoutes = require('./dashboard.routes');
const settingsRoutes = require('./settings.routes');

// Webhook endpoints mounted first with high-throughput limiter
router.use('/webhooks', webhookRoutes);

// Rate limiter for standard API endpoints
router.use(apiLimiter);

// Application resource routes
router.use('/auth', authRoutes);
router.use('/payment-links', paymentLinkRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;
