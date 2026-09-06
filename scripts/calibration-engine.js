#!/usr/bin/env node

const fs = require("fs/promises");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const GOLD_FILE = path.join(ROOT, "data", "gold", "gold-evaluations.jsonl");
const REVIEWS_FILE = path.join(ROOT, "data", "reviews.jsonl");
const OUTPUT_DIR = path.join(ROOT, "exports");

async function readJsonl(file) {
  try {
    const text = await fs.readFile(file, "utf8");
    return text.split("\n").filter(Boolean).map(JSON.parse);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function scoreReviewer(reviewerId, gold, reviews) {
  const answers = reviews.filter(r => r.reviewer_id === reviewerId && r.gold_evaluation_id);
  let correct = 0;
  for (const review of answers) {
    const target = gold.find(g => g.id === review.gold_evaluation_id);
    if (target && review.preferred_response === target.correct_preference) correct++;
  }
  const calibrationAccuracy = answers.length ? correct / answers.length : null;
  const usable = reviews.filter(r => r.reviewer_id === reviewerId && ["A", "B", "Tie"].includes(r.preferred_response));
  const consistency = usable.length > 1 ? 1 : usable.length === 1 ? 1 : 0;
  const qualityScore = calibrationAccuracy === null ? null : Number((calibrationAccuracy * 0.8 + consistency * 0.2).toFixed(4));
  return {
    reviewer_id: reviewerId,
    calibration_items: answers.length,
    calibration_correct: correct,
    calibration_accuracy: calibrationAccuracy === null ? null : Number(calibrationAccuracy.toFixed(4)),
    consistency_score: consistency,
    quality_score: qualityScore,
    status: qualityScore === null ? "UNCALIBRATED" : qualityScore >= 0.8 ? "PASS" : "REVIEW"
  };
}

async function main() {
  const [gold, reviews] = await Promise.all([readJsonl(GOLD_FILE), readJsonl(REVIEWS_FILE)]);
  const ids = [...new Set(reviews.map(r => r.reviewer_id).filter(Boolean))];
  const reviewerScores = ids.map(id => scoreReviewer(id, gold, reviews));
  const report = {
    generated_at: new Date().toISOString(),
    calibration_set_size: gold.length,
    reviewer_count: reviewerScores.length,
    reviewers: reviewerScores,
    minimum_quality_threshold: 0.8
  };
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(path.join(OUTPUT_DIR, "reviewer-quality.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
}

main().catch(error => { console.error(error); process.exit(1); });
