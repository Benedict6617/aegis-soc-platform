'use strict';

const express = require('express');
const { body } = require('express-validator');
const { Op } = require('sequelize');

const { Asset, Vulnerability, Alert } = require('../models');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const asyncHandler = require('../utils/asyncHandler');
const validateRequest = require('../utils/validateRequest');
const { ok, created } = require('../utils/apiResponse');
const { ApiError } = require('../middleware/errorHandler');
const { quarantineAsset, releaseAsset } = require('../services/quarantineService');

const router = express.Router();
router.use(authenticate);

// GET /api/assets - list with filters
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, assetType, criticality, search, page = 1, pageSize = 25 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (assetType) where.assetType = assetType;
    if (criticality) where.criticality = criticality;
    if (search) {
      where[Op.or] = [
        { hostname: { [Op.like]: `%${search}%` } },
        { ipAddress: { [Op.like]: `%${search}%` } },
      ];
    }

    const limit = Math.min(Number(pageSize), 100);
    const offset = (Number(page) - 1) * limit;

    const { rows, count } = await Asset.findAndCountAll({
      where,
      order: [['updatedAt', 'DESC']],
      limit,
      offset,
    });

    return ok(res, rows, { total: count, page: Number(page), pageSize: limit });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const asset = await Asset.findByPk(req.params.id, {
      include: [
        { model: Vulnerability, as: 'vulnerabilities' },
        { model: Alert, as: 'alerts', limit: 25, order: [['detectedAt', 'DESC']] },
      ],
    });
    if (!asset) throw new ApiError(404, 'Asset not found.');
    return ok(res, asset);
  })
);

router.post(
  '/',
  requireRole('admin', 'soc_manager'),
  [body('hostname').notEmpty(), body('assetType').notEmpty()],
  validateRequest,
  asyncHandler(async (req, res) => {
    const asset = await Asset.create(req.body);
    return created(res, asset);
  })
);

router.put(
  '/:id',
  requireRole('admin', 'soc_manager', 'analyst_tier2'),
  asyncHandler(async (req, res) => {
    const asset = await Asset.findByPk(req.params.id);
    if (!asset) throw new ApiError(404, 'Asset not found.');
    await asset.update(req.body);
    return ok(res, asset);
  })
);

router.post(
  '/:id/quarantine',
  requireRole('admin', 'soc_manager', 'analyst_tier1', 'analyst_tier2'),
  [body('reason').notEmpty()],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { reason, incidentId } = req.body;
    const result = await quarantineAsset({
      assetId: req.params.id,
      incidentId,
      actor: req.user.fullName,
      reason,
    });
    return ok(res, result);
  })
);

router.post(
  '/:id/release',
  requireRole('admin', 'soc_manager', 'analyst_tier2'),
  asyncHandler(async (req, res) => {
    const { notes, incidentId } = req.body;
    const asset = await releaseAsset({
      assetId: req.params.id,
      incidentId,
      actor: req.user.fullName,
      notes,
    });
    return ok(res, asset);
  })
);

module.exports = router;
