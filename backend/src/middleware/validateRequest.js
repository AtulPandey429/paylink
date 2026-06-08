/**
 * Express middleware runner for request validation.
 * Accepts a validator function and forwards execution.
 */
function validateRequest(validatorFn) {
  return (req, res, next) => {
    return validatorFn(req, res, next);
  };
}

module.exports = validateRequest;
