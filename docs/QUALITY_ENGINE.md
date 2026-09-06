# Reviewer Quality Engine

Step 15 adds a buyer-facing quality layer for reviewer calibration and inter-rater agreement.

## Calibration

Gold tasks have an expected preference. A reviewer submission is correct when its preference matches the gold preference.

Calibration accuracy:

`correct calibration attempts / usable calibration attempts`

## Reviewer quality score

The MVP quality score combines:

- 80% calibration accuracy
- 20% consistency score

Status is `pass` at a quality score of at least 0.80, otherwise `review`. Reviewers without calibration attempts are `insufficient`.

This is an operational quality filter, not a statistical claim about reviewer reliability.

## Inter-rater agreement

For an evaluation with multiple reviews, the engine calculates:

- preference agreement
- agreement for each scoring dimension
- weighted overall agreement
- unanimous flag
- quality flag

The overall agreement is 60% preference agreement and 40% average dimension agreement. An evaluation needs at least two reviews and an overall agreement of 0.67 or higher for a `pass` flag.

## Production requirements

The current gold set is synthetic and stored in the repository for demonstration. A production deployment should keep gold answers private, rotate calibration items, prevent reviewers from seeing answer keys, record calibration attempts separately from public review data, and protect quality reports from unauthorized modification.
