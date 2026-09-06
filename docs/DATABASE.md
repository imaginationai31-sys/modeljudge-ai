# Database Deployment

ModelJudge AI now includes a PostgreSQL adapter while retaining JSONL as the local-first default.

## Why PostgreSQL

The production data model needs transactions, uniqueness constraints, indexes, concurrent writes, backups, and predictable queries. The existing `backend/schema.sql` defines the core tables for evaluations, reviews, and calibration attempts.

## Configuration

Set:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
```

By default the adapter enables TLS for hosted PostgreSQL. Set `DATABASE_SSL=false` only when the database environment explicitly does not require TLS.

## Initialize schema

Run `backend/schema.sql` against the target PostgreSQL database before enabling database-backed routes.

## Architecture

```text
HTTP API
   │
   ├── JSONL local store  ← default / development
   │
   └── PostgreSQL adapter ← production target
```

The adapter is intentionally separated from HTTP routes so storage can evolve without rewriting validation and API contracts.

## Current Step 11 scope

This release adds the PostgreSQL connection layer and CRUD primitives for evaluations and reviews. The existing API remains JSONL-first so adding the adapter does not silently migrate or overwrite local data.

Before production cutover, add:

- transactional writes for evaluation + review workflows
- migration tooling
- database-backed reviewer statistics and consensus queries
- connection health checks
- retry/backoff policy
- secrets management
- automated backups and point-in-time recovery
- least-privilege database role
- data retention/deletion procedures

Do not commit `DATABASE_URL`, passwords, tokens, or other secrets to the repository.
