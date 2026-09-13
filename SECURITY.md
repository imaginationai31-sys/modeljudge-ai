# Security Policy

## Security Overview

ModelJudge AI handles evaluation prompts, model responses, user/session data, and database-backed evaluation records. Security-sensitive configuration must be supplied through protected environment variables or secret-management systems and must never be committed to the repository.

The application security design is documented in the [Threat Model](THREAT_MODEL.md), which covers assets, trust boundaries, threat actors, STRIDE analysis, mitigations, and production security assumptions.

## Trust Boundaries

The primary trust boundaries are:

1. **Client → Application**
   - Browser requests and submitted evaluation data are untrusted.
   - User-controlled input must be validated before security-sensitive processing or database operations.

2. **Application → Authentication Session Store**
   - Reviewer sessions use cryptographically random bearer tokens.
   - Only a SHA-256 hash of the session token is stored in PostgreSQL.
   - Tokens are time-limited and can be explicitly revoked.
   - Authentication secrets and tokens must never be committed to the repository.

3. **Application → Database**
   - Database credentials and connection information are trusted application secrets.
   - They must remain server-side and must never be committed to source control.
   - Database access should use the minimum privileges required by the application.

4. **CI/CD → Deployment Environment**
   - CI/CD systems may have access to deployment credentials and application secrets.
   - These values must be stored using protected repository or deployment secrets rather than source files.

## Secret Management

The current Node.js application does not require or ship with a default `SECRET_KEY`. Reviewer authentication uses cryptographically random session tokens stored as SHA-256 hashes in PostgreSQL.

Production secrets and credentials must be supplied through secure environment variables or a deployment secret-management system.

Never:

- Commit production secrets to Git.
- Hard-code production secrets in application source code.
- Share secrets in issues, pull requests, logs, screenshots, or public documentation.
- Place authentication tokens or buyer API keys in frontend source code or URLs.
- Use fixed credential-like values in integration-test fixtures when a runtime-generated value is practical.

## Request Validation

All client-supplied request bodies are untrusted. The API applies server-side request validation before security-sensitive persistence operations. JSON request bodies are size-limited, required fields and types are checked, enumerated values are constrained, scoring ranges are enforced, and dedicated validation rules are used for reviewer operations.

Client-side validation is for usability only and is never a security boundary.

See [`docs/REQUEST_VALIDATION.md`](docs/REQUEST_VALIDATION.md) for the formal request-validation requirements and maintenance rules.

## Authentication Token Rotation

Rotate or revoke authentication credentials when:

- A token or secret may have been exposed.
- An unauthorized person may have obtained access to credentials.
- A deployment environment has been compromised.
- Access to the affected credential needs to be revoked.

For compromised reviewer sessions, revoke the affected session and require a new login. For exposed deployment secrets, generate a new cryptographically secure value, store it in the production secret-management system, deploy the new value, and verify authentication and application behavior.

## Dependency Security

Production dependencies are audited in CI with `npm audit --omit=dev --audit-level=high` for both the repository root and backend dependency set. Dependency changes should be reviewed and lockfiles must be kept synchronized with package manifests.

## Data Safety

Never commit secrets, credentials, API keys, authentication tokens, or private user data.

Treat evaluation prompts and model outputs as potentially sensitive unless their provenance and redistribution rights are clear.

Production logs should not expose credentials, session secrets, database credentials, or other sensitive information.

## Production Security Checklist

Before deploying ModelJudge AI to production:

- Do not rely on a default or hard-coded `SECRET_KEY`.
- Keep database credentials outside source control.
- Keep API credentials outside source control.
- Keep reviewer/admin bootstrap credentials outside source control.
- Use HTTPS for production traffic.
- Restrict access to CI/CD and deployment secrets.
- Use strong reviewer passwords.
- Review authentication and authorization behavior after deployment.
- Rotate or revoke credentials when exposure is suspected.
- Review the threat model after major security-sensitive architecture changes.

## Security Documentation

- [`THREAT_MODEL.md`](THREAT_MODEL.md) — application threat model and trust boundaries
- [`docs/REQUEST_VALIDATION.md`](docs/REQUEST_VALIDATION.md) — formal request-validation controls
- [`SECURITY.md`](SECURITY.md) — security policy and vulnerability-reporting guidance
