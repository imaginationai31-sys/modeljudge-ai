# Request Validation

## Purpose

ModelJudge AI treats every client-supplied HTTP request body as untrusted input. Request validation is performed on the server before evaluation, review, calibration, or account data is persisted.

## Current validation boundary

The API parses JSON with a 100 KB request-body limit and applies endpoint-specific validation before database writes.

Evaluation submissions validate:

- `prompt`, `response_a`, and `response_b` are non-empty strings.
- `preferred_response` is one of `A`, `B`, or `Tie`.
- `reason` is a string with at least 10 non-whitespace characters.
- Each scoring dimension (`accuracy`, `relevance`, `clarity`, and `safety`) contains integer A/B scores from 1 through 5.

Review submissions use the dedicated reviewer validation rules before persistence.

Authentication endpoints validate required identifier/password types, and reviewer account creation enforces reviewer-ID, password-length, and role constraints.

## Validation order

The expected security order for protected write operations is:

```text
HTTP request
   ↓
JSON/body-size parsing
   ↓
Authentication / authorization where required
   ↓
Endpoint request validation
   ↓
Business-rule checks
   ↓
Duplicate / integrity checks
   ↓
Database persistence
```

Client-side validation is only a usability feature. It is never a security boundary.

## Error handling

Invalid requests should receive an HTTP 400 response with a safe validation message. Validation errors must not expose database credentials, secrets, stack traces, or internal infrastructure details.

Authorization failures should use the appropriate 401/403 response rather than relying on client-side state.

## Security requirements

When adding a new POST endpoint or changing an existing write endpoint:

1. Define the accepted request fields and types.
2. Validate required fields on the server.
3. Validate enumerated values explicitly.
4. Apply sensible length/range limits.
5. Reject malformed or unexpected values before persistence.
6. Keep authentication and authorization checks server-side.
7. Use parameterized database queries.
8. Add regression tests for valid, invalid, boundary, and unauthorized requests.

## Maintenance rule

Any new security-sensitive request field must be added to the endpoint's formal validation rules and corresponding tests before the endpoint is considered production-ready.

See `THREAT_MODEL.md` for the application trust boundaries and threat analysis, and `SECURITY.md` for the project's security policy.
