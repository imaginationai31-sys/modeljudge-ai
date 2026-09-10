const crypto = require("crypto");

const VALID_PREFERENCES = new Set(["A", "B", "Tie"]);
const SCORE_FIELDS = ["accuracy", "relevance", "clarity", "safety"];

function validateReview(review) {
  const errors = [];
  if (!review || typeof review !== "object") return ["review must be an object"];
  if (!review.reviewer_id || typeof review.reviewer_id !== "string") errors.push("reviewer_id is required");
  if (!review.evaluation_id || typeof review.evaluation_id !== "string") errors.push("evaluation_id is required");
  if (!VALID_PREFERENCES.has(review.preferred_response)) errors.push("preferred_response must be A, B, or Tie");
  for (const dimension of SCORE_FIELDS) {
    for (const side of ["a", "b"]) {
      const value = review[`${dimension}_${side}`];
      if (!Number.isInteger(value) || value < 1 || value > 5) errors.push(`${dimension}_${side} must be an integer from 1 to 5`);
    }
  }
  if (!review.reason || review.reason.trim().length < 10) errors.push("reason must contain at least ten characters");
  return errors;
}

function reviewFingerprint(review) {
  return crypto.createHash("sha256")
    .update([review.evaluation_id, review.reviewer_id].join("\n"))
    .digest("hex");
}

function majority(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

function agreementScore(values) {
  if (values.length < 2) return 1;
  const counts = {};
  for (const value of values) counts[value] = (counts[value] || 0) + 1;
  return Number((Math.max(...Object.values(counts)) / values.length).toFixed(4));
}

function buildConsensus(reviews) {
  if (!reviews.length) return {
    status: "insufficient",
    reviewer_count: 0,
    consensus_preference: null,
    agreement_score: null,
    dimension_agreement: {},
    unanimous: false,
    quality_flag: "insufficient"
  };
  const preferenceValues = reviews.map(r => r.preferred_response);
  const consensus = majority(preferenceValues);
  const agreement = agreementScore(preferenceValues);
  const dimensionAgreement = {};

  for (const dimension of SCORE_FIELDS) {
    const pairs = reviews.map(r => `${r[`${dimension}_a`]}:${r[`${dimension}_b`]}`);
    dimensionAgreement[dimension] = agreementScore(pairs);
  }

  return {
    status: reviews.length >= 2 ? "ready" : "insufficient",
    reviewer_count: reviews.length,
    consensus_preference: consensus,
    agreement_score: agreement,
    dimension_agreement: dimensionAgreement,
    unanimous: new Set(preferenceValues).size === 1,
    quality_flag: agreement >= 0.67 ? "pass" : "review"
  };
}

function reviewerStats(reviews) {
  const grouped = new Map();
  for (const review of reviews) {
    if (!grouped.has(review.reviewer_id)) grouped.set(review.reviewer_id, []);
    grouped.get(review.reviewer_id).push(review);
  }
  return [...grouped.entries()].map(([reviewer_id, items]) => ({
    reviewer_id,
    review_count: items.length,
    average_score: Number((items.flatMap(r => SCORE_FIELDS.flatMap(d => [r[`${d}_a`], r[`${d}_b`]])).reduce((a, b) => a + b, 0) / (items.length * 8)).toFixed(3)),
    tie_rate: Number((items.filter(r => r.preferred_response === "Tie").length / items.length).toFixed(4))
  }));
}

module.exports = { validateReview, reviewFingerprint, buildConsensus, reviewerStats };
