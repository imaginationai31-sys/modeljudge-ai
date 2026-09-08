# ModelJudge AI — Seller Handover Package

This document defines the recommended handover package for a software acquisition of ModelJudge AI.

## 1. Handover objective

The goal is to give the acquirer enough controlled access, documentation, and operational information to reproduce the application in buyer-controlled infrastructure without transferring unnecessary secrets or relying on the seller's personal accounts.

The software should be transferred as a repository and deployable technical asset. Credentials and infrastructure access should be transferred or recreated separately and securely.

## 2. Repository package

The seller should provide or transfer:

- [ ] Full Git repository ownership/access
- [ ] Complete commit history, where commercially agreed
- [ ] `README.md`
- [ ] `LICENSE`
- [ ] `CONTRIBUTING.md`
- [ ] `SECURITY.md`
- [ ] `frontend/`
- [ ] `backend/`
- [ ] `scripts/`
- [ ] `tests/`
- [ ] `docs/`
- [ ] `data/` and `exports/` subject to data-rights review
- [ ] `releases/` subject to release-rights review
- [ ] `.github/workflows/`
- [ ] Root and backend package manifests

The buyer should receive the exact commit/ref that was accepted as the acquisition baseline.

## 3. Technical documentation package

Recommended documents for handover:

- `docs/ACQUISITION_OVERVIEW.md`
- `docs/TECHNICAL_ARCHITECTURE.md`
- `docs/ACQUISITION_CHECKLIST.md`
- `docs/SELLER_HANDOVER.md`
- `docs/BUYER_ONBOARDING.md`
- `docs/API_QUICKSTART.md`
- `docs/BUYER_API.md`
- `docs/BUYER_RELEASES.md`
- `docs/CERTIFICATION.md`
- `docs/RELIABILITY.md`
- `docs/PRODUCTION_DEPLOYMENT.md`
- `docs/SECURITY_HARDENING.md`
- `docs/DEMO_GUIDE.md`

## 4. Environment configuration

Provide the buyer with a documented list of required environment variables and their purpose, but do not place live secrets in GitHub or public documentation.

Typical production configuration includes:

- `DATABASE_URL`
- session/authentication secrets
- buyer API signing/key-management configuration, where applicable
- deployment-specific configuration
- allowed-origin/CORS configuration
- production feature flags

The buyer should create fresh production secrets after transfer rather than inheriting seller credentials.

## 5. Database handover

If a production PostgreSQL database is included in the transaction, the handover should specify:

- [ ] Database ownership/control
- [ ] Database host and connection method
- [ ] Backup location and retention policy
- [ ] Restore procedure
- [ ] Migration version
- [ ] Schema documentation
- [ ] Data retention requirements
- [ ] Data deletion obligations
- [ ] PII/privacy review status

If the database is not transferred, the buyer should provision a new PostgreSQL instance and run the repository migrations before importing any data that is legally transferable.

## 6. Hosting and deployment

For the current deployment model, document:

- GitHub repository and default branch
- Render service configuration
- build/start command
- environment variables
- public service URL
- internal API architecture
- database connection
- deployment workflow
- health-check expectations
- rollback procedure

The seller should remove their personal access after the buyer confirms independent deployment.

## 7. Buyer API handover

Buyer API credentials must be treated as secrets.

Recommended process:

1. Export/document API configuration without exposing raw keys.
2. Revoke seller/test buyer keys that should not survive the transaction.
3. Generate new buyer-controlled API keys.
4. Confirm `dataset:read` scope behavior.
5. Confirm rate/usage limits.
6. Confirm buyer usage logging.
7. Run an authenticated smoke test using a newly generated buyer key.

Never transfer a raw production API key through email, public GitHub issues, screenshots, or source files.

## 8. Release package

For each release included in the transaction, document:

- Release version
- Release identifier
- Generation timestamp
- Record count
- Available formats
- Manifest
- SHA-256 checksums
- Quality report
- Reviewer-quality report
- Reliability evidence, where available
- Provenance statement
- Dataset-specific license/rights status

The current demonstration release is `v0.9.1` and should be treated as a demonstration baseline rather than proof of production-scale dataset volume.

## 9. Data rights package

The seller should separately identify the rights status of:

- Evaluation prompts
- AI-generated responses
- Human annotations
- Reviewer identities or identifiers
- External/reference material
- Dataset exports
- Release artifacts
- Logos, images, fonts, and other third-party assets

Software ownership and dataset ownership are separate questions. Any commercial dataset rights must be explicitly documented in the transaction.

## 10. Security transfer sequence

Recommended sequence:

```text
Buyer signs acquisition agreement
        ↓
Transfer repository ownership/access
        ↓
Buyer provisions independent accounts
        ↓
Rotate all secrets
        ↓
Transfer or recreate hosting
        ↓
Provision buyer-controlled PostgreSQL
        ↓
Run migrations + tests
        ↓
Deploy buyer-controlled environment
        ↓
Verify API + release integrity
        ↓
Transfer/remove remaining access
        ↓
Buyer accepts operational control
```

## 11. Acceptance test

Before final handover acceptance, the buyer should reproduce at least:

```text
Install dependencies
       ↓
Run automated tests
       ↓
Validate dataset
       ↓
Build exports
       ↓
Run quality pipeline
       ↓
Generate release
       ↓
Deploy application
       ↓
Submit evaluation
       ↓
Complete reviewer verification
       ↓
Inspect release
       ↓
Authenticate through Buyer API
       ↓
Verify SHA-256 release artifact
```

A successful reproduction is stronger evidence of software transfer than screenshots alone.

## 12. Access removal

After buyer acceptance:

- [ ] Remove seller from GitHub collaborators, if appropriate
- [ ] Remove seller from Render/team access
- [ ] Rotate database credentials
- [ ] Rotate session/auth secrets
- [ ] Revoke obsolete buyer API keys
- [ ] Remove temporary deployment credentials
- [ ] Review CI/CD credentials and tokens
- [ ] Confirm buyer owns the production accounts

## 13. Support period

If post-sale support is offered, record it explicitly:

- Support start date: __________________
- Support end date: __________________
- Included support hours: __________________
- Communication channel: __________________
- Bug-fix obligations: __________________
- Feature-development obligations: __________________
- Emergency support terms: __________________

Do not imply ongoing support unless it is part of the signed transaction terms.

## 14. Final transfer record

| Item | Status | Notes |
|---|---|---|
| Repository ownership | ☐ | |
| Production hosting | ☐ | |
| Database | ☐ | |
| Domain/branding | ☐ | |
| Documentation | ☐ | |
| CI/CD | ☐ | |
| Secrets rotated | ☐ | |
| Buyer API regenerated | ☐ | |
| Release artifacts | ☐ | |
| Data rights reviewed | ☐ | |
| Security review | ☐ | |
| Clean deployment reproduced | ☐ | |
| Buyer acceptance | ☐ | |

## 15. Final note

ModelJudge AI is currently an **Advanced MVP / buyer-ready software foundation**. The handover package should make that maturity level explicit. A buyer should independently validate production scale, security, legal rights, data provenance, operational resilience, and regulatory requirements before commercial deployment.
