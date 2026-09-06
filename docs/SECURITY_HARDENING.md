# Production Security Hardening

Step 27 documents the security baseline for deploying ModelJudge AI beyond local development.

## Implemented

- Express `X-Powered-By` disabled.
- JSON request bodies capped at 100 KB.
- Content-Security-Policy, frame, MIME-sniffing, referrer, permissions and production HSTS headers.
- Global in-memory IP request-rate limiter with configurable window and limit.
- CORS origin configuration with `Vary: Origin`.
- Release version path validation to prevent path traversal through the buyer API.
- Buyer API keys remain hashed server-side and are never returned by API authentication after creation.
- Optional `TRUST_PROXY` setting prevents blindly trusting forwarded client IP headers.

## Configuration

Set `NODE_ENV=production`, a specific `CORS_ORIGIN`, and a private `DATABASE_URL` in deployment secrets. Enable `TRUST_PROXY` only when the hosting proxy is known to overwrite/validate client IP headers.

## Important production limitation

The built-in rate limiter is process-local. It is useful as a baseline for a single instance, but it is **not a distributed rate limiter**. A multi-instance commercial deployment should enforce rate limits at an API gateway, reverse proxy, WAF, or shared Redis-backed service.

Buyer API daily quotas also require an atomic database-side counter/transaction before being treated as a strict commercial entitlement.

## Secret handling

Never commit API keys, database passwords, admin bootstrap tokens, session tokens, or private gold-task files. Use the hosting provider's secret manager/environment configuration.

## Security checklist before public launch

- [ ] HTTPS enabled end-to-end
- [ ] `CORS_ORIGIN` restricted to the real portal domain
- [ ] PostgreSQL TLS enabled
- [ ] Admin bootstrap secret stored outside Git
- [ ] Private gold dataset stored outside the repository
- [ ] Distributed/API-gateway rate limiting enabled
- [ ] Database backups and restore test completed
- [ ] Log retention reviewed for privacy
- [ ] Buyer API key rotation/revocation procedure tested
- [ ] Dependency audit and CI passing
- [ ] Production monitoring and alerting enabled
