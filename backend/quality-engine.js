const fs = require("fs/promises");
const path = require("path");

function majority(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

function agreementScore(values) {
  if (!values.length) return 0;
  const winner = majority(values);
  return values.filter(value => value === winner).length / values.length;
}

function dimensionAgreement(reviews, field) {
  return agreementScore(reviews.map(review => review[field]).filter(value => value !== undefined && value !== null));
}

function buildAdvancedConsensus(reviews) {
  if (!reviews.length) return { status: "insufficient", review_count: 0 };
  const preferenceAgreement = agreementScore(reviews.map(r => r.preferred_response));
  const dimensions = {};
  for (const field of ["accuracy_a","accuracy_b","relevance_a","relevance_b","clarity_a","clarity_b","safety_a","safety_b"]) {
    dimensions[field] = dimensionAgreement(reviews, field);
  }
  const dimensionValues = Object.values(dimensions);
  const averageDimensionAgreement = dimensionValues.reduce((sum, value) => sum + value, 0) / dimensionValues.length;
  const overallAgreement = preferenceAgreement * 0.6 + averageDimensionAgreement * 0.4;
  return {
    status: reviews.length >= 2 ? "complete" : "insufficient",
    review_count: reviews.length,
    preferred_response: majority(reviews.map(r => r.preferred_response)),
    preference_agreement: Number(preferenceAgreement.toFixed(5)),
    dimension_agreement: Object.fromEntries(Object.entries(dimensions).map(([k,v]) => [k, Number(v.toFixed(5))])),
    overall_agreement: Number(overallAgreement.toFixed(5)),
    unanimous: preferenceAgreement === 1,
    quality_flag: reviews.length >= 2 && overallAgreement >= 0.67 ? "pass" : "review"
  };
}

async function readJsonl(file) {
  try {
    const text = await fs.readFile(file, "utf8");
    return text.split("\n").filter(Boolean).map(JSON.parse);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function buildQualityReport(root = path.join(__dirname, "..")) {
  const reviews = await readJsonl(path.join(root, "data", "reviews.jsonl"));
  const calibrations = await readJsonl(path.join(root, "data", "calibration-attempts.jsonl"));
  const reviewerIds = [...new Set([...reviews.map(r => r.reviewer_id), ...calibrations.map(r => r.reviewer_id)])];
  const reviewers = reviewerIds.map(reviewerId => {
    const reviewerReviews = reviews.filter(r => r.reviewer_id === reviewerId);
    const reviewerCalibrations = calibrations.filter(r => r.reviewer_id === reviewerId);
    const calibrationAccuracy = reviewerCalibrations.length ? reviewerCalibrations.filter(r => r.is_correct).length / reviewerCalibrations.length : 0;
    const consistency = reviewerReviews.length >= 2 ? 1 : reviewerReviews.length === 1 ? 0.5 : 0;
    const qualityScore = calibrationAccuracy * 0.8 + consistency * 0.2;
    return { reviewer_id: reviewerId, review_count: reviewerReviews.length, calibration_count: reviewerCalibrations.length, calibration_accuracy: Number(calibrationAccuracy.toFixed(5)), consistency_score: Number(consistency.toFixed(5)), quality_score: Number(qualityScore.toFixed(5)), status: reviewerCalibrations.length === 0 ? "insufficient" : qualityScore >= 0.8 ? "pass" : "review" };
  });
  const report = { generated_at: new Date().toISOString(), reviewer_count: reviewers.length, reviewers };
  const out = path.join(root, "exports", "reviewer-quality.json");
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, JSON.stringify(report, null, 2) + "\n", "utf8");
  return report;
}

module.exports = { majority, agreementScore, buildAdvancedConsensus, buildQualityReport };
