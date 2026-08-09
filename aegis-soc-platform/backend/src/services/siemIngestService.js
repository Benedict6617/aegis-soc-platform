'use strict';

const { Alert, Asset } = require('../models');
const { correlateAlert } = require('./correlationEngine');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Normalizes an inbound event from any integrated source (SIEM forwarder,
 * EDR webhook, firewall syslog relay, vulnerability scanner, IdP risk
 * event, cloud security posture tool) into the platform's canonical Alert
 * schema, persists it, then feeds it into the correlation engine.
 *
 * This is the single ingestion boundary referenced by:
 *  - POST /api/alerts/ingest        (generic/manual ingestion, used by the demo seed & tests)
 *  - Future connector adapters (Splunk HEC, Elastic, CrowdStrike, Sentinel, etc.)
 *    would translate vendor payloads into this same shape and call `ingestEvent`.
 */
async function ingestEvent(rawEvent) {
  const { source, ruleName, severity, sourceIp, destinationIp, assetHostname, description, mitreTactic, mitreTechnique } = rawEvent;

  if (!source || !ruleName || !severity) {
    throw new ApiError(400, 'Event must include source, ruleName, and severity.');
  }

  let asset = null;
  if (assetHostname) {
    asset = await Asset.findOne({ where: { hostname: assetHostname } });
  }

  const alert = await Alert.create({
    source,
    ruleName,
    severity,
    mitreTactic: mitreTactic || null,
    mitreTechnique: mitreTechnique || null,
    sourceIp: sourceIp || null,
    destinationIp: destinationIp || null,
    assetId: asset ? asset.id : null,
    description: description || null,
    rawEvent: JSON.stringify(rawEvent),
    status: 'new',
    detectedAt: rawEvent.detectedAt ? new Date(rawEvent.detectedAt) : new Date(),
  });

  if (asset && (severity === 'high' || severity === 'critical') && asset.status === 'healthy') {
    asset.status = 'at_risk';
    await asset.save();
  }

  const incident = await correlateAlert(alert);
  return { alert, incident };
}

module.exports = { ingestEvent };
