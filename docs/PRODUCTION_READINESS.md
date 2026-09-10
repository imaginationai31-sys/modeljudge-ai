# Production Readiness & Operational Handover — v1.0.0

This document defines the boundary between the reusable ModelJudge AI software asset and production operations that must be configured by a buyer/operator.

## Readiness status

| Area | v1.0.0 status | Buyer/operator action |
| --- | --- | --- |
| Application/API | Ready for deployment | Configure environment and deploy |
| PostgreSQL persistence | Implemented | Provision managed PostgreSQL and run migrations |
| Reviewer authentication | Implemented | Create reviewer/admin accounts and protect credentials |
| Buyer API authentication | Implemented | Generate buyer keys and store them outside source control |
| Input validation / duplicate detection | Implemented | Define task-specific validation policy |
| Quality and reliability reports | Implemented | Set buyer-specific acceptance thresholds |
| CI tests | Automated and passing in repository CI | Keep CI required for protected branches |
| Structured application logging | Implemented | Connect platform logs to retention/aggregation service |
| Error-event capture | Implemented locally | Connect to hosted alerting/monitoring if required |
| Backups / restore | Not operated by the repository | Configure managed DB backups and test restoration |
| TLS / network controls | Deployment-dependent | Enforce HTTPS, database TLS, firewall/private networking as appropriate |
| Centralized monitoring / alerting | Not bundled | Connect preferred provider and define alerts |
| SSO / SCIM / organization management | Not bundled | Add enterprise identity integration if required |
| Commercial dataset licensing | Not bundled | Complete provenance and rights review before redistribution |
| Independent external audit | Not completed | Commission an audit if buyer requirements call for one |

## Required production environment

At minimum, a production operator should configure:

- Node.js 20+ runtime
- PostgreSQL with a supported version and automated backups
- `DATABASE_URL` and database TLS settings through a secret manager
- a strong `ADMIN_BOOTSTRAP_TOKEN`, supplied only during controlled bootstrap
- `CORS_ORIGIN` restricted to the intended frontend origin(s)
- HTTPS at the public edge
- restricted database network access
- log retention appropriate to the sensitivity of prompts and model outputs
- an operational process for reviewer account lifecycle and buyer API-key rotation

## Database operations

1. Provision a dedicated production PostgreSQL database.
2. Configure `DATABASE_URL` and TLS settings as deployment secrets.
3. Run `npm run migrate` from `backend` before enabling production traffic.
4. Verify `/api/health` reports `storage: "postgres"`.
5. Create controlled reviewer/admin accounts.
6. Verify backup creation and perform a restore test before relying on the system for important evaluation data.

Do not use the repository's JSONL mode as the primary production datastore.

## Security boundaries

The application provides application-level controls, but infrastructure security remains an operator responsibility. In particular:

- never commit database credentials, bootstrap tokens, reviewer passwords, or buyer API keys;
- keep buyer API keys out of browser code and URLs;
- rotate/revoke keys during buyer handover;
- restrict database access to trusted application infrastructure;
- use TLS and a verified CA configuration where the deployment environment supports it;
- review whether retained prompts/model outputs contain confidential or personal information;
- define retention and deletion procedures before collecting sensitive production evaluations.

## Monitoring and incident response

The application emits structured request logs and captures local error events. These are deliberately vendor-neutral. A production operator should connect them to the chosen hosting/logging/monitoring stack and define at least:

- API 5xx alerting
- repeated authentication failures
- database connectivity failures
- abnormal request volume or quota consumption
- disk/log growth where applicable
- backup failures
- service availability checks

For incidents, preserve relevant request IDs and timestamps while avoiding unnecessary retention of prompt/model-output content.

## Release and rollback checklist

Before a production release:

1. Run `npm ci`.
2. Run `npm run verify` from the repository root.
3. Run the full backend quality pipeline.
4. Review generated quality/certification artifacts.
5. Apply database migrations before code that depends on them.
6. Deploy the application.
7. Check `/api/health` and a representative authenticated API request.
8. Confirm logs and alerts are receiving events.
9. Record the deployed commit/version for rollback.

Rollback should use the last known-good application version and follow the database migration compatibility policy of the deployment. Never roll back application code blindly across irreversible schema changes.

## Buyer acceptance evidence

A buyer can use the following evidence during technical due diligence:

- successful GitHub Actions run covering unit, API, and PostgreSQL-backed integration tests;
- migration files and PostgreSQL integration suite;
- structured logging and error-tracking implementation;
- versioned release manifest and SHA-256 checksums;
- security and provenance documentation;
- explicit limitations and operational handover requirements.

This document does not represent an independent security audit, SLA, uptime guarantee, or certification. It is an operational boundary and handover checklist for the v1.0.0 software asset.
