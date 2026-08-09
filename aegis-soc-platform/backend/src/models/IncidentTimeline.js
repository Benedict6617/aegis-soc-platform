'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class IncidentTimeline extends Model {}

IncidentTimeline.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    incidentId: { type: DataTypes.UUID, allowNull: false },
    eventType: {
      type: DataTypes.ENUM(
        'detected',
        'correlated',
        'triaged',
        'analyst_note',
        'containment_action',
        'quarantine_action',
        'escalation',
        'status_change',
        'remediation_step',
        'closed'
      ),
      allowNull: false,
    },
    actor: { type: DataTypes.STRING, allowNull: true }, // "system" or analyst name
    description: { type: DataTypes.TEXT, allowNull: false },
    occurredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'IncidentTimeline',
    tableName: 'incident_timelines',
    timestamps: true,
  }
);

module.exports = IncidentTimeline;
