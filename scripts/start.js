const path = require("path");
const { spawnSync } = require("child_process");
const db = require("../backend/db");

function runMigrations() {
  if (!db.isConfigured()) {
    console.log("DATABASE_URL not configured; starting in JSONL/local mode without migrations.");
    return;
  }

  console.log("DATABASE_URL detected; running PostgreSQL migrations before API startup...");
  const result = spawnSync(
    process.execPath,
    [path.join(__dirname, "migrate.js")],
    { stdio: "inherit" }
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

runMigrations();
console.log("Starting ModelJudge AI API...");
require("../backend/server");
