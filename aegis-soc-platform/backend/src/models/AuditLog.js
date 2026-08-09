'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class AuditLog extends Model {}

AuditLog.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    actorId: { type: DataTypes.UUID, allowNull: true },
    actorName: { type: DataTypes.STRING, allowNull: true },
    action: { type: DataTypes.STRING, allowNull: false }, // e.g. "incident.status_change"
    entityType: { type: DataTypes.STRING, allowNull: true }, // e.g. "Incident"
    entityId: { type: DataTypes.UUID, allowNull: true },
    ipAddress: { type: DataTypes.STRING, allowNull: true },
    metadata: { type: DataTypes.TEXT, allowNull: true }, // JSON-encoded details
    occurredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    timestamps: false,
  }
);

module.exports = AuditLog;
