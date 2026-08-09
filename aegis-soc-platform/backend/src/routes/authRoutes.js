'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');

const { User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const validateRequest = require('../utils/validateRequest');
const { ApiError } = require('../middleware/errorHandler');
const { ok } = require('../utils/apiResponse');
const authenticate = require('../middleware/auth');
const auditService = require('../services/auditService');

const router = express.Router();

function issueToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

router.post(
  '/login',
  [body('email').isEmail(), body('password').isString().notEmpty()],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !user.isActive) {
      throw new ApiError(401, 'Invalid credentials.');
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      await auditService.record({
        actorName: email,
        action: 'auth.login_failed',
        ipAddress: req.ip,
      });
      throw new ApiError(401, 'Invalid credentials.');
    }

    user.lastLoginAt = new Date();
    await user.save();

    await auditService.record({
      actorId: user.id,
      actorName: user.fullName,
      action: 'auth.login_success',
      ipAddress: req.ip,
    });

    const token = issueToken(user);
    return ok(res, { token, user: user.toSafeJSON() });
  })
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    return ok(res, req.user.toSafeJSON());
  })
);

router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    await auditService.record({
      actorId: req.user.id,
      actorName: req.user.fullName,
      action: 'auth.logout',
      ipAddress: req.ip,
    });
    return ok(res, { loggedOut: true });
  })
);

module.exports = router;
