'use strict';

const express = require('express');
const { body } = require('express-validator');

const { Alert, Asset } = require('../models');
const authenticate = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const validateRequest = require('../utils/validateRequest');
const { ok, created } = require('../utils/apiResponse');
const { ingestEvent } = require('../services/siemIngestService');

const router = express.Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { severity, source, status, page = 1, pageSize = 25 } = req.query;
    const where = {};
    if (severity) where.severity = severity;
    if (source) where.source = source;
    if (status) where.status = status;

    const limit = Math.min(Number(pageSize), 100);
    const offset = (Number(page) - 1) * limit;

    const { rows, count } = await Alert.findAndCountAll({
      where,
      include: [{ model: Asset, as: 'asset', attributes: ['id', 'hostname', 'assetType', 'criticality'] }],
      order: [['detectedAt', 'DESC']],
      limit,
      offset,
    });

    return ok(res, rows, { total: count, page: Number(page), pageSize: limit });
  })
);

// Generic ingestion endpoint - simulates SIEM/EDR/firewall/vuln-scanner webhooks.
router.post(
  '/ingest',
  [body('source').notEmpty(), body('ruleName').notEmpty(), body('severity').notEmpty()],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { alert, incident } = await ingestEvent(req.body);
    return created(res, { alert, incident });
  })
);

module.exports = router;
