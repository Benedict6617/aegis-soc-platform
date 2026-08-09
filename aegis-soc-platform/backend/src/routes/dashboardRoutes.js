'use strict';

const express = require('express');
const { Op, fn, col } = require('sequelize');
const { Incident, Alert, Asset, Vulnerability, ThreatIntel } = require('../models');
const authenticate = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');

const router = express.Router();
router.use(authenticate);

// GET /api/dashboard/summary - top-line KPIs for the overview dashboard
router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      openIncidents,
      criticalIncidents,
      incidents24h,
      alerts24h,
      totalAssets,
      compromisedAssets,
      quarantinedAssets,
      openVulnerabilities,
      criticalVulnerabilities,
      activeThreatIndicators,
    ] = await Promise.all([
      Incident.count({ where: { status: { [Op.ne]: 'closed' } } }),
      Incident.count({ where: { severity: 'critical', status: { [Op.ne]: 'closed' } } }),
      Incident.count({ where: { detectedAt: { [Op.gte]: last24h } } }),
      Alert.count({ where: { detectedAt: { [Op.gte]: last24h } } }),
      Asset.count(),
      Asset.count({ where: { status: 'compromised' } }),
      Asset.count({ where: { status: 'quarantined' } }),
      Vulnerability.count({ where: { status: ['open', 'in_progress'] } }),
      Vulnerability.count({ where: { status: ['open', 'in_progress'], severity: 'critical' } }),
      ThreatIntel.count({ where: { isActive: true } }),
    ]);

    const recentIncidents = await Incident.findAll({
      where: { detectedAt: { [Op.gte]: last7d } },
      order: [['detectedAt', 'DESC']],
      limit: 10,
    });

    const avgRisk = await Incident.findAll({
      where: { status: { [Op.ne]: 'closed' } },
      attributes: [[fn('AVG', col('riskScore')), 'avgRiskScore']],
      raw: true,
    });

    return ok(res, {
      openIncidents,
      criticalIncidents,
      incidents24h,
      alerts24h,
      totalAssets,
      compromisedAssets,
      quarantinedAssets,
      openVulnerabilities,
      criticalVulnerabilities,
      activeThreatIndicators,
      averageOpenIncidentRisk: Math.round(Number(avgRisk[0]?.avgRiskScore || 0)),
      recentIncidents,
    });
  })
);

// GET /api/dashboard/trends - time series data for charts
router.get(
  '/trends',
  asyncHandler(async (req, res) => {
    const days = Math.min(Number(req.query.days) || 14, 90);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const incidents = await Incident.findAll({
      where: { detectedAt: { [Op.gte]: startDate } },
      attributes: ['detectedAt', 'severity', 'category', 'riskScore'],
      raw: true,
    });

    const alerts = await Alert.findAll({
      where: { detectedAt: { [Op.gte]: startDate } },
      attributes: ['detectedAt', 'source', 'severity'],
      raw: true,
    });

    const bucketByDay = (records, dateField) => {
      const buckets = {};
      for (const r of records) {
        const day = new Date(r[dateField]).toISOString().slice(0, 10);
        buckets[day] = (buckets[day] || 0) + 1;
      }
      return buckets;
    };

    const severityBreakdown = incidents.reduce((acc, i) => {
      acc[i.severity] = (acc[i.severity] || 0) + 1;
      return acc;
    }, {});

    const categoryBreakdown = incidents.reduce((acc, i) => {
      acc[i.category] = (acc[i.category] || 0) + 1;
      return acc;
    }, {});

    const sourceBreakdown = alerts.reduce((acc, a) => {
      acc[a.source] = (acc[a.source] || 0) + 1;
      return acc;
    }, {});

    return ok(res, {
      incidentsPerDay: bucketByDay(incidents, 'detectedAt'),
      alertsPerDay: bucketByDay(alerts, 'detectedAt'),
      severityBreakdown,
      categoryBreakdown,
      sourceBreakdown,
    });
  })
);

module.exports = router;
