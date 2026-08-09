'use strict';

const logger = require('../config/logger');

/**
 * Notification service abstracts SMS/email delivery so the rest of the
 * platform never talks to a provider SDK directly. Swap the internals of
 * sendEmail/sendSms for real Nodemailer/Twilio calls when wiring up
 * production credentials in `.env`. Kept provider-agnostic so a small
 * business can start with email-only and add SMS later at no code cost.
 */

async function sendEmail({ to, subject, body }) {
  // In production: integrate Nodemailer (SMTP_* env vars) or a transactional
  // email API (SendGrid, SES, Postmark). Stubbed here so the platform is
  // runnable out-of-the-box without external credentials.
  logger.info(`[EMAIL] To: ${to} | Subject: ${subject} | Body: ${body.slice(0, 120)}...`);
  return { delivered: true, channel: 'email', to, subject };
}

async function sendSms({ to, message }) {
  // In production: integrate Twilio (SMS_* env vars) or another SMS gateway.
  logger.info(`[SMS] To: ${to} | Message: ${message.slice(0, 140)}`);
  return { delivered: true, channel: 'sms', to, message };
}

/**
 * High level helper used by the correlation/incident engine to fan out
 * a security alert to the right escalation contacts based on severity.
 */
async function notifyIncident({ incident, recipients }) {
  const subject = `[Aegis SOC] ${incident.severity.toUpperCase()} incident ${incident.referenceCode}: ${incident.title}`;
  const body = `A new ${incident.severity} severity incident has been created.\n\n` +
    `Reference: ${incident.referenceCode}\nCategory: ${incident.category}\nRisk Score: ${incident.riskScore}/100\n\n` +
    `${incident.summary || 'See the SOC dashboard for full correlation details.'}`;

  const results = [];
  for (const recipient of recipients) {
    if (recipient.email) {
      results.push(await sendEmail({ to: recipient.email, subject, body }));
    }
    if (recipient.phoneNumber && (incident.severity === 'critical' || incident.severity === 'high')) {
      results.push(
        await sendSms({
          to: recipient.phoneNumber,
          message: `Aegis SOC: ${incident.severity.toUpperCase()} incident ${incident.referenceCode} - ${incident.title}. Check dashboard immediately.`,
        })
      );
    }
  }
  return results;
}

module.exports = { sendEmail, sendSms, notifyIncident };
