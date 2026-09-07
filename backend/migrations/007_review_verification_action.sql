ALTER TABLE reviews ADD COLUMN IF NOT EXISTS verification_action TEXT NOT NULL DEFAULT 'pending';

UPDATE reviews
SET verification_action = 'approved'
WHERE verification_action = 'pending'
  AND lower(trim(reason)) LIKE 'reviewer approved:%';

UPDATE evaluations e
SET verified = TRUE
WHERE EXISTS (
  SELECT 1
  FROM reviews r
  WHERE r.evaluation_id = e.id
    AND r.verification_action = 'approved'
);

CREATE INDEX IF NOT EXISTS reviews_verification_action_idx
  ON reviews (evaluation_id, verification_action);