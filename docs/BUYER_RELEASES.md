# Buyer Releases

ModelJudge AI treats generated dataset releases as immutable snapshots rather than mutable exports.

## Create a release

```bash
cd backend
npm run export
npm run release -- 0.9.0
```

This creates `releases/v0.9.0/` and updates `releases/LATEST.json`.

## Buyer package

A release can contain:

- `evaluations.jsonl` — primary machine-readable dataset
- `evaluations.csv` — convenience export
- `quality-filtered.jsonl` — filtered subset when available
- `manifest.json` — pipeline metadata
- `quality-report.json` — dataset quality metrics
- `reliability-report.json` — inter-rater reliability evidence
- `reviewer-quality.json` — calibration quality evidence
- `reviewer-control-report.json` — reviewer QC evidence
- `certification-report.json` — internal readiness gates
- `RELEASE-MANIFEST.json` — release-level checksums and provenance notice
- `BUYER-README.md` — handoff and verification instructions

## Integrity verification

`RELEASE-MANIFEST.json` contains a SHA-256 digest and byte count for every copied release file. Buyers should calculate SHA-256 locally and compare it with the manifest before processing the data.

## Immutable policy

A release version is write-once. Attempting to recreate an existing version fails instead of overwriting it. Create a new semantic version for every changed dataset snapshot.

## Provenance and licensing

A repository license does not automatically grant redistribution rights for third-party content or evaluator contributions. Before commercial delivery, verify source permissions, consent, contractual terms, and any applicable data-use restrictions.

## Recommended buyer handoff

Provide the buyer with:

1. release version
2. release manifest
3. primary JSONL dataset
4. optional filtered dataset
5. quality and reliability reports
6. schema
7. provenance/license documentation
8. checksum verification instructions

Internal certification readiness is an engineering quality gate, not a third-party certification or guarantee of dataset fitness for a buyer's particular model-training use case.
