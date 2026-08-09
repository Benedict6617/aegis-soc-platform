'use strict';

const { Incident, Playbook, IncidentTimeline, Asset } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const { quarantineAsset } = require('./quarantineService');
const auditService = require('./auditService');

/**
 * Executes a predefined response playbook against an incident. Each step
 * in a Playbook's `steps` JSON is a small declarative action. Supported
 * step types map to real containment/response capabilities; unrecognized
 * step types are logged to the timeline as manual-action reminders so
 * nothing is silently skipped.
 */
async function executePlaybook({ incidentId, actor = 'system' }) {
  const incident = await Incident.findByPk(incidentId);
  if (!incident) throw new ApiError(404, 'Incident not found.');
  if (!incident.playbookId) throw new ApiError(400, 'Incident has no associated playbook.');

  const playbook = await Playbook.findByPk(incident.playbookId);
  if (!playbook) throw new ApiError(404, 'Playbook not found.');

  const steps = JSON.parse(playbook.steps || '[]');
  const results = [];

  for (const step of steps) {
    switch (step.type) {
      case 'quarantine_asset': {
        if (incident.affectedAssetCount > 0) {
          const asset = await Asset.findOne({ where: { status: ['at_risk', 'compromised'] }, order: [['updatedAt', 'DESC']] });
          if (asset) {
            await quarantineAsset({ assetId: asset.id, incidentId, actor: `playbook:${playbook.name}`, reason: step.description });
            results.push({ step: step.description, status: 'executed' });
          } else {
            results.push({ step: step.description, status: 'skipped_no_target' });
          }
        }
        break;
      }
      case 'notify': {
        await IncidentTimeline.create({
          incidentId,
          eventType: 'escalation',
          actor: `playbook:${playbook.name}`,
          description: step.description,
        });
        results.push({ step: step.description, status: 'executed' });
        break;
      }
      case 'require_manual_action':
      default: {
        await IncidentTimeline.create({
          incidentId,
          eventType: 'remediation_step',
          actor: `playbook:${playbook.name}`,
          description: `Manual action required: ${step.description}`,
        });
        results.push({ step: step.description, status: 'requires_manual_action' });
      }
    }
  }

  await IncidentTimeline.create({
    incidentId,
    eventType: 'status_change',
    actor,
    description: `Playbook "${playbook.name}" executed (${results.length} step(s)).`,
  });

  await auditService.record({
    actorName: actor,
    action: 'playbook.execute',
    entityType: 'Incident',
    entityId: incident.id,
    metadata: { playbook: playbook.name, results },
  });

  return { playbook: playbook.name, results };
}

module.exports = { executePlaybook };
