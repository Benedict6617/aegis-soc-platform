'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class ThreatIntel extends Model {}

ThreatIntel.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    indicatorType: {
      type: DataTypes.ENUM('ip', 'domain', 'file_hash', 'url', 'email'),
      allowNull: false,
    },
    indicatorValue: { type: DataTypes.STRING, allowNull: false },
    threatActor: { type: DataTypes.STRING, allowNull: true },
    campaign: { type: DataTypes.STRING, allowNull: true },
    confidence: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 50 }, // 0-100
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium',
    },
    feedSource: { type: DataTypes.STRING, allowNull: false },
    countryOfOrigin: { type: DataTypes.STRING, allowNull: true },
    latitude: { type: DataTypes.FLOAT, allowNull: true },
    longitude: { type: DataTypes.FLOAT, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    firstSeenAt: { type: DataTypes.DATE, allowNull: true },
    lastSeenAt: { type: DataTypes.DATE, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    modelName: 'ThreatIntel',
    tableName: 'threat_intel',
    timestamps: true,
  }
);

module.exports = ThreatIntel;
