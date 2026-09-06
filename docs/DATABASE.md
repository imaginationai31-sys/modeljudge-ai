# Database Deployment

ModelJudge AI uses JSONL for local development and PostgreSQL for production-oriented deployments.

## PostgreSQL configuration

Set `DATABASE_URL` and, for account provisioning, a one-time `ADMIN_BOOTSTRAP_TOKEN` in the server environment. Never commit real credentials or tokens.

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
DATABASE_SSL=true
ADMIN_BOOTSTRAP_TOKEN=<random-secret>
```

TLS is enabled by default. Set `DATABASE_SSL=false` only for a local PostgreSQL server that intentionally runs without TLS.

## Migrations

Migrations live in `backend/migrations/` and are applied in filename order.

```bash
cd backend
npm install
npm run migrate
```

The runner records applied versions in `schema_migrations`, so an already-applied migration is skipped. Each migration is executed in a transaction. The migration runner currently requires PostgreSQL and therefore fails safely when `DATABASE_URL` is absent.

`backend/schema.sql` remains a readable production blueprint. New deployments should prefer the migration runner so schema changes are versioned.

## Authentication data model

Reviewer authentication uses:

- `reviewer_accounts` for pseudonymous reviewer IDs, password hashes, roles, active status, and login timestamps.
- `reviewer_sessions` for hashed, expiring bearer-session tokens.
- `reviews.submitted_by_account_id` to connect a review to its authenticated account.

Passwords are never stored in plaintext. The application uses PBKDF2-SHA-256 with a per-password random salt. Session tokens are random bearer secrets; only their SHA-256 hashes are stored in PostgreSQL.

## Reviewer account bootstrap

Account creation is protected by `ADMIN_BOOTSTRAP_TOKEN` and is intended as a controlled provisioning mechanism, not a public registration endpoint.

Example request shape:

```text
POST /api/auth/accounts
x-admin-bootstrap-token: <bootstrap-secret>
{
  "reviewer_id": "reviewer-001",
  "password": "a-long-random-password",
  "role": "reviewer"
}
```

After provisioning, the reviewer can authenticate with:

```text
POST /api/auth/login
{
  "reviewer_id": "reviewer-001",
  "password": "..."
}
```

The returned bearer token must be sent as:

```text
Authorization: Bearer <token>
```

## Protected review submission

`POST /api/reviews` requires authentication when PostgreSQL mode is active. The server takes the reviewer identity from the authenticated session rather than trusting a client-supplied reviewer ID. A mismatching `reviewer_id` is rejected.

Public read endpoints remain available for dataset exploration. Authentication is required for creating reviewer judgments and for session logout/profile operations.

## Storage architecture

```text
                    ┌──────────────────┐
                    │    HTTP API      │
                    └────────┬─────────┘
                             │
                  ┌──────────┴──────────┐
                  │                     │
             JSONL mode           PostgreSQL mode
              local/MVP              production
                                        │
                           ┌────────────┴────────────┐
                           │ evaluations / reviews  │
                           │ auth / sessions        │
                           │ calibration             │
                           └─────────────────────────┘
```

## Security notes

- Use a strong randomly generated `ADMIN_BOOTSTRAP_TOKEN` and keep it in the hosting platform's secret manager.
- Rotate or remove the bootstrap secret after controlled reviewer provisioning.
- Use HTTPS in production so bearer tokens are not exposed in transit.
- Use a least-privilege PostgreSQL role.
- Configure backups and point-in-time recovery.
- Add session cleanup for expired rows as an operational job.
- Add rate limiting and account lockout before exposing authentication to an untrusted public network.
- Do not store reviewer names, emails, passwords, credentials, or unnecessary personal information in the dataset.

## Current scope

Step 14 adds the authentication schema, secure password hashing, expiring database-backed sessions, authenticated review submission, account bootstrap protection, and environment documentation.

Remaining production security work includes rate limiting, password reset/recovery, CSRF protection if cookie sessions are introduced, centralized audit events, secret rotation, and a production identity provider if required.
