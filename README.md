# ModelJudge AI

Human preference and AI response evaluation platform for building structured model-evaluation datasets.

> **Software asset:** ModelJudge AI is a deployable evaluation platform with human review, verification, calibration, quality controls, PostgreSQL storage, versioned releases, and an authenticated buyer API.

**Current software version:** 1.0.0  
**Live platform:** https://modeljudge-api.onrender.com  
**Asset & technical overview:** [docs/ACQUISITION_OVERVIEW.md](docs/ACQUISITION_OVERVIEW.md)

## What is ModelJudge AI?

ModelJudge AI is an evaluation workspace for comparing AI responses using consistent human scoring criteria. Completed evaluations can become structured, auditable dataset records for benchmarking and post-training research.

## Why this is a software asset

The primary value of the repository is the reusable application and infrastructure, not only the current demonstration dataset. An operator can deploy, customize, extend, and integrate the platform into its own AI evaluation workflow.

The repository includes the frontend, backend API, PostgreSQL persistence layer, migrations, reviewer workflows, verification logic, quality pipeline, release system, buyer API, documentation, tests, and CI configuration.

## Buyer-ready capabilities

- Pairwise A/B response evaluation
- Accuracy, relevance, clarity, and safety scoring
- Human rationale capture
- Server-side validation and duplicate detection
- JSONL/CSV dataset exports
- Multi-reviewer consensus and agreement metrics
- Cohen's kappa, Fleiss' kappa, and nominal Krippendorff's alpha
- Deterministic bootstrap confidence intervals
- Gold calibration with server-side answer checking
- Automated quality filtering
- PostgreSQL production storage and ordered migrations
- PBKDF2 reviewer authentication and expiring sessions
- Reviewer quality controls and audit history
- Versioned release manifests with SHA-256 checksums
- Buyer API-key authentication, quotas, and access logging
- Buyer portal and release inspection
- Quality Center and certification-readiness evidence
- Automated tests and GitHub Actions CI
- Production deployment workflow

## Buyer workflow

```text
Evaluate → Validate → Multi-review → Calibrate reviewers
     ↓
Quality filter → Reliability evidence → Certification gates
     ↓
Versioned release → SHA-256 manifest → Authenticated buyer access
```

## Buyer resources

- `docs/ACQUISITION_OVERVIEW.md` — software-asset acquisition and technical overview
- `docs/ASSET_TRANSFER.md` — buyer handover and production transfer checklist
- `docs/TECHNICAL_ARCHITECTURE.md` — system architecture, data flow, security boundaries, deployment, and extension points
- `docs/BUYER_ONBOARDING.md` — buyer workflow, data fields, verification, and security
- `docs/API_QUICKSTART.md` — authenticated API examples
- `docs/BUYER_API.md` — buyer API architecture and controls
- `docs/DEMO_GUIDE.md` — safe product demonstration flow
- `docs/BUYER_RELEASES.md` — release packaging
- `docs/CERTIFICATION.md` — certification-readiness methodology
- `docs/RELIABILITY.md` — reliability methodology
- `docs/PRODUCTION_DEPLOYMENT.md` — production operations
- `docs/PRODUCTION_READINESS.md` — production readiness matrix, operational boundaries, and buyer handover checklist
- `docs/SECURITY_HARDENING.md` — security controls
- `docs/DATA_PROVENANCE.md` — provenance and commercial-use guidance
- `docs/THIRD_PARTY_LICENSES.md` — dependency/license review guidance
- `docs/KNOWN_LIMITATIONS.md` — disclosed v1.0 limitations
- `docs/CHANGELOG.md` — version history

## Fresh-clone buyer verification

A buyer should be able to verify the core software from an empty directory using only Node.js 20+ and Git.

```bash
git clone https://github.com/imaginationai31-sys/modeljudge-ai.git
cd modeljudge-ai
npm ci
npm run build
npm test
```

The canonical commands are:

- `npm ci` — installs the locked root dependencies reproducibly.
- `npm run build` — runs the buyer-readiness build/verification gate.
- `npm test` — runs the project's automated backend test suite.

The backend also has its own lockfile and package scripts for the full quality pipeline. The commands below provide deeper verification when required.

## Automated tests & CI

The repository contains Node.js test coverage for core evaluation components, including calibration, quality filtering, reliability reporting, reviewer quality control, reviewer behavior, HTTP API flows, and PostgreSQL-backed persistence/authentication flows.

From the repository root:

```bash
npm ci
npm run build
npm test
```

For the full backend quality pipeline:

```bash
cd backend
npm ci
npm run lint
npm audit --omit=dev
npm test
npm run validate
npm run export
npm run filter
npm run reliability
npm run reviewer-control
npm run certification
npm run release
```

