# Reviewer Quality Control

ModelJudge AI uses an operational reviewer-control policy to identify reviewers who need calibration, temporary warning, or suspension.

## States

- `insufficient` — fewer than three calibration attempts; reviewer must calibrate before normal review work.
- `active` — calibration quality meets the pass policy.
- `warning` — quality is below the warning/pass target; reviewer may continue temporarily but should recalibrate.
- `suspended` — quality is below the suspension threshold or repeated consecutive calibration failures trigger suspension.

## Default policy

- Minimum calibration attempts: 3
- Pass calibration accuracy: 0.80
- Warning calibration accuracy: 0.60
- Warning quality score: 0.80
- Suspension quality score: 0.50
- Maximum consecutive calibration failures: 3

The quality score combines calibration accuracy and consistency using the existing reviewer-quality methodology. These values are operational controls, not universal scientific thresholds.

## Workflow

```text
new reviewer
    ↓
calibration
    ↓
insufficient → calibrate
    ↓
active → continue reviewing
    ↓
warning → continue temporarily + recalibrate
    ↓
suspended → stop review submission + recalibrate
    ↓
quality restored → active
```

The current engine produces a machine-readable control report at `exports/reviewer-control-report.json`.

## Production note

A production deployment should persist reviewer status transitions in PostgreSQL, enforce the status at the authenticated review endpoint, record every suspension/reinstatement in an audit table, and require successful recalibration before reinstatement. The repository currently provides the policy engine and reporting foundation; it should not be described as a complete production suspension enforcement system until those database/API controls are enabled.
