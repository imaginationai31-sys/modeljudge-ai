# ModelJudge AI

Human preference and AI response evaluation platform for building structured model-evaluation datasets.

## What is ModelJudge AI?

ModelJudge AI is an open-source evaluation workspace designed to compare two AI responses using consistent human scoring criteria. Each completed evaluation can become a structured, auditable dataset record for benchmarking and post-training research.

## MVP features

- A/B response comparison
- Accuracy, relevance, clarity, and safety scoring
- Preference selection and preference strength
- Evaluation reason capture
- Sample evaluation dataset
- JSONL-compatible dataset schema
- Responsive browser interface

## Project structure

```text
modeljudge-ai/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── data/
│   ├── sample/evaluations.jsonl
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

No build system is required for the MVP. Open `frontend/index.html` in a modern browser or serve the repository with a local static server.

Example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/frontend/`.

## Dataset philosophy

ModelJudge AI separates the application from the dataset. The application is the collection and review interface; the dataset is versioned separately with a documented schema, provenance, quality checks, and licensing terms.

Do not add personal information, confidential prompts, private model outputs, copyrighted material without permission, or credentials to the dataset.

## Roadmap

- [x] Evaluation interface foundation
- [x] Structured evaluation schema
- [x] Sample JSONL dataset
- [ ] Persistent database
- [ ] Evaluation API
- [ ] Dataset validation pipeline
- [ ] Duplicate detection
- [ ] Inter-rater agreement metrics
- [ ] Reviewer quality controls
- [ ] Dataset export dashboard
- [ ] Automated tests and CI
- [ ] Benchmark leaderboard

## Status

Early MVP / research prototype. The current sample data is illustrative and must not be represented as production human preference data.

## License

MIT. See `LICENSE`.

## Contributing

See `CONTRIBUTING.md` for contribution and dataset-quality expectations.
