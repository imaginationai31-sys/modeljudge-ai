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
- Persistent Step 2 evaluation API
- Validation and duplicate detection
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
├── tests/
├── scripts/
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

The frontend automatically sends completed evaluations to `http://localhost:8787/api`.

### API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API health check |
| GET | `/api/evaluations` | Retrieve saved evaluations |
| POST | `/api/evaluations` | Validate and save an evaluation |

### Example health response

```json
{"status":"ok","service":"modeljudge-api","version":"0.2.0"}
```

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
- [ ] Database adapter
- [ ] Dataset validation pipeline
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
