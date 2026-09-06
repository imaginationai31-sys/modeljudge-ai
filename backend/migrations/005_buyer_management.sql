CREATE TABLE IF NOT EXISTS buyer_accounts (
  buyer_id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','closed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_buyer_accounts_status ON buyer_accounts(status);

CREATE INDEX IF NOT EXISTS idx_buyer_access_log_action ON buyer_access_log(action, created_at DESC);

INSERT INTO schema_migrations (version)
VALUES ('005_buyer_management')
ON CONFLICT (version) DO NOTHING;
