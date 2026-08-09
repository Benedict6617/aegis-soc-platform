'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const sequelize = require('../config/database');
const { User, Asset, ThreatIntel, Vulnerability, Playbook, Incident } = require('../models');
const { ingestEvent } = require('../services/siemIngestService');
const incidentService = require('../services/incidentService');
const logger = require('../config/logger');

const dataDir = path.join(__dirname, 'data');
const loadJson = (file) => JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'));

async function seedUsers() {
  const users = loadJson('users.json');
  const created = [];
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
    const record = await User.create({
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      phoneNumber: u.phoneNumber,
      mfaEnabled: u.mfaEnabled,
      passwordHash,
    });
    created.push(record);
  }
  logger.info(`Seeded ${created.length} users.`);
  return created;
}

async function seedAssets() {
  const assets = loadJson('assets.json');
  const created = await Asset.bulkCreate(
    assets.map((a) => ({ ...a, lastSeenAt: new Date() }))
  );
  logger.info(`Seeded ${created.length} assets.`);
  return created;
}

async function seedThreatIntel() {
  const indicators = loadJson('threatIntel.json');
  const created = await ThreatIntel.bulkCreate(indicators);
  logger.info(`Seeded ${created.length} threat intelligence indicators.`);
  return created;
}

async function seedPlaybooks() {
  const playbooks = loadJson('playbooks.json');
  const created = [];
  for (const p of playbooks) {
    const record = await Playbook.create({
      name: p.name,
      triggerCategory: p.triggerCategory,
      description: p.description,
      autoExecute: p.autoExecute,
      isActive: true,
      steps: JSON.stringify(p.steps),
    });
    created.push(record);
  }
  logger.info(`Seeded ${created.length} response playbooks.`);
  return created;
}

async function seedVulnerabilities(assets) {
  const vulns = loadJson('vulnerabilities.json');
  const byHostname = Object.fromEntries(assets.map((a) => [a.hostname, a]));
  let count = 0;

  for (const v of vulns) {
    const asset = byHostname[v.assetHostname];
    if (!asset) continue;

    const discoveredAt = new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000);
    const dueDate = new Date(Date.now() + (v.dueDateOffsetDays || 0) * 24 * 60 * 60 * 1000);

    await Vulnerability.create({
      assetId: asset.id,
      cveId: v.cveId,
      title: v.title,
      description: v.description,
      cvssScore: v.cvssScore,
      severity: v.severity,
      scanner: v.scanner,
      status: v.status,
      patchAvailable: v.patchAvailable,
      dueDate,
      discoveredAt,
      remediatedAt: v.status === 'remediated' ? new Date() : null,
    });
    count += 1;
  }
  logger.info(`Seeded ${count} vulnerability findings.`);
}

async function seedIncidentsFromAlertScenarios() {
  const events = loadJson('alertScenarios.json');
  let incidentsTouched = 0;

  // Process oldest-first so correlation timelines read chronologically.
  const sorted = [...events].sort((a, b) => b.minutesAgo - a.minutesAgo);

  for (const evt of sorted) {
    const { _scenario, minutesAgo, ...payload } = evt;
    payload.detectedAt = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
    const { incident } = await ingestEvent(payload);
    if (incident) incidentsTouched += 1;
  }

  logger.info(`Ingested ${sorted.length} alert events, touching ${incidentsTouched} incident correlations.`);
}

async function applyIncidentWorkflowSamples() {
  const analysts = await User.findAll({ where: { role: ['analyst_tier1', 'analyst_tier2'] } });
  // Most recent incidents first, so index 0 is the newest/most severe (ransomware)
  // and the last index is the oldest (the resolved historical brute-force incident).
  const incidents = await Incident.findAll({ order: [['detectedAt', 'DESC']] });

  if (incidents.length === 0 || analysts.length === 0) return;

  // Assign the oldest incidents to analysts and progress a few through their lifecycle
  // so the dashboard shows a realistic mix of open/investigating/contained/closed states.
  for (let i = 0; i < incidents.length; i += 1) {
    const incident = incidents[i];
    const analyst = analysts[i % analysts.length];

    await incidentService.assignAnalyst({
      incidentId: incident.id,
      analystId: analyst.id,
      actor: 'seed-script',
    });

    // Progress the two oldest, lowest-severity incidents toward closure to
    // demonstrate the full lifecycle; leave the most severe/recent ones open.
    if (i === incidents.length - 1) {
      // Oldest incident (resolved brute force) -> walk to closed.
      await incidentService.transitionStatus({ incidentId: incident.id, newStatus: 'contained', actor: 'seed-script', note: 'Account lockout policy engaged automatically.' });
      await incidentService.transitionStatus({ incidentId: incident.id, newStatus: 'eradicated', actor: 'seed-script', note: 'Attacker IP blocked at perimeter firewall.' });
      await incidentService.transitionStatus({ incidentId: incident.id, newStatus: 'recovering', actor: 'seed-script', note: 'Monitoring account for further anomalies.' });
      await incidentService.transitionStatus({ incidentId: incident.id, newStatus: 'closed', actor: 'seed-script', note: 'No further malicious activity observed; incident closed.' });
    } else if (i === incidents.length - 2) {
      await incidentService.transitionStatus({ incidentId: incident.id, newStatus: 'contained', actor: 'seed-script', note: 'Immediate containment action taken; remediation in progress.' });
    } else if (i === 0) {
      // Most recent / most severe incident stays open with an analyst note for realism.
      await incidentService.addAnalystNote({
        incidentId: incident.id,
        actor: analyst.fullName,
        note: 'Actively investigating - correlating EDR telemetry with threat intel match. Escalating to Tier 2.',
      });
    }
  }

  logger.info('Applied sample incident workflow transitions (assignment, containment, closure).');
}

async function run() {
  try {
    await sequelize.authenticate();
    logger.info('Connected to database for seeding.');

    logger.warn('Resetting schema (force sync) for a clean seed run...');
    await sequelize.sync({ force: true });

    await seedUsers();
    const assets = await seedAssets();
    await seedThreatIntel();
    await seedPlaybooks();
    await seedVulnerabilities(assets.map((a) => a.toJSON()));
    await seedIncidentsFromAlertScenarios();
    await applyIncidentWorkflowSamples();

    logger.info('Seed complete. Sample login credentials are documented in README.md.');
    process.exit(0);
  } catch (err) {
    logger.error(`Seed failed: ${err.stack || err.message}`);
    process.exit(1);
  }
}

run();
