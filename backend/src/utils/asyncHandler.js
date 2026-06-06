/**
 * Wraps asynchronous route/controller functions to forward unhandled promise rejections
 * directly to Express error-handling middleware, eliminating repetitive try/catch blocks.
 *
 * @param {Function} fn - Async route handler
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
