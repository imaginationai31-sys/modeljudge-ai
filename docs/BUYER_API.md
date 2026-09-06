# ModelJudge AI Buyer API

Step 25 adds a PostgreSQL-backed buyer access layer for controlled dataset delivery.

## Authentication

Buyer requests use either:

- `X-API-Key: mj_live_...`
- `Authorization: Bearer mj_live_...`

API keys are stored only as SHA-256 hashes. The raw key is returned once when created.

## Create a key

After applying migration `004_buyer_api.sql`:

```bash
node scripts/create-buyer-key.js buyer-demo "Demo Buyer"
```

Keep the returned key in a secret manager. Never commit it.

## Current access policy

- PostgreSQL is required.
- Default scope: `dataset:read`.
- Default limit: 1,000 requests per UTC day per key.
- Access events are recorded in `buyer_access_log`.
- Revoked keys are rejected.

## Recommended production extensions

The API layer is deliberately small in Step 25. A production commercial service should add signed download URLs, billing/entitlements, per-release authorization, stronger rate limiting backed by Redis or an API gateway, key rotation, customer administration, and privacy-reviewed audit retention.

## Security note

The API key is a bearer credential. Treat it like a password. Do not place it in frontend JavaScript, public documentation, Git history, or client-side URLs.
