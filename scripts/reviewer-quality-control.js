#!/usr/bin/env node
const fs = require("fs/promises");
const path = require("path");
const { calculateReviewerControl, DEFAULT_POLICY } = require("../backend/reviewer-quality-control");

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
  const root = path.join(__dirname, "..");
  const reviews = await readJsonl(path.join(root, "data", "reviews.jsonl"));
  const calibrations = await readJsonl(path.join(root, "data", "calibration-attempts.jsonl"));
  const reviewerIds = [...new Set([...reviews.map(r => r.reviewer_id), ...calibrations.map(r => r.reviewer_id)])];
  const reviewers = reviewerIds.map(reviewerId => {
    const rs = reviews.filter(r => r.reviewer_id === reviewerId);
    const cs = calibrations.filter(r => r.reviewer_id === reviewerId);
    const correct = cs.filter(r => r.is_correct).length;
    let consecutiveFailures = 0;
    for (let i = cs.length - 1; i >= 0 && !cs[i].is_correct; i--) consecutiveFailures++;
    const accuracy = cs.length ? correct / cs.length : 0;
    return {
      ...calculateReviewerControl({
        reviewer_id: reviewerId,
        calibration_attempts: cs.length,
        calibration_accuracy: accuracy,
        consistency_score: rs.length >= 2 ? 1 : rs.length === 1 ? 0.5 : 0,
        consecutive_calibration_failures: consecutiveFailures
      }),
      review_count: rs.length
    };
  });
  const report = {
    generated_at: new Date().toISOString(),
    policy: DEFAULT_POLICY,
    reviewer_count: reviewers.length,
    status_counts: reviewers.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {}),
    reviewers
  };
  await fs.mkdir(path.join(root, "exports"), { recursive: true });
  await fs.writeFile(path.join(root, "exports", "reviewer-control-report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
}
main().catch(error => { console.error(error); process.exit(1); });
