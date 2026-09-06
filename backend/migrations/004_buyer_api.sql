CREATE TABLE IF NOT EXISTS buyer_api_keys (
  id UUID PRIMARY KEY,
  buyer_id TEXT NOT NULL,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  scopes TEXT[] NOT NULL DEFAULT ARRAY['dataset:read'],
  daily_limit INTEGER NOT NULL DEFAULT 1000 CHECK (daily_limit > 0),
  requests_today INTEGER NOT NULL DEFAULT 0 CHECK (requests_today >= 0),
  day_started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_buyer_api_keys_buyer ON buyer_api_keys(buyer_id);

CREATE TABLE IF NOT EXISTS buyer_access_log (
  id UUID PRIMARY KEY,
  buyer_id TEXT NOT NULL,
  api_key_id UUID REFERENCES buyer_api_keys(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  version TEXT,
  format TEXT,
  record_count INTEGER,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_buyer_access_log_buyer ON buyer_access_log(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_buyer_access_log_version ON buyer_access_log(version, created_at DESC);

INSERT INTO schema_migrations (version)
VALUES ('004_buyer_api')
ON CONFLICT (version) DO NOTHING;
