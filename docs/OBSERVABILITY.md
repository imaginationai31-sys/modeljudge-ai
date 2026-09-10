# Observability

ModelJudge AI includes a dependency-free observability layer for the deployed service.

## Structured logging

`backend/logger.js` emits newline-delimited JSON records with:

- UTC timestamp
- log level
- service name
- event/message name
- request ID for public HTTP requests
- HTTP method, path, status, and duration
- sensitive-field redaction for authorization, cookies, passwords, tokens, secrets, and API keys

This format is suitable for ingestion by Render, CloudWatch, Datadog, Loki, or another log collector without requiring a vendor SDK.

## Error tracking

`backend/error-tracker.js` captures:

- uncaught exceptions
- unhandled promise rejections
- API proxy failures
- error type, message, stack, and safe contextual metadata

Events are persisted as JSONL in `logs/errors.jsonl` and also emitted through the structured logger. The `logs/` directory is ignored by Git so runtime error records and potentially sensitive request context are never committed.

## Production notes

This is a lightweight local error-tracking hook, not a hosted error-monitoring SaaS. A buyer can replace `captureException()` with Sentry, OpenTelemetry, Datadog, or another provider without changing application call sites.

Operational follow-ups for a production buyer include log retention, centralized aggregation, alerting, backup/restore monitoring, and privacy review of retained prompts/model outputs.
