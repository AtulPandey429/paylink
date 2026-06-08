const logger = require('../utils/logger');
const config = require('../config/env');

function errorHandler(err, req, res, next) {
  logger.error(`Unhandled error at ${req.method} ${req.originalUrl}`, err, {
    ip: req.ip,
    user: req.user ? req.user._id : null
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid format for field: ${err.path}`
    });
  }

  // Duplicate key error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`
    });
  }

  // Operational AppError or standard error with status code
  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500 && config.env === 'production'
    ? 'An unexpected internal server error occurred.'
    : (err.message || 'Server Error');

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.errors && err.errors.length > 0 && { errors: err.errors }),
    ...(config.env === 'development' && { stack: err.stack })
  });
}

module.exports = errorHandler;
