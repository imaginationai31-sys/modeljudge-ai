#!/usr/bin/env node

const fs = require("fs/promises");
const path = require("path");
const { buildReliabilityReport } = require("../backend/reliability-engine");

const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const EXPORT_DIR = path.join(ROOT, "exports");

async function readJsonl(file) {
  try {
    const text = await fs.readFile(file, "utf8");
    return text.split("\n").filter(Boolean).map(JSON.parse);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function main() {
  const records = await readJsonl(path.join(DATA_DIR, "evaluations.jsonl"));
  const reviews = await readJsonl(path.join(DATA_DIR, "reviews.jsonl"));
  const report = buildReliabilityReport(records, reviews);
  await fs.mkdir(EXPORT_DIR, { recursive: true });
  await fs.writeFile(path.join(EXPORT_DIR, "reliability-report.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(JSON.stringify(report, null, 2));
}

main().catch(error => { console.error(error); process.exit(1); });
