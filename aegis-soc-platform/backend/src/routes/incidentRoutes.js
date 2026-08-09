'use strict';

const express = require('express');
const { body } = require('express-validator');

const { Incident, IncidentTimeline, Alert, User, Playbook } = require('../models');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const asyncHandler = require('../utils/asyncHandler');
const validateRequest = require('../utils/validateRequest');
const { ok } = require('../utils/apiResponse');
const { ApiError } = require('../middleware/errorHandler');
const incidentService = require('../services/incidentService');
const { executePlaybook } = require('../services/playbookService');

const router = express.Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, severity, category, assignedAnalystId, page = 1, pageSize = 25 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (category) where.category = category;
    if (assignedAnalystId) where.assignedAnalystId = assignedAnalystId;

    const limit = Math.min(Number(pageSize), 100);
    const offset = (Number(page) - 1) * limit;

    const { rows, count } = await Incident.findAndCountAll({
      where,
      include: [{ model: User, as: 'assignedAnalyst', attributes: ['id', 'fullName', 'role'] }],
      order: [
        ['riskScore', 'DESC'],
        ['detectedAt', 'DESC'],
      ],
      limit,
      offset,
    });

    return ok(res, rows, { total: count, page: Number(page), pageSize: limit });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const incident = await Incident.findByPk(req.params.id, {
      include: [
        { model: Alert, as: 'alerts' },
        { model: IncidentTimeline, as: 'timeline', separate: true, order: [['occurredAt', 'ASC']] },
        { model: User, as: 'assignedAnalyst', attributes: ['id', 'fullName', 'role'] },
        { model: Playbook, as: 'playbook' },
      ],
    });
    if (!incident) throw new ApiError(404, 'Incident not found.');
    return ok(res, incident);
  })
);

router.post(
  '/:id/assign',
  requireRole('admin', 'soc_manager'),
  [body('analystId').isUUID()],
  validateRequest,
  asyncHandler(async (req, res) => {
    const incident = await incidentService.assignAnalyst({
      incidentId: req.params.id,
      analystId: req.body.analystId,
      actor: req.user.fullName,
    });
    return ok(res, incident);
  })
);

router.post(
  '/:id/status',
  [body('status').notEmpty()],
  validateRequest,
  asyncHandler(async (req, res) => {
    const incident = await incidentService.transitionStatus({
      incidentId: req.params.id,
      newStatus: req.body.status,
      actor: req.user.fullName,
      note: req.body.note,
    });
    return ok(res, incident);
  })
);

router.post(
  '/:id/notes',
  [body('note').notEmpty()],
  validateRequest,
  asyncHandler(async (req, res) => {
    const incident = await incidentService.addAnalystNote({
      incidentId: req.params.id,
      actor: req.user.fullName,
      note: req.body.note,
    });
    return ok(res, incident);
  })
);

router.post(
  '/:id/execute-playbook',
  requireRole('admin', 'soc_manager', 'analyst_tier2'),
  asyncHandler(async (req, res) => {
    const result = await executePlaybook({ incidentId: req.params.id, actor: req.user.fullName });
    return ok(res, result);
  })
);

module.exports = router;
