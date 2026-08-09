'use strict';

const express = require('express');
const { ThreatIntel } = require('../models');
const authenticate = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');

const router = express.Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { severity, indicatorType, isActive } = req.query;
    const where = {};
    if (severity) where.severity = severity;
    if (indicatorType) where.indicatorType = indicatorType;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const indicators = await ThreatIntel.findAll({ where, order: [['lastSeenAt', 'DESC']], limit: 200 });
    return ok(res, indicators);
  })
);

// Feeds the visual attack map: active indicators with geo coordinates.
router.get(
  '/map',
  asyncHandler(async (req, res) => {
    const indicators = await ThreatIntel.findAll({
      where: { isActive: true },
      attributes: [
        'id',
        'indicatorType',
        'indicatorValue',
        'threatActor',
        'severity',
        'countryOfOrigin',
        'latitude',
        'longitude',
        'lastSeenAt',
      ],
    });
    return ok(res, indicators);
  })
);

module.exports = router;
