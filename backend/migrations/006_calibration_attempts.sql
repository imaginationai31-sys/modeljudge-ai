-- Gold calibration attempt storage.
-- Kept as a migration so Render startup creates the table before API traffic.

CREATE TABLE IF NOT EXISTS calibration_attempts (
  id TEXT PRIMARY KEY,
  reviewer_id TEXT NOT NULL,
  gold_evaluation_id TEXT NOT NULL,
  submitted_preference TEXT NOT NULL,
  expected_preference TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE calibration_attempts
  ADD COLUMN IF NOT EXISTS reviewer_id TEXT;

ALTER TABLE calibration_attempts
  ADD COLUMN IF NOT EXISTS gold_evaluation_id TEXT;

ALTER TABLE calibration_attempts
  ADD COLUMN IF NOT EXISTS submitted_preference TEXT;

ALTER TABLE calibration_attempts
  ADD COLUMN IF NOT EXISTS expected_preference TEXT;

ALTER TABLE calibration_attempts
  ADD COLUMN IF NOT EXISTS is_correct BOOLEAN;

ALTER TABLE calibration_attempts
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS calibration_attempts_reviewer_task_idx
  ON calibration_attempts (reviewer_id, gold_evaluation_id);
