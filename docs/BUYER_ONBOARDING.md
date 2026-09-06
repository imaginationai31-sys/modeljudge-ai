# ModelJudge AI — Buyer Onboarding

## What you receive

A versioned evaluation dataset containing model-comparison tasks with preference labels, quality dimensions, rationales, provenance metadata, and machine-readable release manifests.

Each release can include JSONL and CSV plus quality, reliability, reviewer-control, and certification evidence.

## Quick start

1. Obtain a buyer API key from the ModelJudge administrator.
2. Keep the key in a server-side secret store. Do not put it in frontend code or URLs.
3. Request the release catalog with `X-API-Key` authentication.
4. Inspect the release manifest and quality report.
5. Download the JSONL or CSV release.
6. Verify the SHA-256 checksums in the release manifest.
7. Record the dataset version in your internal experiment metadata.

## Suggested evaluation workflow

```text
Select release → verify checksum → inspect schema → sample records
      → run validation → train/evaluate → record dataset version
```

## Data fields

Core fields include:

- `id`
- `prompt`
- `response_a`
- `response_b`
- `preferred_response`
- accuracy/relevance/clarity/safety scores for A and B
- `preference_strength`
- `reason`
- `category`
- `language`
- `verified`

## Quality evidence

Use the release's quality and reliability reports to understand review coverage, agreement, score distributions, calibration evidence, duplicate checks, and certification gates. These metrics describe dataset quality controls; they should not be interpreted as proof that a preferred response is universally correct.

## Licensing and provenance

Review the release manifest and applicable commercial agreement before downstream use. Repository licensing does not automatically grant unrestricted rights to every task, prompt, response, or external source represented in a dataset release.

## Security

API keys are secrets. Rotate or revoke compromised keys immediately. Contact the administrator if a key is exposed.

## Buyer API example

```bash
curl -H "X-API-Key: $MODELJUDGE_API_KEY" \
  https://your-domain.example/api/buyer/releases
```

## Support information to provide

When reporting a dataset issue, include:

- dataset version
- affected record ID
- release checksum
- API response status
- a concise description of the issue

Do not send private API keys in support requests.
