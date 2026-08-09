# API Reference

Base URL: `http://localhost:4000/api`

All endpoints except `POST /auth/login` require a `Authorization: Bearer <token>`
header. Obtain a token via login. Responses use the envelope:

```json
{ "success": true, "data": { ... }, "meta": { ... } }
```

Errors:

```json
{ "success": false, "message": "...", "details": [ ... ] }
```

## Auth

| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | `{ email, password }` → `{ token, user }` |
| GET | `/auth/me` | Current authenticated user |
| POST | `/auth/logout` | Invalidate session (client-side token discard + audit entry) |

## Dashboard & Analytics

| Method | Path | Description |
|---|---|---|
| GET | `/dashboard/summary` | Top-line KPIs: open incidents, alerts (24h), asset health, vulnerability counts |
| GET | `/dashboard/trends?days=14` | Time series data for charts: incidents/alerts per day, severity/category/source breakdowns |

## Incidents

| Method | Path | Description |
|---|---|---|
| GET | `/incidents` | List, filterable by `status`, `severity`, `category`, `assignedAnalystId` |
| GET | `/incidents/:id` | Full detail including alerts, timeline, playbook |
| POST | `/incidents/:id/assign` | `{ analystId }` - assign to an analyst |
| POST | `/incidents/:id/status` | `{ status, note? }` - transition through the incident lifecycle |
| POST | `/incidents/:id/notes` | `{ note }` - add an analyst note to the timeline |
| POST | `/incidents/:id/execute-playbook` | Run the matched response playbook |

Valid status transitions: `open → investigating → contained → eradicated → recovering → closed`
(or `→ closed` directly from `open`/`investigating`).

## Alerts

| Method | Path | Description |
|---|---|---|
| GET | `/alerts` | List, filterable by `severity`, `source`, `status` |
| POST | `/alerts/ingest` | Generic ingestion endpoint for SIEM/EDR/firewall/scanner events. Feeds the correlation engine. |

### Example: ingest an event

```bash
curl -X POST http://localhost:4000/api/alerts/ingest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "edr",
    "ruleName": "Suspicious PowerShell encoded command",
    "severity": "high",
    "mitreTactic": "execution",
    "mitreTechnique": "T1059.001",
    "assetHostname": "WKS-FINANCE-07",
    "sourceIp": "10.20.11.7",
    "description": "Base64-encoded PowerShell command spawned from Outlook.exe"
  }'
```

## Assets

| Method | Path | Description |
|---|---|---|
| GET | `/assets` | List, filterable by `status`, `assetType`, `criticality`, `search` |
| GET | `/assets/:id` | Detail with vulnerabilities and recent alerts |
| POST | `/assets` | Create (admin/soc_manager) |
| PUT | `/assets/:id` | Update |
| POST | `/assets/:id/quarantine` | `{ reason, incidentId? }` - isolate the device from the network |
| POST | `/assets/:id/release` | `{ notes?, incidentId? }` - release from quarantine |

## Vulnerabilities

| Method | Path | Description |
|---|---|---|
| GET | `/vulnerabilities` | List, filterable by `severity`, `status` |
| POST | `/vulnerabilities` | Record a new finding |
| PUT | `/vulnerabilities/:id` | Update status (auto-stamps `remediatedAt` on `remediated`) |

## Threat Intelligence

| Method | Path | Description |
|---|---|---|
| GET | `/threat-intel` | List indicators, filterable by `severity`, `indicatorType`, `isActive` |
| GET | `/threat-intel/map` | Active indicators with geo-coordinates for the attack map |

## Compliance

| Method | Path | Description |
|---|---|---|
| GET | `/compliance` | List generated reports |
| GET | `/compliance/:id` | Report detail |
| POST | `/compliance/generate` | `{ framework, periodStart, periodEnd }` - one of `SOC2`, `ISO27001`, `PCI_DSS`, `HIPAA`, `GDPR`, `NIST_CSF` |

## Audit Logs

| Method | Path | Description |
|---|---|---|
| GET | `/audit-logs` | List (admin/soc_manager/auditor only), filterable by `action`, `entityType` |

## Playbooks

| Method | Path | Description |
|---|---|---|
| GET | `/playbooks` | List all response playbooks |
| POST | `/playbooks` | Create (admin/soc_manager) |
| PUT | `/playbooks/:id` | Update |

## Users

| Method | Path | Description |
|---|---|---|
| GET | `/users` | List (admin/soc_manager) |
| POST | `/users` | Create user (admin) |
| PUT | `/users/:id` | Update user (admin) |

## Roles

| Role | Typical permissions |
|---|---|
| `admin` | Full access including user management |
| `soc_manager` | Assign incidents, generate compliance reports, manage playbooks/assets |
| `analyst_tier2` | Update assets/vulnerabilities, execute playbooks, quarantine devices |
| `analyst_tier1` | Triage alerts, quarantine devices, work incidents |
| `auditor` | Read-only access to audit logs and compliance reports |
