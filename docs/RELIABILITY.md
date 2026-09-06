# Statistical Reliability

ModelJudge AI reports statistical reliability signals for human preference annotations. These metrics describe reviewer agreement; they do not establish that one model is objectively superior.

## Metrics

### Cohen's kappa

Used for a pair of categorical label sequences. It adjusts observed agreement for agreement expected from the raters' marginal label distributions.

### Fleiss' kappa

Used when multiple reviewers label the same set of evaluation items with categorical preferences. The report currently uses the available reviewer labels per evaluation.

### Krippendorff's alpha (nominal)

A nominal-label reliability statistic that accommodates varying numbers of ratings per unit. ModelJudge currently reports the nominal form for preference labels.

### Bootstrap confidence interval

The reliability report uses a deterministic bootstrap resampling procedure for the mean reviewed dimension score. The fixed seed makes CI output reproducible for the same input data and iteration count.

## Coverage matters

Reliability statistics should always be interpreted with:

- number of evaluations
- number of reviews
- percentage of evaluations receiving multiple reviews
- reviewer calibration performance
- category and language mix
- disagreement patterns

A high agreement score based on a tiny sample is not strong evidence of production reliability.

## API

`GET /api/reliability` returns the current reliability report from the configured storage layer.

## CLI

```bash
cd backend
npm run reliability
```

The command writes `exports/reliability-report.json`.

## Certification guidance

The report is an evidence artifact, not an independent certification. Production releases should document the sample size, reviewer recruitment, calibration procedure, exclusions, provenance, licensing, and known limitations alongside these statistics.
