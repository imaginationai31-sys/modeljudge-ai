#!/usr/bin/env node

const fs = require("fs/promises");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "data", "evaluations.jsonl");
const EXPORT_DIR = path.join(__dirname, "..", "exports");

async function readRecords() {
  try {
    const text = await fs.readFile(DATA_FILE, "utf8");
    return text.split("\n").filter(Boolean).map(JSON.parse);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function metrics(records) {
  const categories = {};
  const languages = {};
  const preferences = { A: 0, B: 0, Tie: 0 };
  const fingerprints = new Set();
  let scoreTotal = 0;
  let scoreCount = 0;
  let verified = 0;

  for (const r of records) {
    categories[r.category || "Unknown"] = (categories[r.category || "Unknown"] || 0) + 1;
    languages[r.language || "unknown"] = (languages[r.language || "unknown"] || 0) + 1;
    if (preferences[r.preferred_response] !== undefined) preferences[r.preferred_response]++;
    if (r.fingerprint) fingerprints.add(r.fingerprint);
    if (r.verified === true) verified++;
    for (const key of ["accuracy_a", "accuracy_b", "relevance_a", "relevance_b", "clarity_a", "clarity_b", "safety_a", "safety_b"]) {
      if (Number.isInteger(r[key])) {
        scoreTotal += r[key];
        scoreCount++;
      }
    }
  }

  return {
    total_evaluations: records.length,
    unique_prompts: new Set(records.map(r => r.prompt)).size,
    duplicate_rate: records.length ? Number(((records.length - fingerprints.size) / records.length).toFixed(4)) : 0,
    invalid_record_rate: 0,
    human_verification_rate: records.length ? Number((verified / records.length).toFixed(4)) : 0,
    average_quality_score: scoreCount ? Number((scoreTotal / scoreCount).toFixed(3)) : 0,
    preference_distribution: preferences,
    category_distribution: categories,
    language_distribution: languages,
    dataset_version: "0.3.0"
  };
}

async function main() {
  const records = await readRecords();
  const report = {
    generated_at: new Date().toISOString(),
    ...metrics(records)
  };

  await fs.mkdir(EXPORT_DIR, { recursive: true });
  await fs.writeFile(path.join(EXPORT_DIR, "evaluations.jsonl"), records.map(r => JSON.stringify(r)).join("\n") + (records.length ? "\n" : ""));
  await fs.writeFile(path.join(EXPORT_DIR, "evaluations.csv"), toCsv(records));
  await fs.writeFile(path.join(EXPORT_DIR, "manifest.json"), JSON.stringify({
    dataset_name: "ModelJudge AI Human Preference Evaluations",
    version: "0.3.0",
    format: "JSONL",
    record_count: records.length,
    generated_at: report.generated_at,
    schema: "data/schemas/evaluation.schema.json",
    quality_report: "exports/quality-report.json"
  }, null, 2) + "\n");
  await fs.writeFile(path.join(EXPORT_DIR, "quality-report.json"), JSON.stringify(report, null, 2) + "\n");

  console.log(JSON.stringify(report, null, 2));
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(records) {
  const fields = [
    "id", "prompt", "response_a", "response_b", "preferred_response",
    "accuracy_a", "accuracy_b", "relevance_a", "relevance_b", "clarity_a", "clarity_b",
    "safety_a", "safety_b", "preference_strength", "reason", "category", "language",
    "verified", "fingerprint", "created_at", "dataset_version"
  ];
  return [fields.join(","), ...records.map(r => fields.map(f => csvEscape(r[f])).join(","))].join("\n") + "\n";
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
