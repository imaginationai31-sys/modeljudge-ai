# ModelJudge AI

Human preference and AI response evaluation platform for building structured model-evaluation datasets.

## What is ModelJudge AI?

ModelJudge AI is an open-source evaluation workspace designed to compare two AI responses using consistent human scoring criteria. Each completed evaluation can become a structured, auditable dataset record for benchmarking and post-training research.

## Current features

- A/B response comparison
- Accuracy, relevance, clarity, and safety scoring
- Human rationale capture
- Persistent evaluation API
- Server-side validation and duplicate detection
- JSONL/CSV dataset export
- Multi-reviewer records and consensus
- Cohen's kappa, Fleiss' kappa, nominal Krippendorff's alpha
- Deterministic bootstrap confidence intervals
- Gold calibration with server-side answer checking
- Automated dataset quality filtering
- PostgreSQL adapter and migrations
- PBKDF2 reviewer authentication and expiring sessions
- Reviewer quality controls with active, warning, insufficient, and suspended states
- Reviewer quality audit history and admin controls
- Dataset Explorer
- Benchmark leaderboard
- Buyer Dataset Release Center
- Buyer Quality Center and certification-readiness evidence
- CI-generated quality, reliability, reviewer-control, and certification reports

## Buyer Quality Center

Open `frontend/quality.html` for the buyer-oriented quality dashboard. It combines dataset volume, review coverage, reliability evidence, and certification gates in one view.

The certification engine is intentionally transparent and conservative. A `ready` result means configured internal gates passed; it is not independent third-party certification.

Default gates include minimum evaluation/review volume, average quality, review coverage, duplicate rate, calibration accuracy, and reliability sample size. See `docs/CERTIFICATION.md`.

## Project structure

```text
modeljudge-ai/
├── frontend/
│   ├── quality.html
│   ├── quality.js
│   ├── dashboard.html
│   ├── leaderboard.html
│   └── releases.html
├── backend/
│   ├── server.js
│   ├── auth.js
│   ├── gold.js
│   ├── certification-engine.js
│   ├── reviewer-quality-control.js
│   ├── reviewer-quality-control-db.js
│   ├── quality-filter.js
│   ├── quality-engine.js
│   ├── reliability-engine.js
│   ├── db.js
│   ├── db-store.js
│   ├── storage-adapter.js
│   ├── storage.js
│   ├── reviewer.js
│   ├── migrations/
│   └── package.json
├── data/
├── docs/
│   ├── CERTIFICATION.md
│   ├── DATABASE.md
│   ├── AUTHENTICATION.md
│   ├── QUALITY_ENGINE.md
│   └── RELIABILITY.md
├── scripts/
│   ├── certification-report.js
│   ├── reviewer-quality-control.js
│   ├── dataset-engine.js
│   ├── quality-filter.js
│   ├── reliability-report.js
│   └── migrate.js
├── tests/
├── exports/
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
└── LICENSE
```

## Run locally

Requirements: Node.js 20 or newer.

```bash
cd backend
npm install
npm start
```

The API runs at `http://localhost:8787`.

From the repository root, serve the frontend with `python -m http.server 8000` and open `http://localhost:8000/frontend/`.

## PostgreSQL mode

JSONL remains the local-first default. When `DATABASE_URL` is configured, the API routes through PostgreSQL.

```bash
cd backend
npm run migrate
```

The migration runner applies SQL files from `backend/migrations/` in lexical order and records applied versions in `schema_migrations`.

## Quality and certification commands

```bash
cd backend
npm test
npm run validate
npm run export
npm run filter
npm run reliability
npm run reviewer-control
npm run certification
```

The certification command generates `exports/certification-report.json`. CI uploads this alongside the other buyer-quality artifacts.

## Reviewer quality enforcement

Authenticated reviewers must establish sufficient calibration history before submitting reviews. Low-quality reviewers can enter `warning` or `suspended` states. Review submissions refresh quality state, and administrative suspend/reinstate actions are recorded in the quality audit table.

Relevant endpoints:

```text
GET  /api/reviewers/me/quality
GET  /api/reviewers/me/history
GET  /api/admin/reviewer-quality
POST /api/admin/reviewer-quality/:reviewerId/reinstate
POST /api/admin/reviewer-quality/:reviewerId/suspend
GET  /api/certification
```

## Dataset philosophy

ModelJudge AI separates the application from the dataset. Raw records, quality-filtered records, reliability evidence, reviewer controls, provenance, and release metadata should be inspectable independently.

Reviewer IDs should be pseudonymous. Do not store names, emails, credentials, private prompts, confidential model outputs, or other unnecessary personal information in the dataset.

## Roadmap

- [x] Evaluation interface foundation
- [x] Structured evaluation schema
- [x] Persistent evaluation API
- [x] Validation and duplicate detection
- [x] JSONL/CSV export engine
- [x] Dataset quality report and manifest
- [x] Multi-reviewer evaluation records
- [x] Consensus and agreement engine
- [x] Advanced agreement metrics
- [x] Gold calibration foundation
- [x] Reviewer quality scoring
- [x] PostgreSQL adapter and migration system
- [x] Reviewer authentication
- [x] Automated dataset quality filtering
- [x] Statistical reliability metrics and evidence report
- [x] Reviewer quality-control workflow
- [x] Buyer Quality Center and certification-readiness engine
- [ ] Production deployment hardening
- [ ] Independent external dataset audit

## Status

Advanced MVP / research prototype. Sample data is illustrative and must not be represented as production human preference data. Production use still requires operational security, private gold tasks, rate limiting, monitoring, backup/recovery, deployment hardening, privacy review, and licensing/provenance review.

## License

MIT. See `LICENSE`.

## Contributing

See `CONTRIBUTING.md` for contribution and dataset-quality expectations.
