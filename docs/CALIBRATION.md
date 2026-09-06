# Reviewer Calibration

ModelJudge AI uses a small gold-standard evaluation set to measure whether reviewers can apply the evaluation protocol consistently.

## Gold-standard design

Gold items contain a known preferred response. They should be mixed into reviewer work without revealing the answer before submission.

## Quality scoring

The calibration engine calculates:

- `calibration_accuracy`: correct gold judgments divided by completed gold judgments
- `consistency_score`: basic evidence that the reviewer has completed more than one usable judgment
- `quality_score`: weighted score using 80% calibration accuracy and 20% consistency
- `status`: `PASS` when quality score is at least 0.80, otherwise `REVIEW`

The threshold is a configurable research default, not a universal industry standard.

## Important limitations

Gold items must be reviewed and maintained by qualified annotators. A small calibration set cannot establish broad reviewer reliability by itself. Production systems should use more gold items, periodic refreshes, blind insertion, disagreement analysis, and human quality audits.

## Privacy

Reviewer identifiers should be pseudonymous. Do not store passwords, access tokens, personal contact information, or unnecessary sensitive information in review records.
