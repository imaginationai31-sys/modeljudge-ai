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
- PostgreSQL production adapter foundation

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
│   ├── db.js
│   ├── db-store.js
│   ├── storage.js
│   ├── reviewer.js
│   ├── schema.sql
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

## PostgreSQL adapter

JSONL remains the local-first default. A PostgreSQL adapter is now available for production integration. Configure `DATABASE_URL` and initialize `backend/schema.sql` against the target database. See `docs/DATABASE.md` for the migration and security plan.

The adapter is deliberately separated from the HTTP layer so the application can migrate storage without changing its evaluation contract. The current API does not silently switch existing installations to PostgreSQL.

## Reviewer API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/reviews` | List reviewer judgments |
| POST | `/api/reviews` | Submit one reviewer judgment |
| GET | `/api/reviews/consensus/:evaluationId` | Calculate consensus for an evaluation |
| GET | `/api/reviewers/stats` | Reviewer workload and scoring statistics |
| GET | `/api/release` | Buyer-facing release metadata |

A reviewer submission contains a reviewer ID, evaluation ID, A/B/Tie preference, eight quality scores, rationale, and confidence. A reviewer cannot submit two reviews for the same evaluation.

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
- [ ] Full database-backed API cutover
- [ ] Reviewer authentication
- [ ] Full inter-rater agreement statistics
- [ ] Reviewer quality scoring against hidden gold tasks
- [ ] Production deployment

## Status

Early MVP / research prototype. Sample data is illustrative and must not be represented as production human preference data.

## License

MIT. See `LICENSE`.

## Contributing

See `CONTRIBUTING.md` for contribution and dataset-quality expectations.
