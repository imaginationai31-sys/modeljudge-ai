# Storage Architecture

## MVP storage

ModelJudge AI currently uses JSONL files as its local-first persistence layer. `backend/storage.js` provides a small queued append adapter so concurrent writes in the same Node process are serialized.

This is intentionally simple and auditable for development and dataset prototyping.

## Production migration

JSONL should not be treated as the final multi-user production database. A production deployment should move evaluations, reviews, calibration attempts, and audit events to a transactional database such as PostgreSQL or another managed relational store.

Recommended production properties:

- Unique constraint on evaluation fingerprint
- Unique constraint on reviewer + evaluation
- Indexed evaluation and reviewer IDs
- Transactional writes
- Backups and point-in-time recovery
- Encryption at rest and in transit
- Role-based access control
- Audit logging
- Retention and deletion policies

The application should keep the storage interface separate from HTTP routes so a database adapter can replace JSONL without rewriting the evaluation protocol.
