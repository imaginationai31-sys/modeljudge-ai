const VALID_PREFERENCES = new Set(["A", "B", "Tie"]);

function validateCalibrationSubmission(submission) {
  const errors = [];
  if (!submission || typeof submission !== "object") return ["submission must be an object"];
  if (!submission.reviewer_id || typeof submission.reviewer_id !== "string") errors.push("reviewer_id is required");
  if (!submission.gold_evaluation_id || typeof submission.gold_evaluation_id !== "string") errors.push("gold_evaluation_id is required");
  if (!VALID_PREFERENCES.has(submission.preferred_response)) errors.push("preferred_response must be A, B, or Tie");
  return errors;
}

function calculateCalibrationAccuracy(results) {
  const total = results.length;
  const correct = results.filter(item => item.expected === item.actual).length;
  return { total, correct, accuracy: total ? Number((correct / total).toFixed(4)) : null };
}

function reviewerQualityStatus(accuracy, threshold = 0.8) {
  if (accuracy === null || accuracy === undefined) return "UNCALIBRATED";
  return accuracy >= threshold ? "PASS" : "REVIEW";
}

module.exports = { validateCalibrationSubmission, calculateCalibrationAccuracy, reviewerQualityStatus };
