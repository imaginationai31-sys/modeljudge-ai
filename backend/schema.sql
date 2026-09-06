-- ModelJudge AI production storage blueprint

CREATE TABLE evaluations (
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

CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  evaluation_id TEXT NOT NULL REFERENCES evaluations(id),
  reviewer_id TEXT NOT NULL,
  preferred_response TEXT NOT NULL CHECK (preferred_response IN ('A','B','Tie')),
  reason TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (evaluation_id, reviewer_id)
);

CREATE INDEX idx_reviews_evaluation_id ON reviews(evaluation_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);

CREATE TABLE calibration_attempts (
  id TEXT PRIMARY KEY,
  gold_evaluation_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  preferred_response TEXT NOT NULL CHECK (preferred_response IN ('A','B','Tie')),
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (gold_evaluation_id, reviewer_id)
);

CREATE INDEX idx_calibration_reviewer_id ON calibration_attempts(reviewer_id);
