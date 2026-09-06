const DEFAULT_POLICY = Object.freeze({
  minCalibrationAttempts: 3,
  passCalibrationAccuracy: 0.8,
  reviewCalibrationAccuracy: 0.6,
  suspensionScore: 0.5,
  warningScore: 0.8,
  maxConsecutiveFailures: 3
});

function calculateReviewerControl(reviewer, policy = {}) {
  const config = { ...DEFAULT_POLICY, ...policy };
  const attempts = Number(reviewer.calibration_attempts || 0);
  const accuracy = Number(reviewer.calibration_accuracy || 0);
  const consistency = Number(reviewer.consistency_score || 0);
  const quality = Number.isFinite(Number(reviewer.quality_score))
    ? Number(reviewer.quality_score)
    : accuracy * 0.8 + consistency * 0.2;
  const failures = Number(reviewer.consecutive_calibration_failures || 0);
  let status = "insufficient";
  let action = "calibrate";
  const reasons = [];

  if (attempts >= config.minCalibrationAttempts) {
    if (quality < config.suspensionScore || failures >= config.maxConsecutiveFailures) {
      status = "suspended";
      action = "recalibrate";
      reasons.push("quality_below_suspension_threshold");
      if (failures >= config.maxConsecutiveFailures) reasons.push("consecutive_calibration_failures");
    } else if (quality < config.warningScore || accuracy < config.reviewCalibrationAccuracy) {
      status = "warning";
      action = "recalibrate";
      reasons.push("quality_below_warning_threshold");
    } else if (accuracy >= config.passCalibrationAccuracy) {
      status = "active";
      action = "continue";
    } else {
      status = "warning";
      action = "recalibrate";
      reasons.push("calibration_below_pass_threshold");
    }
  } else {
    reasons.push("insufficient_calibration_history");
  }

  return {
    reviewer_id: reviewer.reviewer_id,
    status,
    action,
    quality_score: Number(quality.toFixed(5)),
    calibration_accuracy: Number(accuracy.toFixed(5)),
    calibration_attempts: attempts,
    consecutive_calibration_failures: failures,
    reasons
  };
}

function canSubmitReview(control) {
  return control.status === "active" || control.status === "warning";
}

module.exports = { DEFAULT_POLICY, calculateReviewerControl, canSubmitReview };
