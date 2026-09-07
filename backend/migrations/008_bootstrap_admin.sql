-- One-time bootstrap for the existing ModelJudge administrator account.
-- This only promotes reviewer01 when there is no active admin account.
-- The migration is recorded by scripts/migrate.js and will not run again.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM reviewer_accounts
    WHERE role = 'admin'
      AND active = TRUE
  ) THEN
    UPDATE reviewer_accounts
    SET role = 'admin'
    WHERE reviewer_id = 'reviewer01'
      AND active = TRUE;
  END IF;
END $$;

INSERT INTO schema_migrations (version)
VALUES ('008_bootstrap_admin')
ON CONFLICT (version) DO NOTHING;
