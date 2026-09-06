CREATE TABLE IF NOT EXISTS reviewer_quality_control (
  reviewer_id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'insufficient' CHECK (status IN ('insufficient','active','warning','suspended')),
  reason TEXT,
  calibration_accuracy NUMERIC(6,5) NOT NULL DEFAULT 0,
  consistency_score NUMERIC(6,5) NOT NULL DEFAULT 0,
  quality_score NUMERIC(6,5) NOT NULL DEFAULT 0,
  calibration_attempts INTEGER NOT NULL DEFAULT 0,
  consecutive_calibration_failures INTEGER NOT NULL DEFAULT 0,
  suspended_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviewer_quality_audit (
  id UUID PRIMARY KEY,
  reviewer_id TEXT NOT NULL,
  action TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  reason TEXT,
  actor_reviewer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviewer_quality_status ON reviewer_quality_control(status);
CREATE INDEX IF NOT EXISTS idx_reviewer_quality_audit_reviewer ON reviewer_quality_audit(reviewer_id, created_at DESC);

INSERT INTO schema_migrations (version)
VALUES ('003_reviewer_quality_control')
ON CONFLICT (version) DO NOTHING;
