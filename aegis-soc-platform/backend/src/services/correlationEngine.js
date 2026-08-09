'use strict';

const { v4: uuidv4 } = require('uuid');
const { Alert, Asset, Incident, IncidentTimeline, ThreatIntel, Playbook, User } = require('../models');
const { computeRiskScore } = require('./riskScoringService');
const { notifyIncident } = require('./notificationService');
const auditService = require('./auditService');
const logger = require('../config/logger');

const CORRELATION_WINDOW_MINUTES = 15;

function generateReferenceCode() {
  const year = new Date().getFullYear();
  const suffix = uuidv4().split('-')[0].toUpperCase();
  return `INC-${year}-${suffix}`;
}

function inferCategory(alerts) {
  const ruleText = alerts.map((a) => `${a.ruleName} ${a.description || ''}`).join(' ').toLowerCase();
  if (ruleText.includes('ransom')) return 'ransomware';
  if (ruleText.includes('phish')) return 'phishing';
  if (ruleText.includes('exfil')) return 'data_exfiltration';
  if (ruleText.includes('ddos') || ruleText.includes('denial of service')) return 'ddos';
  if (ruleText.includes('insider')) return 'insider_threat';
  if (ruleText.includes('malware') || ruleText.includes('trojan') || ruleText.includes('backdoor')) return 'malware';
  if (ruleText.includes('misconfig')) return 'misconfiguration';
  if (ruleText.includes('unauthorized') || ruleText.includes('privilege') || ruleText.includes('brute force')) return 'unauthorized_access';
  return 'policy_violation';
}

function severityFromBand(band) {
  return band; // bands already align to Incident.severity enum values
}

/**
 * Core correlation routine: takes a newly ingested alert, finds related
 * alerts within a time/asset/source correlation window, and either
 * attaches the alert to an existing open incident or opens a new one.
 * This is the automated "detect anomalies, correlate events, prioritize
 * with AI" pipeline described in the platform requirements.
 */
async function correlateAlert(alert) {
  // Anchor the correlation window on the alert's own event time (not wall-clock
  // time) so batch/backfilled ingestion from log forwarders still correlates
  // correctly, not just alerts arriving in real time.
  const anchorTime = new Date(alert.detectedAt).getTime();
  const windowStart = new Date(anchorTime - CORRELATION_WINDOW_MINUTES * 60 * 1000);
  const windowEnd = new Date(anchorTime + CORRELATION_WINDOW_MINUTES * 60 * 1000);

  // Find candidate related alerts: same asset OR same source IP, within the
  // correlation window around this event.
  const related = await Alert.findAll({
    where: {
      id: { [require('sequelize').Op.ne]: alert.id },
      detectedAt: { [require('sequelize').Op.between]: [windowStart, windowEnd] },
    },
  });

  const correlated = related.filter(
    (r) =>
      (alert.assetId && r.assetId === alert.assetId) ||
      (alert.sourceIp && r.sourceIp === alert.sourceIp) ||
      (alert.destinationIp && r.destinationIp === alert.destinationIp)
  );

  const clusterAlerts = [alert, ...correlated];

  // Pull affected assets for risk scoring.
  const assetIds = [...new Set(clusterAlerts.map((a) => a.assetId).filter(Boolean))];
  const assets = assetIds.length ? await Asset.findAll({ where: { id: assetIds } }) : [];

  // Check threat intel matches on source/destination IPs.
  const ips = [...new Set(clusterAlerts.flatMap((a) => [a.sourceIp, a.destinationIp]).filter(Boolean))];
  const threatMatches = ips.length
    ? await ThreatIntel.count({ where: { indicatorValue: ips, isActive: true } })
    : 0;

  const { score, band, rationale } = computeRiskScore({
    alerts: clusterAlerts,
    assets,
    threatIntelMatches: threatMatches,
  });

  // If one of the correlated alerts already belongs to an open incident, reuse it.
  let incident = null;
  const existingIncidentId = correlated.find((r) => r.incidentId)?.incidentId;
  if (existingIncidentId) {
    incident = await Incident.findByPk(existingIncidentId);
  }

  if (incident && incident.status !== 'closed') {
    incident.riskScore = Math.max(incident.riskScore, score);
    incident.severity = score > computeRiskScore({ alerts: correlated, assets }).score ? severityFromBand(band) : incident.severity;
    incident.affectedAssetCount = assetIds.length;
    await incident.save();

    await IncidentTimeline.create({
      incidentId: incident.id,
      eventType: 'correlated',
      actor: 'correlation-engine',
      description: `Alert "${alert.ruleName}" correlated into existing incident (updated risk score: ${incident.riskScore}).`,
    });
  } else {
    const category = inferCategory(clusterAlerts);
    const playbook = await Playbook.findOne({ where: { triggerCategory: category, isActive: true } });

    incident = await Incident.create({
      referenceCode: generateReferenceCode(),
      title: `${category.replace(/_/g, ' ')} activity detected on ${assets[0]?.hostname || 'multiple assets'}`,
      category,
      severity: severityFromBand(band),
      riskScore: score,
      status: 'open',
      affectedAssetCount: assetIds.length,
      playbookId: playbook ? playbook.id : null,
      summary: `Automatically correlated from ${clusterAlerts.length} alert(s). Rationale: ${rationale.join('; ')}.`,
      slaDeadline: new Date(Date.now() + slaHoursForBand(band) * 60 * 60 * 1000),
      detectedAt: new Date(),
    });

    await IncidentTimeline.create({
      incidentId: incident.id,
      eventType: 'detected',
      actor: 'correlation-engine',
      description: `Incident opened from ${clusterAlerts.length} correlated alert(s) with risk score ${score} (${band}).`,
    });

    if (playbook) {
      await IncidentTimeline.create({
        incidentId: incident.id,
        eventType: 'triaged',
        actor: 'correlation-engine',
        description: `Matched response playbook "${playbook.name}"${playbook.autoExecute ? ' - auto-execution enabled' : ' - pending analyst approval'}.`,
      });
    }

    // Notify SOC managers and on-call analysts for high/critical incidents.
    if (band === 'critical' || band === 'high') {
      const recipients = await User.findAll({
        where: { role: ['soc_manager', 'admin'], isActive: true },
      });
      try {
        await notifyIncident({ incident, recipients: recipients.map((r) => r.toSafeJSON()) });
      } catch (err) {
        logger.error(`Notification dispatch failed for ${incident.referenceCode}: ${err.message}`);
      }
    }

    await auditService.record({
      action: 'incident.auto_created',
      entityType: 'Incident',
      entityId: incident.id,
      metadata: { referenceCode: incident.referenceCode, riskScore: score, band },
    });
  }

  await alert.update({ status: 'correlated', incidentId: incident.id });
  return incident;
}

function slaHoursForBand(band) {
  switch (band) {
    case 'critical':
      return 1;
    case 'high':
      return 4;
    case 'medium':
      return 24;
    default:
      return 72;
  }
}

module.exports = { correlateAlert, generateReferenceCode };
