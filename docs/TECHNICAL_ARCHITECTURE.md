# ModelJudge AI — Technical Architecture

## 1. Purpose and system boundary

ModelJudge AI is a deployable human-preference evaluation platform. Its primary software boundary includes the browser-based evaluation workspace, Node.js/Express API, PostgreSQL persistence, reviewer and verification workflows, quality/reliability controls, release generation, and authenticated buyer API.

The current repository is an **advanced MVP / buyer-ready software foundation**. It is designed to be extended into larger evaluation operations rather than presented as an independently audited enterprise platform.

## 2. High-level architecture

```text
┌──────────────────────────────┐
│           Browser            │
│ Evaluation / Dataset / Buyer │
│ Console / Release UI          │
└──────────────┬───────────────┘
               │ HTTPS
               ▼
┌──────────────────────────────┐
│ Render public service        │
│ scripts/start.js             │
│ Static frontend + /api proxy │
└──────────────┬───────────────┘
               │ /api
               ▼
┌──────────────────────────────┐
│ Node.js + Express backend    │
│                              │
│ Evaluation API               │
│ Reviewer authentication      │
│ Review / verification        │
│ Gold calibration             │
│ Reliability / reviewer QC    │
│ Buyer API / key management   │
│ Release generation           │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ PostgreSQL                   │
│ Evaluations / reviews /      │
│ calibration / buyer access / │
│ migrations                   │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Release artifacts            │
│ JSONL / CSV / manifest       │
│ SHA-256 integrity evidence   │
└──────────────┬───────────────┘
               │ authenticated
               ▼
┌──────────────────────────────┐
│ Buyer API                    │
│ Catalog / manifest / quality │
│ reviewer evidence / dataset  │
│ usage logging                │
└──────────────────────────────┘
```

## 3. Major components

### Frontend

The `frontend/` application provides the operator and buyer-facing web experience, including:

- AI response evaluation and submission
- Dataset Explorer
- Reviewer and verification workflows
- Dataset release inspection
- Quality/certification evidence
- Buyer Developer Console
- Buyer API documentation
- Acquisition/asset overview

The frontend communicates with the backend through `/api` endpoints. Buyer credentials are entered by the buyer at runtime and are not intended to be embedded in source code.

### Public service and routing

`scripts/start.js` is the production entry point used by Render. It serves the static frontend and proxies `/api` traffic to the internal Express API. Render supplies the public `PORT`; the internal backend listens on its configured application port.

The startup sequence also handles required operational initialization such as migrations, diagnostics, verification synchronization, and release preparation before exposing the application.

### Node.js / Express backend

The `backend/` layer contains the application API and domain logic. Important responsibilities include:

- evaluation persistence and retrieval
- validation and duplicate detection
- reviewer authentication and sessions
- review submission and verification synchronization
- gold calibration
- reliability calculations
- reviewer-quality controls
- buyer API authentication and access control
- buyer management and usage logging
- release and manifest generation
- storage adapters for PostgreSQL/local development

### PostgreSQL and storage

Production persistence uses PostgreSQL through the database/storage adapters. Ordered SQL migrations under `backend/migrations/` evolve the production schema.

The application also supports local-first development paths, including JSONL-based data handling and export tooling. Production deployments should use protected database credentials, TLS, backups, monitoring, and a tested restore process.

## 4. Evaluation and data lifecycle

The core data lifecycle is:

```text
Create evaluation
      ↓
Server validation + duplicate detection
      ↓
Human reviewer assessment
      ↓
Review decision / verification action
      ↓
Verified evaluation state
      ↓
Calibration + reviewer-quality controls
      ↓
Quality filtering + reliability evidence
      ↓
Release generation
      ↓
Immutable manifest + SHA-256 checksums
      ↓
Authenticated buyer access
```

An evaluation is not treated as a release-ready record merely because it exists. Review and verification state, quality controls, and release-generation steps provide additional gates between raw evaluation activity and buyer-facing artifacts.

## 5. Reviewer authentication and verification

Reviewer access is separated from buyer access.

Reviewer authentication uses password-derived credentials and expiring sessions. Review records contain verification actions, and approved review actions can synchronize the corresponding evaluation into a verified state.

The verification system is intentionally server-side so that changing a browser display cannot by itself create a verified evaluation.

## 6. Calibration, reliability, and reviewer quality

ModelJudge AI includes multiple quality-control layers:

- Gold calibration for checking reviewer performance against known answers
- Agreement and reliability reporting
- Cohen's kappa, Fleiss' kappa, and nominal Krippendorff's alpha support
- Deterministic bootstrap confidence intervals
- Reviewer-quality reporting
- Tie-rate and review-count evidence
- Automated quality filtering
- Certification-readiness reporting

These controls provide evidence about the evaluation process. They do not constitute a guarantee of universal factual correctness or prove that one model is objectively superior in every context.

## 7. Buyer API architecture

The buyer API is designed as a controlled machine-to-machine interface.

Authentication supports:

- `X-API-Key`
- `Authorization: Bearer <key>`

