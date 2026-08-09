'use strict';

const express = require('express');
const { AuditLog } = require('../models');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');

const router = express.Router();
router.use(authenticate);
router.use(requireRole('admin', 'soc_manager', 'auditor'));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { action, entityType, page = 1, pageSize = 50 } = req.query;
    const where = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    const limit = Math.min(Number(pageSize), 200);
    const offset = (Number(page) - 1) * limit;

    const { rows, count } = await AuditLog.findAndCountAll({
      where,
      order: [['occurredAt', 'DESC']],
      limit,
      offset,
    });

    return ok(res, rows, { total: count, page: Number(page), pageSize: limit });
  })
);

module.exports = router;
