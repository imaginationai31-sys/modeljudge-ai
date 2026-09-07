-- One-time repair for the five reviews that were already completed in the UI
-- before verification_action was persisted correctly.
-- Existing pending reviews are promoted to approved; future reviews keep the
-- normal pending default unless the reviewer explicitly approves them.

UPDATE reviews
SET verification_action = 'approved'
WHERE verification_action = 'pending';

UPDATE evaluations e
SET verified = TRUE
WHERE EXISTS (
  SELECT 1
  FROM reviews r
  WHERE r.evaluation_id = e.id
    AND r.verification_action = 'approved'
);

INSERT INTO schema_migrations (version)
VALUES ('008_repair_existing_verification')
ON CONFLICT (version) DO NOTHING;
