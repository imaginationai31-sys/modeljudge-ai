const fs = require("fs");
const path = require("path");
const db = require("../backend/db");

async function main() {
  const report = { timestamp: new Date().toISOString(), database_configured: db.isConfigured(), database: null, gold_file: null, checks: [] };
  const goldPath = path.join(__dirname, "..", "data", "gold", "gold-evaluations.jsonl");

  try {
    const lines = fs.readFileSync(goldPath, "utf8").split(/\r?\n/).filter(Boolean);
    const records = lines.map((line, index) => {
      try { return JSON.parse(line); }
      catch (error) { throw new Error(`Invalid JSON on gold line ${index + 1}: ${error.message}`); }
    });
    report.gold_file = { exists: true, records: records.length, first_id: records[0]?.gold_evaluation_id || records[0]?.id || null, last_id: records.at(-1)?.gold_evaluation_id || records.at(-1)?.id || null };
    report.checks.push({ name: "gold_file", status: "ok", message: `${records.length} valid JSONL records loaded` });
  } catch (error) {
    report.gold_file = { exists: false, error: error.message };
    report.checks.push({ name: "gold_file", status: "failed", message: error.message });
  }

  if (!db.isConfigured()) {
    report.checks.push({ name: "postgres", status: "failed", message: "DATABASE_URL is not configured" });
    console.log(JSON.stringify(report, null, 2)); process.exitCode = 1; return;
  }

  try {
    await db.query("SELECT 1 AS ok");
    report.database = { connected: true };
    report.checks.push({ name: "postgres", status: "ok", message: "PostgreSQL connection succeeded" });
  } catch (error) {
    report.database = { connected: false, error: error.message, code: error.code };
    report.checks.push({ name: "postgres", status: "failed", message: `${error.code || "DB_ERROR"}: ${error.message}` });
    console.log(JSON.stringify(report, null, 2)); process.exitCode = 1; return;
  }

  try {
    const migration = await db.query(
      "SELECT version FROM schema_migrations WHERE version IN ($1, $2)",
      ["006_calibration_attempts.sql", "006_calibration_attempts"]
    );
    report.checks.push({ name: "migration_006", status: migration.rowCount ? "ok" : "failed", message: migration.rowCount ? `Migration 006 recorded as: ${migration.rows.map(r => r.version).join(", ")}` : "Migration 006 is not recorded as applied" });
  } catch (error) {
    report.checks.push({ name: "migration_006", status: "failed", message: error.message });
  }

  try {
    const table = await db.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'calibration_attempts' ORDER BY ordinal_position`);
    report.calibration_table = { exists: table.rowCount > 0, columns: table.rows };
    const required = ["id", "reviewer_id", "gold_evaluation_id", "submitted_preference", "expected_preference", "is_correct", "created_at"];
    const actual = new Set(table.rows.map(row => row.column_name));
    const missing = required.filter(column => !actual.has(column));
    report.checks.push({ name: "calibration_attempts_schema", status: missing.length ? "failed" : "ok", message: missing.length ? `Missing columns: ${missing.join(", ")}` : "Required calibration_attempts columns are present" });
  } catch (error) {
    report.checks.push({ name: "calibration_attempts_schema", status: "failed", message: error.message });
  }

  try {
    const attempts = await db.query("SELECT COUNT(*)::int AS count FROM calibration_attempts WHERE reviewer_id = $1", ["reviewer01"]);
    report.checks.push({ name: "reviewer01_attempts", status: "ok", message: `${attempts.rows[0].count} calibration attempts recorded for reviewer01` });
  } catch (error) {
    report.checks.push({ name: "reviewer01_attempts", status: "failed", message: `${error.code || "DB_ERROR"}: ${error.message}` });
  }

  const failed = report.checks.filter(check => check.status === "failed");
  report.status = failed.length ? "failed" : "ok";
  console.log(JSON.stringify(report, null, 2));
  if (failed.length) process.exitCode = 1;
}

main().catch(error => {
  console.error(JSON.stringify({ status: "failed", fatal: error.message, code: error.code }, null, 2));
  process.exitCode = 1;
});
