const { validateCreatePaymentLink } = require('./paymentLink.validator');
const { validateRegister, validateLogin } = require('./auth.validator');

module.exports = {
  validateCreatePaymentLink,
  validateRegister,
  validateLogin
};
