#!/usr/bin/env node

const fs = require("fs/promises");
const path = require("path");
const { buildRelease } = require("../backend/release-engine");

async function main() {
  const version = process.argv[2] || process.env.DATASET_VERSION || "0.9.0";
  const reportPath = path.join(__dirname, "..", "exports", "quality-report.json");
  let recordCount = null;
  try { recordCount = JSON.parse(await fs.readFile(reportPath, "utf8")).total_evaluations; } catch {}
  const manifest = await buildRelease(version, { record_count: recordCount });
  console.log(JSON.stringify({ message: "Immutable buyer release created", release: manifest }, null, 2));
}

main().catch(error => { console.error(error.message); process.exit(1); });
