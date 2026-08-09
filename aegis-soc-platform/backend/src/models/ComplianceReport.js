'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class ComplianceReport extends Model {}

ComplianceReport.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    framework: {
      type: DataTypes.ENUM('SOC2', 'ISO27001', 'PCI_DSS', 'HIPAA', 'GDPR', 'NIST_CSF'),
      allowNull: false,
    },
    title: { type: DataTypes.STRING, allowNull: false },
    periodStart: { type: DataTypes.DATEONLY, allowNull: false },
    periodEnd: { type: DataTypes.DATEONLY, allowNull: false },
    overallScore: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 }, // percentage
    controlsPassed: { type: DataTypes.INTEGER, defaultValue: 0 },
    controlsFailed: { type: DataTypes.INTEGER, defaultValue: 0 },
    controlsTotal: { type: DataTypes.INTEGER, defaultValue: 0 },
    generatedBy: { type: DataTypes.STRING, allowNull: true },
    status: {
      type: DataTypes.ENUM('draft', 'final', 'submitted'),
      defaultValue: 'draft',
    },
    findings: { type: DataTypes.TEXT, allowNull: true }, // JSON-encoded array of findings
    generatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'ComplianceReport',
    tableName: 'compliance_reports',
    timestamps: true,
  }
);

module.exports = ComplianceReport;
