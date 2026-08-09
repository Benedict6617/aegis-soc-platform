# Aegis SOC — Security Operations Center Management Platform

Aegis SOC is a full-stack Security Operations Center platform built for
small and mid-sized businesses that need enterprise-grade threat
monitoring, incident response, and compliance reporting without the cost
or operational overhead of a traditional SOC stack.

It continuously ingests events from your security tooling (SIEM, EDR,
firewalls, vulnerability scanners, identity providers, cloud posture
tools, threat intelligence feeds), automatically correlates related
events into incidents, prioritizes them with an explainable risk-scoring
model, launches predefined response playbooks, can quarantine compromised
devices, and generates audit-ready compliance reports — all from a single
analyst console.

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![Status](https://img.shields.io/badge/status-demo--ready-brightgreen)

---

## Why this exists

Most SOC platforms are priced and architected for enterprises with
dedicated security teams and existing SIEM infrastructure. Aegis SOC is
built the other way around: it runs on a single SQLite file with zero
external infrastructure, ships with a working correlation and response
engine out of the box, and is architected so each vendor integration
(SIEM, EDR, SMS/email, threat intel) is a clean, swappable service
boundary — so a small IT team can run it today and plug in real vendor
APIs as they grow.

## Key capabilities

- **Continuous monitoring** across servers, endpoints, cloud
  infrastructure, firewalls, applications, and network traffic via a
  unified event ingestion API
- **Automated correlation engine** that clusters related alerts (same
  asset, source IP, or destination IP within a time window) into a single
  incident instead of flooding analysts with noise
- **AI-style risk scoring** — an explainable, auditable 0–100 model
  weighing alert severity, correlation strength, asset criticality, MITRE
  ATT&CK tactic, and threat intelligence matches, used to prioritize the
  incident queue
- **Predefined response playbooks** that can auto-quarantine compromised
  devices, notify stakeholders, and walk analysts through containment,
  eradication, and recovery steps
- **One-click device quarantine / release** with full audit trail
- **Compliance reporting** for SOC 2, ISO 27001, PCI DSS, HIPAA, GDPR, and
  NIST CSF, scored against your live incident/vulnerability/audit data
- **Visual attack map** plotting active threat sources, geolocated by
  indicator, against your infrastructure
- **Security analytics dashboard** — incident/alert trends, severity and
  category breakdowns, alert source distribution
- **Tamper-evident audit log** of every authentication event, incident
  change, quarantine action, and report generation
- **Email/SMS alerting** for high and critical severity incidents
- **Role-based access control** (admin, SOC manager, Tier 1/2 analyst,
  auditor)

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, Sequelize ORM |
| Database | SQLite by default (zero-config); PostgreSQL-ready for scale |
| Auth | JWT + bcrypt, role-based middleware |
| Frontend | React 18 (Vite), React Router, Recharts |
| Scheduling | node-cron (threat intel refresh) |
| Logging | Winston (structured, file + console) |
| Testing | Jest, Supertest |
| Deployment | Docker Compose (backend + frontend containers) |

## Project structure

```
soc-platform/
├── backend/
│   ├── src/
│   │   ├── config/          # database + logger configuration
│   │   ├── middleware/      # auth, RBAC, error handling, request logging
│   │   ├── models/          # Sequelize models (User, Asset, Incident, Alert, ...)
│   │   ├── routes/          # REST API route handlers
│   │   ├── services/        # correlation engine, risk scoring, quarantine,
│   │   │                    # playbooks, compliance, notifications, SIEM ingest
│   │   ├── seeders/         # realistic sample data + seed script
│   │   ├── utils/           # shared helpers
│   │   ├── app.js
│   │   └── server.js
│   └── tests/                # Jest unit tests
├── frontend/
│   └── src/
│       ├── api/              # Axios client + endpoint definitions
│       ├── components/       # Layout, Dashboard, AttackMap, shared UI
│       ├── context/          # auth context
│       ├── pages/            # route-level pages
│       └── styles/
├── docs/                      # architecture, API reference, compliance guide
├── docker-compose.yml
└── LICENSE
```

## Getting started (local development)

### Prerequisites

- Node.js 18+
- npm

### 1. Backend setup

```bash
cd backend
cp .env.example .env
npm install
npm run seed     # creates the SQLite database and loads realistic sample data
npm run dev       # starts the API on http://localhost:4000
```

### 2. Frontend setup

In a separate terminal:

```bash
cd frontend
npm install
npm run dev       # starts the console on http://localhost:5173
```

Open `http://localhost:5173` and sign in with one of the demo accounts
below.

### 3. Run tests

```bash
cd backend
npm test
```

## Docker deployment

```bash
JWT_SECRET=$(openssl rand -hex 32) docker compose up --build
```

This builds and runs both the backend (port `4000`) and the frontend
(port `5173`, served via Nginx and proxying `/api` to the backend). The
SQLite database persists in a named Docker volume. Run the seed script
once against the running backend container to load sample data:

```bash
docker compose exec backend npm run seed
```

## Demo login credentials

The seed script creates the following accounts (organization: *Nimbus
Retail Co.*, a fictional mid-market retailer used throughout the sample
data):

| Name | Email | Password | Role |
|---|---|---|---|
| Dana Whitfield | dana.whitfield@nimbusretail.com | `AegisAdmin!2024` | Admin |
| Marcus Ibe | marcus.ibe@nimbusretail.com | `AegisManager!2024` | SOC Manager |
| Priya Chandrasekaran | priya.c@nimbusretail.com | `AegisAnalyst!2024` | Analyst (Tier 2) |
| Leo Fontaine | leo.fontaine@nimbusretail.com | `AegisAnalyst!2024` | Analyst (Tier 1) |
| Sofia Reyes | sofia.reyes@nimbusretail.com | `AegisAnalyst!2024` | Analyst (Tier 1) |
| Grace Oduya | grace.oduya@nimbusretail.com | `AegisAuditor!2024` | Auditor |

> These are sample credentials for the seeded demo environment only.
> Rotate or remove them before any real deployment.

## Sample data

Running `npm run seed` populates:

- **21 assets** spanning servers, endpoints, cloud instances (AWS/Azure),
  firewalls, network devices, and applications for a realistic retail
  small-business environment
- **8 active threat intelligence indicators** with real-world geo
  coordinates for the attack map, including a POS-skimming campaign, a
  phishing domain, and a ransomware loader hash
- **12 vulnerability findings** referencing real, publicly disclosed CVEs
  (e.g. `CVE-2024-3094`, `CVE-2024-21762`) across a mix of open,
  in-progress, remediated, and accepted-risk states
- **8 response playbooks** covering ransomware, phishing, malware, data
  exfiltration, DDoS, insider threat, unauthorized access, and cloud
  misconfiguration scenarios
- **A realistic incident scenario set** — ransomware on a file server,
  executive phishing, credential stuffing, data exfiltration from a
  database, reconnaissance scanning, DDoS against the storefront, and
  more — ingested through the actual correlation and risk-scoring engine
  so incidents, timelines, and risk scores are generated the same way
  they would be in production, not hand-authored

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design, data
  flow from detection to remediation, and how to plug in real vendor
  integrations
- [`docs/API.md`](docs/API.md) — full REST API reference
- [`docs/COMPLIANCE.md`](docs/COMPLIANCE.md) — how compliance scoring
  works and how to extend the control catalog

## Security notes

- Passwords are hashed with bcrypt (configurable salt rounds)
- All state-changing actions are recorded in an append-only audit log
- JWT tokens are short-lived and role-scoped; sensitive routes enforce
  RBAC middleware
- `.env.example` documents every required secret — never commit a real
  `.env` file (already excluded via `.gitignore`)
- This repository ships with **sample/demo credentials only**; rotate all
  secrets and seeded accounts before any production use

## License

Released under the [MIT License](LICENSE).
