CREATE TABLE IF NOT EXISTS calibration_attempts (
  id UUID PRIMARY KEY,
  reviewer_id TEXT NOT NULL,
  gold_evaluation_id TEXT NOT NULL,
  submitted_preference TEXT NOT NULL CHECK (submitted_preference IN ('A','B','Tie')),
  expected_preference TEXT NOT NULL CHECK (expected_preference IN ('A','B','Tie')),
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_calibration_reviewer ON calibration_attempts(reviewer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS reviewer_quality_snapshots (
  reviewer_id TEXT PRIMARY KEY,
  calibration_accuracy NUMERIC(6,5) NOT NULL DEFAULT 0,
  consistency_score NUMERIC(6,5) NOT NULL DEFAULT 0,
  quality_score NUMERIC(6,5) NOT NULL DEFAULT 0,
  sample_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'insufficient' CHECK (status IN ('insufficient','pass','review')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_migrations (version)
VALUES ('002_reviewer_quality')
ON CONFLICT (version) DO NOTHING;
