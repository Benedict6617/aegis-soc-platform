'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Incident extends Model {}

Incident.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    referenceCode: { type: DataTypes.STRING, allowNull: false, unique: true },
    title: { type: DataTypes.STRING, allowNull: false },
    category: {
      type: DataTypes.ENUM(
        'malware',
        'phishing',
        'unauthorized_access',
        'data_exfiltration',
        'ddos',
        'insider_threat',
        'ransomware',
        'misconfiguration',
        'policy_violation'
      ),
      allowNull: false,
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium',
    },
    riskScore: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM('open', 'investigating', 'contained', 'eradicated', 'recovering', 'closed'),
      defaultValue: 'open',
    },
    affectedAssetCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    assignedAnalystId: { type: DataTypes.UUID, allowNull: true },
    playbookId: { type: DataTypes.UUID, allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    rootCause: { type: DataTypes.TEXT, allowNull: true },
    remediationNotes: { type: DataTypes.TEXT, allowNull: true },
    slaDeadline: { type: DataTypes.DATE, allowNull: true },
    detectedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    containedAt: { type: DataTypes.DATE, allowNull: true },
    closedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Incident',
    tableName: 'incidents',
    timestamps: true,
  }
);

module.exports = Incident;
