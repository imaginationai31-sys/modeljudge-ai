# Changelog

## [1.0.1] — Security Hardening

### Security

- Added `THREAT_MODEL.md` covering assets, trust boundaries, threat actors, STRIDE analysis, mitigations, and production assumptions.
- Removed obsolete production-dangerous/default `SECRET_KEY` references from the Node.js application documentation.
- Replaced fixed credential-like integration-test fixtures with runtime-generated secrets.
- Added root and backend production dependency audits to GitHub Actions with a high-severity failure threshold.
- Documented formal server-side request-validation requirements in `docs/REQUEST_VALIDATION.md`.
- Updated `SECURITY.md` to reference the threat model and request-validation controls.

### CI

- PostgreSQL integration tests now generate their bootstrap token at runtime instead of storing a fixed token in workflow configuration.
- Dependency auditing is performed for both the root and backend package sets.

## [1.0.0] — 2026-09-10

### Added

- Buyer-oriented asset transfer runbook.
- Dataset provenance and commercial-use guidance.
- Known limitations disclosure.
- Third-party dependency/license review guidance.
- MIT software license file.

### Improved

- Repository root cleaned of accidental duplicate dataset artifacts.
- Backend package version aligned with the v1.0.0 application release.
- Verification state is based on explicit reviewer actions rather than free-form reason text.
- Release and health versioning are aligned with the application package version.

### Preserved

- Historical v0.9.1 release/demo references remain historical and are not rewritten as v1.0.0.

## [0.9.1]

Historical demo/release version. See repository history and release documentation for the exact contents of that version.
