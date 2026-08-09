'use strict';

const { Incident, IncidentTimeline, User } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const auditService = require('./auditService');

const VALID_TRANSITIONS = {
  open: ['investigating', 'closed'],
  investigating: ['contained', 'closed'],
  contained: ['eradicated', 'investigating'],
  eradicated: ['recovering'],
  recovering: ['closed'],
  closed: [],
};

async function assignAnalyst({ incidentId, analystId, actor }) {
  const incident = await Incident.findByPk(incidentId);
  if (!incident) throw new ApiError(404, 'Incident not found.');

  const analyst = await User.findByPk(analystId);
  if (!analyst) throw new ApiError(404, 'Analyst not found.');

  incident.assignedAnalystId = analyst.id;
  if (incident.status === 'open') incident.status = 'investigating';
  await incident.save();

  await IncidentTimeline.create({
    incidentId,
    eventType: 'triaged',
    actor,
    description: `Incident assigned to ${analyst.fullName}.`,
  });

  await auditService.record({
    actorName: actor,
    action: 'incident.assign',
    entityType: 'Incident',
    entityId: incident.id,
    metadata: { analyst: analyst.fullName },
  });

  return incident;
}

async function transitionStatus({ incidentId, newStatus, actor, note }) {
  const incident = await Incident.findByPk(incidentId);
  if (!incident) throw new ApiError(404, 'Incident not found.');

  const allowed = VALID_TRANSITIONS[incident.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new ApiError(400, `Cannot transition incident from "${incident.status}" to "${newStatus}".`);
  }

  const previousStatus = incident.status;
  incident.status = newStatus;
  if (newStatus === 'contained') incident.containedAt = new Date();
  if (newStatus === 'closed') incident.closedAt = new Date();
  await incident.save();

  await IncidentTimeline.create({
    incidentId,
    eventType: 'status_change',
    actor,
    description: `Status changed from "${previousStatus}" to "${newStatus}".${note ? ` Note: ${note}` : ''}`,
  });

  await auditService.record({
    actorName: actor,
    action: 'incident.status_change',
    entityType: 'Incident',
    entityId: incident.id,
    metadata: { previousStatus, newStatus, note },
  });

  return incident;
}

async function addAnalystNote({ incidentId, actor, note }) {
  const incident = await Incident.findByPk(incidentId);
  if (!incident) throw new ApiError(404, 'Incident not found.');

  await IncidentTimeline.create({
    incidentId,
    eventType: 'analyst_note',
    actor,
    description: note,
  });

  return incident;
}

module.exports = { assignAnalyst, transitionStatus, addAnalystNote, VALID_TRANSITIONS };
