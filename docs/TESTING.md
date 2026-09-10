# Testing Strategy

ModelJudge AI uses Node's built-in test runner and coverage instrumentation.

## Test layers

### Unit tests

Pure evaluation, reliability, calibration, quality-filter, and reviewer-control logic is tested independently. These tests are fast and deterministic.

### HTTP integration tests

`tests/api.integration.test.js` starts the real public service and exercises the deployed HTTP path through the Express proxy. The suite covers:

- health and capability metadata
- evaluation listing and validation
- valid evaluation creation
- duplicate detection
- review authentication boundaries
- consensus and reviewer statistics endpoints
- release metadata
- reliability reporting
- CORS preflight
- JSON 404 handling

The integration suite runs independently in CI as well as through the complete test command.

## Coverage gate

CI runs Node test coverage with enforced minimums:

- lines: 60%
- functions: 60%
- statements: 60%
- branches: 50%

The threshold is intentionally a baseline rather than a claim of exhaustive production coverage. It can be raised as additional endpoint and database integration tests are added.

Coverage artifacts are uploaded by GitHub Actions for buyer inspection.

## CI quality gates

Every push to `main` and pull request targeting `main` runs linting, production dependency audit, unit/integration tests, coverage enforcement, dataset validation, export generation, quality filtering, reliability reporting, reviewer-control reporting, and certification-readiness reporting.
