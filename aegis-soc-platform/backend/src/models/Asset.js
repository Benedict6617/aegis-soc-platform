'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Asset extends Model {}

Asset.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    hostname: { type: DataTypes.STRING, allowNull: false },
    assetType: {
      type: DataTypes.ENUM('server', 'endpoint', 'cloud_instance', 'firewall', 'application', 'network_device'),
      allowNull: false,
    },
    ipAddress: { type: DataTypes.STRING, allowNull: true },
    macAddress: { type: DataTypes.STRING, allowNull: true },
    operatingSystem: { type: DataTypes.STRING, allowNull: true },
    environment: {
      type: DataTypes.ENUM('production', 'staging', 'development', 'corporate'),
      defaultValue: 'production',
    },
    owner: { type: DataTypes.STRING, allowNull: true },
    location: { type: DataTypes.STRING, allowNull: true },
    criticality: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium',
    },
    status: {
      type: DataTypes.ENUM('healthy', 'at_risk', 'compromised', 'quarantined', 'decommissioned'),
      defaultValue: 'healthy',
    },
    tags: { type: DataTypes.STRING, allowNull: true }, // comma-separated
    lastSeenAt: { type: DataTypes.DATE, allowNull: true },
    agentVersion: { type: DataTypes.STRING, allowNull: true },
    cloudProvider: { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Asset',
    tableName: 'assets',
    timestamps: true,
  }
);

module.exports = Asset;
