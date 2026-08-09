'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Alert extends Model {}

Alert.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    source: {
      type: DataTypes.ENUM(
        'siem',
        'edr',
        'firewall',
        'ids_ips',
        'vulnerability_scanner',
        'identity_provider',
        'cloud_security',
        'threat_intel'
      ),
      allowNull: false,
    },
    ruleName: { type: DataTypes.STRING, allowNull: false },
    severity: {
      type: DataTypes.ENUM('informational', 'low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium',
    },
    mitreTactic: { type: DataTypes.STRING, allowNull: true },
    mitreTechnique: { type: DataTypes.STRING, allowNull: true },
    sourceIp: { type: DataTypes.STRING, allowNull: true },
    destinationIp: { type: DataTypes.STRING, allowNull: true },
    assetId: { type: DataTypes.UUID, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    rawEvent: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM('new', 'correlated', 'suppressed', 'escalated', 'closed'),
      defaultValue: 'new',
    },
    incidentId: { type: DataTypes.UUID, allowNull: true },
    detectedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'Alert',
    tableName: 'alerts',
    timestamps: true,
  }
);

module.exports = Alert;
