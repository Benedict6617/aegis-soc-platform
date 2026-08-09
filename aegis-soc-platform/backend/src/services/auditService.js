'use strict';

const { AuditLog } = require('../models');
const logger = require('../config/logger');

/**
 * Records an immutable audit trail entry. Used for every sensitive
 * action across the platform (auth, incident changes, quarantine
 * actions, report generation, user management) to satisfy
 * compliance frameworks that require a tamper-evident activity log.
 */
async function record({ actorId = null, actorName = 'system', action, entityType = null, entityId = null, ipAddress = null, metadata = {} }) {
  try {
    await AuditLog.create({
      actorId,
      actorName,
      action,
      entityType,
      entityId,
      ipAddress,
      metadata: JSON.stringify(metadata),
      occurredAt: new Date(),
    });
  } catch (err) {
    // Audit logging must never crash the primary request flow.
    logger.error(`Failed to write audit log for action "${action}": ${err.message}`);
  }
}

module.exports = { record };
