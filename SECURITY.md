# Security Policy

## Security Overview

ModelJudge AI handles evaluation prompts, model responses, user/session data, and database-backed evaluation records. Security-sensitive configuration must be supplied through protected environment variables or secret-management systems and must never be committed to the repository.

## Trust Boundaries

The primary trust boundaries are:

1. **Client → Application**
   - Browser requests and submitted evaluation data are untrusted.
   - User-controlled input must be validated before security-sensitive processing or database operations.

2. **Application → Session Signing**
   - Session state is protected by the application's signing mechanism.
   - The configured `SECRET_KEY` is a security boundary for signed session data.
   - Anyone who obtains the production `SECRET_KEY` may be able to forge valid signed session data.

3. **Application → Database**
   - Database credentials and connection information are trusted application secrets.
   - They must remain server-side and must never be committed to source control.
   - Database access should use the minimum privileges required by the application.

4. **CI/CD → Deployment Environment**
   - CI/CD systems may have access to deployment credentials and application secrets.
   - These values must be stored using protected repository or deployment secrets rather than source files.

## SECRET_KEY

Session signing depends on `SECRET_KEY`.

The motivating example for this policy is the documented development/default key in `src/flask/config.py`. That development/default value is for development only and **must never be used in production**.

Production deployments must provide a strong, unique, unpredictable `SECRET_KEY` through a secure environment variable or secret-management system.

Never:

- Commit a production `SECRET_KEY` to Git.
- Use the documented development/default key in production.
- Hard-code production secrets in application source code.
- Share secrets in issues, pull requests, logs, screenshots, or public documentation.

## SECRET_KEY Rotation

Rotate the production `SECRET_KEY` when:

- The existing key may have been exposed.
- An unauthorized person may have obtained access to the key.
- A deployment environment has been compromised.
- Access to the production secret needs to be revoked.

When rotating the key:

1. Generate a new cryptographically secure random value.
2. Store it in the production secret-management system.
3. Deploy the new value.
4. Verify authentication and session behavior.
5. Treat the previous key as compromised if exposure is suspected.

Changing `SECRET_KEY` can invalidate existing signed sessions, requiring users to authenticate again.

## Data Safety

Never commit secrets, credentials, API keys, or private user data.

Treat evaluation prompts and model outputs as potentially sensitive unless their provenance and redistribution rights are clear.

Production logs should not expose credentials, session secrets, database credentials, or other sensitive information.

## Production Security Checklist

Before deploying ModelJudge AI to production:

- Set a unique production `SECRET_KEY`.
- Never use the development/default key.
- Keep database credentials outside source control.
- Keep API credentials outside source control.
- Use HTTPS for production traffic.
- Restrict access to CI/CD and deployment secrets.
- Review logs for accidental secret exposure.
- Keep dependencies updated and monitor security advisories.

## Vulnerability Disclosure

Please do not publish credentials, API keys, private data, or exploitable security details in public issues.

Open a private security report through the repository's available GitHub security reporting features when enabled. If those features are unavailable, contact the maintainer privately through GitHub before disclosure.

When reporting a vulnerability, please include:

- A concise description of the vulnerability.
- The affected component, endpoint, or file.
- Steps required to reproduce the issue.
- Potential security impact.
- Suggested mitigation, if available.

Please do not include real credentials, production secrets, or unnecessary personal information in a report.

## Scope

This policy describes security expectations for the ModelJudge AI repository. Deployers are also responsible for securing their hosting environment, infrastructure, databases, networks, credentials, and third-party services.
