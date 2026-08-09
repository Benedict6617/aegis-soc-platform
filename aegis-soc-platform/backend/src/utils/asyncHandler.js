'use strict';

/**
 * Wraps an async Express route handler so rejected promises are
 * forwarded to the centralized error handler instead of crashing
 * the process or requiring a try/catch in every route.
 */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = asyncHandler;
