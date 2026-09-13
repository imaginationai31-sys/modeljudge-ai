# ModelJudge AI — Threat Model

## 1. Purpose

This document describes the main security threats considered for ModelJudge AI, an AI response evaluation and human-preference dataset platform.

The goal is to identify realistic attack scenarios, define the security boundaries of the application, and document the controls used to reduce risk.

This threat model is intended for developers, self-hosting buyers, reviewers, and maintainers.

## 2. System Overview

ModelJudge AI consists of:

- A web-based evaluation interface
- A Node.js API backend
- A PostgreSQL database
- Reviewer authentication and authorization
- Evaluation and review workflows
- Dataset exploration and verification features
- Dataset release/export functionality
- Deployment through a public hosting provider

### Primary data flow

```text
User
  |
  v
Web Frontend
  |
  | HTTPS/API requests
  v
ModelJudge API
  |
  +---- Authentication / Authorization
  |
  +---- Evaluation & Review Logic
  |
  v
PostgreSQL Database
  |
  v
Dataset / Verification Records
```

## 3. Assets to Protect

The following assets are considered security-sensitive:

### Authentication data

- Reviewer accounts
- Password credentials
- Authentication tokens
- Session information
- Reviewer identity information

### Evaluation data

- User prompts
- Model responses
- Preference labels
- Evaluation metadata
- Reviewer decisions

### Dataset data

- Verified evaluations
- Dataset versions
- Dataset exports
- Quality and reliability information

### Application infrastructure

- Database credentials
- Environment variables
- API configuration
- Deployment configuration
- Repository secrets

## 4. Security Boundaries

The main trust boundaries are:

### Boundary 1 — Public frontend → API

The frontend is publicly accessible and communicates with the backend through HTTP(S) API requests.

Threats include:

- Unauthorized API requests
- Malicious request payloads
- API abuse
- Cross-origin attacks
- Automated scraping

### Boundary 2 — API → Database

The API is trusted to access the database.

Threats include:

- SQL injection
- Unauthorized data access
- Privilege escalation
- Accidental data modification

### Boundary 3 — Reviewer → Protected review functions

Authenticated reviewers can access protected review operations.

Threats include:

- Account compromise
- Unauthorized review actions
- Privilege escalation
- Manipulation of verification status

### Boundary 4 — Repository → Deployment environment

The source repository contains application code and deployment configuration.

Threats include:

- Accidental secret commits
- Dependency vulnerabilities
- Malicious code changes
- Compromised CI/CD credentials

## 5. Threat Actors

### Unauthenticated attacker

An external user attempting to access protected functionality without valid credentials.

Potential capabilities:

- Send arbitrary HTTP requests
- Submit malformed input
- Enumerate public endpoints
- Attempt authentication attacks

### Authenticated malicious user

A legitimate account holder attempting to abuse application functionality.

Potential capabilities:

- Submit evaluations
- Access permitted reviewer functionality
- Attempt to manipulate review data
- Attempt privilege escalation

### Compromised reviewer account

An attacker who obtains valid reviewer credentials or tokens.

Potential capabilities:

- Perform actions available to that reviewer
- Submit malicious or incorrect reviews
- Attempt to manipulate dataset quality

### Malicious or compromised dependency

A third-party package containing vulnerable or malicious code.

Potential impact:

- Application compromise
- Data exposure
- Supply-chain attacks

### Accidental insider

A developer or administrator unintentionally exposing secrets, modifying production data, or deploying unsafe code.

## 6. Threat Analysis

| Threat | Risk | Primary Mitigation |
|---|---|---|
| SQL injection | High | Parameterized database queries |
| Credential exposure | High | Environment variables and secret management |
| Broken authentication | High | Protected authentication endpoints and token validation |
| Unauthorized dataset modification | High | Server-side authorization |
| Privilege escalation | High | Role/permission checks on protected endpoints |
| XSS | Medium | Input/output handling and browser protections |
| CSRF | Medium | Authentication design and request validation |
| CORS abuse | Medium | Explicitly configured allowed origins |
| API abuse | Medium | Request validation and deployment-level controls |
| Malicious payloads | Medium | Input validation |
| Dependency vulnerability | Medium | Dependency updates and CI checks |
| Secret leakage in Git | High | Secret scanning and environment-based configuration |
| Data scraping | Medium | Access controls and rate limiting at deployment/infrastructure level |
| Database compromise | Critical | Restricted credentials and secure hosting |
| CI/CD compromise | High | Protected repository secrets and workflow controls |

## 7. STRIDE Analysis

### Spoofing

**Threat:** An attacker attempts to impersonate a legitimate reviewer.

**Potential impact:**

- Unauthorized reviews
- Dataset manipulation
- Access to protected functionality

**Mitigations:**

- Authentication
- Token validation
- Server-side authorization
- Secure credential handling

### Tampering

**Threat:** An attacker modifies evaluations, reviews, or dataset records without authorization.

**Potential impact:**

- Incorrect dataset labels
- Corrupted verification results
- Loss of dataset integrity

**Mitigations:**

- Server-side authorization
- Database constraints
- Controlled API endpoints
- Validation of submitted data

