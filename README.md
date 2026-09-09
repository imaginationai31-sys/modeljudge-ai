# ModelJudge AI

Human preference and AI response evaluation platform for building structured model-evaluation datasets.

> **Software asset:** ModelJudge AI is a deployable evaluation platform with human review, verification, calibration, quality controls, PostgreSQL storage, versioned releases, and an authenticated buyer API.

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
- `docs/TECHNICAL_ARCHITECTURE.md` — system architecture, data flow, security boundaries, deployment, and extension points
- `docs/BUYER_ONBOARDING.md` — buyer workflow, data fields, verification, and security
- `docs/API_QUICKSTART.md` — authenticated API examples
- `docs/BUYER_API.md` — buyer API architecture and controls
- `docs/DEMO_GUIDE.md` — safe product demonstration flow
- `docs/BUYER_RELEASES.md` — release packaging
- `docs/CERTIFICATION.md` — certification-readiness methodology
- `docs/RELIABILITY.md` — reliability methodology
- `docs/PRODUCTION_DEPLOYMENT.md` — production operations
- `docs/SECURITY_HARDENING.md` — security controls

## Project structure

```text
modeljudge-ai/
├── frontend/
├── backend/
│   ├── server.js
│   ├── auth.js
│   ├── gold.js
│   ├── buyer-api.js
│   ├── buyer-management.js
│   ├── security.js
│   ├── *-engine.js
│   ├── db*.js
│   ├── storage*.js
│   ├── migrations/
│   └── package.json
├── data/
├── docs/
├── scripts/
├── tests/
├── exports/
├── releases/
├── .github/workflows/
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
└── LICENSE
```

## Automated tests & CI

The repository contains Node.js test coverage for core evaluation components, including calibration, quality filtering, reliability reporting, reviewer quality control, and reviewer behavior.

Run the automated test suite:

```bash
cd backend
npm test
```

Run the complete quality pipeline:

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

GitHub Actions runs tests and the dataset/quality pipeline on pushes to `main` and pull requests targeting `main`. Quality reports are uploaded as CI artifacts. Production deployment remains separately controlled by the deployment workflow and environment configuration.

## Buyer validation from a fresh clone

Buyers evaluating the software can reproduce the core quality checks from a clean checkout. From the repository root:

```bash
git clone https://github.com/imaginationai31-sys/modeljudge-ai.git
cd modeljudge-ai
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
```

These commands validate dependency installation, linting, production dependency security, automated tests, dataset validation, export generation, quality filtering, reliability reporting, reviewer controls, and certification-readiness reporting without requiring production credentials.

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

Production should use TLS, restricted database access, backups, monitoring, and a tested restore procedure.

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

Sample records are illustrative. Before commercial distribution, review the provenance and licensing of every task, prompt, model response, annotation, and external source included in a release.

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
- [ ] Live production infrastructure configuration
- [ ] Independent external dataset audit
- [ ] Commercial licensing/provenance review for a real buyer dataset

## Current status

**Advanced MVP / buyer-ready software foundation.** The repository contains a serious evaluation-data platform foundation, but a live commercial deployment, production-scale dataset, independent audit, and final licensing/provenance review remain business and operational activities.

## License

MIT. See `LICENSE`. Dataset-specific commercial rights and third-party content rights must be reviewed separately.

## Contributing

See `CONTRIBUTING.md` for contribution and dataset-quality expectations.
