# ModelJudge AI Buyer API

The Buyer API provides authenticated access to versioned ModelJudge AI evaluation datasets and their quality evidence. Dataset access is controlled by buyer API keys and the `dataset:read` scope.

## Base URL

Current Render deployment:

```text
https://modeljudge-api.onrender.com
```

Replace this with the base URL of another deployment when self-hosting.

## Authentication

Buyer requests may authenticate with either:

```http
X-API-Key: mj_live_...
```

or:

```http
Authorization: Bearer mj_live_...
```

A buyer key is a bearer credential. API keys are stored server-side as SHA-256 hashes; the raw key is returned only when the key is created or rotated.

All buyer release endpoints require the `dataset:read` scope.

### Example

```bash
export MODELJUDGE_API_KEY='mj_live_REPLACE_ME'
export MODELJUDGE_API_URL='https://modeljudge-api.onrender.com'

curl -H "X-API-Key: $MODELJUDGE_API_KEY" \
  "$MODELJUDGE_API_URL/api/buyer/releases"
```

## Endpoint reference

### `GET /api/release`

Public release summary used by the dashboard. It exposes current release metadata and live database quality metrics.

Example:

```bash
curl "$MODELJUDGE_API_URL/api/release"
```

This endpoint does not grant dataset download access.

### `GET /api/buyer/releases`

Lists buyer-accessible releases. Requires `dataset:read`.

```bash
curl -H "Authorization: Bearer $MODELJUDGE_API_KEY" \
  "$MODELJUDGE_API_URL/api/buyer/releases"
```

Use the returned version as the immutable release identifier for subsequent requests.

### `GET /api/buyer/releases/:version/manifest`

Returns release manifest metadata, including release packaging and integrity information.

```bash
curl -H "X-API-Key: $MODELJUDGE_API_KEY" \
  "$MODELJUDGE_API_URL/api/buyer/releases/0.9.1/manifest"
```

Buyers should retain this manifest with the downloaded dataset and verify SHA-256 checksums before processing.

### `GET /api/buyer/releases/:version/dataset`

Downloads the dataset for a specific release. Requires `dataset:read`.

Query parameter:

- `format=jsonl` — primary machine-readable dataset; recommended for ML pipelines
- `format=csv` — convenience tabular export

JSONL example:

```bash
curl -L -H "X-API-Key: $MODELJUDGE_API_KEY" \
  -H "Accept: application/jsonl" \
  -o modeljudge-0.9.1.jsonl \
  "$MODELJUDGE_API_URL/api/buyer/releases/0.9.1/dataset?format=jsonl"
```

CSV example:

```bash
curl -L -H "X-API-Key: $MODELJUDGE_API_KEY" \
  -H "Accept: text/csv" \
  -o modeljudge-0.9.1.csv \
  "$MODELJUDGE_API_URL/api/buyer/releases/0.9.1/dataset?format=csv"
```

The JSONL response uses `application/x-ndjson`; CSV uses `text/csv`. Dataset downloads are logged by buyer, release version, format, record count, and request IP when available.

### `GET /api/buyer/releases/:version/quality`

Returns quality evidence for the selected release.

```bash
curl -H "X-API-Key: $MODELJUDGE_API_KEY" \
  "$MODELJUDGE_API_URL/api/buyer/releases/0.9.1/quality"
```

Use this endpoint alongside the release manifest when assessing a dataset for training or benchmarking.

### `GET /api/buyer/releases/:version/reviewer-quality`

Returns reviewer-quality and calibration evidence associated with the release.

```bash
curl -H "X-API-Key: $MODELJUDGE_API_KEY" \
  "$MODELJUDGE_API_URL/api/buyer/releases/0.9.1/reviewer-quality"
```

### `GET /api/buyer/usage`

Returns buyer API usage information for the authenticated key.

