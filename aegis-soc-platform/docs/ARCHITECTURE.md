# Architecture Overview

Aegis SOC is a two-tier web application: a Node.js/Express REST API backed
by a relational database, and a React single-page application for the
analyst console.

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Integrated Data Sources                     │
│  SIEM  |  EDR  |  Firewalls / IDS-IPS  |  Vulnerability Scanners     │
│  Identity Provider  |  Cloud Security Posture  |  Threat Intel Feeds │
└───────────────────────────────┬──────────────────────────────────────┘
                                 │ normalized events (POST /api/alerts/ingest)
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         Aegis SOC Backend (Express)                  │
│  ┌────────────────┐   ┌─────────────────────┐   ┌──────────────────┐│
│  │ SIEM Ingest     │──▶│ Correlation Engine   │──▶│ Risk Scoring     ││
│  │ Service         │   │ (time/asset/IP       │   │ Service (AI-style││
│  │                 │   │  clustering)         │   │  prioritization) ││
│  └────────────────┘   └─────────────────────┘   └──────────────────┘│
│           │                      │                        │          │
│           ▼                      ▼                        ▼          │
│  ┌────────────────┐   ┌─────────────────────┐   ┌──────────────────┐│
│  │ Playbook        │   │ Quarantine Service   │   │ Notification      ││
│  │ Execution Engine│   │ (device isolation)    │   │ Service (Email/SMS)││
│  └────────────────┘   └─────────────────────┘   └──────────────────┘│
│           │                                                          │
│           ▼                                                          │
│  ┌────────────────┐   ┌─────────────────────┐   ┌──────────────────┐│
│  │ Compliance      │   │ Audit Log Service     │   │ Dashboard/        ││
│  │ Reporting       │   │ (tamper-evident trail)│   │ Analytics API     ││
│  └────────────────┘   └─────────────────────┘   └──────────────────┘│
└───────────────────────────────┬──────────────────────────────────────┘
                                 │ REST + JWT auth
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     Aegis SOC Frontend (React SPA)                   │
│  Dashboard | Incidents | Alerts | Assets | Vulnerabilities |         │
│  Attack Map | Threat Intel | Compliance | Audit Logs | Playbooks     │
└──────────────────────────────────────────────────────────────────────┘
```

## Core data flow: detection to remediation

1. **Ingestion** - An external tool (or the demo seed script) posts a
   normalized event to `POST /api/alerts/ingest`. `siemIngestService`
   resolves the affected asset and persists an `Alert` record.
2. **Correlation** - `correlationEngine.correlateAlert` looks for related
   alerts within a 15-minute window sharing the same asset or IP address,
   and either attaches the new alert to an existing open `Incident` or
   opens a new one.
3. **Risk scoring** - `riskScoringService.computeRiskScore` combines alert
   severity, multi-source correlation strength, affected asset criticality,
   MITRE ATT&CK tactic weight, and threat intelligence matches into an
   explainable 0-100 score and severity band. This score drives incident
   priority ordering across the platform.
4. **Notification** - Critical/high incidents trigger
   `notificationService.notifyIncident`, fanning out email (and SMS for
   high-severity) alerts to SOC managers and admins.
5. **Response** - Analysts can manually quarantine an asset
   (`quarantineService`) or trigger the matched `Playbook` end-to-end via
   `playbookService.executePlaybook`, which can auto-isolate assets and
   logs every step to the incident timeline.
6. **Audit & compliance** - Every state-changing action writes an
   `AuditLog` entry. `complianceService.generateComplianceReport`
   evaluates live incident/vulnerability/audit data against a framework's
   control catalog (SOC 2, ISO 27001, PCI DSS, HIPAA, GDPR, NIST CSF) to
   produce a scored, evidence-backed report.

## Why SQLite by default?

Small businesses adopting a SOC platform often don't want to stand up and
operate a separate database server. Aegis SOC defaults to a single-file
SQLite database (`DB_DIALECT=sqlite`) so the entire platform runs with
zero external infrastructure. When you outgrow that (multiple concurrent
writers, HA requirements, larger data volumes), set `DB_DIALECT=postgres`
and the connection fields in `.env` - the Sequelize models and every
service are dialect-agnostic and require no code changes.

## Extending with real integrations

Every external integration point is isolated behind a service boundary so
real vendor SDKs/APIs can be dropped in without touching business logic:

| Capability | Service file | Replace with |
|---|---|---|
| SIEM/EDR/firewall ingestion | `services/siemIngestService.js` | Splunk HEC, Elastic, CrowdStrike, Microsoft Sentinel webhooks that call `ingestEvent()` |
| Device quarantine | `services/quarantineService.js` | CrowdStrike, Microsoft Defender for Endpoint, Cisco ISE APIs |
| Email/SMS alerts | `services/notificationService.js` | Nodemailer/SES/SendGrid, Twilio |
| Threat intel feeds | `services/threatIntelService.js` | AlienVault OTX, MISP, Recorded Future |
