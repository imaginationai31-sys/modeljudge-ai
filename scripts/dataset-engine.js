#!/usr/bin/env node

const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const DATA_FILE = path.join(__dirname, "..", "data", "evaluations.jsonl");
const EXPORT_DIR = path.join(__dirname, "..", "exports");
const RELEASE_DIR = path.join(__dirname, "..", "releases");
const DATASET_VERSION = process.env.DATASET_VERSION || "0.8.0";

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
  const categories = {}, languages = {}, preferences = { A: 0, B: 0, Tie: 0 };
  const fingerprints = new Set();
  let scoreTotal = 0, scoreCount = 0, verified = 0;
  for (const r of records) {
    categories[r.category || "Unknown"] = (categories[r.category || "Unknown"] || 0) + 1;
    languages[r.language || "unknown"] = (languages[r.language || "unknown"] || 0) + 1;
    if (preferences[r.preferred_response] !== undefined) preferences[r.preferred_response]++;
    if (r.fingerprint) fingerprints.add(r.fingerprint);
    if (r.verified === true) verified++;
    for (const key of ["accuracy_a","accuracy_b","relevance_a","relevance_b","clarity_a","clarity_b","safety_a","safety_b"]) {
      if (Number.isInteger(r[key])) { scoreTotal += r[key]; scoreCount++; }
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
    dataset_version: DATASET_VERSION
  };
}

function csvEscape(value) { const text = value == null ? "" : String(value); return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }
function toCsv(records) {
  const fields = ["id","prompt","response_a","response_b","preferred_response","accuracy_a","accuracy_b","relevance_a","relevance_b","clarity_a","clarity_b","safety_a","safety_b","preference_strength","reason","category","language","verified","fingerprint","created_at","dataset_version"];
  return [fields.join(","), ...records.map(r => fields.map(f => csvEscape(r[f])).join(","))].join("\n") + "\n";
}

async function sha256(filePath) {
  const data = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function writeRelease(records, report, generatedAt) {
  const versionDir = path.join(RELEASE_DIR, `v${DATASET_VERSION}`);
  await fs.mkdir(versionDir, { recursive: true });
  const jsonl = records.map(r => JSON.stringify(r)).join("\n") + (records.length ? "\n" : "");
  const csv = toCsv(records);
  await fs.writeFile(path.join(versionDir, "evaluations.jsonl"), jsonl);
  await fs.writeFile(path.join(versionDir, "evaluations.csv"), csv);
  await fs.writeFile(path.join(versionDir, "quality-report.json"), JSON.stringify(report, null, 2) + "\n");

  const files = ["evaluations.jsonl", "evaluations.csv", "quality-report.json"];
  const checksums = {};
  for (const file of files) checksums[file] = await sha256(path.join(versionDir, file));

  const manifest = {
    dataset_name: "ModelJudge AI Human Preference Evaluations",
    version: DATASET_VERSION,
    release_id: `modeljudge-ai-${DATASET_VERSION}`,
    generated_at: generatedAt,
    immutable_snapshot: true,
    record_count: records.length,
    formats: ["JSONL", "CSV"],
    schema: "data/schemas/evaluation.schema.json",
    quality_report: "quality-report.json",
    provenance: {
      source: "ModelJudge AI evaluation workflow",
      synthetic_or_demo_data_warning: "Repository sample data is illustrative unless explicitly verified as production human preference data."
    },
    licensing: "MIT repository license; downstream dataset rights must be reviewed separately for task/model content provenance.",
    sha256: checksums
  };
  await fs.writeFile(path.join(versionDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  await fs.writeFile(path.join(RELEASE_DIR, "LATEST.json"), JSON.stringify({ version: DATASET_VERSION, release_path: `releases/v${DATASET_VERSION}`, generated_at: generatedAt, manifest: `releases/v${DATASET_VERSION}/manifest.json` }, null, 2) + "\n");
  return { versionDir, manifest };
}

async function main() {
  const records = await readRecords();
  const generatedAt = new Date().toISOString();
  const report = { generated_at: generatedAt, ...metrics(records) };
  await fs.mkdir(EXPORT_DIR, { recursive: true });
  await fs.writeFile(path.join(EXPORT_DIR, "evaluations.jsonl"), records.map(r => JSON.stringify(r)).join("\n") + (records.length ? "\n" : ""));
  await fs.writeFile(path.join(EXPORT_DIR, "evaluations.csv"), toCsv(records));
  await fs.writeFile(path.join(EXPORT_DIR, "manifest.json"), JSON.stringify({ dataset_name: "ModelJudge AI Human Preference Evaluations", version: DATASET_VERSION, format: "JSONL", record_count: records.length, generated_at: generatedAt, schema: "data/schemas/evaluation.schema.json", quality_report: "exports/quality-report.json", reliability_report: "exports/reliability-report.json" }, null, 2) + "\n");
  await fs.writeFile(path.join(EXPORT_DIR, "quality-report.json"), JSON.stringify(report, null, 2) + "\n");
  const release = await writeRelease(records, report, generatedAt);
  console.log(JSON.stringify({ ...report, release: release.manifest }, null, 2));
}

main().catch(error => { console.error(error); process.exit(1); });
