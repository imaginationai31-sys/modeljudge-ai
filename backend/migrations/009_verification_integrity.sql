BEGIN;

-- Verification integrity hardening.
-- Historical migrations are intentionally left unchanged.
-- From this migration onward, verification state is explicit: pending,
-- approved, revision requested, or rejected.

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS verification_action TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_verification_action_check;

ALTER TABLE reviews
  ADD CONSTRAINT reviews_verification_action_check
  CHECK (verification_action IN ('pending', 'approved', 'revision requested', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_reviews_verification_evaluation_action
  ON reviews (evaluation_id, verification_action);

-- Reconcile only from explicit verification actions. Do not infer approval
-- from free-form reason text and do not promote pending reviews.
UPDATE evaluations e
SET verified = TRUE
WHERE EXISTS (
  SELECT 1
  FROM reviews r
  WHERE r.evaluation_id = e.id
    AND r.verification_action = 'approved'
);

UPDATE evaluations e
SET verified = FALSE
WHERE e.verified IS DISTINCT FROM FALSE
  AND NOT EXISTS (
    SELECT 1
    FROM reviews r
    WHERE r.evaluation_id = e.id
      AND r.verification_action = 'approved'
  );

INSERT INTO schema_migrations(version)
VALUES ('009_verification_integrity')
ON CONFLICT (version) DO NOTHING;

COMMIT;
