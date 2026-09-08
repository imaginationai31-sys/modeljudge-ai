# ModelJudge AI — Software Acquisition Checklist

This checklist is intended for a prospective acquirer evaluating or taking ownership of the ModelJudge AI software asset.

> ModelJudge AI is being positioned primarily as a reusable AI evaluation platform and software foundation. The current demonstration dataset should not be treated as automatically transferable commercial data; provenance, licensing, and third-party rights must be reviewed separately.

## 1. Asset scope

### Included software assets

- [x] Frontend evaluation workspace
- [x] Dataset Explorer and release interfaces
- [x] Reviewer workflow and verification system
- [x] Calibration and reviewer-quality controls
- [x] Reliability reporting
- [x] Quality filtering and certification-readiness pipeline
- [x] PostgreSQL persistence layer
- [x] Database migrations
- [x] Dataset export and release-generation tooling
- [x] Immutable release manifests and SHA-256 integrity checks
- [x] Authenticated buyer API
- [x] Buyer Developer Console
- [x] Documentation and operational guides
- [x] Automated tests
- [x] GitHub Actions CI/deployment configuration

### Items requiring explicit agreement

- [ ] Repository ownership transfer
- [ ] Domain/branding transfer, if applicable
- [ ] Hosting account and production infrastructure transfer
- [ ] Environment-variable and secret rotation
- [ ] Third-party service/account transfer
- [ ] Commercial rights to any included datasets or third-party content
- [ ] Final licensing and provenance review
- [ ] Support/maintenance period
- [ ] Future development obligations

## 2. Technical due diligence

A buyer should verify:

- [ ] Repository builds from a clean checkout
- [ ] Node.js engine requirement is satisfied
- [ ] Backend dependencies install successfully
- [ ] Automated tests pass
- [ ] Dataset validation passes
- [ ] Export pipeline completes
- [ ] Quality filtering completes
- [ ] Reliability reporting completes
- [ ] Reviewer-quality reporting completes
- [ ] Certification-readiness reporting completes
- [ ] Release generation completes
- [ ] PostgreSQL migrations run successfully
- [ ] Production environment starts successfully
- [ ] Frontend and API routes are reachable
- [ ] Buyer API authentication rejects missing/invalid credentials
- [ ] Buyer API scope enforcement works
- [ ] Buyer usage/rate controls work as configured
- [ ] Release manifest checksums match generated artifacts

## 3. Security handover

Before ownership changes hands:

1. Rotate every production secret.
2. Revoke temporary or previous-owner credentials.
3. Create new database credentials or transfer the database securely.
4. Generate new buyer API keys rather than transferring raw keys.
5. Review GitHub repository collaborators and deploy permissions.
6. Review Render/environment access and remove unnecessary users.
7. Review logs for credentials, personal information, or other sensitive data.
8. Confirm no secrets are committed to the repository.
9. Confirm HTTPS/TLS is enabled for production services.
10. Establish a buyer-controlled backup and restore procedure.

Never put buyer API keys, database passwords, session secrets, or deployment credentials in frontend source code, public documentation, screenshots, URLs, or Git history.

## 4. Data and provenance due diligence

The software can generate and manage evaluation datasets, but software ownership does not automatically establish rights to every dataset record.

For every commercial release, the buyer should verify:

- [ ] Task/prompt provenance
- [ ] Model-response provenance
- [ ] Human annotation/reviewer permissions
- [ ] Third-party content rights
- [ ] Privacy/PII review
- [ ] Applicable contractual restrictions
- [ ] Dataset-specific license
- [ ] Intended commercial use
- [ ] Retention/deletion obligations
- [ ] Geographic or regulatory restrictions, where applicable

Quality scores and verification status describe the evaluation process; they are not a legal warranty that every underlying record is commercially reusable.

## 5. Production deployment handover

Recommended sequence:

