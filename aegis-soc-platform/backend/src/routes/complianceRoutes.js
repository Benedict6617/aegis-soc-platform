'use strict';

const express = require('express');
const { body } = require('express-validator');

const { ComplianceReport } = require('../models');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const asyncHandler = require('../utils/asyncHandler');
const validateRequest = require('../utils/validateRequest');
const { ok, created } = require('../utils/apiResponse');
const { generateComplianceReport } = require('../services/complianceService');

const router = express.Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const reports = await ComplianceReport.findAll({ order: [['generatedAt', 'DESC']] });
    return ok(res, reports);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const report = await ComplianceReport.findByPk(req.params.id);
    return ok(res, report);
  })
);

router.post(
  '/generate',
  requireRole('admin', 'soc_manager', 'auditor'),
  [body('framework').notEmpty(), body('periodStart').isDate(), body('periodEnd').isDate()],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { framework, periodStart, periodEnd } = req.body;
    const report = await generateComplianceReport({
      framework,
      periodStart,
      periodEnd,
      generatedBy: req.user.fullName,
    });
    return created(res, report);
  })
);

module.exports = router;
