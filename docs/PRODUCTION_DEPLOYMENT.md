# Production Deployment

## Architecture

Recommended production topology:

```text
Browser / Buyer
      |
   HTTPS
      |
 CDN / WAF / Reverse Proxy
      |
 ModelJudge AI API
      |
 PostgreSQL
```

The repository supports JSONL storage for local development and PostgreSQL for production workloads.

## Required production configuration

Set these environment variables in the deployment platform's secret/configuration store:

- `NODE_ENV=production`
- `PORT` to the platform-provided port when required
- `DATABASE_URL`
- `DATABASE_SSL=true` when the managed database requires TLS
- `CORS_ORIGIN=https://your-production-domain`
- `TRUST_PROXY=true` only when the reverse proxy forwards client IPs correctly
- `ADMIN_BOOTSTRAP_TOKEN`
- `GOLD_TASKS_FILE` pointing to a private production gold-task file
- reviewer quality policy variables
- `SECURITY_RATE_WINDOW_MS`
- `SECURITY_RATE_MAX_REQUESTS`

Never commit production secrets, API keys, database URLs, or private gold answers.

## Database migration

Run the repository migration command against the production database before enabling buyer/reviewer features. Verify that migrations `001` through `005` have completed successfully.

## GitHub Actions deployment

`.github/workflows/deploy.yml` performs the complete verification pipeline on `main` and can call a platform-specific deployment hook.

Set repository/environment configuration:

- Variable: `DEPLOY_ENABLED=true`
- Secret: `DEPLOY_HOOK_URL`
- Secret: `HEALTHCHECK_URL` — the production `/api/health` endpoint

The deployment job runs only after tests, dataset validation, exports, filtering, reliability, reviewer-control, certification, and buyer-release generation succeed.

## Reverse proxy

Use HTTPS and forward the original client IP only through a trusted proxy. Set `TRUST_PROXY=true` only after confirming the deployment platform's proxy behavior.

For multiple application instances, replace the process-local security rate limiter with a distributed gateway/WAF/Redis-based control before treating rate limits as a hard security boundary.

## PostgreSQL operations

Production should use a managed PostgreSQL service with:

- automated backups
- point-in-time recovery where available
- TLS
- restricted network access
- least-privilege database credentials
- monitoring and connection limits
- tested restore procedures

## Launch checklist

- [ ] Production domain uses HTTPS
- [ ] `CORS_ORIGIN` is restricted
- [ ] PostgreSQL is configured and migrations are applied
- [ ] private gold dataset is outside the public repository
- [ ] admin bootstrap secret is stored in a secret manager
- [ ] buyer API keys are never placed in frontend source or URLs
- [ ] deployment health check passes
- [ ] backups and restore have been tested
- [ ] monitoring/alerts are enabled
- [ ] distributed rate limiting is configured for multi-instance deployments
- [ ] production buyer key rotation/revocation has been tested
- [ ] dependency audit is part of the release process
