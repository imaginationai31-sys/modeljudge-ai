const DEFAULTS = Object.freeze({
  minAverageScore: 3.5,
  minAgreement: 0.67,
  requireHumanVerified: false,
  requireMultipleReviews: true,
  excludeTies: false
});

function averageReviewScore(review) {
  const fields = [
    "accuracy_a", "accuracy_b", "relevance_a", "relevance_b",
    "clarity_a", "clarity_b", "safety_a", "safety_b"
  ];
  const values = fields.map(field => Number(review[field])).filter(Number.isFinite);
  return values.length === fields.length ? values.reduce((sum, value) => sum + value, 0) / fields.length : null;
}

function agreement(values) {
  if (!values.length) return 0;
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return Math.max(...counts.values()) / values.length;
}

function buildReviewSummary(reviews) {
  if (!reviews.length) return { review_count: 0, average_score: null, preference_agreement: 0, quality_flag: "insufficient" };
  const scores = reviews.map(averageReviewScore).filter(score => score !== null);
  const preferences = reviews.map(review => review.preferred_response).filter(Boolean);
  const avgScore = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
  const preferenceAgreement = agreement(preferences);
  return {
    review_count: reviews.length,
    average_score: avgScore === null ? null : Number(avgScore.toFixed(5)),
    preference_agreement: Number(preferenceAgreement.toFixed(5)),
    quality_flag: reviews.length >= 2 && preferenceAgreement >= 0.67 ? "pass" : "review"
  };
}

function evaluateRecord(record, reviews = [], options = {}) {
  const config = { ...DEFAULTS, ...options };
  const reasons = [];
  if (record.verified === true) reasons.push("human_verified");
  else if (config.requireHumanVerified) reasons.push("not_human_verified");

  const summary = buildReviewSummary(reviews);
  if (summary.average_score === null) reasons.push("missing_review_scores");
  else if (summary.average_score < config.minAverageScore) reasons.push("low_average_score");

  if (config.requireMultipleReviews && summary.review_count < 2) reasons.push("insufficient_reviews");
  if (summary.review_count >= 2 && summary.preference_agreement < config.minAgreement) reasons.push("low_preference_agreement");
  if (config.excludeTies && record.preferred_response === "Tie") reasons.push("tie_preference");
  if (!record.prompt || !record.response_a || !record.response_b) reasons.push("missing_content");
  if (record.fingerprint) reasons.push("fingerprint_present");

  const blockingReasons = reasons.filter(reason => reason !== "human_verified" && reason !== "fingerprint_present");
  return {
    evaluation_id: record.id,
    included: blockingReasons.length === 0,
    reasons,
    review_summary: summary
  };
}

function filterDataset(records, reviewsByEvaluation = new Map(), options = {}) {
  const decisions = records.map(record => evaluateRecord(record, reviewsByEvaluation.get(record.id) || [], options));
  return {
    records: records.filter((record, index) => decisions[index].included),
    decisions,
    summary: {
      input_count: records.length,
      included_count: decisions.filter(d => d.included).length,
      excluded_count: decisions.filter(d => !d.included).length,
      inclusion_rate: records.length ? Number((decisions.filter(d => d.included).length / records.length).toFixed(5)) : 0
    }
  };
}

module.exports = { DEFAULTS, averageReviewScore, agreement, buildReviewSummary, evaluateRecord, filterDataset };
