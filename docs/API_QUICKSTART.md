# API Quickstart

Base URL:

```text
https://your-domain.example
```

## Authenticate

Send the buyer API key using either `X-API-Key` or an Authorization Bearer header.

```bash
export MODELJUDGE_API_KEY='mj_live_REPLACE_ME'
```

## List releases

```bash
curl -H "X-API-Key: $MODELJUDGE_API_KEY" \
  https://your-domain.example/api/buyer/releases
```

## Inspect a release

```bash
curl -H "X-API-Key: $MODELJUDGE_API_KEY" \
  https://your-domain.example/api/buyer/releases/0.9.0/manifest
```

## View quality evidence

```bash
curl -H "X-API-Key: $MODELJUDGE_API_KEY" \
  https://your-domain.example/api/buyer/releases/0.9.0/quality
```

## Download JSONL

```bash
curl -L -H "X-API-Key: $MODELJUDGE_API_KEY" \
  -o evaluations.jsonl \
  'https://your-domain.example/api/buyer/releases/0.9.0/dataset?format=jsonl'
```

## Download CSV

```bash
curl -L -H "X-API-Key: $MODELJUDGE_API_KEY" \
  -o evaluations.csv \
  'https://your-domain.example/api/buyer/releases/0.9.0/dataset?format=csv'
```

## Usage

```bash
curl -H "X-API-Key: $MODELJUDGE_API_KEY" \
  https://your-domain.example/api/buyer/usage
```

## Security

Never commit API keys to Git, browser JavaScript, issue trackers, notebooks, or shell history shared with other users. Store them in a server-side secret manager or protected environment variable.

A `401` indicates missing/invalid authentication, `403` indicates an insufficient scope, and `429` indicates a rate/quota limit.