```text
Buyer accepts scope
      ↓
Repository/infrastructure access transfer
      ↓
Rotate secrets and credentials
      ↓
Provision buyer-controlled PostgreSQL
      ↓
Run migrations
      ↓
Configure production environment
      ↓
Deploy application
      ↓
Run health + smoke tests
      ↓
Verify buyer API + release integrity
      ↓
Enable production traffic
```

The existing startup process is designed to initialize migrations and production services through the repository's startup workflow. The buyer should still perform a clean deployment in buyer-controlled infrastructure before treating the environment as production-ready.

## 6. Functional acceptance test

A practical acceptance test should demonstrate:

### Evaluation

- [ ] Submit an evaluation
- [ ] Validate required fields
- [ ] Detect duplicate prompts where applicable
- [ ] Persist the evaluation

### Human review

- [ ] Reviewer can authenticate
- [ ] Reviewer can submit a review
- [ ] Verification action is persisted
- [ ] Approved review updates verification state
- [ ] Reviewer quality metrics update

### Quality

- [ ] Calibration workflow operates
- [ ] Reliability metrics generate
- [ ] Quality filtering operates
- [ ] Certification-readiness report generates

### Release

- [ ] Release is generated
- [ ] Manifest is produced
- [ ] JSONL and CSV artifacts are available
- [ ] Record counts are consistent
- [ ] SHA-256 hashes match the actual artifact bytes
- [ ] Immutable release metadata is preserved

### Buyer API

- [ ] Missing key returns unauthorized response
- [ ] Invalid key returns unauthorized response
- [ ] Valid scoped key can access permitted endpoints
- [ ] Unsupported scope is rejected
- [ ] Usage is logged
- [ ] Rate/usage limits behave as configured

## 7. Current demonstration baseline

The live demonstration currently represents a small proof dataset rather than production-scale training data. The documented release baseline is intended to demonstrate the complete software workflow:

- 5 evaluations
- 5 human-verified records
- 100% verification rate
- 4.25/5 average quality score
- JSONL and CSV release artifacts
- SHA-256 release integrity
- Reviewer-quality evidence

These numbers demonstrate platform functionality and should not be represented as evidence of production-scale dataset volume.

## 8. Buyer acceptance criteria

A sensible software-only acquisition acceptance package should include:

- [ ] Repository access confirmed
- [ ] Clean deployment reproduced
- [ ] Automated tests passing
- [ ] Core evaluation workflow demonstrated
- [ ] Reviewer verification demonstrated
- [ ] Release integrity demonstrated
- [ ] Buyer API demonstrated
- [ ] Documentation reviewed
- [ ] Security handover completed
- [ ] Ownership/licensing agreement executed
- [ ] Dataset rights documented separately

## 9. Recommended post-acquisition roadmap

After acceptance, an acquirer could prioritize:

1. Increase evaluation volume and reviewer coverage.
2. Add organization/team workspaces.
3. Add enterprise SSO and role-based access control.
4. Add billing and subscription management.
5. Add model/provider integrations.
6. Add richer analytics and experiment dashboards.
7. Add automated ingestion and evaluation pipelines.
8. Expand dataset formats and storage backends.
9. Add enterprise audit/export controls.
10. Conduct an independent security and data-provenance review.

## 10. Important maturity statement

ModelJudge AI should currently be evaluated as an **Advanced MVP / buyer-ready software foundation**. It contains substantial reusable engineering infrastructure, but a buyer should independently validate production infrastructure, scale characteristics, security, legal rights, dataset provenance, and operational requirements before commercial deployment.

## Related documentation

- `docs/ACQUISITION_OVERVIEW.md` — asset and acquisition overview
- `docs/TECHNICAL_ARCHITECTURE.md` — system architecture
- `docs/BUYER_ONBOARDING.md` — buyer workflow
- `docs/API_QUICKSTART.md` — API integration
- `docs/BUYER_API.md` — buyer API controls
- `docs/PRODUCTION_DEPLOYMENT.md` — deployment operations
- `docs/SECURITY_HARDENING.md` — security controls
- `docs/CERTIFICATION.md` — quality/certification methodology
