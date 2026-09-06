# ModelJudge AI

Human preference and AI response evaluation platform for building structured model-evaluation datasets.

## What is ModelJudge AI?

ModelJudge AI is an open-source evaluation workspace designed to compare two AI responses using consistent human scoring criteria. Each completed evaluation can become a structured, auditable dataset record for benchmarking and post-training research.

## Current features

- A/B response comparison
- Accuracy, relevance, clarity, and safety scoring
- Preference selection and preference strength
- Human rationale capture
- Persistent evaluation API
- Server-side validation and duplicate detection
- JSONL/CSV dataset export
- Dataset quality metrics and manifest
- Multi-reviewer review records
- Reviewer-level duplicate protection
- Consensus preference calculation
- Advanced inter-rater agreement metrics
- Statistical reliability reporting: Cohen's kappa, Fleiss' kappa, nominal Krippendorff's alpha
- Deterministic bootstrap confidence intervals for reviewed score means
- Reliability coverage and sample-size reporting
- Low-agreement quality flags
- Reviewer statistics
- Gold calibration and reviewer quality scoring foundation
- Hidden calibration task service with server-side answer checking
- Automated dataset quality filtering
- Dataset quality-filter report and filtered JSONL export
- Automated reviewer-engine tests
- Dataset Explorer dashboard
- Benchmark leaderboard and reviewer analytics
- Buyer Dataset Release Center
- PostgreSQL production adapter
- Unified JSONL/PostgreSQL storage routing
- PostgreSQL migration runner
- Database health checks and connection pooling
- Reviewer authentication with PBKDF2 password hashing
- Expiring database-backed reviewer sessions
- Authenticated review submission and reviewer identity enforcement
- Controlled reviewer-account bootstrap

## Project structure

```text
modeljudge-ai/
├── frontend/
├── backend/
│   ├── server.js
│   ├── auth.js
│   ├── gold.js
│   ├── quality-filter.js
│   ├── quality-engine.js
│   ├── reliability-engine.js
│   ├── db.js
│   ├── db-store.js
│   ├── storage-adapter.js
│   ├── storage.js
│   ├── reviewer.js
│   ├── schema.sql
│   ├── migrations/001_initial.sql
│   ├── migrations/002_reviewer_quality.sql
│   ├── .env.example
│   └── package.json
├── data/
│   ├── gold/gold-evaluations.jsonl
│   ├── sample/evaluations.jsonl
│   ├── evaluations.jsonl
│   ├── reviews.jsonl
│   └── schemas/evaluation.schema.json
├── docs/
│   ├── DATABASE.md
│   ├── AUTHENTICATION.md
│   ├── QUALITY_ENGINE.md
│   └── RELIABILITY.md
├── scripts/
│   ├── dataset-engine.js
│   ├── quality-filter.js
│   ├── reliability-report.js
│   ├── validate-dataset.js
│   ├── calibration-engine.js
│   ├── create-reviewer.js
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

Never commit database credentials, passwords, bearer tokens, or `.env` files.

## Reviewer authentication

Reviewer write access is authenticated in PostgreSQL mode. Account creation is controlled by `ADMIN_BOOTSTRAP_TOKEN`. Passwords use PBKDF2-SHA-256 with random salts, while only SHA-256 session-token hashes are persisted.

```text
POST /api/auth/accounts
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/reviews
```

Authenticated requests use `Authorization: Bearer <token>`. Review submissions derive reviewer identity from the authenticated session rather than trusting a client-supplied reviewer ID.

## Step 16 — Hidden gold calibration

Authenticated reviewers can receive calibration tasks without receiving the expected preference. The server loads the answer key privately, records the submitted preference, and calculates correctness server-side. Reviewers cannot select a gold task for another reviewer, and already-attempted tasks are not selected again until the available pool is exhausted.

The default demonstration gold file is `data/gold/gold-evaluations.jsonl`. Production deployments should set `GOLD_TASKS_FILE` to a private location outside the repository and protect the answer key with appropriate filesystem or secret-management controls.

## Step 17 — Automated dataset quality filtering

The quality filter creates a buyer-oriented inclusion layer without modifying the raw dataset. By default, a record must have at least two reviews, an average eight-dimension review score of at least 3.5, and preference agreement of at least 0.67. Optional policy controls can also require human verification or exclude Tie preferences.

Run:

```bash
cd backend
npm run filter
```

This generates:

- `exports/quality-filtered.jsonl` — records that passed the active policy
- `exports/quality-filter-report.json` — inclusion/exclusion counts and reasons

The filter is deterministic for a given input and policy, and exclusions are retained in the report for auditability. This is an operational quality gate, not a statistical claim that the resulting dataset is universally unbiased or error-free.

## Step 19 — Statistical reliability

ModelJudge now produces a statistical reliability evidence report. It includes:

- Cohen's kappa for pairwise categorical agreement
- Fleiss' kappa for multi-reviewer categorical agreement
- nominal Krippendorff's alpha
- multi-review coverage and sample counts
- deterministic bootstrap 95% confidence intervals for reviewed dimension-score means

Run:

```bash
cd backend
npm run reliability
```

This generates `exports/reliability-report.json`. The API also exposes `GET /api/reliability`.

These metrics are descriptive evidence, not an independent certification and not proof that a model is objectively better. Buyers should evaluate them together with sample size, reviewer calibration, task composition, provenance, licensing, and exclusion policy. See `docs/RELIABILITY.md`.

## Dataset philosophy

ModelJudge AI separates the application from the dataset. The dataset is versioned with schema, provenance, quality checks, reliability evidence, and licensing documentation.

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
- [x] Reviewer quality scoring foundation
- [x] PostgreSQL adapter and migration system
- [x] Reviewer authentication
- [x] Hidden production-ready gold-task service foundation
- [x] Automated quality-based dataset filtering
- [x] Statistical reliability metrics and evidence report
- [ ] Automated quality-based reviewer suspension/workflow
- [ ] Production deployment

## Status

Early MVP / research prototype. Sample data is illustrative and must not be represented as production human preference data. Production use still requires operational security, private gold tasks, rate limiting, monitoring, backup/recovery, and deployment hardening.

## License

MIT. See `LICENSE`.

## Contributing

See `CONTRIBUTING.md` for contribution and dataset-quality expectations.
