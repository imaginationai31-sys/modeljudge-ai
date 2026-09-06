const fs = require("fs/promises");
const path = require("path");
const { filterDataset, DEFAULTS } = require("../backend/quality-filter");

const ROOT = path.join(__dirname, "..");
const DATASET_FILE = path.join(ROOT, "data", "evaluations.jsonl");
const REVIEWS_FILE = path.join(ROOT, "data", "reviews.jsonl");
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
  const records = await readJsonl(DATASET_FILE);
  const reviews = await readJsonl(REVIEWS_FILE);
  const reviewsByEvaluation = new Map();
  for (const review of reviews) {
    if (!reviewsByEvaluation.has(review.evaluation_id)) reviewsByEvaluation.set(review.evaluation_id, []);
    reviewsByEvaluation.get(review.evaluation_id).push(review);
  }

  const result = filterDataset(records, reviewsByEvaluation, DEFAULTS);
  await fs.mkdir(EXPORT_DIR, { recursive: true });
  await fs.writeFile(path.join(EXPORT_DIR, "quality-filtered.jsonl"), result.records.map(r => JSON.stringify(r)).join("\n") + (result.records.length ? "\n" : ""));
  await fs.writeFile(path.join(EXPORT_DIR, "quality-filter-report.json"), JSON.stringify({ generated_at: new Date().toISOString(), policy: DEFAULTS, ...result.summary, exclusions: result.decisions.filter(d => !d.included) }, null, 2) + "\n");
  console.log(`Quality filter: ${result.summary.included_count}/${result.summary.input_count} records included`);
}

main().catch(error => { console.error("Quality filter failed:", error.message); process.exitCode = 1; });
