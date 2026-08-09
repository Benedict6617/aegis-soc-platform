'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Playbook extends Model {}

Playbook.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    triggerCategory: { type: DataTypes.STRING, allowNull: false }, // matches Incident.category
    description: { type: DataTypes.TEXT, allowNull: true },
    steps: { type: DataTypes.TEXT, allowNull: false }, // JSON-encoded ordered array of steps
    autoExecute: { type: DataTypes.BOOLEAN, defaultValue: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    modelName: 'Playbook',
    tableName: 'playbooks',
    timestamps: true,
  }
);

module.exports = Playbook;
