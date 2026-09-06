# Dataset Certification Readiness

ModelJudge AI includes an internal certification-readiness gate for buyer due diligence. It is an operational quality checklist, not independent third-party certification.

## Gates

Default thresholds:

| Gate | Requirement |
|---|---:|
| Evaluations | >= 100 |
| Reviewed evaluations | >= 50 |
| Multi-reviewed evaluations | >= 25 |
| Average quality score | >= 3.5 / 5 |
| Review coverage | >= 1.0x |
| Duplicate rate | <= 1% |
| Calibration accuracy | >= 80% |
| Reliability sample | >= 25 multi-reviewed evaluations |

Status is:

- `ready` — every configured gate passes
- `conditional` — at least 75% of gates pass
- `not_ready` — fewer than 75% pass

## Commands

```bash
cd backend
npm run certification
```

Output: `exports/certification-report.json`.

## API

`GET /api/certification` returns the current readiness evidence. If a generated report is unavailable, the API computes a limited fallback from available release and reliability evidence.

## Buyer interpretation

A `ready` result means the configured internal gates passed at report generation time. It does not establish legal compliance, absence of bias, model superiority, licensing clearance, or independent certification. Buyers should inspect provenance, task composition, reviewer calibration, inter-rater reliability, licensing, privacy controls, and the actual release manifest.
