'use strict';

/**
 * Risk Scoring Service
 * ---------------------------------------------------------------------------
 * Produces a 0-100 risk score used to auto-prioritize incidents. The model
 * combines weighted signal categories (a lightweight, explainable stand-in
 * for a trained ML classifier) so scores stay auditable - a requirement for
 * SOC2/ISO27001 evidence. Swap `computeRiskScore` for a call to a hosted
 * ML/LLM scoring model without changing any calling code.
 *
 * Signals considered:
 *  - Severity of contributing alerts
 *  - Number of correlated alerts (multi-source correlation = higher confidence)
 *  - Criticality of affected assets
 *  - Match against active threat intelligence indicators
 *  - MITRE ATT&CK tactic weight (e.g. exfiltration/impact weigh more than recon)
 */

const SEVERITY_WEIGHTS = { informational: 2, low: 10, medium: 30, high: 60, critical: 90 };
const ASSET_CRITICALITY_WEIGHTS = { low: 5, medium: 15, high: 30, critical: 45 };
const TACTIC_WEIGHTS = {
  reconnaissance: 5,
  'initial-access': 20,
  execution: 25,
  persistence: 25,
  'privilege-escalation': 30,
  'defense-evasion': 25,
  'credential-access': 30,
  discovery: 10,
  'lateral-movement': 35,
  collection: 25,
  exfiltration: 45,
  'command-and-control': 35,
  impact: 45,
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

/**
 * @param {Object} params
 * @param {Array}  params.alerts - correlated alerts (each with severity, mitreTactic)
 * @param {Array}  params.assets - affected assets (each with criticality)
 * @param {Number} params.threatIntelMatches - count of IOC matches against active threat intel
 * @returns {{score: number, band: string, rationale: string[]}}
 */
function computeRiskScore({ alerts = [], assets = [], threatIntelMatches = 0 }) {
  const rationale = [];

  const severityComponent = alerts.length
    ? alerts.reduce((sum, a) => sum + (SEVERITY_WEIGHTS[a.severity] || 0), 0) / alerts.length
    : 0;
  rationale.push(`Average alert severity contributes ${severityComponent.toFixed(1)} pts`);

  const correlationBonus = clamp((alerts.length - 1) * 4, 0, 20);
  if (correlationBonus > 0) rationale.push(`Multi-source correlation (${alerts.length} alerts) adds ${correlationBonus} pts`);

  const assetComponent = assets.length
    ? Math.max(...assets.map((a) => ASSET_CRITICALITY_WEIGHTS[a.criticality] || 0))
    : 0;
  if (assetComponent > 0) rationale.push(`Highest affected asset criticality adds ${assetComponent} pts`);

  const tacticComponent = alerts.length
    ? Math.max(...alerts.map((a) => TACTIC_WEIGHTS[(a.mitreTactic || '').toLowerCase()] || 0))
    : 0;
  if (tacticComponent > 0) rationale.push(`MITRE ATT&CK tactic weight adds ${tacticComponent} pts`);

  const threatIntelComponent = clamp(threatIntelMatches * 10, 0, 25);
  if (threatIntelComponent > 0) rationale.push(`${threatIntelMatches} threat intel indicator match(es) add ${threatIntelComponent} pts`);

  const rawScore = severityComponent * 0.5 + correlationBonus + assetComponent * 0.4 + tacticComponent * 0.3 + threatIntelComponent;
  const score = Math.round(clamp(rawScore));

  let band = 'low';
  const criticalThreshold = Number(process.env.CRITICAL_RISK_THRESHOLD || 85);
  const highThreshold = Number(process.env.HIGH_RISK_THRESHOLD || 65);
  const mediumThreshold = Number(process.env.MEDIUM_RISK_THRESHOLD || 40);

  if (score >= criticalThreshold) band = 'critical';
  else if (score >= highThreshold) band = 'high';
  else if (score >= mediumThreshold) band = 'medium';

  return { score, band, rationale };
}

module.exports = { computeRiskScore };
