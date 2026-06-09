const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);
router.get('/summary', dashboardController.getSummary);

module.exports = router;
