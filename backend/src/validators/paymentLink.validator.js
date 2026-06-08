const { GATEWAY_CURRENCY_SUPPORT } = require('../utils/currency');

/**
 * Validates request payload for creating payment links.
 */
function validateCreatePaymentLink(req, res, next) {
  const { title, amount, currency, gateway, customer, expiresAt } = req.body;
  const errors = [];

  // Title validation
  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    errors.push('Title/description must be at least 3 characters long');
  } else if (title.trim().length > 200) {
    errors.push('Title cannot exceed 200 characters');
  }

  // Amount validation
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    errors.push('Amount must be a positive number greater than 0');
  }

  // Gateway validation
  const validGateways = ['stripe', 'razorpay', 'cashfree', 'demo'];
  const cleanGateway = String(gateway || '').toLowerCase().trim();
  if (!cleanGateway || !validGateways.includes(cleanGateway)) {
    errors.push(`Gateway must be one of: ${validGateways.join(', ')}`);
  }

  // Currency validation
  const cleanCurrency = String(currency || '').toUpperCase().trim();
  if (!cleanCurrency || cleanCurrency.length !== 3) {
    errors.push('Currency must be a valid 3-letter ISO code (e.g. USD, INR, EUR)');
  } else if (cleanGateway && GATEWAY_CURRENCY_SUPPORT[cleanGateway]) {
    const supported = GATEWAY_CURRENCY_SUPPORT[cleanGateway].supported;
    if (!supported.includes(cleanCurrency)) {
      errors.push(`Currency ${cleanCurrency} is not supported by ${cleanGateway}. Supported: ${supported.join(', ')}`);
    } else {
      const minAmount = GATEWAY_CURRENCY_SUPPORT[cleanGateway].minAmount[cleanCurrency] || 0.50;
      if (numAmount < minAmount) {
        errors.push(`Minimum amount for ${cleanGateway} in ${cleanCurrency} is ${minAmount}`);
      }
    }
  }

  // Customer validation (if provided)
  if (customer && typeof customer === 'object') {
    if (customer.email && !/^\S+@\S+\.\S+$/.test(customer.email)) {
      errors.push('Customer email must be a valid email format');
    }
    if (customer.phone && typeof customer.phone === 'string') {
      const cleanPhone = customer.phone.replace(/[^0-9+]/g, '');
      if (cleanPhone.length < 8 || cleanPhone.length > 15) {
        errors.push('Customer phone must contain 8-15 digits');
      }
    }
  }

  // Expiry date validation (if provided)
  if (expiresAt) {
    const expiryDate = new Date(expiresAt);
    if (isNaN(expiryDate.getTime())) {
      errors.push('expiresAt must be a valid ISO date');
    } else if (expiryDate.getTime() <= Date.now() + 60000) {
      errors.push('Link expiry must be at least 1 minute into the future');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.body.title = title.trim();
  req.body.amount = numAmount;
  req.body.currency = cleanCurrency;
  req.body.gateway = cleanGateway;

  next();
}

module.exports = {
  validateCreatePaymentLink
};
