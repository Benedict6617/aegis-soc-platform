'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');

const { User } = require('../models');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const asyncHandler = require('../utils/asyncHandler');
const validateRequest = require('../utils/validateRequest');
const { ok, created } = require('../utils/apiResponse');
const { ApiError } = require('../middleware/errorHandler');
const auditService = require('../services/auditService');

const router = express.Router();
router.use(authenticate);

router.get(
  '/',
  requireRole('admin', 'soc_manager'),
  asyncHandler(async (req, res) => {
    const users = await User.findAll({ order: [['fullName', 'ASC']] });
    return ok(res, users.map((u) => u.toSafeJSON()));
  })
);

router.post(
  '/',
  requireRole('admin'),
  [body('email').isEmail(), body('fullName').notEmpty(), body('password').isLength({ min: 10 })],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { email, fullName, password, role, phoneNumber } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) throw new ApiError(409, 'A user with this email already exists.');

    const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
    const user = await User.create({ email, fullName, passwordHash, role, phoneNumber });

    await auditService.record({
      actorId: req.user.id,
      actorName: req.user.fullName,
      action: 'user.create',
      entityType: 'User',
      entityId: user.id,
      metadata: { email, role },
    });

    return created(res, user.toSafeJSON());
  })
);

router.put(
  '/:id',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) throw new ApiError(404, 'User not found.');

    const { password, ...rest } = req.body;
    const updates = { ...rest };
    if (password) {
      updates.passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
    }
    await user.update(updates);

    await auditService.record({
      actorId: req.user.id,
      actorName: req.user.fullName,
      action: 'user.update',
      entityType: 'User',
      entityId: user.id,
    });

    return ok(res, user.toSafeJSON());
  })
);

module.exports = router;
