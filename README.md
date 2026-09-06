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
- Inter-rater agreement score
- Low-agreement quality flags
- Reviewer statistics
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
│   ├── index.html
│   ├── dashboard.html
│   ├── dashboard.js
│   ├── leaderboard.html
│   ├── leaderboard.js
│   ├── releases.html
│   └── releases.js
├── backend/
│   ├── server.js
│   ├── auth.js
│   ├── db.js
│   ├── db-store.js
│   ├── storage-adapter.js
│   ├── storage.js
│   ├── reviewer.js
│   ├── schema.sql
│   ├── migrations/001_initial.sql
│   ├── migrations/002_reviewer_auth.sql
│   ├── .env.example
│   └── package.json
├── data/
│   ├── sample/evaluations.jsonl
│   ├── evaluations.jsonl
│   ├── reviews.jsonl
│   └── schemas/evaluation.schema.json
├── docs/
│   ├── DATABASE.md
│   └── ...
├── scripts/
│   ├── dataset-engine.js
│   ├── validate-dataset.js
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

### API

```bash
cd backend
npm install
npm start
```

The API runs at `http://localhost:8787`.

### Frontend

From the repository root:

```bash
python -m http.server 8000
```

Open `http://localhost:8000/frontend/`.

### Dashboards

- Dataset Explorer: `http://localhost:8000/frontend/dashboard.html`
- Benchmark Leaderboard: `http://localhost:8000/frontend/leaderboard.html`
- Buyer Dataset Center: `http://localhost:8000/frontend/releases.html`

### Validate and export

```bash
cd backend
npm run validate
npm run export
```

### Run tests

```bash
npm test
```

## PostgreSQL production mode

JSONL remains the local-first default. When `DATABASE_URL` is configured, the API routes through the PostgreSQL storage adapter. The database connection uses a bounded pool, connection timeout, idle timeout, and TLS by default for hosted databases.

Initialize the database with the migration runner:

```bash
cd backend
npm run migrate
```

The migration runner applies SQL files from `backend/migrations/` in lexical order and records applied versions in `schema_migrations`.

For local PostgreSQL without TLS only, use `DATABASE_SSL=false`. Never commit database credentials or `.env` files.

See `docs/DATABASE.md` for production database requirements and the planned security controls.

## Reviewer authentication

Reviewer write access is authenticated in PostgreSQL mode. Account creation is controlled by the `ADMIN_BOOTSTRAP_TOKEN` environment secret. Passwords are stored as PBKDF2-SHA-256 hashes with per-password random salts; session tokens are random bearer secrets and only their SHA-256 hashes are persisted.

Authentication endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/accounts` | Provision reviewer/admin account using bootstrap secret |
| POST | `/api/auth/login` | Create an expiring reviewer session |
| POST | `/api/auth/logout` | Revoke current session |
| GET | `/api/auth/me` | Return authenticated reviewer identity |

Authenticated requests use `Authorization: Bearer <token>`. `POST /api/reviews` requires a valid session and derives reviewer identity from that session. A client cannot impersonate another reviewer by changing `reviewer_id`.

Authentication is deliberately unavailable in JSONL-only mode because production reviewer identity requires a durable account/session store.

## Reviewer API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/reviews` | List reviewer judgments |
| POST | `/api/reviews` | Submit one authenticated reviewer judgment |
| GET | `/api/reviews/consensus/:evaluationId` | Calculate consensus for an evaluation |
| GET | `/api/reviewers/stats` | Reviewer workload and scoring statistics |
| GET | `/api/release` | Buyer-facing release metadata |

A reviewer submission contains an evaluation ID, A/B/Tie preference, eight quality scores, rationale, and confidence. A reviewer cannot submit two reviews for the same evaluation.

## Dataset philosophy

ModelJudge AI separates the application from the dataset. The application is the collection and review interface; the dataset is versioned separately with a documented schema, provenance, quality checks, and licensing terms.

Reviewer IDs should be pseudonymous identifiers. Do not store names, emails, credentials, private prompts, confidential model outputs, or other unnecessary personal information in the dataset.

## Roadmap

- [x] Evaluation interface foundation
- [x] Structured evaluation schema
- [x] Sample JSONL dataset
- [x] Persistent evaluation API
- [x] Server-side validation
- [x] Duplicate fingerprint detection
- [x] Dataset validation pipeline
- [x] JSONL/CSV export engine
- [x] Dataset quality report and manifest
- [x] Multi-reviewer evaluation records
- [x] Consensus and agreement engine
- [x] Reviewer statistics
- [x] Automated reviewer-engine tests
- [x] Gold calibration engine foundation
- [x] Storage abstraction and production SQL blueprint
- [x] Dataset Explorer dashboard
- [x] Benchmark leaderboard
- [x] Buyer dataset download center
- [x] PostgreSQL adapter foundation
- [x] Full database-backed API cutover
- [x] Database migration runner
- [x] Reviewer authentication
- [ ] Full inter-rater agreement statistics
- [ ] Reviewer quality scoring against hidden gold tasks
- [ ] Production deployment

## Status

Early MVP / research prototype. Sample data is illustrative and must not be represented as production human preference data. Authentication is production-oriented groundwork and still needs rate limiting, recovery controls, and operational security before public exposure.

## License

MIT. See `LICENSE`.

## Contributing

See `CONTRIBUTING.md` for contribution and dataset-quality expectations.
