'use strict';

const { validationResult } = require('express-validator');
const { ApiError } = require('../middleware/errorHandler');

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(422, 'Validation failed.', errors.array()));
  }
  next();
}

module.exports = validateRequest;