### Repudiation

**Threat:** A reviewer denies having performed a review or other protected action.

**Potential impact:**

- Difficult incident investigation
- Reduced dataset accountability

**Mitigations:**

- Persisted review records
- Evaluation/review identifiers
- Timestamps
- Reviewer association with protected actions

### Information Disclosure

**Threat:** Sensitive information is exposed through API responses, logs, configuration, or repository files.

**Potential impact:**

- Credential compromise
- Dataset leakage
- Reviewer information exposure

**Mitigations:**

- Environment variables for secrets
- Avoid committing credentials
- Restricted database access
- Careful API response design
- Repository security controls

### Denial of Service

**Threat:** An attacker sends excessive or intentionally expensive requests.

**Potential impact:**

- Increased infrastructure costs
- API degradation
- Database resource exhaustion
- Service unavailability

**Mitigations:**

- Input validation
- Infrastructure-level rate limiting where available
- Request size controls
- Database query constraints
- Monitoring and deployment-provider protections

### Elevation of Privilege

**Threat:** A normal user attempts to gain reviewer or administrative privileges.

**Potential impact:**

- Unauthorized dataset modification
- Access to protected functionality
- Compromise of review workflows

**Mitigations:**

- Server-side authorization
- Explicit role checks
- Protected authentication flows
- Never trusting client-side role information

## 8. Key Security Requirements

### Authentication

Authentication credentials must never be hard-coded into source code.

Secrets should be supplied through environment variables or the deployment platform's secret-management system.

### Authorization

Authorization must be enforced on the backend.

Frontend visibility of a button or page must not be considered a security control.

### Database Security

Database access must use authenticated connections and restricted credentials.

Application queries should use parameterized queries rather than constructing SQL statements from untrusted input.

### Input Validation

API endpoints should validate:

- Required fields
- Data types
- String lengths
- Enumerated values
- Identifiers
- Authentication state

Invalid input should be rejected before database operations.

### CORS

CORS should be configured for the actual production frontend origin rather than using unrestricted origins in production.

### Secrets

The following must not be committed to Git:

- Database passwords
- API keys
- Authentication secrets
- Deployment credentials
- Private tokens

### Dependencies

Application dependencies should be periodically updated and checked for known vulnerabilities.

## 9. Data Classification

### Public

Examples:

- Public application pages
- Public project documentation
- Public dataset metadata intentionally released by the owner

### Internal

Examples:

- Application configuration
- Operational logs
- Non-public project information

### Confidential

Examples:

- Reviewer credentials
- Authentication tokens
- Database credentials
- Private evaluation data
- Deployment secrets

Confidential information must not be exposed through public repository files or unauthenticated API responses.

## 10. Security Assumptions

This threat model assumes:

1. Production traffic uses HTTPS.
2. Database credentials are stored outside the source repository.
3. Deployment secrets are managed by the hosting provider.
4. The production database is not directly exposed to the public internet unless explicitly required.
5. Review permissions are enforced by the backend.
6. Users cannot be trusted to enforce security rules through the frontend.
7. The hosting provider's infrastructure security controls are enabled.
8. Developers review dependency and CI/CD changes before production deployment.

## 11. Out of Scope

The following are outside the application's direct security boundary:

- Physical security of hosting-provider infrastructure
- Security of the user's own device
- Compromise of a user's email account
- Compromise of the hosting provider
- Compromise of GitHub itself
- Network attacks against infrastructure controlled entirely by the hosting provider
- Security of third-party services outside ModelJudge AI's control

These risks should be handled using the security controls provided by the relevant service providers.

## 12. Recommended Production Controls

For production deployments, operators should additionally consider:

- HTTPS-only access
- Strong reviewer passwords
- Secret rotation
- Database backups
- Database least-privilege credentials
- API rate limiting
- Dependency vulnerability scanning
- Repository secret scanning
- CI/CD branch protection
- Monitoring and alerting
- Regular dependency updates
- Regular database backups and restore testing

## 13. Incident Response

If a security incident is suspected:

1. Disable or rotate compromised credentials.
2. Revoke affected authentication tokens where applicable.
3. Review application and deployment logs.
4. Identify affected records or systems.
5. Rotate exposed environment secrets.
6. Patch the vulnerable component.
7. Redeploy the application.
8. Verify that the vulnerability is no longer exploitable.
9. Document the incident and corrective actions.

## 14. Security Reporting

Security vulnerabilities should be reported privately according to the project's `SECURITY.md` policy.

Do not publicly disclose credentials, authentication tokens, private user data, or an exploitable vulnerability before the maintainer has had an opportunity to investigate.

## 15. Threat Model Status

**Status:** Active

**Scope:** ModelJudge AI application, API, database, authentication, dataset and deployment workflow.

**Review frequency:** Review this document when major authentication, authorization, database, API, deployment, or dataset architecture changes are introduced.

## 16. Security Objective

The primary security objective of ModelJudge AI is:

> Protect evaluation integrity, reviewer access, dataset confidentiality, and deployment credentials while ensuring that only authorized users can perform protected operations.

This threat model should evolve together with the application as new features and deployment environments are introduced.