The buyer-readiness verification command checks required buyer documentation, v1.0.0 version alignment, accidental root artifacts, automated tests, linting, and dataset validation. Full production verification still requires the buyer's PostgreSQL and deployment environment.

GitHub Actions runs the same canonical root `npm ci`, `npm run build`, and `npm test` commands on pushes to `main` and pull requests targeting `main`, followed by explicit HTTP API and PostgreSQL-backed integration tests and the dataset/quality pipeline. Quality reports and coverage data are uploaded as CI artifacts. Production deployment remains separately controlled by the deployment workflow and environment configuration.

## Run locally

Requirements: Node.js 20 or newer.

```bash
cd backend
npm install
npm start
```

The API runs at `http://localhost:8787`.

From the repository root, serve the frontend with `python -m http.server 8000` and open `http://localhost:8000/frontend/`.

## Run with Docker

Docker support is included for buyers and developers who want a reproducible local deployment with PostgreSQL.

Requirements:
- Docker Desktop or Docker Engine with Docker Compose
- Git

From the repository root:

```bash
docker compose up --build
```

The application will be available at:

`http://localhost:8787`

The Docker Compose stack starts:
- ModelJudge AI Node.js/Express application
- PostgreSQL 17 database
- Persistent PostgreSQL volume
- Application-to-database networking
- Health-checked database startup

To stop the stack:

```bash
docker compose down
```

To stop the stack and remove the local database volume:

```bash
docker compose down -v
```

### Docker configuration

The application container is defined in `backend/Dockerfile`.

The PostgreSQL development stack is defined in `docker-compose.yml`.

Environment configuration should be supplied through deployment secrets or environment variables. Do not commit real database credentials, reviewer credentials, admin bootstrap tokens, or buyer API keys.

For production deployments, use a managed PostgreSQL service or secured PostgreSQL infrastructure with TLS, backups, restricted network access, monitoring, and a tested restore procedure.

## PostgreSQL mode

JSONL is intended for local development. Configure `DATABASE_URL` for PostgreSQL-backed operation and run:

```bash
cd backend
npm run migrate
```

Production should use TLS, restricted database access, backups, monitoring, and a tested restore procedure. See `docs/PRODUCTION_READINESS.md` for the complete operational handover checklist.

## Quality pipeline

```bash
cd backend
npm test
npm run validate
npm run export
npm run filter
npm run reliability
npm run reviewer-control
npm run certification
npm run release
```

CI runs the quality pipeline before an optional production deployment hook. Deployment is disabled until the deployment environment explicitly sets `DEPLOY_ENABLED=true`.

## Buyer API

Production buyer access requires PostgreSQL and a buyer API key. Keys are hashed at rest and the raw key is returned only when created or rotated. Dataset access is logged by buyer and release version.

Never expose buyer keys in frontend source code, URLs, public repositories, screenshots, or support tickets.

## Data and provenance

Sample records are illustrative. Before commercial distribution, review the provenance and licensing of every task, prompt, model response, annotation, and external source included in a release. See `docs/DATA_PROVENANCE.md`.

Quality metrics describe the evaluation process; they are not guarantees of universal factual correctness or proof that one model is objectively superior.

## Release readiness

- [x] Evaluation interface and schema
- [x] Persistent evaluation API
- [x] Validation and duplicate detection
- [x] JSONL/CSV export engine
- [x] Multi-reviewer consensus
- [x] Reliability metrics
- [x] Gold calibration
- [x] Reviewer authentication and quality control
- [x] PostgreSQL adapter and migrations
- [x] Automated quality filtering
- [x] Versioned buyer releases
- [x] Buyer API and buyer portal
- [x] Security hardening
- [x] Production deployment workflow
- [x] Automated test suite
- [x] GitHub Actions CI
- [x] Buyer onboarding and demo documentation
- [x] Asset transfer and provenance documentation
- [x] Software license file
- [x] Buyer-readiness verification command
- [ ] Independent external dataset audit
- [ ] Commercial licensing/provenance review for a real buyer dataset
- [ ] Buyer-specific production infrastructure configuration

## Current status

**v1.0.0 — buyer-ready software foundation.** The repository is organized and documented for technical due diligence and transfer. The live demo and software are separate from any buyer-specific production infrastructure or commercial dataset. Production deployment, independent audit, and final dataset licensing/provenance review remain buyer/operator responsibilities.

## License

MIT for the software. See `LICENSE`. Dataset-specific commercial rights and third-party content rights must be reviewed separately.

## Contributing

See `CONTRIBUTING.md` for contribution and dataset-quality expectations.
