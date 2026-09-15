# ModelJudge AI Data Pipeline

## Purpose

ModelJudge AI treats dataset creation as a staged pipeline rather than a single export step. The pipeline separates collection, validation, quality filtering, reliability analysis, reviewer controls, and immutable release packaging.

## Pipeline stages

```text
INGEST
  ↓
SCHEMA + FIELD VALIDATION
  ↓
DUPLICATE / FINGERPRINT CHECKS
  ↓
DATA-QUALITY GATES
  ↓
QUALITY FILTER
  ↓
RELIABILITY ANALYSIS
  ↓
REVIEWER / CALIBRATION CONTROLS
  ↓
RELEASE EXPORT (optional)
  ↓
MANIFEST + SHA-256 VERIFICATION
```

The executable orchestration layer is `scripts/pipeline-engine.js`. It runs the dataset stages in a fixed order, records stage status and duration, fingerprints the source dataset, records output SHA-256 hashes and supports safe skipping of an already-completed run with identical input/configuration. An immutable release is included when `PIPELINE_RELEASE_VERSION` is supplied.

### 1. Ingest

Evaluation records enter through the API or local dataset files. The canonical JSONL dataset is `data/evaluations.jsonl`.

### 2. Schema and field validation

`scripts/validate-dataset.js` validates required fields, allowed preference values, score ranges, rationale length, duplicate IDs, and duplicate content fingerprints. The JSON Schema is maintained at `data/schemas/evaluation.schema.json`.

A validation failure exits non-zero and must be fixed before a release is considered valid.

### 3. Duplicate detection

Evaluation IDs and content fingerprints are checked before records are accepted into the validated dataset. Duplicate records are excluded from a clean dataset rather than silently treated as independent observations.

### 4. Data-quality gates

The quality-filter engine applies explicit policies for review count, score quality, preference agreement, optional human verification, ties, and required content. The default policy requires multiple reviews and excludes records that fail blocking quality checks.

See `backend/quality-filter.js` and `scripts/quality-filter.js`.

### 5. Reliability analysis

`scripts/reliability-report.js` produces agreement and reliability measurements. The implementation includes Cohen's kappa, Fleiss' kappa, Krippendorff's alpha, and bootstrap confidence intervals where applicable.

### 6. Reviewer and calibration controls

Reviewer quality and calibration are evaluated before release. Gold-task calibration and reviewer-control reports provide additional evidence about annotation quality.

### 7. Release packaging

The release engine packages the generated dataset exports and quality artifacts into a versioned directory under `releases/vX.Y.Z`.

Releases are immutable: an existing release directory cannot be overwritten. Each packaged file receives a SHA-256 digest and byte count in `RELEASE-MANIFEST.json`.

### 8. Provenance and verification

Release manifests identify the dataset, release version, record count, provenance note, licensing note, and file-level checksums. Buyers should verify the manifest and independently confirm rights to source material and evaluator contributions before redistribution or commercial use.

## Reproducibility and idempotency

`pipeline-engine.js` stores a local run manifest under `.pipeline/pipeline-manifest.json`. The state directory is ignored by Git and is intended as local/CI execution state, not buyer dataset content.

A completed pipeline is considered safely repeatable when the source dataset fingerprint and pipeline configuration fingerprint are unchanged and all recorded outputs still exist. In that case, the engine reports `skipped` instead of executing the stages again. If an output is missing, the pipeline reruns rather than incorrectly treating the previous run as complete.

The engine records a unique run ID, stage ordering, execution duration, input SHA-256, configuration SHA-256, output paths, output hashes, byte counts, and failure information. This provides lightweight lineage without introducing an external orchestration platform.

Immutable release creation intentionally behaves differently: attempting to create the same release version twice fails instead of replacing an existing artifact. This prevents accidental mutation of a buyer-facing release.

For a new release, use a new semantic version and regenerate the pipeline artifacts from the intended source dataset.

## Canonical commands

From the repository root:

```bash
npm --prefix backend run pipeline
```

To run the complete pipeline and create a new immutable release:

```bash
PIPELINE_RELEASE_VERSION=1.0.0 npm --prefix backend run pipeline
```

The individual stage commands remain available for debugging or targeted development:

```bash
npm run validate
npm --prefix backend run export
npm --prefix backend run filter
npm --prefix backend run reliability
npm --prefix backend run reviewer-control
npm --prefix backend run certification
node scripts/create-release.js 1.0.0
```

The exact available artifacts depend on the source data and configured reviewer/database inputs. CI continues to run the underlying validation, export/filter/reliability/control/certification checks before buyer quality artifacts are uploaded.

## Quality gate policy

A release should not be treated as buyer-ready unless:

- dataset validation passes;
- duplicate IDs/fingerprints are not present in the accepted dataset;
- required quality reports are generated successfully;
- reliability calculations complete without errors;
- reviewer/calibration controls pass the configured policy;
- release files have SHA-256 checksums;
- provenance and licensing are reviewed for the specific dataset contents.

This document describes the repository's pipeline controls; it does not grant rights to third-party data or guarantee that every future dataset satisfies a buyer's contractual requirements.
