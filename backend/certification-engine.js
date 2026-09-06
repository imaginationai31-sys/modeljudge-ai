const DEFAULT_GATES = Object.freeze({
  minEvaluations: 100,
  minReviewedEvaluations: 50,
  minMultiReviewedEvaluations: 25,
  minAverageQualityScore: 3.5,
  minReviewCoverage: 1,
  maxDuplicateRate: 0.01,
  minCalibrationAccuracy: 0.8,
  minReliabilitySample: 25
});

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function evaluateCertification(input = {}, gates = {}) {
  const policy = { ...DEFAULT_GATES, ...gates };
  const checks = [
    { key: "minimum_evaluations", pass: num(input.evaluations) >= policy.minEvaluations, actual: num(input.evaluations), required: policy.minEvaluations },
    { key: "reviewed_evaluations", pass: num(input.reviewed_evaluations) >= policy.minReviewedEvaluations, actual: num(input.reviewed_evaluations), required: policy.minReviewedEvaluations },
    { key: "multi_reviewed_evaluations", pass: num(input.multi_reviewed_evaluations) >= policy.minMultiReviewedEvaluations, actual: num(input.multi_reviewed_evaluations), required: policy.minMultiReviewedEvaluations },
    { key: "average_quality_score", pass: num(input.average_quality_score) >= policy.minAverageQualityScore, actual: num(input.average_quality_score), required: policy.minAverageQualityScore },
    { key: "review_coverage", pass: num(input.review_coverage) >= policy.minReviewCoverage, actual: num(input.review_coverage), required: policy.minReviewCoverage },
    { key: "duplicate_rate", pass: num(input.duplicate_rate) <= policy.maxDuplicateRate, actual: num(input.duplicate_rate), required: policy.maxDuplicateRate },
    { key: "calibration_accuracy", pass: num(input.calibration_accuracy) >= policy.minCalibrationAccuracy, actual: num(input.calibration_accuracy), required: policy.minCalibrationAccuracy },
    { key: "reliability_sample", pass: num(input.reliability_sample) >= policy.minReliabilitySample, actual: num(input.reliability_sample), required: policy.minReliabilitySample }
  ];
  const passed = checks.filter(c => c.pass).length;
  const status = checks.every(c => c.pass) ? "ready" : passed >= Math.ceil(checks.length * 0.75) ? "conditional" : "not_ready";
  return { status, passed_checks: passed, total_checks: checks.length, checks };
}

module.exports = { DEFAULT_GATES, evaluateCertification };