```bash
curl -H "X-API-Key: $MODELJUDGE_API_KEY" \
  "$MODELJUDGE_API_URL/api/buyer/usage"
```

### `GET /api/buyer/keys`

Returns buyer key-management information for an authenticated key where enabled by the deployment. It does not expose raw API secrets.

## Scope model

The dataset API currently uses one buyer scope:

```text
dataset:read
```

A key without this scope receives `403 Forbidden` on protected buyer endpoints. Scope checks are performed server-side.

## Current access controls

- PostgreSQL-backed buyer API
- SHA-256 hashing of API keys at rest
- Revocation support
- `dataset:read` scope enforcement
- Default daily request limit of 1,000 requests per key
- UTC-day usage tracking
- Buyer access logging for dataset downloads
- Version-specific release paths
- Release manifests with SHA-256 integrity metadata
- No buyer secret embedded in the public frontend

## HTTP errors

| Status | Meaning |
|---|---|
| `401` | Missing, malformed, invalid, or revoked buyer API key |
| `403` | The key is valid but lacks the required scope |
| `404` | Requested release or release artifact was not found |
| `429` | Daily API limit has been reached |
| `503` | Buyer API/PostgreSQL service is unavailable |

## Versioning and dataset integrity

ModelJudge AI treats releases as immutable snapshots. A changed dataset should receive a new semantic version rather than replacing an existing release.

For each buyer delivery:

1. Select and record the exact release version.
2. Fetch the release manifest.
3. Fetch quality and reviewer-quality evidence.
4. Download the JSONL dataset.
5. Calculate SHA-256 locally.
6. Compare the local digest with the release manifest.
7. Store the manifest and checksum with the dataset in the buyer's data lineage system.

The release package may also contain CSV, filtered data, reliability evidence, reviewer-control evidence, certification-readiness evidence, and a buyer handoff README. See `docs/BUYER_RELEASES.md` for the package model.

## Example integration pattern

```text
Buyer backend
    │
    │  X-API-Key / Bearer token
    ▼
ModelJudge Buyer API
    │
    ├── Release catalog
    ├── Manifest
    ├── Quality evidence
    ├── Reviewer-quality evidence
    └── Versioned JSONL/CSV download
            │
            ▼
       Buyer validation
       SHA-256 + schema checks
            │
            ▼
       Training / benchmark pipeline
```

Keep API access on the buyer's server. Do not expose the key to a browser or public client application.

## Creating buyer keys

For an administrator operating the backend, buyer keys can be provisioned with the repository's buyer management workflow. The underlying API supports a default `dataset:read` scope and a configurable daily request limit.

Example CLI workflow used by the repository:

```bash
node scripts/create-buyer-key.js buyer-demo "Demo Buyer"
```

The command returns the raw key at creation time. Store it immediately in a protected secret store.

## Security requirements

Never:

- commit a buyer API key to Git
- place a key in frontend JavaScript
- put a key in a URL query string
- include a key in screenshots or public issue comments
- paste a production key into notebooks or shared logs
- send a key through an untrusted client application

Rotate/revoke a key if it may have been exposed.

## Data licensing and provenance

API authentication proves access authorization; it does not by itself establish that every dataset record is commercially redistributable. Buyers and operators should review provenance, contributor terms, source permissions, model-output rights, privacy requirements, and any applicable contractual restrictions before training or redistribution.

Quality metrics are evidence about the evaluation process. They are not a guarantee of universal factual correctness or proof that one model is objectively superior in every use case.

## Related documentation

- `docs/API_QUICKSTART.md` — copy/paste buyer API examples
- `docs/BUYER_RELEASES.md` — release packaging, immutability, and checksum verification
- `docs/BUYER_ONBOARDING.md` — buyer workflow and data fields
- `docs/RELIABILITY.md` — inter-rater reliability methodology
- `docs/SECURITY_HARDENING.md` — security controls
- `docs/CERTIFICATION.md` — certification-readiness methodology
