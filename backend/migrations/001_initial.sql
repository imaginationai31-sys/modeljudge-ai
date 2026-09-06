BEGIN;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY,
  prompt TEXT NOT NULL,
  response_a TEXT NOT NULL,
  response_b TEXT NOT NULL,
  preferred_response TEXT NOT NULL CHECK (preferred_response IN ('A','B','Tie')),
  accuracy_a SMALLINT NOT NULL CHECK (accuracy_a BETWEEN 1 AND 5),
  accuracy_b SMALLINT NOT NULL CHECK (accuracy_b BETWEEN 1 AND 5),
  relevance_a SMALLINT NOT NULL CHECK (relevance_a BETWEEN 1 AND 5),
  relevance_b SMALLINT NOT NULL CHECK (relevance_b BETWEEN 1 AND 5),
  clarity_a SMALLINT NOT NULL CHECK (clarity_a BETWEEN 1 AND 5),
  clarity_b SMALLINT NOT NULL CHECK (clarity_b BETWEEN 1 AND 5),
  safety_a SMALLINT NOT NULL CHECK (safety_a BETWEEN 1 AND 5),
  safety_b SMALLINT NOT NULL CHECK (safety_b BETWEEN 1 AND 5),
  reason TEXT NOT NULL,
  fingerprint CHAR(64) NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'General Knowledge',
  language TEXT NOT NULL DEFAULT 'en',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  dataset_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  evaluation_id TEXT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  reviewer_id TEXT NOT NULL,
  preferred_response TEXT NOT NULL CHECK (preferred_response IN ('A','B','Tie')),
  accuracy_a SMALLINT NOT NULL CHECK (accuracy_a BETWEEN 1 AND 5),
  accuracy_b SMALLINT NOT NULL CHECK (accuracy_b BETWEEN 1 AND 5),
  relevance_a SMALLINT NOT NULL CHECK (relevance_a BETWEEN 1 AND 5),
  relevance_b SMALLINT NOT NULL CHECK (relevance_b BETWEEN 1 AND 5),
  clarity_a SMALLINT NOT NULL CHECK (clarity_a BETWEEN 1 AND 5),
  clarity_b SMALLINT NOT NULL CHECK (clarity_b BETWEEN 1 AND 5),
  safety_a SMALLINT NOT NULL CHECK (safety_a BETWEEN 1 AND 5),
  safety_b SMALLINT NOT NULL CHECK (safety_b BETWEEN 1 AND 5),
  reason TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'medium',
  fingerprint CHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (evaluation_id, reviewer_id),
  UNIQUE (fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evaluations_category ON evaluations(category);
CREATE INDEX IF NOT EXISTS idx_evaluations_language ON evaluations(language);
CREATE INDEX IF NOT EXISTS idx_reviews_evaluation_id ON reviews(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);

CREATE TABLE IF NOT EXISTS calibration_attempts (
  id TEXT PRIMARY KEY,
  gold_evaluation_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  preferred_response TEXT NOT NULL CHECK (preferred_response IN ('A','B','Tie')),
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (gold_evaluation_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_calibration_reviewer_id ON calibration_attempts(reviewer_id);

INSERT INTO schema_migrations(version) VALUES ('001_initial') ON CONFLICT (version) DO NOTHING;

COMMIT;
