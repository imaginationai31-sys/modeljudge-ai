# ModelJudge AI

Human preference and AI response evaluation platform for building structured model-evaluation datasets.

## What is ModelJudge AI?

ModelJudge AI is an open-source evaluation workspace designed to compare two AI responses using consistent human scoring criteria. Each completed evaluation can become a structured, auditable dataset record for benchmarking and post-training research.

## MVP features

- A/B response comparison
- Accuracy, relevance, clarity, and safety scoring
- Preference selection and preference strength
- Human rationale capture
- JSONL-compatible dataset schema
- Persistent evaluation API
- Server-side validation and duplicate detection
- Dataset validation and export scripts
- Quality metrics and dataset manifest
- Responsive browser interface

## Project structure

```text
modeljudge-ai/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── server.js
│   └── package.json
├── data/
│   ├── sample/evaluations.jsonl
│   ├── evaluations.jsonl
│   └── schemas/evaluation.schema.json
├── docs/
│   ├── DATASET_CARD.md
│   ├── METHODOLOGY.md
│   └── QUALITY.md
├── scripts/
│   ├── dataset-engine.js
│   └── validate-dataset.js
├── exports/
├── tests/
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
└── LICENSE
```

## Run locally

### 1. Start the API

Requirements: Node.js 20 or newer.

```bash
cd backend
npm install
npm start
```

The API runs at `http://localhost:8787`.

### 2. Start the frontend

From the repository root, use any static server. For example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/frontend/`.

### 3. Validate the dataset

```bash
cd backend
npm run validate
```

### 4. Generate exports and quality report

```bash
npm run export
```

This creates:

- `exports/evaluations.jsonl`
- `exports/evaluations.csv`
- `exports/manifest.json`
- `exports/quality-report.json`

### API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API health check |
| GET | `/api/evaluations` | Retrieve saved evaluations |
| POST | `/api/evaluations` | Validate and save an evaluation |

## Dataset philosophy

ModelJudge AI separates the application from the dataset. The application is the collection and review interface; the dataset is versioned separately with a documented schema, provenance, quality checks, and licensing terms.

Do not add personal information, confidential prompts, private model outputs, copyrighted material without permission, or credentials to the dataset.

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
- [ ] Database adapter
- [ ] Inter-rater agreement metrics
- [ ] Reviewer quality controls
- [ ] Dataset export dashboard
- [ ] Automated tests and CI
- [ ] Benchmark leaderboard
- [ ] Production deployment

## Status

Early MVP / research prototype. The sample data is illustrative and must not be represented as production human preference data.

## License

MIT. See `LICENSE`.

## Contributing

See `CONTRIBUTING.md` for contribution and dataset-quality expectations.
