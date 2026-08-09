'use strict';

const express = require('express');
const { Playbook } = require('../models');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/apiResponse');
const { ApiError } = require('../middleware/errorHandler');

const router = express.Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const playbooks = await Playbook.findAll({ order: [['name', 'ASC']] });
    return ok(res, playbooks.map((p) => ({ ...p.toJSON(), steps: JSON.parse(p.steps) })));
  })
);

router.post(
  '/',
  requireRole('admin', 'soc_manager'),
  asyncHandler(async (req, res) => {
    const { steps, ...rest } = req.body;
    const playbook = await Playbook.create({ ...rest, steps: JSON.stringify(steps || []) });
    return created(res, playbook);
  })
);

router.put(
  '/:id',
  requireRole('admin', 'soc_manager'),
  asyncHandler(async (req, res) => {
    const playbook = await Playbook.findByPk(req.params.id);
    if (!playbook) throw new ApiError(404, 'Playbook not found.');
    const { steps, ...rest } = req.body;
    await playbook.update({ ...rest, ...(steps ? { steps: JSON.stringify(steps) } : {}) });
    return ok(res, playbook);
  })
);

module.exports = router;
