-- Synchronize reviewer verification actions and repair previously approved reviews.

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS verification_action TEXT NOT NULL DEFAULT 'pending';

UPDATE reviews
SET verification_action = CASE
  WHEN LOWER(reason) LIKE 'reviewer approved:%' THEN 'approved'
  WHEN LOWER(reason) LIKE 'reviewer revision requested:%' THEN 'revision requested'
  WHEN LOWER(reason) LIKE 'reviewer rejected:%' THEN 'rejected'
  ELSE COALESCE(verification_action, 'pending')
END;

UPDATE evaluations e
SET verified = TRUE
WHERE EXISTS (
  SELECT 1
  FROM reviews r
  WHERE r.evaluation_id = e.id
    AND r.verification_action = 'approved'
);

CREATE INDEX IF NOT EXISTS idx_reviews_verification_action
  ON reviews (verification_action);

INSERT INTO schema_migrations (version)
VALUES ('007_verification_sync')
ON CONFLICT (version) DO NOTHING;
