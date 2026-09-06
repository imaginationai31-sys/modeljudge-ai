BEGIN;

CREATE TABLE IF NOT EXISTS reviewer_accounts (
  id TEXT PRIMARY KEY,
  reviewer_id TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'reviewer' CHECK (role IN ('reviewer','admin')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS reviewer_sessions (
  id TEXT PRIMARY KEY,
  reviewer_account_id TEXT NOT NULL REFERENCES reviewer_accounts(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reviewer_sessions_account ON reviewer_sessions(reviewer_account_id);
CREATE INDEX IF NOT EXISTS idx_reviewer_sessions_expires ON reviewer_sessions(expires_at);

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS submitted_by_account_id TEXT REFERENCES reviewer_accounts(id);

INSERT INTO schema_migrations(version) VALUES ('002_reviewer_auth') ON CONFLICT (version) DO NOTHING;

COMMIT;
