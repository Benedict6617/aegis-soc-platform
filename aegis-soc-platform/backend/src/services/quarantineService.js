'use strict';

const { Asset, IncidentTimeline, Incident } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const auditService = require('./auditService');
const logger = require('../config/logger');

/**
 * Quarantine Service
 * ---------------------------------------------------------------------------
 * Represents the platform's automated containment capability: isolating a
 * compromised endpoint/server from the network. In a real deployment this
 * would call out to the EDR/NAC vendor API (CrowdStrike, Defender for
 * Endpoint, Cisco ISE, etc). Here it is implemented as a clean service
 * boundary with full audit trail + incident timeline integration so the
 * calling code (routes, playbook executor) never needs to know which
 * vendor is behind it.
 */

async function quarantineAsset({ assetId, incidentId, actor, reason }) {
  const asset = await Asset.findByPk(assetId);
  if (!asset) throw new ApiError(404, 'Asset not found.');

  if (asset.status === 'quarantined') {
    return { asset, alreadyQuarantined: true };
  }

  const previousStatus = asset.status;
  asset.status = 'quarantined';
  await asset.save();

  logger.warn(`Asset ${asset.hostname} (${asset.id}) quarantined by ${actor}. Reason: ${reason}`);

  if (incidentId) {
    await IncidentTimeline.create({
      incidentId,
      eventType: 'quarantine_action',
      actor,
      description: `Isolated asset "${asset.hostname}" from the network (previous status: ${previousStatus}). Reason: ${reason}`,
    });

    const incident = await Incident.findByPk(incidentId);
    if (incident && incident.status === 'open') {
      incident.status = 'contained';
      incident.containedAt = new Date();
      await incident.save();
    }
  }

  await auditService.record({
    actorName: actor,
    action: 'asset.quarantine',
    entityType: 'Asset',
    entityId: asset.id,
    metadata: { previousStatus, reason, incidentId },
  });

  return { asset, alreadyQuarantined: false };
}

async function releaseAsset({ assetId, incidentId, actor, notes }) {
  const asset = await Asset.findByPk(assetId);
  if (!asset) throw new ApiError(404, 'Asset not found.');

  asset.status = 'healthy';
  await asset.save();

  if (incidentId) {
    await IncidentTimeline.create({
      incidentId,
      eventType: 'remediation_step',
      actor,
      description: `Released asset "${asset.hostname}" from quarantine after remediation. ${notes || ''}`.trim(),
    });
  }

  await auditService.record({
    actorName: actor,
    action: 'asset.release_quarantine',
    entityType: 'Asset',
    entityId: asset.id,
    metadata: { notes, incidentId },
  });

  return asset;
}

module.exports = { quarantineAsset, releaseAsset };
