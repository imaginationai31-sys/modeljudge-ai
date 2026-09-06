const fs = require("fs/promises");
const path = require("path");
const db = require("../backend/db");

function migrationVersion(file) {
  return file.replace(/\.sql$/i, "");
}

async function migrate() {
  if (!db.isConfigured()) throw new Error("DATABASE_URL is required to run migrations");

  const dir = path.join(__dirname, "..", "backend", "migrations");
  const files = (await fs.readdir(dir)).filter(name => name.endsWith(".sql")).sort();

  // Bootstrap the migration ledger before reading it. Migration 001 also
  // creates this table, so IF NOT EXISTS keeps the runner safe on a fresh DB.
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  for (const file of files) {
    const version = migrationVersion(file);
    const existing = await db.query(
      "SELECT 1 FROM schema_migrations WHERE version = $1 LIMIT 1",
      [version]
    );

    if (existing.rowCount > 0) {
      console.log(`Skipped migration: ${file}`);
      continue;
    }

    const sql = await fs.readFile(path.join(dir, file), "utf8");
    await db.query(sql);

    // Record the filename-based version after the migration succeeds.
    // ON CONFLICT also tolerates migrations that record their own version.
    await db.query(
      "INSERT INTO schema_migrations(version) VALUES ($1) ON CONFLICT (version) DO NOTHING",
      [version]
    );

    console.log(`Applied migration: ${file}`);
  }

  await db.close();
}

migrate().catch(async error => {
  console.error(`Migration failed: ${error.message}`);
  await db.close();
  process.exit(1);
});
