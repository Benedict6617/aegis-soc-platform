'use strict';

const sequelize = require('../config/database');
const User = require('./User');
const Asset = require('./Asset');
const Alert = require('./Alert');
const Incident = require('./Incident');
const IncidentTimeline = require('./IncidentTimeline');
const Vulnerability = require('./Vulnerability');
const ThreatIntel = require('./ThreatIntel');
const ComplianceReport = require('./ComplianceReport');
const AuditLog = require('./AuditLog');
const Playbook = require('./Playbook');

// ---- Associations ----
Incident.hasMany(Alert, { foreignKey: 'incidentId', as: 'alerts' });
Alert.belongsTo(Incident, { foreignKey: 'incidentId', as: 'incident' });

Incident.hasMany(IncidentTimeline, { foreignKey: 'incidentId', as: 'timeline' });
IncidentTimeline.belongsTo(Incident, { foreignKey: 'incidentId', as: 'incident' });

Incident.belongsTo(User, { foreignKey: 'assignedAnalystId', as: 'assignedAnalyst' });
Incident.belongsTo(Playbook, { foreignKey: 'playbookId', as: 'playbook' });

Alert.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });
Asset.hasMany(Alert, { foreignKey: 'assetId', as: 'alerts' });

Vulnerability.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });
Asset.hasMany(Vulnerability, { foreignKey: 'assetId', as: 'vulnerabilities' });

module.exports = {
  sequelize,
  User,
  Asset,
  Alert,
  Incident,
  IncidentTimeline,
  Vulnerability,
  ThreatIntel,
  ComplianceReport,
  AuditLog,
  Playbook,
};
