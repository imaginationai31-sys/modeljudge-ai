# ModelJudge AI Buyer API Quickstart

This guide shows the shortest path from a buyer API key to an authenticated, versioned dataset download.

## Production base URL

For the current Render deployment:

```text
https://modeljudge-api.onrender.com
```

For another deployment, replace the base URL in the examples below.

## 1. Authenticate

Buyer API keys use the `mj_live_...` format. Send the key with either header:

```http
X-API-Key: mj_live_...
```

or:

```http
Authorization: Bearer mj_live_...
```

The buyer API requires the `dataset:read` scope. Keys are bearer credentials and must be kept server-side.

```bash
export MODELJUDGE_API_KEY='mj_live_REPLACE_ME'
export MODELJUDGE_API_URL='https://modeljudge-api.onrender.com'
```

## 2. List available releases

```bash
curl -H "X-API-Key: $MODELJUDGE_API_KEY" \
  "$MODELJUDGE_API_URL/api/buyer/releases"
```

This returns the releases available to the authenticated buyer.

## 3. Inspect a release manifest

Use a version returned by the release catalog, for example `0.9.1`:

```bash
curl -H "X-API-Key: $MODELJUDGE_API_KEY" \
  "$MODELJUDGE_API_URL/api/buyer/releases/0.9.1/manifest"
```

The manifest is the release-level integrity and provenance record. Check the release version, record count, file metadata, and SHA-256 checksums before processing a dataset.

## 4. View quality evidence

```bash
curl -H "X-API-Key: $MODELJUDGE_API_KEY" \
  "$MODELJUDGE_API_URL/api/buyer/releases/0.9.1/quality"
```

Reviewer-quality evidence is available separately:

```bash
curl -H "X-API-Key: $MODELJUDGE_API_KEY" \
  "$MODELJUDGE_API_URL/api/buyer/releases/0.9.1/reviewer-quality"
```

## 5. Download the primary JSONL dataset

```bash
curl -L -H "X-API-Key: $MODELJUDGE_API_KEY" \
  -H "Accept: application/jsonl" \
  -o evaluations.jsonl \
  "$MODELJUDGE_API_URL/api/buyer/releases/0.9.1/dataset?format=jsonl"
```

The primary dataset is returned as newline-delimited JSON (`application/x-ndjson`).

## 6. Download CSV

CSV is available as a convenience format:

```bash
curl -L -H "X-API-Key: $MODELJUDGE_API_KEY" \
  -H "Accept: text/csv" \
  -o evaluations.csv \
  "$MODELJUDGE_API_URL/api/buyer/releases/0.9.1/dataset?format=csv"
```

## 7. Check buyer API usage

```bash
curl -H "X-API-Key: $MODELJUDGE_API_KEY" \
  "$MODELJUDGE_API_URL/api/buyer/usage"
```

The current default buyer key limit is 1,000 authenticated API requests per UTC day unless a different limit was provisioned for the key.

## 8. Verify the release before processing

Recommended buyer flow:

```text
List releases
    ↓
Select version
    ↓
Read manifest + quality evidence
    ↓
Download JSONL
    ↓
Verify SHA-256 against the release manifest
    ↓
Process dataset
```

Do not treat the live `/api/release` summary as a substitute for the release manifest. The manifest belongs to the versioned release snapshot.

## HTTP errors

| Status | Meaning |
|---|---|
| `401` | Missing, malformed, invalid, or revoked buyer API key |
| `403` | Valid key, but the required `dataset:read` scope is missing |
| `404` | Requested release or dataset artifact does not exist |
| `429` | The API key has reached its daily request limit |
| `503` | Buyer API or its PostgreSQL dependency is temporarily unavailable |

## Security

Never put a buyer API key in browser JavaScript, a public repository, a URL query parameter, screenshots, notebooks, or shared logs. The public dashboard intentionally does not contain a buyer key. Store the credential in a protected server-side environment or secret manager.

## Versioning

Release versions are immutable snapshots. If the dataset changes, use a new semantic version rather than replacing an existing release. Buyers should pin the exact release version used for training or benchmarking and retain its manifest/checksum with their internal data lineage records.

## Related documentation

- `docs/BUYER_API.md` — complete endpoint and security reference
- `docs/BUYER_RELEASES.md` — release packaging and integrity verification
- `docs/BUYER_ONBOARDING.md` — buyer workflow and dataset fields
- `docs/SECURITY_HARDENING.md` — security controls
