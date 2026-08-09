'use strict';

const cron = require('node-cron');
const logger = require('../config/logger');
const { ThreatIntel } = require('../models');

/**
 * Placeholder connector for external threat intelligence feeds
 * (e.g. AlienVault OTX, MISP, commercial feeds). In production, replace
 * `fetchFromExternalFeed` with real HTTP calls using THREAT_FEED_API_KEY.
 * The scheduled job keeps `isActive` / `lastSeenAt` current so the
 * correlation engine and attack map always reflect fresh indicators.
 */
async function fetchFromExternalFeed() {
  // Stubbed: in production this calls out to the configured provider.
  logger.info('Threat intel refresh triggered (using existing local indicator set).');
  return [];
}

async function refreshFeeds() {
  const newIndicators = await fetchFromExternalFeed();
  for (const indicator of newIndicators) {
    await ThreatIntel.upsert(indicator);
  }
  logger.info(`Threat intel refresh complete. ${newIndicators.length} indicator(s) processed.`);
}

function scheduleThreatIntelRefresh() {
  const cronExpression = process.env.THREAT_FEED_REFRESH_CRON || '*/30 * * * *';
  cron.schedule(cronExpression, () => {
    refreshFeeds().catch((err) => logger.error(`Threat intel refresh failed: ${err.message}`));
  });
  logger.info(`Threat intelligence refresh scheduled with cron "${cronExpression}".`);
}

module.exports = { refreshFeeds, scheduleThreatIntelRefresh };
