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
- Low-agreement quality flags
- Reviewer statistics
- Gold calibration and reviewer quality scoring foundation
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
│   ├── quality-engine.js
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
│   └── QUALITY_ENGINE.md
├── scripts/
│   ├── dataset-engine.js
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

## Step 15 — Reviewer quality and agreement

The quality engine adds two buyer-relevant signals:

1. **Gold calibration** — measures whether a reviewer agrees with known-answer calibration tasks.
2. **Inter-rater agreement** — measures preference agreement plus agreement across all eight quality dimensions.

Reviewer quality combines calibration accuracy and consistency into an operational quality score. Evaluations with weak agreement receive a `review` quality flag.

The repository gold set is synthetic demonstration data. Production gold answers should remain private and should be rotated so reviewers cannot learn the answer key.

See `docs/QUALITY_ENGINE.md` for the methodology and limitations.

## Dataset philosophy

ModelJudge AI separates the application from the dataset. The dataset is versioned with schema, provenance, quality checks, and licensing documentation.

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
- [ ] Hidden production gold-task service
- [ ] Full statistical reliability metrics
- [ ] Automated quality-based dataset filtering
- [ ] Production deployment

## Status

Early MVP / research prototype. Sample data is illustrative and must not be represented as production human preference data. Production use still requires operational security, private gold tasks, rate limiting, monitoring, backup/recovery, and deployment hardening.

## License

MIT. See `LICENSE`.

## Contributing

See `CONTRIBUTING.md` for contribution and dataset-quality expectations.
