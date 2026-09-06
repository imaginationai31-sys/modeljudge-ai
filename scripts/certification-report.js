const fs = require("fs/promises");
const path = require("path");
const { evaluateCertification } = require("../backend/certification-engine");

const ROOT = path.join(__dirname, "..");
const dataDir = path.join(ROOT, "data");
const exportDir = path.join(ROOT, "exports");

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
  const evaluations = await readJsonl(path.join(dataDir, "evaluations.jsonl"));
  const reviews = await readJsonl(path.join(dataDir, "reviews.jsonl"));
  const calibrations = await readJsonl(path.join(dataDir, "calibration-attempts.jsonl"));
  const byEvaluation = new Map();
  for (const review of reviews) {
    if (!byEvaluation.has(review.evaluation_id)) byEvaluation.set(review.evaluation_id, []);
    byEvaluation.get(review.evaluation_id).push(review);
  }
  const reviewed = [...byEvaluation.values()].filter(v => v.length >= 1).length;
  const multiReviewed = [...byEvaluation.values()].filter(v => v.length >= 2).length;
  const qualityValues = reviews.flatMap(r => ["accuracy_a","accuracy_b","relevance_a","relevance_b","clarity_a","clarity_b","safety_a","safety_b"].map(k => Number(r[k]))).filter(Number.isFinite);
  const averageQualityScore = qualityValues.length ? qualityValues.reduce((a,b) => a+b, 0) / qualityValues.length : 0;
  const duplicateFingerprints = new Set(evaluations.map(e => e.fingerprint).filter(Boolean)).size;
  const duplicateRate = evaluations.length ? Math.max(0, evaluations.length - duplicateFingerprints) / evaluations.length : 0;
  const calibrationAccuracy = calibrations.length ? calibrations.filter(c => c.is_correct).length / calibrations.length : 0;
  const report = evaluateCertification({
    evaluations: evaluations.length,
    reviewed_evaluations: reviewed,
    multi_reviewed_evaluations: multiReviewed,
    average_quality_score: averageQualityScore,
    review_coverage: evaluations.length ? reviews.length / evaluations.length : 0,
    duplicate_rate: duplicateRate,
    calibration_accuracy: calibrationAccuracy,
    reliability_sample: multiReviewed
  });
  const output = {
    generated_at: new Date().toISOString(),
    status: report.status,
    summary: { evaluations: evaluations.length, reviews: reviews.length, reviewed_evaluations: reviewed, multi_reviewed_evaluations: multiReviewed, average_quality_score: Number(averageQualityScore.toFixed(5)), review_coverage: evaluations.length ? Number((reviews.length / evaluations.length).toFixed(5)) : 0, duplicate_rate: Number(duplicateRate.toFixed(5)), calibration_accuracy: Number(calibrationAccuracy.toFixed(5)) },
    certification: report,
    note: "Certification readiness is an internal quality gate, not an independent third-party certification."
  };
  await fs.mkdir(exportDir, { recursive: true });
  await fs.writeFile(path.join(exportDir, "certification-report.json"), JSON.stringify(output, null, 2) + "\n", "utf8");
  console.log(JSON.stringify(output, null, 2));
}

main().catch(error => { console.error(error); process.exit(1); });
