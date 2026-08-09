# Compliance Reporting Guide

Aegis SOC generates evidence-backed compliance reports by evaluating your
live incident, vulnerability, and audit log data against a framework's
control catalog. This document explains the supported frameworks, how
scoring works, and how to extend the control catalog.

## Supported frameworks

| Framework | Use case |
|---|---|
| **SOC 2** | Service organizations demonstrating trust services criteria to customers/auditors |
| **ISO 27001** | Information security management system certification |
| **PCI DSS** | Organizations handling cardholder data (relevant given the platform's point-of-sale monitoring) |
| **HIPAA** | Organizations handling protected health information |
| **GDPR** | Organizations processing EU personal data |
| **NIST CSF** | General-purpose cybersecurity framework alignment |

## How scoring works

Each framework maps to a list of controls (`FRAMEWORK_CONTROLS` in
`backend/src/services/complianceService.js`). Each control has an
`evaluate(periodStart, periodEnd)` function that inspects real platform
data for the reporting period:

- **Incident response time** - flags incidents that breached their SLA
  containment deadline.
- **Incident triage** - flags open incidents that were never assigned to
  an analyst.
- **Vulnerability remediation** - flags open/in-progress findings past
  their remediation due date.
- **Monitoring coverage** - checks data source telemetry health (stubbed
  for demo; wire to real heartbeat checks in production).
- **Audit logging** - confirms audit trail entries exist for the period.

The `overallScore` is the percentage of controls that passed. Every
report stores its full findings (`findings` JSON column) so past reports
remain a permanent, immutable audit artifact - important for auditor
review.

## Extending the control catalog

To add a new control to an existing framework, add an entry to its array
in `FRAMEWORK_CONTROLS` with a unique `id`, a human-readable `name`, and
an `evaluate` function returning `{ passed: boolean, detail: string }`.
To support a new framework entirely, add a new key to
`FRAMEWORK_CONTROLS` and extend the `framework` ENUM on the
`ComplianceReport` model.

## Generating a report

Via the UI: **Compliance → Generate New Report**, choosing a framework
and reporting period.

Via the API:

```bash
curl -X POST http://localhost:4000/api/compliance/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "framework": "SOC2", "periodStart": "2026-07-01", "periodEnd": "2026-08-01" }'
```

Report generation itself is written to the audit log
(`compliance_report.generate`), preserving a record of who generated
which report and when.