Buyer keys are generated with a `mj_live_` prefix and stored as hashes rather than plaintext. The raw key is returned only during creation or rotation. Access is scope-controlled, with `dataset:read` used for dataset retrieval, and buyer activity is subject to quota/rate controls and usage logging.

Typical buyer resources include:

```text
/api/buyer/releases
/api/buyer/releases/:version/manifest
/api/buyer/releases/:version/quality
/api/buyer/releases/:version/reviewer-quality
/api/buyer/releases/:version/dataset?format=jsonl
/api/buyer/releases/:version/usage
```

A production operator should never publish a buyer API key in frontend source, URLs, screenshots, public repositories, or support tickets.

## 8. Release and integrity architecture

A release packages validated evaluation data into buyer-consumable artifacts such as JSONL and CSV, accompanied by a release manifest.

The manifest records information such as:

- dataset and release identity
- generation timestamp
- immutability status
- record count
- supported formats
- file byte counts
- SHA-256 checksums
- provenance and licensing guidance
- verification information

The buyer download flow can verify the downloaded bytes against the expected SHA-256 checksum before allowing the artifact to be saved. This provides byte-level integrity evidence for the release artifact.

## 9. Current deployment architecture

The repository is designed for a GitHub-to-Render deployment flow:

```text
GitHub repository
      ↓
Render build/deploy
      ↓
scripts/start.js
      ├── migrations / startup diagnostics
      ├── verification synchronization
      ├── release preparation
      ├── internal Express API
      └── public frontend + API proxy
```

The public service uses Render's `PORT` environment variable. The startup wrapper keeps the API and frontend behind the same public service boundary, reducing browser CORS complexity for the deployed application.

## 10. CI and quality gates

GitHub Actions provides automated repository checks. The CI workflow runs Node.js tests and the dataset/quality pipeline, including validation, export, filtering, reliability, reviewer-control, and certification-readiness reporting. Generated quality artifacts are uploaded by CI for inspection.

The repository therefore has an automated engineering and quality baseline rather than relying exclusively on manual browser testing.

## 11. Security boundaries

The main security boundaries are:

1. **Browser boundary** — public UI and user-entered credentials.
2. **Application boundary** — Express API validates requests and enforces workflow rules.
3. **Reviewer boundary** — authenticated reviewer sessions and verification actions.
4. **Buyer boundary** — scoped API keys, quotas/rate controls, and usage logging.
5. **Persistence boundary** — PostgreSQL credentials and database access remain server-side.
6. **Release boundary** — buyer-facing artifacts are exposed through controlled release endpoints and integrity metadata.

Secrets such as `DATABASE_URL`, reviewer secrets, and buyer credentials belong in deployment environment configuration rather than source control.

## 12. Extension points for an acquirer

The existing architecture leaves clear expansion points for a commercial operator:

- Organization/team workspaces
- Enterprise SSO and role-based access control
- Billing and subscription management
- Larger reviewer pools and task queues
- Model/provider integrations
- Automated evaluation pipelines
- Custom rubrics and evaluation schemas
- Advanced analytics and experiment dashboards
- More export formats and object storage
- Webhooks and event-driven integrations
- Dataset version comparison and lineage
- Enterprise observability and audit infrastructure
- Dedicated buyer/customer portals

These are extension opportunities, not claims that the current MVP already implements each capability.

## 13. Operational limitations and acquisition diligence

The software foundation is buyer-ready for demonstration, customization, and further development. Before a commercial acquisition or large production rollout, an acquirer should independently review:

- deployment and infrastructure configuration
- database backups and restore procedures
- access-control configuration
- dependency and vulnerability posture
- observability and incident response
- dataset provenance and licensing
- reviewer/annotation agreements
- third-party content rights
- privacy and data-retention requirements
- commercial ownership and assignment terms

The current demonstration dataset should not be treated as proof of production-scale dataset supply. Software ownership and dataset/content rights should be documented separately in any acquisition agreement.

## 14. Related documentation

- `docs/ACQUISITION_OVERVIEW.md` — software asset and acquisition overview
- `docs/BUYER_ONBOARDING.md` — buyer workflow and onboarding
- `docs/API_QUICKSTART.md` — API integration examples
- `docs/BUYER_API.md` — buyer API controls
- `docs/BUYER_RELEASES.md` — release packaging
- `docs/CERTIFICATION.md` — certification-readiness methodology
- `docs/RELIABILITY.md` — reliability methodology
- `docs/PRODUCTION_DEPLOYMENT.md` — deployment operations
- `docs/SECURITY_HARDENING.md` — security controls

## 15. Summary

ModelJudge AI is structured as a modular evaluation-data platform: the browser captures judgments, the Express backend enforces workflow and security rules, PostgreSQL provides durable production persistence, quality systems produce evidence, and the release/buyer layers turn verified evaluations into controlled machine-readable artifacts.

That separation gives an acquirer a practical foundation for extending the platform without requiring a rewrite of the core evaluation, verification, quality, release, and buyer-access workflow.
